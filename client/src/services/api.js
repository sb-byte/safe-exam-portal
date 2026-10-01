const BACKEND_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
const API_BASE = `${BACKEND_URL}/api`;

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('secure_exam_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// Authentication APIs
export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  googleLogin: (payload) => request('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  faceLogin: (payload) => request('/auth/face-login', { method: 'POST', body: JSON.stringify(payload) }),
  enrollFace: (payload) => request('/auth/enroll-face', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),
  simulateIntrusion: (targetUsername) => request('/auth/simulate-alert', { method: 'POST', body: JSON.stringify({ targetUsername }) }),
};

// Exam APIs
export const examApi = {
  getExamList: () => request('/exam/list'),
  getQuestions: (examId) => request(`/exam/questions${examId ? `?examId=${examId}` : ''}`),
  logEvent: (payload) => request('/exam/event', { method: 'POST', body: JSON.stringify(payload) }),
  submitExam: (payload) => request('/exam/submit', { method: 'POST', body: JSON.stringify(payload) }),
  getStudentReport: (studentId) => request(`/exam/student/${studentId}`),
};

// Admin & Faculty APIs
export const adminApi = {
  getExams: () => request('/admin/exams'),
  createExam: (payload) => request('/admin/exams', { method: 'POST', body: JSON.stringify(payload) }),
  updateExam: (id, payload) => request(`/admin/exams/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteExam: (id) => request(`/admin/exams/${id}`, { method: 'DELETE' }),
  getExamQuestions: (examId) => request(`/admin/exams/${examId}/questions`),
  createQuestion: (payload) => request('/admin/questions', { method: 'POST', body: JSON.stringify(payload) }),
  bulkCreateQuestions: (payload) => request('/admin/questions/bulk', { method: 'POST', body: JSON.stringify(payload) }),
  updateQuestion: (id, payload) => request(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteQuestion: (id) => request(`/admin/questions/${id}`, { method: 'DELETE' }),
  getSubmissions: () => request('/admin/submissions'),
  getAuthLogs: () => request('/admin/auth-logs'),
  getUsers: () => request('/admin/users'),
  getCheatingMonitor: () => request('/admin/cheating-monitor'),
  getSecurityEmails: () => request('/admin/security-emails'),
};

// Machine Learning & Adversarial APIs
export const mlApi = {
  getCheatingModel: () => request('/ml/cheating-model'),
  getAdversarialDemo: () => request('/ml/adversarial-demo'),
  retrainModel: () => request('/ml/retrain', { method: 'POST' }),
};
