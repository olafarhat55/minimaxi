import {
  mockUsers,
  mockCompany,
  mockMachines,
  mockWorkOrders,
  mockAlerts,
  mockDashboardStats,
  mockHealthDistribution,
  mockFailureTrendData,
  mockSensorTrends,
  mockAIInsights,
  mockNotifications,
  mockReportsData,
  mockMaintenanceEvents,
  mockAccessRequests,
} from '../data/mockData';
import type { MockUser, Machine, WorkOrder, Alert, Notification, Company, User } from '../types';

// Simulate network delay
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to generate unique IDs
const generateId = (): string => Date.now() + Math.random().toString(36).substr(2, 9);

// Filter interfaces
interface MachineFilters {
  type?: string;
  location?: string;
  status?: string;
  search?: string;
}

interface WorkOrderFilters {
  status?: string;
  priority?: string;
  assigned_to?: number;
}

interface AlertFilters {
  severity?: string;
  acknowledged?: boolean;
}

// In-memory data store (simulates database)
let users: MockUser[] = [...mockUsers];

// Pending activations: token → { email, name } — bridges requestAccess to activateAccount
const pendingActivations = new Map<string, { email: string; name: string }>();
let machines: Machine[] = [...mockMachines];
let workOrders: WorkOrder[] = [...mockWorkOrders];
let alerts: Alert[] = [...mockAlerts];
let notifications: Notification[] = [...mockNotifications];
let company: Company = { ...mockCompany };

let assetTypes: Array<{ id: number; name: string; description: string; active: boolean; maintenanceInterval: number }> = [
  { id: 1, name: 'Engine',     description: 'Industrial engines and motors',  active: true, maintenanceInterval: 90  },
  { id: 2, name: 'Pump',       description: 'Hydraulic and water pumps',       active: true, maintenanceInterval: 60  },
  { id: 3, name: 'Compressor', description: 'Air compressors',                 active: true, maintenanceInterval: 30  },
  { id: 4, name: 'Motor',      description: 'Electric motors',                 active: true, maintenanceInterval: 90  },
  { id: 5, name: 'Turbine',    description: 'Gas and steam turbines',          active: true, maintenanceInterval: 120 },
  { id: 6, name: 'Conveyor',   description: 'Belt conveyor systems',           active: true, maintenanceInterval: 45  },
];

let sensorThresholds: Array<{ id: number; name: string; unit: string; warningThreshold: number; criticalThreshold: number; canOverride: boolean; description: string }> = [
  { id: 1, name: 'Temperature', unit: '°C',   warningThreshold: 80,   criticalThreshold: 90,   canOverride: true, description: 'Engine and motor temperature monitoring' },
  { id: 2, name: 'Vibration',   unit: 'mm/s', warningThreshold: 2.0,  criticalThreshold: 4.0,  canOverride: true, description: 'Mechanical vibration level'               },
  { id: 3, name: 'Pressure',    unit: 'BAR',  warningThreshold: 80,   criticalThreshold: 100,  canOverride: true, description: 'Hydraulic or pneumatic pressure'          },
  { id: 4, name: 'RPM',         unit: 'RPM',  warningThreshold: 3000, criticalThreshold: 3500, canOverride: true, description: 'Rotational speed monitoring'              },
];

