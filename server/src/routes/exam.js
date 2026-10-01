import express from 'express';
import { db } from '../db.js';
import { calculateStudentCheatingScore } from '../services/cheatingScore.js';
import { broadcastProctoringEvent, broadcastCheatingScoreUpdate } from '../services/socket.js';

const router = express.Router();

// Get exam questions
router.get('/questions', (req, res) => {
  const questions = db.getQuestions().map(({ correctAnswer, ...q }) => q);
  return res.json({
    examTitle: 'AI & Cybersecurity Candidate Certification Test 2026',
    durationMinutes: 10,
    totalQuestions: questions.length,
    questions
  });
});

// Log proctoring violation event
router.post('/event', (req, res) => {
  try {
    const { studentId, studentName, type, details, duration, severity } = req.body;

    if (!studentId || !type) {
      return res.status(400).json({ error: 'studentId and event type are required.' });
    }

    const eventRecord = db.addProctoringEvent({
      studentId,
      studentName: studentName || 'Candidate',
      type, // CAMERA_OFF, LOOKING_AWAY, TAB_SWITCH, FULLSCREEN_EXIT, MULTIPLE_FACES, NO_FACE, COPY_PASTE
      details: details || `Proctoring flag: ${type}`,
      duration: duration || null,
      severity: severity || 'WARNING'
    });

    // Recalculate dynamic cheating score for student
    const updatedScore = calculateStudentCheatingScore(studentId, studentName);

    // Real-time broadcast to Admin Dashboard
    broadcastProctoringEvent({
      event: eventRecord,
      studentScore: updatedScore
    });

    broadcastCheatingScoreUpdate(updatedScore);

    return res.status(201).json({
      message: 'Event logged and integrity evaluated.',
      event: eventRecord,
      currentCheatingScore: updatedScore
    });
  } catch (err) {
    console.error('Proctoring event error:', err);
    return res.status(500).json({ error: 'Failed to record proctoring event.' });
  }
});

// Submit exam answers
router.post('/submit', (req, res) => {
  try {
    const { studentId, studentName, answers, timeSpentSeconds } = req.body;

    if (!studentId || !answers) {
      return res.status(400).json({ error: 'studentId and answers are required.' });
    }

    const questions = db.getQuestions();
    let correctCount = 0;
    const reviewedAnswers = questions.map((q) => {
      const selected = answers[q.id];
      const isCorrect = selected === q.correctAnswer;
      if (isCorrect) correctCount += 1;
      return {
        questionId: q.id,
        category: q.category,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const finalCheatingScore = calculateStudentCheatingScore(studentId, studentName);

    const submission = db.addExamSubmission({
      studentId,
      studentName: studentName || studentId,
      totalQuestions: questions.length,
      correctCount,
      percentage,
      timeSpentSeconds: timeSpentSeconds || 0,
      reviewedAnswers,
      cheatingScore: finalCheatingScore.score,
      integrityClassification: finalCheatingScore.classification,
      status: 'submitted'
    });

    return res.json({
      message: 'Exam submitted successfully.',
      submission,
      cheatingAnalysis: finalCheatingScore
    });
  } catch (err) {
    console.error('Exam submission error:', err);
    return res.status(500).json({ error: 'Failed to submit exam.' });
  }
});

// Get individual student integrity & exam score
router.get('/student/:id', (req, res) => {
  const { id } = req.params;
  const events = db.getProctoringEvents(id);
  const cheatingScore = db.getCheatingScoreByStudent(id) || calculateStudentCheatingScore(id);
  const submissions = db.getExamSubmissions().filter(s => s.studentId === id);

  return res.json({
    studentId: id,
    events,
    cheatingScore,
    latestSubmission: submissions[0] || null
  });
});

export default router;
