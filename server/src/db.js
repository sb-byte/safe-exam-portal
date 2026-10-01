import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial DB state
const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const studentPasswordHash = bcrypt.hashSync('student123', salt);

  return {
    users: [
      {
        id: 'usr_admin',
        username: 'admin',
        email: 'admin@secureexam.edu',
        passwordHash: adminPasswordHash,
        fullName: 'Dr. Sarah Connor (Admin)',
        role: 'admin',
        faceEnrolled: false,
        faceDescriptor: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_demo_student',
        username: 'student1',
        email: 'student1@secureexam.edu',
        passwordHash: studentPasswordHash,
        fullName: 'Alex Mercer (Student)',
        role: 'student',
        faceEnrolled: true,
        // Preset normalized 128-d reference descriptor for instant face test
        faceDescriptor: Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1) * 0.1),
        createdAt: new Date().toISOString()
      }
    ],
    failedPasswordAttempts: {}, // { username: count }
    loginAttempts: [
      {
        id: 'att_init_1',
        username: 'student1',
        success: false,
        reason: 'Password mismatch (>3 failed threshold triggered)',
        ip: '103.21.244.18',
        location: {
          city: 'Mumbai',
          region: 'Maharashtra',
          country: 'India',
          isp: 'Reliance Jio Infocomm',
          lat: 19.0760,
          lon: 72.8777
        },
        device: {
          browser: 'Firefox 128.0',
          os: 'Windows 11',
          device: 'Desktop / PC'
        },
        attemptCount: 4,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    proctoringEvents: [],
    cheatingScores: {}, // { [studentId]: { score, classification, metrics, breakdown } }
    examSubmissions: [],
    securityEmails: [],
    questions: [
      {
        id: 'q1',
        category: 'Network Security',
        question: 'Which cryptographic mechanism prevents replay attacks in authentication protocols?',
        options: [
          'Diffie-Hellman Key Exchange',
          'Cryptographic Nonces and Timestamps',
          'Symmetric Triple-DES Encryption',
          'MD5 Hashing without salt'
        ],
        correctAnswer: 1,
        explanation: 'Nonces (numbers used once) and timestamps ensure each authentication payload cannot be intercepted and retransmitted later.'
      },
      {
        id: 'q2',
        category: 'Machine Learning',
        question: 'Why is SMOTE (Synthetic Minority Over-sampling Technique) specifically critical in cheating detection systems?',
        options: [
          'It compresses high-dimensional video streams into embeddings',
          'Real-world cheating occurrences are rare (<5%), causing severe class imbalance where models ignore cheaters',
          'It accelerates neural network backpropagation by 10x',
          'It encrypts face descriptor vectors on the client device'
        ],
        correctAnswer: 1,
        explanation: 'Cheating datasets suffer from severe class imbalance. SMOTE generates synthetic minority samples in feature space to avoid biased models.'
      },
      {
        id: 'q3',
        category: 'Algorithms',
        question: 'What is the average time complexity of searching in a well-balanced Red-Black Tree with N nodes?',
        options: [
          'O(1)',
          'O(N)',
          'O(log N)',
          'O(N log N)'
        ],
        correctAnswer: 2,
        explanation: 'A Red-Black Tree enforces balanced height bounding maximum search paths to 2 * log2(N + 1), giving O(log N).'
      },
      {
        id: 'q4',
        category: 'Cybersecurity',
        question: 'In FGSM (Fast Gradient Sign Method) adversarial attacks against neural networks, how is the perturbation generated?',
        options: [
          'By randomly flipping binary weights in the final layer',
          'By taking the sign of the loss gradient with respect to the input image: eta = epsilon * sign(grad_x J(theta, x, y))',
          'By performing brute-force dictionary permutations on passwords',
          'By corrupting the webcam hardware firmware'
        ],
        correctAnswer: 1,
        explanation: 'FGSM computes the gradient of the loss with respect to input features and shifts them by epsilon in the direction that maximizes loss.'
      },
      {
        id: 'q5',
        category: 'System Design',
        question: 'Which browser Web API allows an online exam portal to immediately detect when a test taker switches to another application or tab?',
        options: [
          'Document Page Visibility API (document.visibilityState and visibilitychange event)',
          'Canvas 2D Rendering Context API',
          'Web Speech Recognition API',
          'Service Worker Cache Storage API'
        ],
        correctAnswer: 0,
        explanation: 'The Page Visibility API fires the visibilitychange event immediately whenever the browser tab becomes hidden or minimized.'
      }
    ]
  };
};

