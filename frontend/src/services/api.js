import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'https://recruiter-risk-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data || 'No response'
    });

    if (error.response?.status === 401 && !error.config.url.includes('/auth/me')) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const recruiterAPI = {
  search: (params) => api.get('/api/recruiter/search/query', { params }),
  getById: (id) => api.get(`/api/recruiter/${id}`),
  verify: (data) => api.post('/api/recruiter/verify', data),
  getLeaderboard: (limit) => api.get('/api/recruiter/list/leaderboard', { params: { limit } }),
  update: (id, data) => api.put(`/api/recruiter/${id}`, data),
};

export const feedbackAPI = {
  create: (data) => api.post('/api/feedback', data),
  getByRecruiter: (recruiterId) => api.get(`/api/feedback/recruiter/${recruiterId}`),
  respond: (id, data) => api.put(`/api/feedback/${id}/respond`, data),
  myFeedback: () => api.get('/api/feedback/my-feedback'),
};

export const adminAPI = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getFlaggedRecruiters: () => api.get('/api/admin/flagged-recruiters'),
  getReportedFeedback: () => api.get('/api/admin/reported-feedback'),
  flagRecruiter: (id, data) => api.put(`/api/admin/recruiter/${id}/flag`, data),
  deleteFeedback: (id) => api.delete(`/api/admin/feedback/${id}`),
};

export const jobAPI = {
  getAll: (params) => api.get('/api/jobs', { params }),
  getById: (id) => api.get(`/api/jobs/${id}`),
  create: (data) => api.post('/api/jobs', data),
  update: (id, data) => api.put(`/api/jobs/${id}`, data),
  delete: (id) => api.delete(`/api/jobs/${id}`),
  duplicate: (id) => api.post(`/api/jobs/${id}/duplicate`),
  getMyJobs: (params) => api.get('/api/jobs/my-jobs', { params }),
  getStats: () => api.get('/api/jobs/stats/dashboard'),
};

export const applicationAPI = {
  submit: (data, formData) => {
    if (formData) {
      return api.post('/api/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/api/applications', data);
  },
  getMyApplications: (params) => api.get('/api/applications/my-applications', { params }),
  getJobApplications: (jobId, params) => api.get(`/api/applications/job/${jobId}`, { params }),
  getById: (id) => api.get(`/api/applications/${id}`),
  updateStatus: (id, data) => api.put(`/api/applications/${id}/status`, data),
  updateNotes: (id, data) => api.put(`/api/applications/${id}/notes`, data),
  updateScore: (id, data) => api.put(`/api/applications/${id}/score`, data),
  scheduleInterview: (id, data) => api.post(`/api/applications/${id}/interview`, data),
  withdraw: (id) => api.delete(`/api/applications/${id}`),
  getRecruiterDashboard: () => api.get('/api/applications/recruiter/dashboard'),
};

export default api;
