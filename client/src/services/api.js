const API_BASE = '/api';

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
  faceLogin: (payload) => request('/auth/face-login', { method: 'POST', body: JSON.stringify(payload) }),
  enrollFace: (payload) => request('/auth/enroll-face', { method: 'POST', body: JSON.stringify(payload) }),
  triggerDemoBruteForce: (targetUsername) => request('/auth/demo-brute-force', { method: 'POST', body: JSON.stringify({ targetUsername }) }),
};

// Exam APIs
export const examApi = {
  getQuestions: () => request('/exam/questions'),
  logEvent: (payload) => request('/exam/event', { method: 'POST', body: JSON.stringify(payload) }),
  submitExam: (payload) => request('/exam/submit', { method: 'POST', body: JSON.stringify(payload) }),
  getStudentReport: (studentId) => request(`/exam/student/${studentId}`),
};

// Admin APIs
export const adminApi = {
  getAuthLogs: () => request('/admin/auth-logs'),
  getUsers: () => request('/admin/users'),
  getCheatingMonitor: () => request('/admin/cheating-monitor'),
  getSecurityEmails: () => request('/admin/security-emails'),
  resetDemoLogs: () => request('/admin/reset-demo-logs', { method: 'POST' }),
};

// ML APIs
export const mlApi = {
  getCheatingModel: () => request('/ml/cheating-model'),
  getAdversarialDemo: () => request('/ml/adversarial-demo'),
  retrainModel: () => request('/ml/retrain', { method: 'POST' }),
};
