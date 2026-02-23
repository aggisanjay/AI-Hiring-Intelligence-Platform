import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hireiq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hireiq_token');
      localStorage.removeItem('hireiq_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── API Functions ─────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data)       => api.post('/auth/register', data),
  login:          (data)       => api.post('/auth/login', data),
  getMe:          ()           => api.get('/auth/me'),
  updateProfile:  (data)       => api.put('/auth/profile', data),
  changePassword: (data)       => api.put('/auth/password', data),
};

export const jobsAPI = {
  getAll:          (params)    => api.get('/jobs', { params }),
  getOne:          (id)        => api.get(`/jobs/${id}`),
  getMyJobs:       ()          => api.get('/jobs/recruiter/my-jobs'),
  create:          (data)      => api.post('/jobs', data),
  update:          (id, data)  => api.put(`/jobs/${id}`, data),
  delete:          (id)        => api.delete(`/jobs/${id}`),
  getTopCandidates:(id)        => api.get(`/jobs/${id}/top-candidates`),
  getPipeline:     (id)        => api.get(`/jobs/${id}/pipeline`),
};

export const candidatesAPI = {
  apply:           (data)      => api.post('/candidates/apply', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyApplications: ()        => api.get('/candidates/my-applications'),
  getAll:          (params)    => api.get('/candidates/all', { params }),
  getJobApplications:(jobId, params) => api.get(`/candidates/job/${jobId}`, { params }),
  updateStatus:    (id, data)  => api.patch(`/candidates/application/${id}/status`, data),
};

export const interviewsAPI = {
  start:     (data)            => api.post('/interviews/start', data),
  sendMsg:   (id, data)        => api.post(`/interviews/${id}/message`, data),
  complete:  (id)              => api.post(`/interviews/${id}/complete`),
  getResult: (id)              => api.get(`/interviews/${id}/result`),
  getMyAll:  ()                => api.get('/interviews/my'),
};

export const analyticsAPI = {
  dashboard:       ()          => api.get('/analytics/dashboard'),
  funnel:          ()          => api.get('/analytics/funnel'),
  scoreDistrib:    ()          => api.get('/analytics/score-distribution'),
  appOverTime:     ()          => api.get('/analytics/applications-time'),
  skillGaps:       ()          => api.get('/analytics/skill-gaps'),
  candidateStats:  ()          => api.get('/analytics/candidate/stats'),
};