class JSONDatabase {
  constructor() {
    this.data = getInitialData();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // Merge with initial structure to avoid missing keys
        this.data = { ...getInitialData(), ...parsed };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, initializing default:', err);
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // User operations
  getUsers() {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  findUserByUsername(username) {
    if (!username) return null;
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === id) || null;
  }

  createUser(userData) {
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      username: userData.username,
      email: userData.email,
      passwordHash: userData.passwordHash,
      fullName: userData.fullName || userData.username,
      role: userData.role || 'student',
      faceEnrolled: false,
      faceDescriptor: null,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  updateUser(id, updates) {
    const userIndex = this.data.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
    this.save();
    const { passwordHash, ...safeUser } = this.data.users[userIndex];
    return safeUser;
  }

  // Failed attempts tracker
  getFailedAttempts(username) {
    return this.data.failedPasswordAttempts[username.toLowerCase()] || 0;
  }

  incrementFailedAttempts(username) {
    const key = username.toLowerCase();
    this.data.failedPasswordAttempts[key] = (this.data.failedPasswordAttempts[key] || 0) + 1;
    this.save();
    return this.data.failedPasswordAttempts[key];
  }

  resetFailedAttempts(username) {
    const key = username.toLowerCase();
    delete this.data.failedPasswordAttempts[key];
    this.save();
  }

  // Login Attempts Log
  addLoginAttempt(attempt) {
    const record = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...attempt
    };
    this.data.loginAttempts.unshift(record);
    // Keep max 200 recent records
    if (this.data.loginAttempts.length > 200) {
      this.data.loginAttempts = this.data.loginAttempts.slice(0, 200);
    }
    this.save();
    return record;
  }

  getLoginAttempts() {
    return this.data.loginAttempts;
  }

  // Proctoring Events
  addProctoringEvent(event) {
    const record = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.data.proctoringEvents.unshift(record);
    if (this.data.proctoringEvents.length > 500) {
      this.data.proctoringEvents = this.data.proctoringEvents.slice(0, 500);
    }
    this.save();
    return record;
  }

  getProctoringEvents(studentId = null) {
    if (studentId) {
      return this.data.proctoringEvents.filter(e => e.studentId === studentId);
    }
    return this.data.proctoringEvents;
  }

  // Cheating Scores
  saveCheatingScore(studentId, scoreData) {
    this.data.cheatingScores[studentId] = {
      ...scoreData,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.cheatingScores[studentId];
  }

  getCheatingScores() {
    return this.data.cheatingScores;
  }

  getCheatingScoreByStudent(studentId) {
    return this.data.cheatingScores[studentId] || null;
  }

  // Exam Submissions
  addExamSubmission(submission) {
    const record = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      submittedAt: new Date().toISOString(),
      ...submission
    };
    this.data.examSubmissions.unshift(record);
    this.save();
    return record;
  }

  getExamSubmissions() {
    return this.data.examSubmissions;
  }

  // Security Emails
  addSecurityEmail(emailData) {
    const record = {
      id: `eml_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sentAt: new Date().toISOString(),
      ...emailData
    };
    this.data.securityEmails.unshift(record);
    this.save();
    return record;
  }

  getSecurityEmails() {
    return this.data.securityEmails;
  }

  getQuestions() {
    return this.data.questions;
  }
}

export const db = new JSONDatabase();
