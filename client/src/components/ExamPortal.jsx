import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { examApi } from '../services/api';
import ProctoringMonitor from './ProctoringMonitor';
import confetti from 'canvas-confetti';
import {
  Clock,
  Shield,
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  Maximize2,
  Minimize2,
  FileQuestion,
  Award,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react';

export default function ExamPortal({ onExitExam }) {
  const { user } = useAuth();

  // Exam questions and state
  const [examData, setExamData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timer: 10 minutes (600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Proctoring states
  const [isCameraCompulsoryBlocked, setIsCameraCompulsoryBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningToast, setWarningToast] = useState(null);

  // Active student identifier
  const studentId = user?.id || 'usr_demo_student';
  const studentName = user?.fullName || user?.username || 'Alex Mercer';

  // Load Exam Questions
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const data = await examApi.getQuestions();
        setExamData(data);
      } catch (err) {
        setError(err.message || 'Failed to load exam questions.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (submissionResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submissionResult, timeLeft]);

  // Toast auto-clear
  const showToast = useCallback((msg, type = 'warning') => {
    setWarningToast({ message: msg, type });
    setTimeout(() => {
      setWarningToast(null);
    }, 4500);
  }, []);

  // Proctoring event logger helper
  const logEvent = useCallback(async (type, details, severity = 'WARNING') => {
    try {
      await examApi.logEvent({
        studentId,
        studentName,
        type,
        details,
        severity
      });
    } catch (e) {
      console.warn('Event logging error:', e);
    }
  }, [studentId, studentName]);

  // ANTI-CHEATING LISTENERS REQUIREMENT:
  // 1. Switching tab or window -> Logged and warned
  // 2. Leaving fullscreen -> Logged and warned
  // 3. Copy / paste / right click -> Blocked and logged
  useEffect(() => {
    if (submissionResult) return;

    // A. Tab / Window Switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        showToast('⚠️ WARNING: Switching tabs is recorded as an integrity violation!', 'danger');
        logEvent('TAB_SWITCH', 'Candidate switched browser tab or minimized window', 'CRITICAL');
      }
    };

    const handleWindowBlur = () => {
      showToast('⚠️ Window focus lost! Please remain on the exam screen.', 'danger');
      logEvent('TAB_SWITCH', 'Candidate clicked outside browser window (Window blur)', 'WARNING');
    };

    // B. Fullscreen Change
    const handleFullscreenChange = () => {
      const isNowFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isNowFull);
      if (!isNowFull) {
        showToast('⚠️ WARNING: Exiting fullscreen mode is flagged as suspicious!', 'danger');
        logEvent('FULLSCREEN_EXIT', 'Candidate left fullscreen examination mode', 'WARNING');
      }
    };

    // C. Copy / Paste / Cut Block
    const handleCopy = (e) => {
      e.preventDefault();
      showToast('🚫 Copying question text is strictly disabled!', 'danger');
      logEvent('COPY_PASTE', 'Attempted to COPY exam question to clipboard', 'WARNING');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      showToast('🚫 Pasting text into answer fields is disabled!', 'danger');
      logEvent('COPY_PASTE', 'Attempted to PASTE unauthorized text', 'WARNING');
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      showToast('🚫 Right-click context menu is disabled during the exam.', 'danger');
      logEvent('COPY_PASTE', 'Attempted to open right-click inspector context menu', 'WARNING');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [submissionResult, showToast, logEvent]);

  // Request Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Select Option
  const handleSelectOption = (questionId, optionIndex) => {
    if (isCameraCompulsoryBlocked) {
      showToast('🚫 Camera is required! Turn camera on to answer questions.', 'danger');
      return;
    }
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  // Submit Exam
  const handleSubmitExam = async () => {
    if (isCameraCompulsoryBlocked) {
      showToast('🚫 Camera is required! Turn camera on to submit.', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await examApi.submitExam({
        studentId,
        studentName,
        answers,
        timeSpentSeconds: 600 - timeLeft
      });

      setSubmissionResult(res);

      if (res.cheatingAnalysis?.classification === 'HONEST') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      showToast(err.message || 'Submission error.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format Timer mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-cyan-300">Loading Secure Examination Session...</p>
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center p-4">
        <div className="cyber-card rounded-2xl p-6 text-center max-w-md">
          <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Exam Portal Error</h3>
          <p className="text-xs text-slate-400 mb-4">{error || 'Could not load exam data'}</p>
          <button
            onClick={onExitExam}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const questions = examData.questions || [];
  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col relative select-none">
      {/* Proctoring HUD Camera Monitor */}
      <ProctoringMonitor
        studentId={studentId}
        studentName={studentName}
        isCameraCompulsoryBlocked={isCameraCompulsoryBlocked}
        setIsCameraCompulsoryBlocked={setIsCameraCompulsoryBlocked}
      />

      {/* Floating Warning Toast */}
      {warningToast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 text-xs font-semibold animate-bounce ${
          warningToast.type === 'danger'
            ? 'bg-red-950/90 border-red-500 text-red-200 shadow-red-500/30'
            : 'bg-amber-950/90 border-amber-500 text-amber-200'
        }`}>
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{warningToast.message}</span>
        </div>
      )}

      {/* Top Examination Navigation Bar */}
      <header className="sticky top-0 z-30 cyber-glass border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white font-display">
              {examData.examTitle}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Candidate: <span className="text-cyan-300 font-semibold">{studentName}</span> • Session ID: <span className="text-slate-500">{studentId.slice(0, 8)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          {/* Fullscreen Mode Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isFullscreen ? 'Fullscreen' : 'Full Screen'}</span>
          </button>

          {/* Countdown Timer */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border ${
            timeLeft < 120
              ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse'
              : 'bg-slate-900/80 border-cyan-500/40 text-cyan-300'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Submit Button */}
          {!submissionResult && (
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting || isCameraCompulsoryBlocked}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                isCameraCompulsoryBlocked
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Examination Content / Post-Exam Integrity Report */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!submissionResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left 3 Cols: Active Question Card */}
            <div className="lg:col-span-3 space-y-6">
              <div className="cyber-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl">
                {/* Category & Question Counter */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    {currentQ.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                </div>

                {/* Question Prompt */}
                <h2 className="text-base sm:text-lg font-semibold text-slate-100 mb-6 leading-relaxed">
                  {currentQ.question}
                </h2>

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {currentQ.options.map((option, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full p-4 rounded-xl text-left text-sm transition-all border flex items-center justify-between group ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-glow font-medium'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                            isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{option}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Pagination Controls */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setCurrentIdx(prev => Math.max(prev - 1, 0))}
                    disabled={currentIdx === 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {isLastQuestion ? (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      disabled={isSubmitting || isCameraCompulsoryBlocked}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                    >
                      <span>Final Submit</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(prev => Math.min(prev + 1, questions.length - 1))}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Question Navigation Palette */}
            <div className="space-y-4">
              <div className="cyber-card rounded-2xl p-5 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
                  Question Palette
                </h3>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {questions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = currentIdx === idx;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentIdx(idx)}
                        className={`aspect-square rounded-xl text-xs font-mono font-bold transition-all border flex items-center justify-center ${
                          isCurrent
                            ? 'border-cyan-400 bg-cyan-500 text-slate-950 shadow-glow'
                            : isAnswered
                            ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                            : 'border-slate-800 bg-slate-900 text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Answered:</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                      <span>Remaining:</span>
                    </span>
                    <span className="font-mono text-slate-300">{questions.length - answeredCount}</span>
                  </div>
                </div>
              </div>

              {/* Proctoring Rules Summary Card */}
              <div className="cyber-card rounded-2xl p-4 border border-slate-800 text-[11px] space-y-2 text-slate-400">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Continuous AI Supervision:</span>
                </div>
                <ul className="space-y-1 list-disc list-inside text-slate-400">
                  <li>Keep camera active continuously</li>
                  <li>Do not switch tabs or windows</li>
                  <li>Avoid looking away from display</li>
                  <li>Copy / paste is blocked and logged</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* POST-EXAM INTEGRITY & SCORECARD REPORT */
          <div className="space-y-6 animate-fadeIn">
            {/* Header Result Card */}
            <div className="cyber-card rounded-2xl p-6 sm:p-8 border border-cyan-500/30 text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-glow">
                <Award className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-white font-display mb-1">
                Exam Completed & Evaluated
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                Your responses and continuous multi-sensor proctoring telemetry have been verified by the AI Integrity Engine.
              </p>

              {/* Score Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                {/* Academic Score */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Academic Score</span>
                  <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
                    {submissionResult.submission.percentage}%
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {submissionResult.submission.correctCount} / {submissionResult.submission.totalQuestions} Correct
                  </span>
                </div>

                {/* AI Cheating Risk Score */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">AI Cheating Risk Score</span>
                  <div className="text-2xl font-extrabold font-mono mt-1" style={{ color: submissionResult.cheatingAnalysis.badgeColor }}>
                    {submissionResult.cheatingAnalysis.score}%
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: submissionResult.cheatingAnalysis.badgeColor }}>
                    {submissionResult.cheatingAnalysis.classification}
                  </span>
                </div>

                {/* Integrity Status */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Proctoring Verdict</span>
                  <div className="text-sm font-bold text-white mt-2">
                    {submissionResult.cheatingAnalysis.statusText}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {submissionResult.cheatingAnalysis.totalEvents} Telemetry Flags
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={onExitExam}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
                >
                  Return to Main Portal
                </button>
              </div>
            </div>

            {/* Detailed Integrity Telemetry Breakdown */}
            <div className="cyber-card rounded-2xl p-6 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Cheating Score Factors Breakdown (Ensemble Model)</span>
              </h3>

              <div className="space-y-3">
                {submissionResult.cheatingAnalysis.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                    <span className="text-slate-300 font-medium">{item.factor}</span>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-slate-400">Instances: <strong className="text-slate-200">{item.count}</strong></span>
                      <span className={item.penalty > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                        +{item.penalty} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Answer Explanations Review */}
            <div className="cyber-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-cyan-400" />
                <span>Question-by-Question Solution Review</span>
              </h3>

              {submissionResult.submission.reviewedAnswers.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border text-xs space-y-2 ${
                  item.isCorrect ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-slate-400">Question {idx + 1} • {item.category}</span>
                    <span className={item.isCorrect ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {item.isCorrect ? '✓ Correct (+10 pts)' : '✕ Incorrect'}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
