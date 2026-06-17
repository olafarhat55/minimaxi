import axios from 'axios';
import { mockApi } from './mockApi';
import type { WorkOrderFilters } from '../types';

// Toggle between mock and real API
const USE_MOCK = false;

// Axios instance for real API calls
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://minimaxi-backend-production-3500.up.railway.app/api',
  timeout: 150000,
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
  (error) => Promise.reject(error)
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

// Helpers
export const getCompanyId = (): number => {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.company_id ?? 17;
  } catch {
    return 17;
  }
};

const getUserId = (): number => {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.id ?? 30;
  } catch {
    return 30;
  }
};

// ─── Status mapping helpers ───────────────────────────────────────────────────
const backendStatusToFront = (s: string): string => {
  if (!s) return 'open';
  const map: Record<string, string> = {
    OPEN:        'open',
    ASSIGNED:    'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED:   'completed',
    CANCELLED:   'cancelled',
    CLOSED:      'closed',
  };
  return map[s.toUpperCase()] ?? s.toLowerCase();
};

export const frontStatusToBackend = (s: string): string => {
  const map: Record<string, string> = {
    open:        'OPEN',
    assigned:    'ASSIGNED',
    in_progress: 'IN_PROGRESS',
    completed:   'COMPLETED',
    cancelled:   'CANCELLED',
    closed:      'CLOSED',
  };
  return map[s.toLowerCase()] ?? s.toUpperCase();
};

export const frontPriorityToBackend = (p: string): string => {
  const map: Record<string, string> = {
    low:      'LOW',
    medium:   'MEDIUM',
    high:     'HIGH',
    critical: 'CRITICAL',
  };
  return map[p.toLowerCase()] ?? p.toUpperCase();
};

// ─── normalizeWorkOrder ───────────────────────────────────────────────────────
const normalizeWorkOrder = (d: any) => {
  if (!d) return d;
  const normalize = (wo: any) => {
    const rawStatus   = wo.status   ?? '';
    const rawPriority = wo.priority ?? '';

    const assignedTo = wo.assignedTo ?? wo.assigned_to ?? null;
    const assignedToNorm = assignedTo
      ? { id: assignedTo.id, name: assignedTo.name ?? assignedTo.fullName ?? assignedTo.username ?? '' }
      : null;

    const createdBy = wo.createdBy ?? wo.created_by ?? null;
    const createdByNorm = createdBy
      ? { id: createdBy.id, name: createdBy.name ?? createdBy.fullName ?? createdBy.username ?? '' }
      : null;

    return {
      ...wo,
      wo_number:       wo.woNumber        ?? wo.wo_number,
      machine_id:      wo.machineId       ?? wo.machine_id,
      machine_name:    wo.machineName     ?? wo.machine_name,
      asset_id:        wo.assetId         ?? wo.asset_id,
      due_date:        wo.dueDate         ?? wo.due_date,
      created_at:      wo.createdAt       ?? wo.created_at,
      completed_at:    wo.completedAt     ?? wo.closedAt ?? wo.completed_at,
      estimated_hours: wo.estimatedHours  ?? wo.estimated_hours,
      actual_hours:    wo.actualHours     ?? wo.actual_hours,
      parts_needed:    wo.partsNeeded     ?? wo.parts_needed ?? [],
      ai_suggested:    wo.aiSuggested     ?? wo.ai_suggested,
      priority:        rawPriority ? rawPriority.toLowerCase() : 'medium',
      status:          backendStatusToFront(rawStatus),
      assigned_to:     assignedToNorm,
      created_by:      createdByNorm,
      notes: (wo.notes ?? []).map((n: any) => ({
        id:         n.id,
        user:       n.authorName ?? n.userName ?? n.user ?? n.author ?? 'User',
        text:       n.content    ?? n.text ?? n.note ?? '',
        created_at: n.createdAt  ?? n.created_at ?? new Date().toISOString(),
      })),
    };
  };
  return Array.isArray(d) ? d.map(normalize) : normalize(d);
};

// ─── normalizeAssetType ───────────────────────────────────────────────────────
const normalizeAssetType = (d: any) => {
  const normalize = (a: any) => ({
    id:                  a.id,
    name:                a.name                ?? '',
    description:         a.description         ?? '',
    industry:            a.industry            ?? 'Manufacturing',
    active:              a.active              ?? true,
    maintenanceInterval: a.maintenanceInterval ?? 90,
  });
  return Array.isArray(d) ? d.map(normalize) : normalize(d);
};

