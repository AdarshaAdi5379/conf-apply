import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const recruiterAPI = {
  verify: (data) => api.post('/recruiter/verify', data),
  getById: (id) => api.get(`/recruiter/${id}`),
  update: (id, data) => api.put(`/recruiter/${id}`, data),
  getLeaderboard: (limit = 10) => api.get(`/recruiter/list/leaderboard?limit=${limit}`),
  search: (query) => api.get('/recruiter/search/query', { params: query })
};

export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  getByRecruiter: (recruiterId, page = 1) => api.get(`/feedback/recruiter/${recruiterId}?page=${page}`),
  respond: (id, response) => api.put(`/feedback/${id}/respond`, { response }),
  getMyFeedback: () => api.get('/feedback/my-feedback')
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getFlaggedRecruiters: () => api.get('/admin/flagged-recruiters'),
  getReportedFeedback: () => api.get('/admin/reported-feedback'),
  flagRecruiter: (id, data) => api.put(`/admin/recruiter/${id}/flag`, data),
  deleteFeedback: (id) => api.delete(`/admin/feedback/${id}`)
};

export default api;