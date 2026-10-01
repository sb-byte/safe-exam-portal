import React, { useState, useEffect, useCallback } from 'react';
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

  const [examData, setExamData] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timeLeft, setTimeLeft] = useState(600);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const [isCameraCompulsoryBlocked, setIsCameraCompulsoryBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningToast, setWarningToast] = useState(null);

  const studentId = user?.id || 'usr_demo_student';
  const studentName = user?.fullName || user?.username || 'Alex Mercer';

  useEffect(() => {
    async function fetchQuestions() {
      try {
        setLoading(true);
        const data = await examApi.getQuestions();
        setExamData(data);
        if (data.durationMinutes) {
          setTimeLeft(data.durationMinutes * 60);
        }
      } catch (err) {
        setError(err.message || 'Failed to load exam questions.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

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

  const showToast = useCallback((msg, type = 'warning') => {
    setWarningToast({ message: msg, type });
    setTimeout(() => {
      setWarningToast(null);
    }, 4500);
  }, []);

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

  useEffect(() => {
    if (submissionResult) return;

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

    const handleFullscreenChange = () => {
      const isNowFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isNowFull);
      if (!isNowFull) {
        showToast('⚠️ WARNING: Exiting fullscreen mode is flagged as suspicious!', 'danger');
        logEvent('FULLSCREEN_EXIT', 'Candidate left fullscreen examination mode', 'WARNING');
      }
    };

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

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

  const handleSubmitExam = async () => {
    if (isCameraCompulsoryBlocked) {
      showToast('🚫 Camera is required! Turn camera on to submit.', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalDurationSecs = (examData?.durationMinutes || 15) * 60;
      const res = await examApi.submitExam({
        examId: examData?.examId,
        studentId,
        studentName,
        answers,
        timeSpentSeconds: Math.max(0, totalDurationSecs - timeLeft)
      });

      setSubmissionResult(res);

      if (res.cheatingAnalysis?.classification === 'HONEST') {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      showToast(err.message || 'Submission error.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center neo-grid-bg">
        <div className="bg-white p-8 rounded-2xl border-4 border-black shadow-neo-lg flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-[#ffe600] rounded-full animate-spin" />
          <p className="text-sm font-black font-mono uppercase text-black">Loading Examination Session...</p>
        </div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen bg-[#f8f5ee] flex items-center justify-center p-4 neo-grid-bg">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md border-4 border-black shadow-neo-lg">
          <AlertOctagon className="w-14 h-14 text-[#dc2626] mx-auto mb-3 stroke-[2.5]" />
          <h3 className="text-xl font-black text-black uppercase mb-2">Exam Portal Error</h3>
          <p className="text-xs font-bold text-slate-700 mb-6">{error || 'Could not load exam data'}</p>
          <button
            onClick={onExitExam}
            className="px-6 py-3 bg-[#ffe600] text-black text-xs font-black rounded-xl neo-btn uppercase"
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
    <div className="min-h-screen bg-[#f8f5ee] text-black flex flex-col relative select-none neo-grid-bg">
      {/* Proctoring HUD Camera Monitor */}
      <ProctoringMonitor
        studentId={studentId}
        studentName={studentName}
        isCameraCompulsoryBlocked={isCameraCompulsoryBlocked}
        setIsCameraCompulsoryBlocked={setIsCameraCompulsoryBlocked}
      />

      {/* Floating Warning Toast */}
      {warningToast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-xl border-3 border-black shadow-neo-lg flex items-center gap-3 text-xs font-black animate-bounce ${
          warningToast.type === 'danger'
            ? 'bg-[#fee2e2] text-black'
            : 'bg-[#fef3c7] text-black'
        }`}>
          <AlertTriangle className="w-5 h-5 text-[#dc2626] flex-shrink-0 stroke-[3]" />
          <span>{warningToast.message}</span>
        </div>
      )}

      {/* Top Examination Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b-4 border-black px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#ffe600] border-2 border-black shadow-neo-sm flex items-center justify-center text-black">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-black font-display uppercase tracking-tight">
              {examData.examTitle}
            </h1>
            <p className="text-[11px] text-slate-800 font-mono font-bold">
              Candidate: <span className="bg-[#38bdf8] px-1 border border-black rounded">{studentName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Fullscreen Mode Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8f5ee] border-2 border-black shadow-neo-sm text-xs font-black text-black hover:bg-white transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 stroke-[2.5]" /> : <Maximize2 className="w-4 h-4 stroke-[2.5]" />}
            <span>{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>

          {/* Countdown Timer */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black border-2 border-black shadow-neo-sm ${
            timeLeft < 120
              ? 'bg-[#fee2e2] text-[#dc2626] animate-pulse'
              : 'bg-[#ffe600] text-black'
          }`}>
            <Clock className="w-4 h-4 stroke-[2.5]" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Submit Button */}
          {!submissionResult && (
            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting || isCameraCompulsoryBlocked}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 ${
                isCameraCompulsoryBlocked
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-2 border-black'
                  : 'bg-[#86efac] hover:bg-[#4ade80] text-black neo-btn'
              }`}
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
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
              <div className="bg-white rounded-2xl p-6 sm:p-8 border-3 border-black shadow-neo-lg">
                {/* Category & Question Counter */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
                  <span className="neo-badge bg-[#38bdf8] text-black px-3 py-1 text-xs">
                    {currentQ.category}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-800">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                </div>

                {/* Question Prompt */}
                <h2 className="text-base sm:text-xl font-black text-black mb-6 leading-relaxed">
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
                        className={`w-full p-4 rounded-xl text-left text-sm transition-all border-2 border-black flex items-center justify-between group ${
                          isSelected
                            ? 'bg-[#ffe600] text-black font-black shadow-neo translate-x-1'
                            : 'bg-white text-slate-900 font-bold hover:bg-[#f8f5ee] shadow-neo-sm hover:translate-x-0.5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center text-xs font-mono font-black ${
                            isSelected ? 'bg-black text-[#ffe600]' : 'bg-[#f8f5ee] text-black group-hover:bg-[#ffe600]'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-black">{option}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-black stroke-[3] flex-shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Pagination Controls */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setCurrentIdx(prev => Math.max(prev - 1, 0))}
                    disabled={currentIdx === 0}
                    className="px-4 py-2.5 rounded-xl text-xs font-black bg-white border-2 border-black shadow-neo-sm text-black hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 uppercase"
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[3]" />
                    <span>Previous</span>
                  </button>

                  {isLastQuestion ? (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      disabled={isSubmitting || isCameraCompulsoryBlocked}
                      className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#86efac] hover:bg-[#4ade80] text-black neo-btn flex items-center gap-1.5 uppercase tracking-wide"
                    >
                      <span>Final Submit</span>
                      <Send className="w-4 h-4 stroke-[3]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(prev => Math.min(prev + 1, questions.length - 1))}
                      className="px-5 py-2.5 rounded-xl text-xs bg-[#ffe600] hover:bg-[#fde047] text-black font-black neo-btn flex items-center gap-1.5 uppercase tracking-wide"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Question Navigation Palette */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border-3 border-black shadow-neo-md">
                <h3 className="text-xs font-black uppercase tracking-wider text-black mb-3 font-mono">
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
                        className={`aspect-square rounded-lg text-xs font-mono font-black transition-all border-2 border-black flex items-center justify-center ${
                          isCurrent
                            ? 'bg-[#ffe600] text-black shadow-neo-sm scale-105'
                            : isAnswered
                            ? 'bg-[#86efac] text-black shadow-neo-sm'
                            : 'bg-white text-slate-800 hover:bg-[#f8f5ee]'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-3 border-t-2 border-black text-xs font-bold text-black">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-[#86efac] border border-black" />
                      <span>Answered:</span>
                    </span>
                    <span className="font-mono font-black">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-white border border-black" />
                      <span>Remaining:</span>
                    </span>
                    <span className="font-mono font-black">{questions.length - answeredCount}</span>
                  </div>
                </div>
              </div>

              {/* Rules Summary Card */}
              <div className="bg-[#fef3c7] rounded-2xl p-4 border-2 border-black shadow-neo-sm text-xs font-bold space-y-2 text-black">
                <div className="flex items-center gap-1.5 uppercase font-black">
                  <Shield className="w-4 h-4 stroke-[2.5]" />
                  <span>AI Proctoring Strict Rules:</span>
                </div>
                <ul className="space-y-1 list-disc list-inside font-medium text-slate-900 text-[11px]">
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
            <div className="bg-white rounded-2xl p-8 border-4 border-black shadow-neo-xl text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#ffe600] border-3 border-black shadow-neo flex items-center justify-center text-black mb-4">
                <Award className="w-9 h-9 stroke-[2.5]" />
              </div>

              <span className="neo-badge bg-[#86efac] text-black px-3 py-1 text-xs">Evaluation Complete</span>
              <h2 className="text-3xl font-black text-black font-display uppercase tracking-tight mt-2 mb-1">
                Exam Evaluated & Audited
              </h2>
              <p className="text-xs font-semibold text-slate-700 max-w-md mx-auto mb-6">
                Your responses and continuous multi-sensor proctoring telemetry have been verified by the AI Integrity Engine.
              </p>

              {/* Score Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                {/* Academic Score */}
                <div className="bg-[#e0f2fe] rounded-xl p-4 border-3 border-black shadow-neo text-black">
                  <span className="text-xs font-mono font-black uppercase">Academic Score</span>
                  <div className="text-3xl font-black font-mono mt-1">
                    {submissionResult.submission.percentage}%
                  </div>
                  <span className="text-xs font-bold">
                    {submissionResult.submission.correctCount} / {submissionResult.submission.totalQuestions} Correct
                  </span>
                </div>

                {/* AI Cheating Risk Score */}
                <div className="bg-[#fee2e2] rounded-xl p-4 border-3 border-black shadow-neo text-black">
                  <span className="text-xs font-mono font-black uppercase">Cheating Risk Score</span>
                  <div className="text-3xl font-black font-mono mt-1 text-[#dc2626]">
                    {submissionResult.cheatingAnalysis.score}%
                  </div>
                  <span className="text-xs font-black uppercase">
                    {submissionResult.cheatingAnalysis.classification}
                  </span>
                </div>

                {/* Integrity Status */}
                <div className="bg-[#dcfce7] rounded-xl p-4 border-3 border-black shadow-neo text-black">
                  <span className="text-xs font-mono font-black uppercase">Proctoring Verdict</span>
                  <div className="text-sm font-black mt-2 uppercase">
                    {submissionResult.cheatingAnalysis.statusText}
                  </div>
                  <span className="text-xs font-bold">
                    {submissionResult.cheatingAnalysis.totalEvents} Telemetry Flags
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={onExitExam}
                  className="px-8 py-3.5 bg-[#ffe600] hover:bg-[#fde047] text-black font-black rounded-xl text-sm neo-btn uppercase tracking-wide"
                >
                  Return to Main Portal
                </button>
              </div>
            </div>

            {/* Detailed Integrity Telemetry Breakdown */}
            <div className="bg-white rounded-2xl p-6 border-3 border-black shadow-neo-lg">
              <h3 className="text-sm font-black text-black mb-4 uppercase flex items-center gap-2">
                <Shield className="w-5 h-5 stroke-[2.5]" />
                <span>Cheating Score Factors Breakdown (Ensemble Model)</span>
              </h3>

              <div className="space-y-3">
                {submissionResult.cheatingAnalysis.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f5ee] border-2 border-black text-xs font-bold">
                    <span className="text-black">{item.factor}</span>
                    <div className="flex items-center gap-4 font-mono">
                      <span>Instances: <strong>{item.count}</strong></span>
                      <span className={`px-2 py-0.5 rounded border border-black ${
                        item.penalty > 0 ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#15803d]'
                      }`}>
                        +{item.penalty} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Answer Explanations Review */}
            <div className="bg-white rounded-2xl p-6 border-3 border-black shadow-neo-lg space-y-4">
              <h3 className="text-sm font-black text-black mb-2 uppercase flex items-center gap-2">
                <FileQuestion className="w-5 h-5 stroke-[2.5]" />
                <span>Question-by-Question Solution Review</span>
              </h3>

              {submissionResult.submission.reviewedAnswers.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border-2 border-black shadow-neo-sm text-xs space-y-2 ${
                  item.isCorrect ? 'bg-[#dcfce7]' : 'bg-[#fee2e2]'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="font-mono uppercase">Question {idx + 1} • {item.category}</span>
                    <span className={`px-2 py-0.5 rounded border border-black uppercase ${
                      item.isCorrect ? 'bg-[#86efac] text-black' : 'bg-[#fca5a5] text-black'
                    }`}>
                      {item.isCorrect ? '✓ Correct (+10 pts)' : '✕ Incorrect'}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
