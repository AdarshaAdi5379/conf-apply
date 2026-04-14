import axios from 'axios';

const rawBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  'https://recruiter-risk-backend.onrender.com';

const API_BASE = (typeof rawBase === 'string' ? rawBase.trim() : rawBase) || 'https://recruiter-risk-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshPromise = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  async (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data || 'No response'
    });

    if (error.response?.status === 401 && !originalRequest.url.includes('/auth/') && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        if (!isRefreshing) {
          refreshPromise = api.post('/api/auth/refresh', { refreshToken })
            .then(async (res) => {
              const { accessToken, refreshToken: newRefreshToken } = res.data.data;
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              return { accessToken, refreshToken: newRefreshToken };
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const { accessToken } = await refreshPromise || { accessToken: await refreshPromise };
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && !originalRequest.url.includes('/auth/')) {
      localStorage.clear();
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
