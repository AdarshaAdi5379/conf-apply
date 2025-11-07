import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://recruiter-risk-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log full error details
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      headers: error.config?.headers,
      data: error.response?.data || error.response || 'No response'
    });

    // Don't redirect on 401 during initial load
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
  logout: () => api.post('/api/auth/logout'),
};

export const recruiterAPI = {
  search: (params) => api.get('recruiters/search', { params }),
  getById: (id) => api.get(`recruiters/${id}`),
  verify: (data) => api.post('recruiters/verify', data),
};

export const feedbackAPI = {
  create: (data) => api.post('feedback', data),
  getByRecruiter: (recruiterId) => api.get(`feedback/recruiter/${recruiterId}`),
  report: (feedbackId, data) => api.post(`feedback/${feedbackId}/report`, data),
};

export const adminAPI = {
  getDashboard: () => api.get('admin/dashboard'),
  getFlaggedRecruiters: () => api.get('admin/flagged-recruiters'),
  getReportedFeedback: () => api.get('admin/reported-feedback'),
  flagRecruiter: (id, data) => api.put(`admin/recruiters/${id}/flag`, data),
  deleteFeedback: (id) => api.delete(`admin/feedback/${id}`),
};

export default api;