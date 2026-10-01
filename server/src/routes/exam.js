import express from 'express';
import { db } from '../db.js';
import { calculateStudentCheatingScore } from '../services/cheatingScore.js';
import { broadcastProctoringEvent, broadcastCheatingScoreUpdate } from '../services/socket.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';

const router = express.Router();

// List available exams for candidates
router.get('/list', (req, res) => {
  const exams = db.getExams().filter(e => e.isActive);
  return res.json({ exams });
});

// Get exam metadata & questions for candidate (NEVER exposes correct answers or explanations to candidate before submit!)
router.get('/questions', (req, res) => {
  const { examId } = req.query;
  const exam = examId ? db.getExamById(examId) : db.getActiveExam();

  if (!exam) {
    return res.status(404).json({ error: 'No active examination found.' });
  }

  const rawQuestions = db.getQuestions(exam.id);

  // SANITIZE: Strip correct answers and explanations before sending to client!
  const sanitizedQuestions = rawQuestions.map(({ correctAnswer, explanation, ...q }) => q);

  return res.json({
    examId: exam.id,
    examTitle: exam.title,
    description: exam.description,
    category: exam.category,
    durationMinutes: exam.durationMinutes,
    totalMarks: exam.totalMarks,
    passingPercentage: exam.passingPercentage,
    strictProctoring: exam.strictProctoring,
    totalQuestions: sanitizedQuestions.length,
    questions: sanitizedQuestions
  });
});

// Log proctoring violation event
router.post('/event', (req, res) => {
  try {
    const { studentId, studentName, examId, type, details, duration, severity } = req.body;

    if (!studentId || !type) {
      return res.status(400).json({ error: 'studentId and event type are required.' });
    }

    const eventRecord = db.addProctoringEvent({
      studentId,
      studentName: studentName || 'Candidate',
      examId: examId || null,
      type, // CAMERA_OFF, LOOKING_AWAY, TAB_SWITCH, FULLSCREEN_EXIT, MULTIPLE_FACES, NO_FACE, COPY_PASTE
      details: details || `Proctoring flag: ${type}`,
      duration: duration || null,
      severity: severity || 'WARNING'
    });

    // Recalculate dynamic cheating score for student
    const updatedScore = calculateStudentCheatingScore(studentId, studentName);

    // Save to SQLite
    db.saveCheatingScore(studentId, updatedScore);

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
router.post('/submit', optionalAuthenticateToken, (req, res) => {
  try {
    const { studentId, studentName, examId, answers, timeSpentSeconds } = req.body;

    if (!studentId || !answers) {
      return res.status(400).json({ error: 'studentId and answers are required.' });
    }

    const targetExamId = examId || (db.getActiveExam()?.id || 'exam_cyber_ai_2026');
    const questions = db.getQuestions(targetExamId);

    if (questions.length === 0) {
      return res.status(400).json({ error: 'No questions registered for this exam.' });
    }

    let correctCount = 0;
    let earnedPoints = 0;
    let totalPossiblePoints = 0;

    const reviewedAnswers = questions.map((q) => {
      const selected = answers[q.id];
      const isCorrect = selected !== undefined && Number(selected) === Number(q.correctAnswer);
      const points = q.points || 1;
      totalPossiblePoints += points;

      if (isCorrect) {
        correctCount += 1;
        earnedPoints += points;
      }

      return {
        questionId: q.id,
        category: q.category,
        question: q.question,
        options: q.options,
        selectedAnswer: selected !== undefined ? Number(selected) : null,
        correctAnswer: q.correctAnswer,
        isCorrect,
        points: isCorrect ? points : 0,
        explanation: q.explanation
      };
    });

    const percentage = totalPossiblePoints > 0
      ? Math.round((earnedPoints / totalPossiblePoints) * 100)
      : Math.round((correctCount / questions.length) * 100);

    const finalCheatingScore = calculateStudentCheatingScore(studentId, studentName);
    db.saveCheatingScore(studentId, finalCheatingScore);

    const submission = db.addExamSubmission({
      examId: targetExamId,
      studentId,
      studentName: studentName || (req.user ? req.user.fullName : studentId),
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
      message: 'Examination submitted and evaluated successfully.',
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
