import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'secure_exam.db');
const LEGACY_JSON = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class SQLiteDatabase {
  constructor() {
    this.sqlite = new Database(DB_PATH);
    // Performance and integrity pragmas
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('foreign_keys = ON');
    this.initTables();
    this.seedDefaults();
  }

  initTables() {
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        google_id TEXT,
        avatar_url TEXT,
        face_enrolled INTEGER DEFAULT 0,
        face_descriptor TEXT,
        keystroke_profile TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        duration_minutes INTEGER DEFAULT 15,
        total_marks INTEGER DEFAULT 100,
        passing_percentage INTEGER DEFAULT 60,
        strict_proctoring INTEGER DEFAULT 1,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        category TEXT,
        question TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        points INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS login_attempts (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        success INTEGER NOT NULL,
        reason TEXT,
        ip TEXT,
        location_json TEXT,
        device_json TEXT,
        attempt_count INTEGER DEFAULT 1,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS failed_attempts_tracker (
        username TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS proctoring_events (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT,
        exam_id TEXT,
        type TEXT NOT NULL,
        details TEXT,
        severity TEXT DEFAULT 'WARNING',
        duration INTEGER,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cheating_scores (
        student_id TEXT PRIMARY KEY,
        student_name TEXT,
        score REAL NOT NULL,
        classification TEXT NOT NULL,
        metrics_json TEXT,
        breakdown_json TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS exam_submissions (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_count INTEGER NOT NULL,
        percentage REAL NOT NULL,
        time_spent_seconds INTEGER NOT NULL,
        reviewed_answers_json TEXT NOT NULL,
        cheating_score REAL,
        integrity_classification TEXT,
        status TEXT DEFAULT 'submitted',
        submitted_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS security_emails (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        recipient_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        attempt_details_json TEXT,
        sent_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
      CREATE INDEX IF NOT EXISTS idx_users_google ON users (google_id);
      CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions (exam_id);
      CREATE INDEX IF NOT EXISTS idx_proctoring_student ON proctoring_events (student_id);
      CREATE INDEX IF NOT EXISTS idx_submissions_student ON exam_submissions (student_id);
      CREATE INDEX IF NOT EXISTS idx_login_username ON login_attempts (username);
    `);
  }

  seedDefaults() {
    const userCount = this.sqlite.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      const now = new Date().toISOString();
      const salt = bcrypt.genSaltSync(10);
      const adminHash = bcrypt.hashSync('admin123', salt);
      const facultyHash = bcrypt.hashSync('faculty123', salt);
      const studentHash = bcrypt.hashSync('student123', salt);

      const insertUser = this.sqlite.prepare(`
        INSERT INTO users (id, username, email, password_hash, full_name, role, google_id, avatar_url, face_enrolled, face_descriptor, created_at, updated_at)
        VALUES (@id, @username, @email, @password_hash, @full_name, @role, @google_id, @avatar_url, @face_enrolled, @face_descriptor, @created_at, @updated_at)
      `);

      // 1. Admin
      insertUser.run({
        id: 'usr_admin',
        username: 'admin',
        email: 'admin@secureexam.edu',
        password_hash: adminHash,
        full_name: 'Dr. Sarah Connor (Enterprise Admin)',
        role: 'admin',
        google_id: null,
        avatar_url: null,
        face_enrolled: 0,
        face_descriptor: null,
        created_at: now,
        updated_at: now
      });

      // 2. Faculty
      insertUser.run({
        id: 'usr_faculty',
        username: 'prof_sharma',
        email: 'faculty@university.edu',
        password_hash: facultyHash,
        full_name: 'Prof. Rajesh Sharma (Faculty Proctor)',
        role: 'faculty',
        google_id: null,
        avatar_url: null,
        face_enrolled: 0,
        face_descriptor: null,
        created_at: now,
        updated_at: now
      });

      // 3. Demo Candidate
      const sampleDescriptor = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1) * 0.1);
      insertUser.run({
        id: 'usr_demo_student',
        username: 'student1',
        email: 'student1@secureexam.edu',
        password_hash: studentHash,
        full_name: 'Alex Mercer (Candidate)',
        role: 'student',
        google_id: null,
        avatar_url: null,
        face_enrolled: 1,
        face_descriptor: JSON.stringify(sampleDescriptor),
        created_at: now,
        updated_at: now
      });

      console.log('✅ SQLite initialized with default enterprise users (admin, faculty, student).');
    }

    // Seed default exam and questions if none exist
    const examCount = this.sqlite.prepare('SELECT COUNT(*) as count FROM exams').get().count;
    if (examCount === 0) {
      const defaultExamId = 'exam_cyber_ai_2026';
      const now = new Date().toISOString();

      this.sqlite.prepare(`
        INSERT INTO exams (id, title, description, category, duration_minutes, total_marks, passing_percentage, strict_proctoring, is_active, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        defaultExamId,
        'Enterprise AI & Cybersecurity Certification Assessment',
        'Official proctored examination evaluating network security, machine learning integrity, adversarial defenses, and distributed systems architecture.',
        'Cybersecurity & AI',
        15,
        100,
        60,
        1,
        1,
        'usr_admin',
        now
      );

      const defaultQuestions = [
        {
          id: 'q1',
          exam_id: defaultExamId,
          category: 'Network Security',
          question: 'Which cryptographic mechanism prevents replay attacks in authentication protocols?',
          options: [
            'Diffie-Hellman Key Exchange',
            'Cryptographic Nonces and Timestamps',
            'Symmetric Triple-DES Encryption',
            'MD5 Hashing without salt'
          ],
          correct_answer: 1,
          explanation: 'Nonces (numbers used once) and timestamps guarantee that each authentication payload cannot be intercepted and retransmitted by an attacker.',
          points: 20
        },
        {
          id: 'q2',
          exam_id: defaultExamId,
          category: 'Machine Learning',
          question: 'Why is SMOTE (Synthetic Minority Over-sampling Technique) specifically critical in cheating detection systems?',
          options: [
            'It compresses high-dimensional video streams into embeddings',
            'Real-world cheating occurrences are rare (<5%), causing severe class imbalance where standard models ignore fraud',
            'It accelerates neural network backpropagation by 10x',
            'It encrypts face descriptor vectors on the client device'
          ],
          correct_answer: 1,
          explanation: 'Cheating datasets suffer from severe class imbalance. SMOTE synthesizes minority class instances along feature vectors to ensure high recall on malicious behavior.',
          points: 20
        },
        {
          id: 'q3',
          exam_id: defaultExamId,
          category: 'Algorithms',
          question: 'What is the average time complexity of searching in a well-balanced Red-Black Tree with N nodes?',
          options: [
            'O(1)',
            'O(N)',
            'O(log N)',
            'O(N log N)'
          ],
          correct_answer: 2,
          explanation: 'A Red-Black Tree enforces balanced height bounding maximum search paths to 2 * log2(N + 1), giving O(log N).',
          points: 20
        },
        {
          id: 'q4',
          exam_id: defaultExamId,
          category: 'Adversarial Defense',
          question: 'In FGSM (Fast Gradient Sign Method) adversarial attacks against neural networks, how is the perturbation generated?',
          options: [
            'By randomly flipping binary weights in the final layer',
            'By computing perturbation eta = epsilon * sign(grad_x J(theta, x, y)) in input feature space',
            'By performing brute-force dictionary permutations on passwords',
            'By corrupting the webcam hardware firmware'
          ],
          correct_answer: 1,
          explanation: 'FGSM calculates the gradient of the loss with respect to input features and shifts the sample by epsilon in the direction that maximizes classification error.',
          points: 20
        },
        {
          id: 'q5',
          exam_id: defaultExamId,
          category: 'System Design',
          question: 'Which browser Web API allows an enterprise exam portal to immediately detect when a candidate switches to another application or tab?',
          options: [
            'Document Page Visibility API (document.visibilityState and visibilitychange event)',
            'Canvas 2D Rendering Context API',
            'Web Speech Recognition API',
            'Service Worker Cache Storage API'
          ],
          correct_answer: 0,
          explanation: 'The Page Visibility API fires the visibilitychange event immediately whenever the browser tab becomes hidden or minimized.',
          points: 20
        }
      ];

      const insertQuestion = this.sqlite.prepare(`
        INSERT INTO questions (id, exam_id, category, question, options_json, correct_answer, explanation, points, created_at)
        VALUES (@id, @exam_id, @category, @question, @options_json, @correct_answer, @explanation, @points, @created_at)
      `);

      for (const q of defaultQuestions) {
        insertQuestion.run({
          ...q,
          options_json: JSON.stringify(q.options),
          created_at: now
        });
      }

      console.log('✅ SQLite seeded default exam with 5 core questions.');
    }
  }

  // --- USER OPERATIONS ---
  getUsers() {
    const rows = this.sqlite.prepare('SELECT id, username, email, full_name as fullName, role, google_id as googleId, avatar_url as avatarUrl, face_enrolled as faceEnrolled, face_descriptor as faceDescriptor, created_at as createdAt, updated_at as updatedAt FROM users ORDER BY created_at DESC').all();
    return rows.map(r => ({
      ...r,
      faceEnrolled: Boolean(r.faceEnrolled),
      faceDescriptor: r.faceDescriptor ? JSON.parse(r.faceDescriptor) : null
    }));
  }

  findUserByUsername(username) {
    if (!username) return null;
    const row = this.sqlite.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username);
    if (!row) return null;
    return this._formatUser(row);
  }

  findUserByEmail(email) {
    if (!email) return null;
    const row = this.sqlite.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email);
    if (!row) return null;
    return this._formatUser(row);
  }

  findUserByGoogleId(googleId) {
    if (!googleId) return null;
    const row = this.sqlite.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
    if (!row) return null;
    return this._formatUser(row);
  }

  findUserById(id) {
    if (!id) return null;
    const row = this.sqlite.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return null;
    return this._formatUser(row);
  }

  _formatUser(row) {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role,
      googleId: row.google_id,
      avatarUrl: row.avatar_url,
      faceEnrolled: Boolean(row.face_enrolled),
      faceDescriptor: row.face_descriptor ? JSON.parse(row.face_descriptor) : null,
      keystrokeProfile: row.keystroke_profile ? JSON.parse(row.keystroke_profile) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  createUser(userData) {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const faceDescriptorJson = userData.faceDescriptor ? JSON.stringify(userData.faceDescriptor) : null;
    const keystrokeJson = userData.keystrokeProfile ? JSON.stringify(userData.keystrokeProfile) : null;

    this.sqlite.prepare(`
      INSERT INTO users (id, username, email, password_hash, full_name, role, google_id, avatar_url, face_enrolled, face_descriptor, keystroke_profile, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userData.username,
      userData.email,
      userData.passwordHash || null,
      userData.fullName || userData.username,
      userData.role || 'student',
      userData.googleId || null,
      userData.avatarUrl || null,
      userData.faceEnrolled ? 1 : 0,
      faceDescriptorJson,
      keystrokeJson,
      now,
      now
    );

    return this.findUserById(id);
  }

  updateUser(id, updates) {
    const existing = this.findUserById(id);
    if (!existing) return null;

    const fullName = updates.fullName !== undefined ? updates.fullName : existing.fullName;
    const role = updates.role !== undefined ? updates.role : existing.role;
    const googleId = updates.googleId !== undefined ? updates.googleId : existing.googleId;
    const avatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : existing.avatarUrl;
    const faceEnrolled = updates.faceEnrolled !== undefined ? (updates.faceEnrolled ? 1 : 0) : (existing.faceEnrolled ? 1 : 0);
    const faceDescriptor = updates.faceDescriptor !== undefined
      ? (updates.faceDescriptor ? JSON.stringify(updates.faceDescriptor) : null)
      : (existing.faceDescriptor ? JSON.stringify(existing.faceDescriptor) : null);
    const now = new Date().toISOString();

    this.sqlite.prepare(`
      UPDATE users
      SET full_name = ?, role = ?, google_id = ?, avatar_url = ?, face_enrolled = ?, face_descriptor = ?, updated_at = ?
      WHERE id = ?
    `).run(fullName, role, googleId, avatarUrl, faceEnrolled, faceDescriptor, now, id);

    return this.findUserById(id);
  }

  // --- FAILED PASSWORD ATTEMPTS TRACKER ---
  getFailedAttempts(username) {
    if (!username) return 0;
    const row = this.sqlite.prepare('SELECT count FROM failed_attempts_tracker WHERE LOWER(username) = LOWER(?)').get(username);
    return row ? row.count : 0;
  }

  incrementFailedAttempts(username) {
    if (!username) return 0;
    const now = new Date().toISOString();
    const existing = this.sqlite.prepare('SELECT count FROM failed_attempts_tracker WHERE LOWER(username) = LOWER(?)').get(username);
    const newCount = (existing ? existing.count : 0) + 1;

    this.sqlite.prepare(`
      INSERT INTO failed_attempts_tracker (username, count, updated_at)
      VALUES (LOWER(?), ?, ?)
      ON CONFLICT(username) DO UPDATE SET count = ?, updated_at = ?
    `).run(username, newCount, now, newCount, now);

    return newCount;
  }

  resetFailedAttempts(username) {
    if (!username) return;
    this.sqlite.prepare('DELETE FROM failed_attempts_tracker WHERE LOWER(username) = LOWER(?)').run(username);
  }

  // --- LOGIN ATTEMPTS FORENSIC LOG ---
  addLoginAttempt(attempt) {
    const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = attempt.timestamp || new Date().toISOString();

    this.sqlite.prepare(`
      INSERT INTO login_attempts (id, username, success, reason, ip, location_json, device_json, attempt_count, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      attempt.username,
      attempt.success ? 1 : 0,
      attempt.reason || null,
      attempt.ip || null,
      attempt.location ? JSON.stringify(attempt.location) : null,
      attempt.device ? JSON.stringify(attempt.device) : null,
      attempt.attemptCount || 1,
      now
    );

    return {
      id,
      ...attempt,
      timestamp: now
    };
  }

  getLoginAttempts(limit = 200) {
    const rows = this.sqlite.prepare('SELECT * FROM login_attempts ORDER BY timestamp DESC LIMIT ?').all(limit);
    return rows.map(r => ({
      id: r.id,
      username: r.username,
      success: Boolean(r.success),
      reason: r.reason,
      ip: r.ip,
      location: r.location_json ? JSON.parse(r.location_json) : null,
      device: r.device_json ? JSON.parse(r.device_json) : null,
      attemptCount: r.attempt_count,
      timestamp: r.timestamp
    }));
  }

  // --- PROCTORING EVENTS ---
  addProctoringEvent(event) {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = event.timestamp || new Date().toISOString();

    this.sqlite.prepare(`
      INSERT INTO proctoring_events (id, student_id, student_name, exam_id, type, details, severity, duration, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      event.studentId,
      event.studentName || 'Candidate',
      event.examId || null,
      event.type,
      event.details || `Proctoring flag: ${event.type}`,
      event.severity || 'WARNING',
      event.duration || null,
      now
    );

    return {
      id,
      ...event,
      timestamp: now
    };
  }

  getProctoringEvents(studentId = null, limit = 500) {
    let rows;
    if (studentId) {
      rows = this.sqlite.prepare('SELECT * FROM proctoring_events WHERE student_id = ? ORDER BY timestamp DESC LIMIT ?').all(studentId, limit);
    } else {
      rows = this.sqlite.prepare('SELECT * FROM proctoring_events ORDER BY timestamp DESC LIMIT ?').all(limit);
    }

    return rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      examId: r.exam_id,
      type: r.type,
      details: r.details,
      severity: r.severity,
      duration: r.duration,
      timestamp: r.timestamp
    }));
  }

  // --- CHEATING SCORES ---
  saveCheatingScore(studentId, scoreData) {
    const now = new Date().toISOString();
    this.sqlite.prepare(`
      INSERT INTO cheating_scores (student_id, student_name, score, classification, metrics_json, breakdown_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        student_name = excluded.student_name,
        score = excluded.score,
        classification = excluded.classification,
        metrics_json = excluded.metrics_json,
        breakdown_json = excluded.breakdown_json,
        updated_at = excluded.updated_at
    `).run(
      studentId,
      scoreData.studentName || studentId,
      scoreData.score,
      scoreData.classification,
      scoreData.metrics ? JSON.stringify(scoreData.metrics) : null,
      scoreData.breakdown ? JSON.stringify(scoreData.breakdown) : null,
      now
    );

    return {
      studentId,
      ...scoreData,
      updatedAt: now
    };
  }

  getCheatingScores() {
    const rows = this.sqlite.prepare('SELECT * FROM cheating_scores').all();
    const map = {};
    for (const r of rows) {
      map[r.student_id] = {
        studentId: r.student_id,
        studentName: r.student_name,
        score: r.score,
        classification: r.classification,
        metrics: r.metrics_json ? JSON.parse(r.metrics_json) : null,
        breakdown: r.breakdown_json ? JSON.parse(r.breakdown_json) : null,
        updatedAt: r.updated_at
      };
    }
    return map;
  }

  getCheatingScoreByStudent(studentId) {
    if (!studentId) return null;
    const r = this.sqlite.prepare('SELECT * FROM cheating_scores WHERE student_id = ?').get(studentId);
    if (!r) return null;
    return {
      studentId: r.student_id,
      studentName: r.student_name,
      score: r.score,
      classification: r.classification,
      metrics: r.metrics_json ? JSON.parse(r.metrics_json) : null,
      breakdown: r.breakdown_json ? JSON.parse(r.breakdown_json) : null,
      updatedAt: r.updated_at
    };
  }

  // --- EXAM SUBMISSIONS ---
  addExamSubmission(submission) {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = submission.submittedAt || new Date().toISOString();

    this.sqlite.prepare(`
      INSERT INTO exam_submissions (id, exam_id, student_id, student_name, total_questions, correct_count, percentage, time_spent_seconds, reviewed_answers_json, cheating_score, integrity_classification, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      submission.examId || 'exam_cyber_ai_2026',
      submission.studentId,
      submission.studentName || submission.studentId,
      submission.totalQuestions,
      submission.correctCount,
      submission.percentage,
      submission.timeSpentSeconds || 0,
      JSON.stringify(submission.reviewedAnswers || []),
      submission.cheatingScore || 0,
      submission.integrityClassification || 'HONEST',
      submission.status || 'submitted',
      now
    );

    return {
      id,
      ...submission,
      submittedAt: now
    };
  }

  getExamSubmissions() {
    const rows = this.sqlite.prepare('SELECT * FROM exam_submissions ORDER BY submitted_at DESC').all();
    return rows.map(r => ({
      id: r.id,
      examId: r.exam_id,
      studentId: r.student_id,
      studentName: r.student_name,
      totalQuestions: r.total_questions,
      correctCount: r.correct_count,
      percentage: r.percentage,
      timeSpentSeconds: r.time_spent_seconds,
      reviewedAnswers: r.reviewed_answers_json ? JSON.parse(r.reviewed_answers_json) : [],
      cheatingScore: r.cheating_score,
      integrityClassification: r.integrity_classification,
      status: r.status,
      submittedAt: r.submitted_at
    }));
  }

  // --- SECURITY EMAILS ---
  addSecurityEmail(emailData) {
    const id = `eml_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();

    this.sqlite.prepare(`
      INSERT INTO security_emails (id, user_id, recipient_email, subject, message, attempt_details_json, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      emailData.userId || null,
      emailData.recipientEmail,
      emailData.subject,
      emailData.message,
      emailData.attemptDetails ? JSON.stringify(emailData.attemptDetails) : null,
      now
    );

    return {
      id,
      ...emailData,
      sentAt: now
    };
  }

  getSecurityEmails() {
    const rows = this.sqlite.prepare('SELECT * FROM security_emails ORDER BY sent_at DESC').all();
    return rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      recipientEmail: r.recipient_email,
      subject: r.subject,
      message: r.message,
      attemptDetails: r.attempt_details_json ? JSON.parse(r.attempt_details_json) : null,
      sentAt: r.sent_at
    }));
  }

  // --- EXAMS & QUESTIONS MANAGEMENT ---
  getExams() {
    const exams = this.sqlite.prepare('SELECT * FROM exams ORDER BY created_at DESC').all();
    return exams.map(e => {
      const qCount = this.sqlite.prepare('SELECT COUNT(*) as count FROM questions WHERE exam_id = ?').get(e.id).count;
      const subCount = this.sqlite.prepare('SELECT COUNT(*) as count FROM exam_submissions WHERE exam_id = ?').get(e.id).count;
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category,
        durationMinutes: e.duration_minutes,
        totalMarks: e.total_marks,
        passingPercentage: e.passing_percentage,
        strictProctoring: Boolean(e.strict_proctoring),
        isActive: Boolean(e.is_active),
        createdBy: e.created_by,
        createdAt: e.created_at,
        questionCount: qCount,
        submissionCount: subCount
      };
    });
  }

  getExamById(id) {
    const e = this.sqlite.prepare('SELECT * FROM exams WHERE id = ?').get(id);
    if (!e) return null;
    const questions = this.getQuestions(id);
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      durationMinutes: e.duration_minutes,
      totalMarks: e.total_marks,
      passingPercentage: e.passing_percentage,
      strictProctoring: Boolean(e.strict_proctoring),
      isActive: Boolean(e.is_active),
      createdBy: e.created_by,
      createdAt: e.created_at,
      questions
    };
  }

  getActiveExam() {
    const e = this.sqlite.prepare('SELECT * FROM exams WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1').get();
    if (!e) return null;
    return this.getExamById(e.id);
  }

  createExam(examData) {
    const id = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    this.sqlite.prepare(`
      INSERT INTO exams (id, title, description, category, duration_minutes, total_marks, passing_percentage, strict_proctoring, is_active, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      examData.title,
      examData.description || '',
      examData.category || 'General Assessment',
      examData.durationMinutes || 15,
      examData.totalMarks || 100,
      examData.passingPercentage || 60,
      examData.strictProctoring !== false ? 1 : 0,
      examData.isActive !== false ? 1 : 0,
      examData.createdBy || 'usr_admin',
      now
    );

    return this.getExamById(id);
  }

  updateExam(id, updates) {
    const existing = this.sqlite.prepare('SELECT * FROM exams WHERE id = ?').get(id);
    if (!existing) return null;

    const title = updates.title !== undefined ? updates.title : existing.title;
    const description = updates.description !== undefined ? updates.description : existing.description;
    const category = updates.category !== undefined ? updates.category : existing.category;
    const durationMinutes = updates.durationMinutes !== undefined ? updates.durationMinutes : existing.duration_minutes;
    const totalMarks = updates.totalMarks !== undefined ? updates.totalMarks : existing.total_marks;
    const passingPercentage = updates.passingPercentage !== undefined ? updates.passingPercentage : existing.passing_percentage;
    const strictProctoring = updates.strictProctoring !== undefined ? (updates.strictProctoring ? 1 : 0) : existing.strict_proctoring;
    const isActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : existing.is_active;

    // If activating this exam, deactivate others
    if (updates.isActive) {
      this.sqlite.prepare('UPDATE exams SET is_active = 0').run();
    }

    this.sqlite.prepare(`
      UPDATE exams
      SET title = ?, description = ?, category = ?, duration_minutes = ?, total_marks = ?, passing_percentage = ?, strict_proctoring = ?, is_active = ?
      WHERE id = ?
    `).run(title, description, category, durationMinutes, totalMarks, passingPercentage, strictProctoring, isActive, id);

    return this.getExamById(id);
  }

  deleteExam(id) {
    this.sqlite.prepare('DELETE FROM questions WHERE exam_id = ?').run(id);
    const result = this.sqlite.prepare('DELETE FROM exams WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getQuestions(examId = null) {
    let rows;
    if (examId) {
      rows = this.sqlite.prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY created_at ASC').all(examId);
    } else {
      // Default to active exam or all
      const active = this.sqlite.prepare('SELECT id FROM exams WHERE is_active = 1 LIMIT 1').get();
      if (active) {
        rows = this.sqlite.prepare('SELECT * FROM questions WHERE exam_id = ? ORDER BY created_at ASC').all(active.id);
      } else {
        rows = this.sqlite.prepare('SELECT * FROM questions ORDER BY created_at ASC').all();
      }
    }

    return rows.map(r => ({
      id: r.id,
      examId: r.exam_id,
      category: r.category,
      question: r.question,
      options: JSON.parse(r.options_json),
      correctAnswer: r.correct_answer,
      explanation: r.explanation,
      points: r.points,
      createdAt: r.created_at
    }));
  }

  getQuestionById(id) {
    const r = this.sqlite.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    if (!r) return null;
    return {
      id: r.id,
      examId: r.exam_id,
      category: r.category,
      question: r.question,
      options: JSON.parse(r.options_json),
      correctAnswer: r.correct_answer,
      explanation: r.explanation,
      points: r.points,
      createdAt: r.created_at
    };
  }

  createQuestion(qData) {
    const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date().toISOString();
    const examId = qData.examId || (this.sqlite.prepare('SELECT id FROM exams WHERE is_active = 1 LIMIT 1').get()?.id || 'exam_cyber_ai_2026');

    this.sqlite.prepare(`
      INSERT INTO questions (id, exam_id, category, question, options_json, correct_answer, explanation, points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      examId,
      qData.category || 'General',
      qData.question,
      JSON.stringify(qData.options || []),
      Number(qData.correctAnswer) || 0,
      qData.explanation || '',
      Number(qData.points) || 1,
      now
    );

    return this.getQuestionById(id);
  }

  bulkCreateQuestions(questionsArray, examId = null) {
    const targetExamId = examId || (this.sqlite.prepare('SELECT id FROM exams WHERE is_active = 1 LIMIT 1').get()?.id || 'exam_cyber_ai_2026');
    const now = new Date().toISOString();
    const insert = this.sqlite.prepare(`
      INSERT INTO questions (id, exam_id, category, question, options_json, correct_answer, explanation, points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.sqlite.transaction((questions) => {
      let created = 0;
      for (const q of questions) {
        if (!q.question || !Array.isArray(q.options) || q.options.length < 2) continue;
        const id = `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}_${created}`;
        insert.run(
          id,
          targetExamId,
          q.category || 'Uploaded',
          q.question,
          JSON.stringify(q.options),
          Number(q.correctAnswer) || 0,
          q.explanation || '',
          Number(q.points) || 1,
          now
        );
        created++;
      }
      return created;
    });

    const count = insertMany(questionsArray);
    return { count, examId: targetExamId };
  }

  updateQuestion(id, updates) {
    const existing = this.sqlite.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    if (!existing) return null;

    const question = updates.question !== undefined ? updates.question : existing.question;
    const category = updates.category !== undefined ? updates.category : existing.category;
    const optionsJson = updates.options !== undefined ? JSON.stringify(updates.options) : existing.options_json;
    const correctAnswer = updates.correctAnswer !== undefined ? Number(updates.correctAnswer) : existing.correct_answer;
    const explanation = updates.explanation !== undefined ? updates.explanation : existing.explanation;
    const points = updates.points !== undefined ? Number(updates.points) : existing.points;

    this.sqlite.prepare(`
      UPDATE questions
      SET question = ?, category = ?, options_json = ?, correct_answer = ?, explanation = ?, points = ?
      WHERE id = ?
    `).run(question, category, optionsJson, correctAnswer, explanation, points, id);

    return this.getQuestionById(id);
  }

  deleteQuestion(id) {
    const result = this.sqlite.prepare('DELETE FROM questions WHERE id = ?').run(id);
    return result.changes > 0;
  }
}

export const db = new SQLiteDatabase();