// ─── normalizeSensorThreshold ─────────────────────────────────────────────────
const normalizeSensorThreshold = (d: any) => {
  const normalize = (s: any) => ({
    id:                s.id,
    name:              s.name        ?? `Sensor ${s.sensorTypeId ?? s.id}`,
    unit:              s.unit        ?? '',
    warningThreshold:  s.warningValue  ?? s.warningThreshold  ?? 0,
    criticalThreshold: s.criticalValue ?? s.criticalThreshold ?? 0,
    canOverride:       s.canOverride ?? true,
    description:       s.description ?? '',
    // keep originals for PUT
    assetTypeId:       s.assetTypeId   ?? s.asset_type_id,
    sensorTypeId:      s.sensorTypeId  ?? s.sensor_type_id,
    asset_type_id:     s.asset_type_id ?? s.assetTypeId,
    asset_type_name:   s.asset_type_name ?? '',
  });
  return Array.isArray(d) ? d.map(normalize) : normalize(d);
};

// ─── Real API ─────────────────────────────────────────────────────────────────
const realApi = {
  // Auth
  login: (email: string, password: string) =>
    axiosInstance.post('/auth/login', { email, password }),
  logout: () => axiosInstance.post('/auth/logout'),
  requestAccess: (data: any) =>
    axiosInstance.post('/auth/request-access', data),
  activateAccount: (accessRequestId: number, password: string) =>
    axiosInstance.post('/auth/activate', { access_request_id: accessRequestId, password }),
  activateInvitedUser: (token: string, password: string) =>
    axios.post(
      `${import.meta.env.VITE_API_URL || 'https://minimaxi-backend-production-3500.up.railway.app/api'}/auth/activate-invited`,
      { token, password },
      { headers: { 'Content-Type': 'application/json' } }
    ),
  forgotPassword: (email: string) =>
    axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    axiosInstance.post('/auth/reset-password', { email, otp, newPassword }),

  // Dashboard
  getDashboardStats: () =>
    axiosInstance.get('/dashboard/stats', { params: { companyId: getCompanyId() } }).then((data: any) => ({
      total_assets:       data.totalAssets       ?? data.total_assets,
      healthy:            data.healthy,
      warning:            data.warning,
      critical:           data.critical,
      active_work_orders: data.activeWorkOrders  ?? data.active_work_orders,
      predicted_failures: data.predictedFailures ?? data.predicted_failures,
      uptime_percentage:  data.uptimePercentage  ?? data.uptime_percentage,
      mtbf:               data.mtbf,
      mttr:               data.mttr,
    })),
  getHealthDistribution: () =>
    axiosInstance.get('/dashboard/health-distribution', { params: { companyId: getCompanyId() } }),
  getFailureTrend: (period: string = 'monthly') =>
    axiosInstance.get('/dashboard/failure-trend', { params: { period, companyId: getCompanyId() } }),
  getSensorTrends: () =>
    axiosInstance.get('/dashboard/sensor-trends', { params: { companyId: getCompanyId() } }),
  getAIInsights: () =>
    axiosInstance.get('/dashboard/ai-insights', { params: { companyId: getCompanyId() } })
      .then((data: any) =>
        (Array.isArray(data) ? data : []).map((item: any) => ({
          id:           item.id,
          machine_id:   item.machineId   ?? item.machine_id,
          machine_name: item.machineName ?? item.machine_name,
          asset_id:     item.assetId     ?? item.asset_id,
          insight:      item.insight,
          severity:     item.severity,
          confidence:   item.confidence,
        }))
      ),

  // Machines
  getMachines: (filters?: any) =>
  axiosInstance.get('/machines', { params: { ...filters, companyId: getCompanyId() } }),
  getMachineById: (id: string | number) =>
    axiosInstance.get(`/machines/${id}`),
  createMachine: (data: any) =>
    axiosInstance.post('/machines', {
      organizationId:         getCompanyId(),
      name:                   data.name,
      serialNumber:           data.serialNumber ?? data.serial_number,
      type:                   data.type,
      location:               data.location,
      criticality:            ((data.criticality as string) ?? 'MEDIUM').toUpperCase(),
      installationDate:       data.installationDate ?? data.installation_date ?? new Date().toISOString().split('T')[0],
      gatewayUrl:             data.gatewayUrl ?? null,
      pollingIntervalSeconds: data.pollingIntervalSeconds ?? 30,
    }),
  updateMachine: (id: string | number, data: any) =>
    axiosInstance.put(`/machines/${id}`, data),
  deleteMachine: (id: string | number) =>
  axiosInstance.delete(`/machines/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  }),
  getMachineSensorHistory: (id: string | number, hours?: number) =>
    axiosInstance.get(`/machines/${id}/sensor-history`, { params: { hours } }),
  getMachineIssues: (id: string | number) =>
    axiosInstance.get(`/machines/${id}/issues`),
  getMachineWorkOrders: (id: string | number) =>
    axiosInstance.get(`/machines/${id}/work-orders`),
  getMachineNotes: (id: string | number) =>
    axiosInstance.get(`/machines/${id}/notes`),

  // Work Orders
  getWorkOrders: (filters?: WorkOrderFilters) => {
    const params: any = {};
    if (filters?.status)      params.status     = frontStatusToBackend(filters.status);
    if (filters?.priority)    params.priority   = frontPriorityToBackend(filters.priority);
    if (filters?.assigned_to) params.assignedTo = filters.assigned_to;
    return axiosInstance.get('/work-orders', { params })
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data as any)?.content ?? [];
        return list.map((wo: any) => normalizeWorkOrder(wo));
      });
  },

  getWorkOrderById: (id: string | number) =>
    axiosInstance.get(`/work-orders/${id}`).then((data: any) => normalizeWorkOrder(data)),

  createWorkOrder: (data: any) => {
  const userId = getUserId();
  return axiosInstance.post('/work-orders', {
    title:               data.title,
    description:         data.description,
    machine_id:          data.machine_id,
    organization_id:     getCompanyId(),
    created_by_user_id:  userId,
    assigned_to_user_id: data.assigned_to?.id ?? userId,
    priority:            frontPriorityToBackend(data.priority ?? 'medium'),
    status:              'OPEN',
    due_date:            data.due_date ? data.due_date.split('T')[0] : null,
    ai_suggested:        false,
   estimatedHours: data.estimated_hours ? Number(data.estimated_hours) : undefined,
  });
},

  updateWorkOrder: (id: string | number, data: any) => {
    const payload: Record<string, any> = {};
    if (data.title               !== undefined) payload.title             = data.title;
    if (data.description         !== undefined) payload.description       = data.description;
    if (data.priority            !== undefined) payload.priority          = frontPriorityToBackend(data.priority);
    if (data.status              !== undefined) payload.status            = frontStatusToBackend(data.status);
    if (data.dueDate             !== undefined) payload.dueDate           = data.dueDate;
    if (data.due_date            !== undefined) payload.dueDate           = data.due_date.split('T')[0];
    if (data.assignedToUserId    !== undefined) payload.assignedToUserId  = data.assignedToUserId;
    if (data.assigned_to_user_id !== undefined) payload.assignedToUserId = data.assigned_to_user_id;
    if (data.estimatedHours !== undefined) payload.estimatedHours = data.estimatedHours;
    return axiosInstance.put(`/work-orders/${id}`, payload)
      .then((d: any) => normalizeWorkOrder(d));
  },

  deleteWorkOrder: (id: string | number) =>
    axiosInstance.delete(`/work-orders/${id}`),

  addWorkOrderNote: (id: string | number, note: any) => {
    const userId = getUserId();
    return axiosInstance.post(`/work-orders/${id}/notes`, {
      content: note.text ?? note.content,
      userId,
    });
  },

  // Alerts
  getAlerts: (filters?: any) =>
    axiosInstance.get('/alerts', { params: { ...filters, companyId: getCompanyId() } }),
  acknowledgeAlert: (id: string | number, user: any) =>
    axiosInstance.put(`/alerts/${id}/acknowledge`, { user }),

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
      ...(sessionUser && { _session: sessionUser }),
    }),

  // Company/Settings
  getCompanySettings: () =>
    axiosInstance.get('/company', { params: { companyId: getCompanyId() } }),
  updateCompanySettings: (data: any) =>
    axiosInstance.put('/company', data, { params: { companyId: getCompanyId() } }),
  completeSetup: () =>
    axiosInstance.post('/company/completesetup', null, { params: { companyId: getCompanyId() } }),

  // Notifications
  getNotifications: () =>
    axiosInstance.get('/notifications', { params: { userId: getUserId() } }),
  markNotificationRead: (id: string | number) =>
    axiosInstance.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () =>
  axiosInstance.put('/notifications/read-all', null, { params: { userId: getUserId() } }),

  // Reports
  getReportsData: () =>
    axiosInstance.get('/reports', { params: { companyId: getCompanyId() } }).then((d: any) => ({
      downtime_reduction:     d.downtimeReduction     ?? d.downtime_reduction     ?? 0,
      prediction_accuracy:    d.predictionAccuracy    ?? d.prediction_accuracy    ?? 0,
      cost_savings:           d.costSavings           ?? d.cost_savings           ?? 0,
      preventive_vs_reactive: d.preventiveVsReactive  ?? d.preventive_vs_reactive ?? { preventive: 0, reactive: 0 },
      monthly_downtime:       d.monthlyDowntime       ?? d.monthly_downtime       ?? [],
      monthly_cost:           d.monthlyCost           ?? d.monthly_cost           ?? [],
      accuracy_trend:         d.accuracyTrend         ?? d.accuracy_trend         ?? [],
      technician_performance: (d.technicianPerformance ?? d.technician_performance ?? []).map((t: any) => ({
        name:         t.name,
        completed:    t.completed         ?? t.completedOrders ?? 0,
        avg_time:     t.avgTime           ?? t.avg_time        ?? 0,
        total_hours:  t.totalHours        ?? t.total_hours     ?? 0,
        success_rate: t.successRate       ?? t.success_rate    ?? 0,
        rating:       t.rating           ?? 0,
      })),
    })),

  // Access Requests
  getAccessRequests: () => axiosInstance.get('/access-requests'),
  approveAccessRequest: (id: string | number) =>
    axiosInstance.put(`/access-requests/${id}/approve`),

  // Maintenance
  getMaintenanceEvents: (month: number, year: number) =>
    axiosInstance.get('/maintenance/events', { params: { month, year, companyId: getCompanyId() } }),

  // Export
  exportPDF: (type: string, id: string | number) =>
    axiosInstance.post('/export/pdf', { type, id }),

  // Settings — Asset Types
  getAssetTypes: () =>
    axiosInstance.get('/settings/asset-types')
      .then((d: any) => normalizeAssetType(d)),

  createAssetType: (data: any) =>
    axiosInstance.post('/settings/asset-types', {
      name:           data.name,
      description:    data.description,
      industry:       'Manufacturing',
      organizationId: getCompanyId(),
    }).then((d: any) => normalizeAssetType(d)),

  updateAssetType: (id: number, data: any) =>
    axiosInstance.put(`/settings/asset-types/${id}`, {
      name:        data.name,
      description: data.description,
      industry:    data.industry ?? 'Manufacturing',
    }).then((d: any) => normalizeAssetType(d)),

  deleteAssetType: (id: number) =>
    axiosInstance.delete(`/settings/asset-types/${id}`),

  // Settings — Sensor Thresholds
  getSensorThresholds: () =>
    axiosInstance.get('/settings/sensor-thresholds')
      .then((d: any) => normalizeSensorThreshold(d)),

  createSensorThreshold: (data: any) =>
    axiosInstance.post('/settings/sensor-thresholds', {
      assetTypeId:     data.assetTypeId     ?? 1,
      sensorTypeId:    data.sensorTypeId    ?? 1,
      organizationId:  getCompanyId(),
      updatedByUserId: getUserId(),
      warningValue:    data.warningThreshold  ?? data.warningValue,
      criticalValue:   data.criticalThreshold ?? data.criticalValue,
    }).then((d: any) => normalizeSensorThreshold(d)),

  updateSensorThreshold: (id: number, data: any) =>
    axiosInstance.put(`/settings/sensor-thresholds/${id}`, {
      updatedByUserId: getUserId(),
      warningValue:    data.warningThreshold  ?? data.warningValue,
      criticalValue:   data.criticalThreshold ?? data.criticalValue,
    }).then((d: any) => normalizeSensorThreshold(d)),

  deleteSensorThreshold: (id: number) =>
    axiosInstance.delete(`/settings/sensor-thresholds/${id}`),

  // Settings — AI Model
  getAIModelInfo: () =>
  axiosInstance.get('/settings/ai-model').then((d: any) => ({
    name:         d.name         ?? d.modelName    ?? 'Predictive Maintenance Model',
    type:         d.type         ?? d.modelType    ?? 'Random Forest Classifier',
    status:       d.status       ?? 'active',
    lastTraining: d.lastTraining ?? d.lastTrained  ?? d.last_training  ?? 'N/A',
    nextTraining: d.nextTraining ?? d.nextTrained  ?? d.next_training  ?? 'N/A',
    metrics: {
      accuracy:  d.metrics?.accuracy  ?? d.accuracy  ?? 0,
      precision: d.metrics?.precision ?? d.precision ?? 0,
      recall:    d.metrics?.recall    ?? d.recall    ?? 0,
      f1Score:   d.metrics?.f1Score   ?? d.metrics?.f1_score ?? d.f1Score ?? 0,
    },
    trainingHistory: (d.trainingHistory ?? d.training_history ?? []).map((h: any) => ({
      date:     h.date     ?? h.trainedAt ?? '',
      duration: h.duration ?? '',
      accuracy: h.accuracy ?? 0,
      status:   h.status   ?? 'Success',
    })),
  })),

  retrainAIModel: () =>
    axiosInstance.post('/settings/ai-model/retrain'),

  scheduleTraining: (data: any) =>
    axiosInstance.post('/settings/ai-model/schedule', {
      scheduledAt: `${data.date}T${data.time ?? '10:00'}:00Z`,
    }),
};

export const api = USE_MOCK ? mockApi : realApi as unknown as typeof mockApi & {
  activateInvitedUser: (token: string, password: string) => Promise<any>;
};

export default api;