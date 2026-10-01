import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// Tab 1: Authentication / Suspicious Login Attempts
router.get('/auth-logs', (req, res) => {
  const attempts = db.getLoginAttempts();
  const suspicious = attempts.filter(a => !a.success || a.attemptCount > 3);

  return res.json({
    totalAttempts: attempts.length,
    suspiciousCount: suspicious.length,
    attempts, // includes IP, location, device name, browser, time, attempt count
    suspicious
  });
});

// Tab 2: Users Management (all registered users, face login status)
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

  // Statistics for charts
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
    events, // chronological stream of which student did what and when
    scores, // cheating score per student
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

// Reset demo proctoring logs (useful for repeated viva runs)
router.post('/reset-demo-logs', (req, res) => {
  db.data.proctoringEvents = [];
  db.data.cheatingScores = {};
  db.data.failedPasswordAttempts = {};
  db.save();
  return res.json({ message: 'Proctoring logs and failed attempts reset successfully.' });
});

export default router;
