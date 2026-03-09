import axios from 'axios';
import { mockApi } from './mockApi';

// Toggle between mock and real API
const USE_MOCK = false;

// Axios instance for real API calls
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Real API implementation
const realApi = {
  // Auth
  login: (email: string, password: string) => axiosInstance.post('/auth/login', { email, password }),
  logout: () => axiosInstance.post('/auth/logout'),
  requestAccess: (data: any) => axiosInstance.post('/auth/request-access', data),
  activateAccount: (token: string, password: string) => axiosInstance.post('/auth/activate', { token, password }),

  // Dashboard
  getDashboardStats: () => axiosInstance.get('/dashboard/stats'),
  getHealthDistribution: () => axiosInstance.get('/dashboard/health-distribution'),
  getFailureTrend: (period: string = 'monthly') => axiosInstance.get('/dashboard/failure-trend', { params: { period } }),
  getSensorTrends: () => axiosInstance.get('/dashboard/sensor-trends'),
  getAIInsights: () => axiosInstance.get('/dashboard/ai-insights'),

  // Machines
  getMachines: (filters?: any) => axiosInstance.get('/machines', { params: filters }),
  getMachineById: (id: string | number) => axiosInstance.get(`/machines/${id}`),
  createMachine: (data: any) => axiosInstance.post('/machines', data),
  updateMachine: (id: string | number, data: any) => axiosInstance.put(`/machines/${id}`, data),
  deleteMachine: (id: string | number) => axiosInstance.delete(`/machines/${id}`),
  getMachineSensorHistory: (id: string | number, hours?: number) => axiosInstance.get(`/machines/${id}/sensor-history`, { params: { hours } }),

  // Work Orders
  getWorkOrders: (filters?: any) => axiosInstance.get('/work-orders', { params: filters }),
  getWorkOrderById: (id: string | number) => axiosInstance.get(`/work-orders/${id}`),
  createWorkOrder: (data: any) => axiosInstance.post('/work-orders', data),
  updateWorkOrder: (id: string | number, data: any) => axiosInstance.put(`/work-orders/${id}`, data),
  deleteWorkOrder: (id: string | number) => axiosInstance.delete(`/work-orders/${id}`),
  addWorkOrderNote: (id: string | number, note: any) => axiosInstance.post(`/work-orders/${id}/notes`, note),

  // Alerts
  getAlerts: (filters?: any) => axiosInstance.get('/alerts', { params: filters }),
  acknowledgeAlert: (id: string | number, user: any) => axiosInstance.put(`/alerts/${id}/acknowledge`, { user }),

  // Users
  getUsers: () => axiosInstance.get('/users'),
  getUserById: (id: string | number) => axiosInstance.get(`/users/${id}`),
  createUser: (data: any) => axiosInstance.post('/users', data),
  updateUser: (id: string | number, data: any) => axiosInstance.put(`/users/${id}`, data),
  deleteUser: (id: string | number) => axiosInstance.delete(`/users/${id}`),
  inviteUser: (data: any) => axiosInstance.post('/users/invite', data),
  updateAvatar: (id: string | number, base64Image: string, sessionUser?: any) =>
    axiosInstance.patch(`/users/${id}/avatar`, {
      avatar: base64Image,
      // Forwarded for MSW/mock fallback — real backend uses auth token instead
      ...(sessionUser && { _session: sessionUser }),
    }),

  // Company/Settings
  getCompanySettings: () => axiosInstance.get('/company'),
  updateCompanySettings: (data: any) => axiosInstance.put('/company', data),
  completeSetup: () => axiosInstance.post('/company/complete-setup'),

  // Notifications
  getNotifications: () => axiosInstance.get('/notifications'),
  markNotificationRead: (id: string | number) => axiosInstance.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => axiosInstance.put('/notifications/read-all'),

  // Reports
  getReportsData: () => axiosInstance.get('/reports'),

  // Access Requests
  getAccessRequests: () => axiosInstance.get('/access-requests'),

  // Maintenance
  getMaintenanceEvents: (month: number, year: number) => axiosInstance.get('/maintenance/events', { params: { month, year } }),

  // Export
  exportPDF: (type: string, id: string | number) => axiosInstance.post('/export/pdf', { type, id }),

  // Settings — Asset Types
  getAssetTypes: () => axiosInstance.get('/settings/asset-types'),
  createAssetType: (data: any) => axiosInstance.post('/settings/asset-types', data),
  updateAssetType: (id: number, data: any) => axiosInstance.put(`/settings/asset-types/${id}`, data),
  deleteAssetType: (id: number) => axiosInstance.delete(`/settings/asset-types/${id}`),

  // Settings — Sensor Thresholds
  getSensorThresholds: () => axiosInstance.get('/settings/sensor-thresholds'),
  createSensorThreshold: (data: any) => axiosInstance.post('/settings/sensor-thresholds', data),
  updateSensorThreshold: (id: number, data: any) => axiosInstance.put(`/settings/sensor-thresholds/${id}`, data),
  deleteSensorThreshold: (id: number) => axiosInstance.delete(`/settings/sensor-thresholds/${id}`),

  // Settings — AI Model
  getAIModelInfo: () => axiosInstance.get('/settings/ai-model'),
  retrainAIModel: () => axiosInstance.post('/settings/ai-model/retrain'),
  scheduleTraining: (data: any) => axiosInstance.post('/settings/ai-model/schedule', data),
};

// Export the appropriate API based on USE_MOCK flag
// Type as mockApi since the axios interceptor unwraps responses to .data
export const api: typeof mockApi = USE_MOCK ? mockApi : realApi as unknown as typeof mockApi;

export default api;
