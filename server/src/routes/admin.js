import express from 'express';
import { db } from '../db.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- EXAM MANAGEMENT SUITE ---
// List all exams
router.get('/exams', (req, res) => {
  const exams = db.getExams();
  return res.json({ exams });
});

// Create new exam
router.post('/exams', optionalAuthenticateToken, (req, res) => {
  try {
    const { title, description, category, durationMinutes, totalMarks, passingPercentage, strictProctoring, isActive } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Exam title is required.' });
    }

    const newExam = db.createExam({
      title,
      description,
      category: category || 'General Certification',
      durationMinutes: Number(durationMinutes) || 15,
      totalMarks: Number(totalMarks) || 100,
      passingPercentage: Number(passingPercentage) || 60,
      strictProctoring: strictProctoring !== false,
      isActive: Boolean(isActive),
      createdBy: req.user ? req.user.username : 'admin'
    });

    return res.status(201).json({ message: 'Exam created successfully!', exam: newExam });
  } catch (err) {
    console.error('Create exam error:', err);
    return res.status(500).json({ error: 'Failed to create exam.' });
  }
});

// Update exam
router.put('/exams/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.updateExam(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    return res.json({ message: 'Exam updated successfully.', exam: updated });
  } catch (err) {
    console.error('Update exam error:', err);
    return res.status(500).json({ error: 'Failed to update exam.' });
  }
});

// Delete exam
router.delete('/exams/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteExam(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Exam not found.' });
    }
    return res.json({ message: 'Exam and all its questions deleted successfully.' });
  } catch (err) {
    console.error('Delete exam error:', err);
    return res.status(500).json({ error: 'Failed to delete exam.' });
  }
});

// --- QUESTION BANK MANAGEMENT ---
// Get questions for specific exam
router.get('/exams/:id/questions', (req, res) => {
  const { id } = req.params;
  const questions = db.getQuestions(id);
  return res.json({ questions });
});

// Create single question
router.post('/questions', (req, res) => {
  try {
    const { examId, question, options, correctAnswer, explanation, category, points } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question text and at least 2 options are required.' });
    }

    const created = db.createQuestion({
      examId,
      question,
      options,
      correctAnswer: Number(correctAnswer) || 0,
      explanation: explanation || '',
      category: category || 'General',
      points: Number(points) || 1
    });

    return res.status(201).json({ message: 'Question added to question bank!', question: created });
  } catch (err) {
    console.error('Create question error:', err);
    return res.status(500).json({ error: 'Failed to create question.' });
  }
});

// Bulk upload questions (JSON array or parsed CSV records)
router.post('/questions/bulk', (req, res) => {
  try {
    const { examId, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Array of questions required for bulk upload.' });
    }

    const result = db.bulkCreateQuestions(questions, examId);
    return res.status(201).json({
      message: `Successfully imported ${result.count} questions into examination!`,
      importedCount: result.count,
      examId: result.examId
    });
  } catch (err) {
    console.error('Bulk questions error:', err);
    return res.status(500).json({ error: 'Failed to bulk import questions.' });
  }
});

// Update question
router.put('/questions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.updateQuestion(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.json({ message: 'Question updated successfully.', question: updated });
  } catch (err) {
    console.error('Update question error:', err);
    return res.status(500).json({ error: 'Failed to update question.' });
  }
});

// Delete question
router.delete('/questions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteQuestion(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    return res.json({ message: 'Question removed from question bank.' });
  } catch (err) {
    console.error('Delete question error:', err);
    return res.status(500).json({ error: 'Failed to delete question.' });
  }
});

// Submissions List
router.get('/submissions', (req, res) => {
  const submissions = db.getExamSubmissions();
  return res.json({ totalSubmissions: submissions.length, submissions });
});

// --- FORENSICS & DASHBOARD TABS ---
// Tab 1: Authentication / Suspicious Login Attempts
router.get('/auth-logs', (req, res) => {
  const attempts = db.getLoginAttempts();
  const suspicious = attempts.filter(a => !a.success || a.attemptCount > 3);

  return res.json({
    totalAttempts: attempts.length,
    suspiciousCount: suspicious.length,
    attempts,
    suspicious
  });
});

// Tab 2: Users Management (all registered users, face login status, roles)
router.get('/users', (req, res) => {
  const users = db.getUsers();
  const enriched = users.map(u => {
    const studentEvents = db.getProctoringEvents(u.id);
    const score = db.getCheatingScoreByStudent(u.id);
    const submissions = db.getExamSubmissions().filter(s => s.studentId === u.id);
    return {
      ...u,
      hasFaceLogin: Boolean(u.faceEnrolled && u.faceDescriptor),
      violationsCount: studentEvents.length,
      cheatingScore: score ? score.score : 0,
      classification: score ? score.classification : 'HONEST',
      hasSubmittedExam: submissions.length > 0
    };
  });

  return res.json({
    totalUsers: users.length,
    faceEnrolledCount: enriched.filter(u => u.hasFaceLogin).length,
    users: enriched
  });
});

// Tab 3: Exam Cheating & Proctoring Events + Scores
router.get('/cheating-monitor', (req, res) => {
  const events = db.getProctoringEvents();
  const scores = db.getCheatingScores();
  const submissions = db.getExamSubmissions();

  const stats = {
    totalViolations: events.length,
    tabSwitches: events.filter(e => e.type === 'TAB_SWITCH').length,
    gazeDeviations: events.filter(e => e.type === 'LOOKING_AWAY').length,
    multipleFaces: events.filter(e => e.type === 'MULTIPLE_FACES').length,
    missingFaces: events.filter(e => e.type === 'NO_FACE').length,
    copyPasteAttempts: events.filter(e => e.type === 'COPY_PASTE').length,
    fullscreenExits: events.filter(e => e.type === 'FULLSCREEN_EXIT').length,
    cameraOff: events.filter(e => e.type === 'CAMERA_OFF').length
  };

  return res.json({
    stats,
    events,
    scores,
    submissions
  });
});

// Security Emails dispatched by the system
router.get('/security-emails', (req, res) => {
  const emails = db.getSecurityEmails();
  return res.json({
    totalEmails: emails.length,
    emails
  });
});

export default router;