export const mockApi = {
  // ============ AUTH ============
  login: async (email: string, password: string) => {
    await delay(500);
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token: `mock-token-${user.id}-${Date.now()}`,
    };
  },

  logout: async () => {
    await delay(200);
    return { success: true };
  },

  requestAccess: async (data: any) => {
    await delay(800);
    const activationToken = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store the real email + name so activateAccount can use them
    const pendingData = {
      email: data.email as string,
      name: (data.contact_person || data.name || 'New Admin') as string,
    };
    pendingActivations.set(activationToken, pendingData);
    // Also store under the demo token so the "Go to Activation Page" button works
    pendingActivations.set('demo-admin-token', pendingData);

    console.log('=== ACTIVATION EMAIL SENT ===');
    console.log('To:', data.email);
    console.log('Activation Link:', `/activate?token=${activationToken}`);
    console.log('=============================');
    return {
      success: true,
      message: 'Request submitted! Check your email for activation link.',
    };
  },

  activateAccount: async (token: string, password: string) => {
    await delay(500);

    // Look up the real user info stored during requestAccess
    const pending = pendingActivations.get(token ?? '');
    const email = pending?.email ?? 'admin@newcompany.com';
    const name  = pending?.name  ?? 'New Admin';

    // Determine role from token prefix (real flow uses role-specific tokens)
    const role: 'admin' | 'engineer' | 'technician' =
      token?.includes('engineer')   ? 'engineer'   :
      token?.includes('technician') ? 'technician' :
      'admin';

    // Save user to users array with the real email + password so login works
    const newUser: MockUser = {
      id: users.length + 1,
      name,
      email,
      role,
      password, // Store plaintext so login's === check passes
      avatar: null,
      first_login: true,
      company_id: 1,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);

    // Clean up pending activation
    if (token) pendingActivations.delete(token);

    const { password: _pw, ...userWithoutPassword } = newUser;
    return {
      success: true,
      message: 'Account activated. Please log in with your new password.',
      user: userWithoutPassword,
      token: `mock-token-${newUser.id}-${Date.now()}`,
    };
  },

  inviteUser: async (data: any) => {
    await delay(500);
    // Simulate sending invitation email
    const inviteToken = `${data.role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('=== INVITATION EMAIL SENT ===');
    console.log('To:', data.email);
    console.log('Role:', data.role);
    console.log('Activation Link:', `/activate?token=${inviteToken}`);
    console.log('=============================');

    const newUser = {
      id: users.length + 1,
      name: data.name,
      email: data.email,
      role: data.role,
      status: 'invited',
      first_login: true,
      company_id: 1,
      created_at: new Date().toISOString(),
    };
    users.push({ ...newUser, avatar: null, password: 'temp123' } as MockUser);

    return newUser;
  },

  // ============ DASHBOARD ============
  getDashboardStats: async () => {
    await delay(300);
    return mockDashboardStats;
  },

  getHealthDistribution: async () => {
    await delay(300);
    return mockHealthDistribution;
  },

  getFailureTrend: async (period: string = 'monthly') => {
    await delay(300);
    const data = mockFailureTrendData[period] || mockFailureTrendData.monthly;
    return data;
  },

  getSensorTrends: async () => {
    await delay(300);
    return mockSensorTrends;
  },

  getAIInsights: async () => {
    await delay(400);
    return mockAIInsights;
  },

  // ============ MACHINES ============
  getMachines: async (filters: MachineFilters = {}) => {
    await delay(500);
    let result = [...machines];

    if (filters.type) {
      result = result.filter((m) => m.type === filters.type);
    }
    if (filters.location) {
      result = result.filter((m) => m.location === filters.location);
    }
    if (filters.status) {
      result = result.filter((m) => m.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.asset_id.toLowerCase().includes(search)
      );
    }

    return result;
  },

  getMachineById: async (id: string | number) => {
    await delay(300);
    const machine = machines.find((m) => m.id === Number(id));
    if (!machine) {
      throw new Error('Machine not found');
    }
    return machine;
  },

  createMachine: async (data: any) => {
    await delay(500);
    const newMachine: Machine = {
      id: Math.max(...machines.map((m) => m.id), 0) + 1,
      asset_id: `${data.type.substring(0, 3).toUpperCase()}-${String(machines.length + 1).padStart(3, '0')}`,
      status: 'healthy',
      sensors: { temperature: 70, vibration: 0.2, pressure: 95 },
      prediction: {
        failure_probability: 5,
        rul: 200,
        ttf: '40 days',
        status: 'healthy',
        recommendation: 'New asset. Establishing baseline.',
      },
      ...data,
    };
    machines.push(newMachine);
    return newMachine;
  },

  updateMachine: async (id: string | number, data: any) => {
    await delay(400);
    const index = machines.findIndex((m) => m.id === Number(id));
    if (index === -1) {
      throw new Error('Machine not found');
    }
    machines[index] = { ...machines[index], ...data };
    return machines[index];
  },

  deleteMachine: async (id: string | number) => {
    await delay(300);
    machines = machines.filter((m) => m.id !== Number(id));
    return { success: true };
  },

  getMachineSensorHistory: async (id: string | number, hours: number = 24) => {
    await delay(400);
    // Generate mock sensor history
    const history = [];
    const now = Date.now();
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now - i * 60 * 60 * 1000);
      history.push({
        timestamp: time.toISOString(),
        temperature: 70 + Math.random() * 10,
        vibration: 0.2 + Math.random() * 0.3,
        pressure: 95 + Math.random() * 8,
      });
    }
    return history;
  },

  // ============ WORK ORDERS ============
  getWorkOrders: async (filters: WorkOrderFilters = {}) => {
    await delay(500);
    let result = [...workOrders];

    if (filters.status) {
      result = result.filter((wo) => wo.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter((wo) => wo.priority === filters.priority);
    }
    if (filters.assigned_to) {
      result = result.filter((wo) => wo.assigned_to?.id === filters.assigned_to);
    }

    return result;
  },

  getWorkOrderById: async (id: string | number) => {
    await delay(300);
    const workOrder = workOrders.find((wo) => wo.id === Number(id));
    if (!workOrder) {
      throw new Error('Work order not found');
    }
    return workOrder;
  },

  createWorkOrder: async (data: any) => {
    await delay(500);
    const machine = machines.find((m) => m.id === data.machine_id);
    const newWorkOrder: WorkOrder = {
      id: workOrders.length + 101,
      wo_number: `WO-2026-${workOrders.length + 101}`,
      machine_name: machine?.name || 'Unknown',
      asset_id: machine?.asset_id || 'Unknown',
      status: 'open',
      created_at: new Date().toISOString(),
      notes: [],
      ...data,
    };
    workOrders.push(newWorkOrder);
    return newWorkOrder;
  },

  updateWorkOrder: async (id: string | number, data: any) => {
    await delay(400);
    const index = workOrders.findIndex((wo) => wo.id === Number(id));
    if (index === -1) {
      throw new Error('Work order not found');
    }
    workOrders[index] = { ...workOrders[index], ...data };
    return workOrders[index];
  },

  deleteWorkOrder: async (id: string | number) => {
    await delay(300);
    workOrders = workOrders.filter((wo) => wo.id !== Number(id));
    return { success: true };
  },

  addWorkOrderNote: async (id: string | number, note: any) => {
    await delay(300);
    const index = workOrders.findIndex((wo) => wo.id === Number(id));
    if (index === -1) {
      throw new Error('Work order not found');
    }
    const newNote = {
      id: generateId(),
      ...note,
      created_at: new Date().toISOString(),
    };
    workOrders[index].notes.push(newNote);
    return newNote;
  },

  // ============ ALERTS ============
  getAlerts: async (filters: AlertFilters = {}) => {
    await delay(400);
    let result = [...alerts];

    if (filters.severity) {
      result = result.filter((a) => a.severity === filters.severity);
    }
    if (filters.acknowledged !== undefined) {
      result = result.filter((a) => a.acknowledged === filters.acknowledged);
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  acknowledgeAlert: async (id: string | number, user: any) => {
    await delay(300);
    const index = alerts.findIndex((a) => a.id === Number(id));
    if (index === -1) {
      throw new Error('Alert not found');
    }
    alerts[index] = {
      ...alerts[index],
      acknowledged: true,
      acknowledged_by: user,
      acknowledged_at: new Date().toISOString(),
    };
    return alerts[index];
  },

  // ============ USERS ============
  getUsers: async () => {
    await delay(400);
    return users.map(({ password, ...user }) => user);
  },

  getUserById: async (id: string | number) => {
    await delay(300);
    const user = users.find((u) => u.id === Number(id));
    if (!user) {
      throw new Error('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  createUser: async (data: any) => {
    await delay(500);
    const newUser: MockUser = {
      id: users.length + 1,
      avatar: null,
      first_login: true,
      company_id: 1,
      created_at: new Date().toISOString(),
      password: 'temp123', // Temporary password
      ...data,
    };
    users.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },

  updateUser: async (id: string | number, data: any) => {
    await delay(400);
    const index = users.findIndex((u) => u.id === Number(id));
    if (index === -1) {
      throw new Error('User not found');
    }
    users[index] = { ...users[index], ...data };
    const { password, ...userWithoutPassword } = users[index];
    return userWithoutPassword;
  },

  deleteUser: async (id: string | number) => {
    await delay(300);
    users = users.filter((u) => u.id !== Number(id));
    return { success: true };
  },

  updateAvatar: async (id: string | number, base64Image: string, sessionUser?: User) => {
    await delay(300);

    // 1. Try exact ID match
    let index = users.findIndex((u) => u.id === Number(id));

    // 2. Email fallback — handles the case where a dynamic user's ID is no longer in
    //    the in-memory array after a page refresh resets users to [...mockUsers]
    if (index === -1 && sessionUser?.email) {
      index = users.findIndex((u) => u.email === sessionUser.email);
    }

    // 3. Still not found — restore the dynamic user from session data so the update works
    if (index === -1 && sessionUser) {
      users.push({ ...sessionUser, password: '' });
      index = users.length - 1;
    }

    if (index === -1) {
      throw new Error('User not found');
    }

    users[index] = { ...users[index], avatar: base64Image };
    const { password: _, ...userWithoutPassword } = users[index];
    return userWithoutPassword;
  },

  // ============ COMPANY/SETTINGS ============
  getCompanySettings: async () => {
    await delay(300);
    return company;
  },

  updateCompanySettings: async (data: any) => {
    await delay(400);
    company = { ...company, ...data };
    return company;
  },

  completeSetup: async () => {
    await delay(300);
    company.setup_completed = true;
    return company;
  },

  // ============ NOTIFICATIONS ============
  getNotifications: async () => {
    await delay(300);
    return notifications;
  },

  markNotificationRead: async (id: string | number) => {
    await delay(200);
    const index = notifications.findIndex((n) => n.id === Number(id));
    if (index !== -1) {
      notifications[index].read = true;
    }
    return notifications[index];
  },

  markAllNotificationsRead: async () => {
    await delay(200);
    notifications = notifications.map((n) => ({ ...n, read: true }));
    return { success: true };
  },

  // ============ REPORTS ============
  getReportsData: async () => {
    await delay(500);
    return mockReportsData;
  },

  // ============ MAINTENANCE CALENDAR ============
  getMaintenanceEvents: async (month: number, year: number) => {
    await delay(300);
    return mockMaintenanceEvents;
  },

  // ============ EXPORT ============
  exportPDF: async (type: string, id: string | number) => {
    await delay(1000);
    // In real app, this would generate and return a PDF
    return {
      success: true,
      message: 'PDF exported successfully',
      url: '#',
    };
  },

  // ============ SETTINGS – ASSET TYPES ============
  getAssetTypes: async () => {
    await delay(300);
    return [...assetTypes];
  },

  createAssetType: async (data: any) => {
    await delay(300);
    const newItem = { id: Date.now(), ...data };
    assetTypes.push(newItem);
    return newItem;
  },

  updateAssetType: async (id: number, data: any) => {
    await delay(300);
    const idx = assetTypes.findIndex((a) => a.id === id);
    if (idx !== -1) assetTypes[idx] = { ...assetTypes[idx], ...data };
    return assetTypes[idx];
  },

  deleteAssetType: async (id: number) => {
    await delay(300);
    assetTypes = assetTypes.filter((a) => a.id !== id);
    return { success: true };
  },

  // ============ SETTINGS – SENSOR THRESHOLDS ============
  getSensorThresholds: async () => {
    await delay(300);
    return [...sensorThresholds];
  },

  createSensorThreshold: async (data: any) => {
    await delay(300);
    const newItem = { id: Date.now(), ...data };
    sensorThresholds.push(newItem);
    return newItem;
  },

  updateSensorThreshold: async (id: number, data: any) => {
    await delay(300);
    const idx = sensorThresholds.findIndex((s) => s.id === id);
    if (idx !== -1) sensorThresholds[idx] = { ...sensorThresholds[idx], ...data };
    return sensorThresholds[idx];
  },

  deleteSensorThreshold: async (id: number) => {
    await delay(300);
    sensorThresholds = sensorThresholds.filter((s) => s.id !== id);
    return { success: true };
  },

  // ============ SETTINGS – AI MODEL ============
  getAIModelInfo: async () => {
    await delay(300);
    return {
      name: 'Predictive Maintenance Model v2.1',
      type: 'Machine Learning - Random Forest',
      status: 'active',
      lastTraining: '12 Jan 2026',
      nextTraining: '12 Feb 2026',
      metrics: { accuracy: 92, precision: 90, recall: 88, f1Score: 89 },
      trainingHistory: [
        { date: '12 Jan 2026', duration: '2h 15m', accuracy: 92, status: 'Success' },
        { date: '12 Dec 2025', duration: '2h 10m', accuracy: 90, status: 'Success' },
        { date: '12 Nov 2025', duration: '2h 20m', accuracy: 88, status: 'Success' },
        { date: '12 Oct 2025', duration: '2h 18m', accuracy: 86, status: 'Success' },
        { date: '12 Sep 2025', duration: '2h 25m', accuracy: 85, status: 'Success' },
      ],
    };
  },

  retrainAIModel: async () => {
    await delay(2000);
    return { success: true, message: 'Model retraining started. This may take several hours.' };
  },

  scheduleTraining: async (data: Record<string, unknown>) => {
    await delay(500);
    return { success: true, scheduledDate: data.date };
  },

  // ============ ACCESS REQUESTS ============
  getAccessRequests: async () => {
    await delay(350);
    return [...mockAccessRequests];
  },
};

export default mockApi;
