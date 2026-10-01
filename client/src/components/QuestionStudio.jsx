import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Download,
  Check,
  Award,
  Clock,
  Sparkles,
  Layers,
  Search,
  BookOpen,
  Eye,
  Sliders,
  FileSpreadsheet
} from 'lucide-react';

export default function QuestionStudio({ onQuestionsUpdated }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('questions'); // 'questions' | 'upload' | 'submissions'
  const [notification, setNotification] = useState(null);

  // New Exam Modal
  const [isNewExamModalOpen, setIsNewExamModalOpen] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamCategory, setNewExamCategory] = useState('Cybersecurity & AI');
  const [newExamDescription, setNewExamDescription] = useState('');
  const [newExamDuration, setNewExamDuration] = useState(15);
  const [newExamTotalMarks, setNewExamTotalMarks] = useState(100);
  const [newExamPassing, setNewExamPassing] = useState(60);
  const [newExamStrict, setNewExamStrict] = useState(true);

  // Single Question Form
  const [singleQuestion, setSingleQuestion] = useState({
    question: '',
    category: 'Cybersecurity',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    points: 20
  });

  // Bulk Upload State
  const [uploadTab, setUploadTab] = useState('csv'); // 'csv' | 'json'
  const [csvFile, setCsvFile] = useState(null);
  const [parsedPreview, setParsedPreview] = useState([]);
  const [jsonInput, setJsonInput] = useState('');

  // Selected Submission Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchExamsAndQuestions = async () => {
    try {
      setLoading(true);
      const [examsRes, subsRes] = await Promise.all([
        adminApi.getExams(),
        adminApi.getSubmissions()
      ]);
      setExams(examsRes.exams || []);
      setSubmissions(subsRes.submissions || []);

      const active = examsRes.exams?.find(e => e.isActive) || examsRes.exams?.[0];
      const targetId = selectedExamId || active?.id;
      setSelectedExamId(targetId);

      if (targetId) {
        const qRes = await adminApi.getExamQuestions(targetId);
        setQuestions(qRes.questions || []);
      }
    } catch (err) {
      console.error('Failed to load exams & questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamsAndQuestions();
  }, []);

  const handleSelectExam = async (examId) => {
    setSelectedExamId(examId);
    try {
      setLoading(true);
      const qRes = await adminApi.getExamQuestions(examId);
      setQuestions(qRes.questions || []);
    } catch (err) {
      console.error('Failed to fetch questions for exam:', err);
    } finally {
      setLoading(false);
    }
  };

  const notify = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Create New Exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.createExam({
        title: newExamTitle,
        category: newExamCategory,
        description: newExamDescription,
        durationMinutes: Number(newExamDuration),
        totalMarks: Number(newExamTotalMarks),
        passingPercentage: Number(newExamPassing),
        strictProctoring: newExamStrict,
        isActive: true
      });
      notify(`Examination "${newExamTitle}" created successfully!`);
      setIsNewExamModalOpen(false);
      setNewExamTitle('');
      setNewExamDescription('');
      fetchExamsAndQuestions();
    } catch (err) {
      notify(err.message || 'Failed to create exam.', true);
    }
  };

  // 2. Set Active Exam
  const handleSetActiveExam = async (examId) => {
    try {
      await adminApi.updateExam(examId, { isActive: true });
      notify('Exam set as active examination for candidates!');
      fetchExamsAndQuestions();
    } catch (err) {
      notify('Failed to activate exam.', true);
    }
  };

  // 3. Delete Exam
  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this examination and all its questions?')) return;
    try {
      await adminApi.deleteExam(examId);
      notify('Exam deleted.');
      setSelectedExamId(null);
      fetchExamsAndQuestions();
    } catch (err) {
      notify('Failed to delete exam.', true);
    }
  };

  // 4. Create Single Question
  const handleSaveSingleQuestion = async (e) => {
    e.preventDefault();
    if (!singleQuestion.question.trim()) return notify('Question text is required.', true);
    if (singleQuestion.options.some(opt => !opt.trim())) return notify('All 4 options must be filled.', true);

    try {
      await adminApi.createQuestion({
        examId: selectedExamId,
        ...singleQuestion,
        correctAnswer: Number(singleQuestion.correctAnswer),
        points: Number(singleQuestion.points)
      });

      notify('Question added to examination database!');
      setSingleQuestion({
        question: '',
        category: singleQuestion.category,
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        points: 20
      });
      const qRes = await adminApi.getExamQuestions(selectedExamId);
      setQuestions(qRes.questions || []);
      if (onQuestionsUpdated) onQuestionsUpdated();
    } catch (err) {
      notify(err.message || 'Failed to add question.', true);
    }
  };

  // 5. Delete Question
  const handleDeleteQuestion = async (questionId) => {
    try {
      await adminApi.deleteQuestion(questionId);
      notify('Question removed from database.');
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      if (onQuestionsUpdated) onQuestionsUpdated();
    } catch (err) {
      notify('Failed to delete question.', true);
    }
  };

  // 6. CSV File Parsing
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) return notify('CSV file must have header row and at least one question.', true);

      const parsed = [];
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        // Handle CSV split with commas
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'));
        if (cols.length >= 6) {
          const [qText, optA, optB, optC, optD, correctIdx, cat = 'General', exp = '', pts = '20'] = cols;
          parsed.push({
            question: qText,
            options: [optA, optB, optC, optD],
            correctAnswer: Math.max(0, Math.min(3, parseInt(correctIdx, 10) || 0)),
            category: cat,
            explanation: exp,
            points: parseInt(pts, 10) || 20
          });
        }
      }
      setParsedPreview(parsed);
    };
    reader.readAsText(file);
  };

  // 7. Bulk Submit Parsed Questions
  const handleConfirmBulkUpload = async () => {
    const listToUpload = uploadTab === 'csv' ? parsedPreview : (() => {
      try {
        const parsed = JSON.parse(jsonInput);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();

    if (!listToUpload || listToUpload.length === 0) {
      return notify('No valid questions to import.', true);
    }

    try {
      const res = await adminApi.bulkCreateQuestions({
        examId: selectedExamId,
        questions: listToUpload
      });
      notify(`Imported ${res.importedCount} questions successfully!`);
      setParsedPreview([]);
      setCsvFile(null);
      setJsonInput('');
      setActiveSubTab('questions');
      const qRes = await adminApi.getExamQuestions(selectedExamId);
      setQuestions(qRes.questions || []);
      if (onQuestionsUpdated) onQuestionsUpdated();
    } catch (err) {
      notify(err.message || 'Bulk upload failed.', true);
    }
  };

  // CSV Template Downloader
  const downloadSampleCsv = () => {
    const sample = `Question,OptionA,OptionB,OptionC,OptionD,CorrectIndex,Category,Explanation,Points
"What is the default port for HTTPS?","80","443","8080","22",1,"Network Security","HTTPS uses port 443 with TLS.",20
"What does SMOTE do?","Compresses photos","Over-samples minority class","Decreases learning rate","Encrypts passwords",1,"Machine Learning","SMOTE generates synthetic minority data points.",20
"What is a replay attack?","Repeating physical access","Retransmitting intercepted valid auth packets","Rebooting server","Overclocking GPU",1,"Cybersecurity","Replay attacks re-send recorded authentication payloads.",20`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secure_exam_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedExam = exams.find(e => e.id === selectedExamId) || exams[0];

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border-3 border-black shadow-neo font-bold text-xs flex items-center justify-between animate-slideDown ${
            notification.isError ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#15803d]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.isError ? <AlertCircle className="w-4 h-4 stroke-[3]" /> : <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            <span>{notification.msg}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-black">✕</button>
        </div>
      )}

      {/* Top Controls: Active Exam Switcher & Actions */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-3 border-black shadow-neo">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-black uppercase bg-[#ffe600] px-2 py-0.5 border border-black rounded shadow-[1px_1px_0px_#000]">
              Active Question Bank & Studio
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-black font-display uppercase tracking-tight mt-1.5">
              {selectedExam ? selectedExam.title : 'Examination Studio'}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono font-bold text-slate-800">
              <span className="bg-[#f8f5ee] px-2 py-1 rounded border border-black">
                Category: <strong>{selectedExam?.category || 'General'}</strong>
              </span>
              <span className="bg-[#f8f5ee] px-2 py-1 rounded border border-black">
                Duration: <strong>{selectedExam?.durationMinutes || 15} mins</strong>
              </span>
              <span className="bg-[#f8f5ee] px-2 py-1 rounded border border-black">
                Total Marks: <strong>{selectedExam?.totalMarks || 100}</strong>
              </span>
              <span className="bg-[#f8f5ee] px-2 py-1 rounded border border-black">
                Passing: <strong>{selectedExam?.passingPercentage || 60}%</strong>
              </span>
              <span className={`px-2 py-1 rounded border border-black ${selectedExam?.isActive ? 'bg-[#86efac] text-black' : 'bg-slate-200'}`}>
                {selectedExam?.isActive ? '● CURRENT CANDIDATE EXAM' : 'INACTIVE'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Exam Selector Dropdown */}
            <select
              value={selectedExamId || ''}
              onChange={(e) => handleSelectExam(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-black bg-[#f8f5ee] text-xs font-black shadow-neo-sm"
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.title} {e.isActive ? '(Active)' : ''}
                </option>
              ))}
            </select>

            {selectedExam && !selectedExam.isActive && (
              <button
                type="button"
                onClick={() => handleSetActiveExam(selectedExam.id)}
                className="px-3 py-2 rounded-xl bg-[#4ade80] text-black text-xs font-black neo-btn"
              >
                Set as Active
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsNewExamModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#ffe600] text-black text-xs font-black neo-btn flex items-center gap-1.5 uppercase"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Exam</span>
            </button>

            {exams.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteExam(selectedExamId)}
                title="Delete this examination"
                className="p-2 rounded-xl bg-[#fee2e2] text-[#dc2626] border-2 border-black shadow-neo-sm hover:bg-[#fca5a5]"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex gap-2 border-b-3 border-black pb-1 font-bold">
        <button
          onClick={() => setActiveSubTab('questions')}
          className={`px-4 py-2 text-xs font-black rounded-t-xl border-2 border-black border-b-0 uppercase transition-all ${
            activeSubTab === 'questions' ? 'bg-[#ffe600] shadow-neo translate-y-0.5' : 'bg-white hover:bg-[#f8f5ee]'
          }`}
        >
          Questions ({questions.length})
        </button>

        <button
          onClick={() => setActiveSubTab('upload')}
          className={`px-4 py-2 text-xs font-black rounded-t-xl border-2 border-black border-b-0 uppercase transition-all flex items-center gap-1.5 ${
            activeSubTab === 'upload' ? 'bg-[#38bdf8] shadow-neo translate-y-0.5' : 'bg-white hover:bg-[#f8f5ee]'
          }`}
        >
          <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Upload Questions (CSV / JSON)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`px-4 py-2 text-xs font-black rounded-t-xl border-2 border-black border-b-0 uppercase transition-all flex items-center gap-1.5 ${
            activeSubTab === 'submissions' ? 'bg-[#c084fc] shadow-neo translate-y-0.5' : 'bg-white hover:bg-[#f8f5ee]'
          }`}
        >
          <Award className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Candidate Gradebook ({submissions.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: Questions List */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border-3 border-black shadow-neo">
              <BookOpen className="w-12 h-12 mx-auto text-slate-400 mb-3 stroke-[1.5]" />
              <h3 className="text-base font-black uppercase text-black font-display">No Questions in this Examination</h3>
              <p className="text-xs text-slate-600 mt-1 mb-4">
                Add questions manually or upload in bulk using a CSV / JSON file.
              </p>
              <button
                onClick={() => setActiveSubTab('upload')}
                className="px-4 py-2 bg-[#38bdf8] text-black font-black rounded-xl text-xs neo-btn uppercase"
              >
                Upload Questions Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="bg-white rounded-2xl p-5 border-3 border-black shadow-neo space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b-2 border-black">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-[#ffe600] border border-black font-mono font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#f8f5ee] border border-black rounded">
                        {q.category || 'General'}
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#86efac] border border-black rounded">
                        {q.points || 20} Marks
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg bg-[#fee2e2] hover:bg-[#fca5a5] text-[#dc2626] border border-black"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  <p className="text-sm font-extrabold text-black leading-relaxed">
                    {q.question}
                  </p>

                  {/* 4 Choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctAnswer;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border-2 border-black flex items-center justify-between ${
                            isCorrect
                              ? 'bg-[#dcfce7] border-[#15803d] shadow-[2px_2px_0px_#15803d]'
                              : 'bg-[#f8f5ee]'
                          }`}
                        >
                          <span className="text-black">
                            <strong className="font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</strong>
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="px-1.5 py-0.5 rounded bg-[#15803d] text-white font-mono text-[9px] uppercase font-black">
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-2.5 rounded-xl bg-[#fefce8] border border-black text-xs font-medium text-slate-800">
                      <strong className="font-mono font-black text-black">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: Upload Questions (Single Form or Bulk CSV/JSON) */}
      {activeSubTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Method 1: Single Question Manual Form */}
          <div className="bg-white rounded-2xl p-6 border-3 border-black shadow-neo space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-black stroke-[3]" />
                <h3 className="text-base font-black uppercase text-black font-display">
                  Add Single Question
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#ffe600] px-2 py-0.5 border border-black rounded">
                Manual Entry
              </span>
            </div>

            <form onSubmit={handleSaveSingleQuestion} className="space-y-3 text-xs">
              <div>
                <label className="block font-black uppercase text-black mb-1">Question Text</label>
                <textarea
                  rows={3}
                  required
                  value={singleQuestion.question}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, question: e.target.value })}
                  placeholder="e.g. Which cryptographic protocol protects web communication against eavesdropping?"
                  className="w-full p-2.5 neo-input rounded-xl text-xs font-semibold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black uppercase text-black mb-1">Category</label>
                  <input
                    type="text"
                    value={singleQuestion.category}
                    onChange={(e) => setSingleQuestion({ ...singleQuestion, category: e.target.value })}
                    placeholder="e.g. Network Security"
                    className="w-full p-2 neo-input rounded-xl text-xs font-semibold text-black"
                  />
                </div>
                <div>
                  <label className="block font-black uppercase text-black mb-1">Marks / Points</label>
                  <input
                    type="number"
                    value={singleQuestion.points}
                    onChange={(e) => setSingleQuestion({ ...singleQuestion, points: e.target.value })}
                    className="w-full p-2 neo-input rounded-xl text-xs font-semibold text-black"
                  />
                </div>
              </div>

              {/* 4 Choices with Radio Selector */}
              <div>
                <label className="block font-black uppercase text-black mb-1.5">
                  Options (Select the correct radio choice)
                </label>
                <div className="space-y-2">
                  {singleQuestion.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswerOption"
                        checked={singleQuestion.correctAnswer === i}
                        onChange={() => setSingleQuestion({ ...singleQuestion, correctAnswer: i })}
                        className="w-4 h-4 text-black accent-[#15803d]"
                      />
                      <span className="font-mono font-bold text-xs">{String.fromCharCode(65 + i)}:</span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => {
                          const updated = [...singleQuestion.options];
                          updated[i] = e.target.value;
                          setSingleQuestion({ ...singleQuestion, options: updated });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + i)} text`}
                        className={`flex-1 p-2 neo-input rounded-xl text-xs font-semibold text-black ${
                          singleQuestion.correctAnswer === i ? 'bg-[#dcfce7] border-[#15803d]' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-black uppercase text-black mb-1">Explanation (Optional)</label>
                <input
                  type="text"
                  value={singleQuestion.explanation}
                  onChange={(e) => setSingleQuestion({ ...singleQuestion, explanation: e.target.value })}
                  placeholder="Explain why the answer is correct for the candidate review report"
                  className="w-full p-2 neo-input rounded-xl text-xs font-semibold text-black"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#ffe600] hover:bg-[#fde047] text-black font-black rounded-xl text-xs neo-btn uppercase tracking-wide flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Question to Examination</span>
              </button>
            </form>
          </div>

          {/* Method 2: Bulk CSV / JSON Upload */}
          <div className="bg-white rounded-2xl p-6 border-3 border-black shadow-neo space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-black stroke-[2.5]" />
                <h3 className="text-base font-black uppercase text-black font-display">
                  Bulk Question Upload
                </h3>
              </div>
              <div className="flex gap-1 bg-[#f8f5ee] p-1 rounded-lg border border-black text-[10px] font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setUploadTab('csv')}
                  className={`px-2 py-0.5 rounded ${uploadTab === 'csv' ? 'bg-[#38bdf8] text-black' : ''}`}
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab('json')}
                  className={`px-2 py-0.5 rounded ${uploadTab === 'json' ? 'bg-[#38bdf8] text-black' : ''}`}
                >
                  JSON
                </button>
              </div>
            </div>

            {uploadTab === 'csv' ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Need a template?</span>
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="px-2.5 py-1 bg-[#f8f5ee] hover:bg-white text-black font-bold rounded border border-black shadow-neo-sm flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                <div className="border-2 border-dashed border-black rounded-2xl p-6 text-center bg-[#f8f5ee] space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-black stroke-[2]" />
                  <div className="font-bold text-black">
                    Choose a CSV file with exam questions
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="block mx-auto text-xs font-mono font-bold"
                  />
                  {csvFile && (
                    <div className="text-[11px] font-mono text-[#15803d] font-bold">
                      Selected: {csvFile.name} ({parsedPreview.length} questions parsed)
                    </div>
                  )}
                </div>

                {parsedPreview.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-black text-black block">
                      Parsed Preview ({parsedPreview.length} questions ready to import):
                    </span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[#f8f5ee] rounded-xl border border-black text-[11px] font-mono">
                      {parsedPreview.map((p, idx) => (
                        <div key={idx} className="p-1.5 bg-white rounded border border-black">
                          <strong>#{idx + 1}:</strong> {p.question.substring(0, 70)}...
                          <span className="text-[#15803d] ml-2 font-bold">
                            Correct: {String.fromCharCode(65 + p.correctAnswer)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmBulkUpload}
                      className="w-full py-3 bg-[#38bdf8] hover:bg-[#0284c7] text-black font-black rounded-xl text-xs neo-btn uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Confirm & Import {parsedPreview.length} Questions</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <label className="block font-black uppercase text-black">
                  Paste JSON Array of Questions
                </label>
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[\n  {\n    "question": "What is RSA?",\n    "options": ["Symmetric cipher", "Asymmetric cipher", "Hash", "MAC"],\n    "correctAnswer": 1,\n    "category": "Cryptography",\n    "points": 20\n  }\n]`}
                  className="w-full p-2.5 neo-input rounded-xl text-[11px] font-mono text-black"
                />

                <button
                  type="button"
                  onClick={handleConfirmBulkUpload}
                  className="w-full py-3 bg-[#38bdf8] hover:bg-[#0284c7] text-black font-black rounded-xl text-xs neo-btn uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Parse & Import JSON Questions</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Candidate Gradebook & Submissions */}
      {activeSubTab === 'submissions' && (
        <div className="bg-white rounded-2xl p-6 border-3 border-black shadow-neo space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div>
              <h3 className="text-base font-black uppercase text-black font-display">
                Candidate Examination Submissions
              </h3>
              <p className="text-xs text-slate-700">
                Official test scores, percentages, and AI cheating integrity scores recorded in SQLite.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#ffe600] px-2.5 py-1 border border-black rounded shadow-[1px_1px_0px_#000]">
              Total: {submissions.length} Submissions
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-600">
              No exam submissions recorded yet. When candidates complete their examination, their scores and proctoring telemetry will appear here live.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="border-b-2 border-black bg-[#ffe600] text-black uppercase font-black font-mono">
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Score & Grade</th>
                    <th className="py-2.5 px-3">Result</th>
                    <th className="py-2.5 px-3">AI Cheating Score</th>
                    <th className="py-2.5 px-3">Time Spent</th>
                    <th className="py-2.5 px-3">Submitted At</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-medium">
                  {submissions.map((sub) => {
                    const isPassed = sub.percentage >= 60;
                    return (
                      <tr key={sub.id} className="hover:bg-[#f8f5ee] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-black block">{sub.studentName}</span>
                          <span className="text-[10px] text-slate-600 font-mono">{sub.studentId}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-black">
                          {sub.correctCount} / {sub.totalQuestions} ({sub.percentage}%)
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase border border-black ${
                              isPassed ? 'bg-[#86efac] text-[#15803d]' : 'bg-[#fee2e2] text-[#dc2626]'
                            }`}
                          >
                            {isPassed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase border border-black ${
                              sub.integrityClassification === 'HONEST'
                                ? 'bg-[#dcfce7] text-[#15803d]'
                                : sub.integrityClassification === 'SUSPICIOUS'
                                ? 'bg-[#fef9c3] text-[#854d0e]'
                                : 'bg-[#fee2e2] text-[#dc2626]'
                            }`}
                          >
                            {sub.integrityClassification || 'HONEST'} ({Math.round(sub.cheatingScore || 0)}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {Math.floor(sub.timeSpentSeconds / 60)}m {sub.timeSpentSeconds % 60}s
                        </td>
                        <td className="py-3 px-3 text-slate-800 text-[11px] font-mono">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(sub)}
                            className="px-2.5 py-1 bg-white hover:bg-[#ffe600] text-black font-black rounded border border-black shadow-neo-sm text-[11px]"
                          >
                            Review Answers
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Answers Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 border-4 border-black shadow-neo-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-[#ffe600] px-2 py-0.5 border border-black rounded">
                  Forensic Answer Sheet
                </span>
                <h3 className="text-lg font-black uppercase text-black font-display mt-1">
                  {selectedSubmission.studentName} — Score: {selectedSubmission.percentage}%
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-lg bg-[#fee2e2] border-2 border-black font-black text-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {(selectedSubmission.reviewedAnswers || []).map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border-2 border-black text-xs space-y-1.5 ${
                    ans.isCorrect ? 'bg-[#dcfce7]' : 'bg-[#fee2e2]'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>Question #{idx + 1} ({ans.category || 'General'})</span>
                    <span className={ans.isCorrect ? 'text-[#15803d]' : 'text-[#dc2626]'}>
                      {ans.isCorrect ? '✓ CORRECT (+points)' : '✗ INCORRECT'}
                    </span>
                  </div>
                  <p className="font-extrabold text-black">{ans.question}</p>
                  <div className="text-[11px] font-mono space-y-0.5 text-slate-800">
                    <div>Selected: {ans.options?.[ans.selectedAnswer] || `Choice ${ans.selectedAnswer}`}</div>
                    {!ans.isCorrect && (
                      <div className="text-[#15803d] font-bold">
                        Correct Answer: {ans.options?.[ans.correctAnswer] || `Choice ${ans.correctAnswer}`}
                      </div>
                    )}
                    {ans.explanation && (
                      <div className="mt-1 text-slate-600">Note: {ans.explanation}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t-2 border-black flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2 bg-[#ffe600] text-black font-black rounded-xl text-xs neo-btn uppercase"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Exam Modal */}
      {isNewExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 border-4 border-black shadow-neo-xl">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
              <h3 className="text-lg font-black uppercase text-black font-display">
                Create New Examination
              </h3>
              <button
                onClick={() => setIsNewExamModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#fee2e2] border-2 border-black font-black text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block uppercase text-black mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="e.g. Midterm Distributed Systems & Cloud Security"
                  className="w-full p-2.5 neo-input rounded-xl text-xs font-semibold text-black"
                />
              </div>

              <div>
                <label className="block uppercase text-black mb-1">Subject / Domain Category</label>
                <input
                  type="text"
                  required
                  value={newExamCategory}
                  onChange={(e) => setNewExamCategory(e.target.value)}
                  placeholder="e.g. Cloud Computing or Cyber Defense"
                  className="w-full p-2.5 neo-input rounded-xl text-xs font-semibold text-black"
                />
              </div>

              <div>
                <label className="block uppercase text-black mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newExamDescription}
                  onChange={(e) => setNewExamDescription(e.target.value)}
                  placeholder="Exam instructions and syllabus coverage"
                  className="w-full p-2.5 neo-input rounded-xl text-xs font-semibold text-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block uppercase text-black mb-1">Duration (Min)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(e.target.value)}
                    className="w-full p-2 neo-input rounded-xl text-xs font-semibold text-black"
                  />
                </div>
                <div>
                  <label className="block uppercase text-black mb-1">Total Marks</label>
                  <input
                    type="number"
                    required
                    value={newExamTotalMarks}
                    onChange={(e) => setNewExamTotalMarks(e.target.value)}
                    className="w-full p-2 neo-input rounded-xl text-xs font-semibold text-black"
                  />
                </div>
                <div>
                  <label className="block uppercase text-black mb-1">Passing %</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={newExamPassing}
                    onChange={(e) => setNewExamPassing(e.target.value)}
                    className="w-full p-2 neo-input rounded-xl text-xs font-semibold text-black"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#f8f5ee] border-2 border-black flex items-center justify-between">
                <div>
                  <span className="font-black text-black block">Strict AI Proctoring Mode</span>
                  <span className="text-[11px] text-slate-700">Enforce webcam lock, tab switch lock & audio siren</span>
                </div>
                <input
                  type="checkbox"
                  checked={newExamStrict}
                  onChange={(e) => setNewExamStrict(e.target.checked)}
                  className="w-5 h-5 accent-black rounded"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewExamModalOpen(false)}
                  className="px-4 py-2 bg-[#f8f5ee] text-black font-bold rounded-xl border border-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ffe600] text-black font-black rounded-xl neo-btn uppercase"
                >
                  Create & Activate Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
