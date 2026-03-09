import type {
  MockUser,
  Company,
  Machine,
  WorkOrder,
  Alert,
  DashboardStats,
  HealthDistributionItem,
  FailureTrendItem,
  SensorTrendItem,
  AIInsight,
  MaintenanceEvent,
  ReportsData,
  AccessRequest,
  Notification,
  SelectOption,
} from '../types';

// Mock Users Data
export const mockUsers: MockUser[] = [
  {
    id: 1,
    name: 'Ahmed Mohamed',
    email: 'admin@abc.com',
    password: 'admin123',
    role: 'admin',
    avatar: null,
    first_login: false,
    company_id: 1,
    created_at: '2025-01-01T08:00:00Z',
  },
  {
    id: 2,
    name: 'Sara Ahmed',
    email: 'sara@abc.com',
    password: 'engineer123',
    role: 'engineer',
    avatar: null,
    first_login: false,
    company_id: 1,
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 3,
    name: 'Khaled Ibrahim',
    email: 'khaled@abc.com',
    password: 'tech123',
    role: 'technician',
    avatar: null,
    first_login: false,
    company_id: 1,
    created_at: '2025-02-01T08:00:00Z',
  },
  {
    id: 4,
    name: 'Fatima Hassan',
    email: 'fatima@abc.com',
    password: 'tech123',
    role: 'technician',
    avatar: null,
    first_login: false,
    company_id: 1,
    created_at: '2025-02-10T08:00:00Z',
  },
];

// Mock Company Data
export const mockCompany: Company = {
  id: 1,
  name: 'ABC Manufacturing',
  logo: null,
  timezone: 'Africa/Cairo',
  language: 'en',
  service_type: 'both',
  industry: 'Manufacturing',
  setup_completed: true,
};

// Mock Machines Data
export const mockMachines: Machine[] = [
  {
    id: 1,
    asset_id: 'CNC-001',
    name: 'CNC Machine #1',
    type: 'CNC Machine',
    location: 'Line A',
    serial_number: 'CNC2024001',
    manufacturer: 'Haas',
    model: 'VF-2',
    installation_date: '2024-03-15',
    criticality: 'high',
    status: 'healthy',
    last_maintenance: '2026-01-15',
    sensors: {
      temperature: 72,
      vibration: 0.2,
      pressure: 98,
      rpm: 3500,
    },
    prediction: {
      failure_probability: 5,
      rul: 230,
      ttf: '45 days',
      status: 'healthy',
      recommendation: 'No immediate action required. Continue regular monitoring.',
    },
  },
  {
    id: 2,
    asset_id: 'PUMP-023',
    name: 'Hydraulic Pump #23',
    type: 'Pump',
    location: 'Line A',
    serial_number: 'PMP2023023',
    manufacturer: 'Parker',
    model: 'PV180',
    installation_date: '2023-08-10',
    criticality: 'medium',
    status: 'warning',
    last_maintenance: '2025-12-20',
    sensors: {
      temperature: 85,
      vibration: 0.8,
      pressure: 102,
      flow_rate: 45,
    },
    prediction: {
      failure_probability: 70,
      rul: 8,
      ttf: '2 days',
      status: 'warning',
      recommendation: 'Schedule preventive maintenance within 48 hours. Check seal integrity.',
    },
  },
  {
    id: 3,
    asset_id: 'ENGINE-012',
    name: 'Industrial Engine #12',
    type: 'Engine',
    location: 'Line B',
    serial_number: 'ENG2022012',
    manufacturer: 'Caterpillar',
    model: 'C18',
    installation_date: '2022-05-20',
    criticality: 'high',
    status: 'critical',
    last_maintenance: '2025-11-10',
    sensors: {
      temperature: 92,
      vibration: 1.2,
      pressure: 110,
      rpm: 1800,
    },
    prediction: {
      failure_probability: 82,
      rul: 20,
      ttf: '3 days',
      status: 'critical',
      recommendation: 'Immediate maintenance required. High risk of bearing failure.',
    },
  },
  {
    id: 4,
    asset_id: 'COMP-007',
    name: 'Air Compressor #7',
    type: 'Compressor',
    location: 'Utility Room',
    serial_number: 'CMP2024007',
    manufacturer: 'Atlas Copco',
    model: 'GA90',
    installation_date: '2024-01-05',
    criticality: 'medium',
    status: 'healthy',
    last_maintenance: '2026-01-20',
    sensors: {
      temperature: 68,
      vibration: 0.15,
      pressure: 95,
      air_flow: 380,
    },
    prediction: {
      failure_probability: 12,
      rul: 180,
      ttf: '35 days',
      status: 'healthy',
      recommendation: 'Operating within normal parameters.',
    },
  },
  {
    id: 5,
    asset_id: 'CNC-002',
    name: 'CNC Machine #2',
    type: 'CNC Machine',
    location: 'Line A',
    serial_number: 'CNC2024002',
    manufacturer: 'Haas',
    model: 'VF-3',
    installation_date: '2024-04-20',
    criticality: 'high',
    status: 'healthy',
    last_maintenance: '2026-01-18',
    sensors: {
      temperature: 70,
      vibration: 0.18,
      pressure: 97,
      rpm: 3600,
    },
    prediction: {
      failure_probability: 8,
      rul: 210,
      ttf: '40 days',
      status: 'healthy',
      recommendation: 'Continue regular monitoring.',
    },
  },
  {
    id: 6,
    asset_id: 'ENGINE-015',
    name: 'Industrial Engine #15',
    type: 'Engine',
    location: 'Line C',
    serial_number: 'ENG2023015',
    manufacturer: 'Caterpillar',
    model: 'C15',
    installation_date: '2023-02-15',
    criticality: 'high',
    status: 'warning',
    last_maintenance: '2025-12-05',
    sensors: {
      temperature: 88,
      vibration: 0.9,
      pressure: 105,
      rpm: 1750,
    },
    prediction: {
      failure_probability: 55,
      rul: 45,
      ttf: '7 days',
      status: 'warning',
      recommendation: 'Schedule inspection within the next week.',
    },
  },
];

// Mock Work Orders Data
export const mockWorkOrders: WorkOrder[] = [
  {
    id: 101,
    wo_number: 'WO-2026-101',
    machine_id: 3,
    machine_name: 'Industrial Engine #12',
    asset_id: 'ENGINE-012',
    title: 'Emergency bearing replacement',
    description: 'Replace main bearing due to high vibration levels detected by AI system.',
    priority: 'critical',
    status: 'in_progress',
    assigned_to: { id: 3, name: 'Khaled Ibrahim' },
    created_by: { id: 2, name: 'Sara Ahmed' },
    created_at: '2026-02-01T08:00:00Z',
    due_date: '2026-02-01T17:00:00Z',
    estimated_hours: 4,
    actual_hours: null,
    parts_needed: ['Bearing SKF 6308', 'Seal kit', 'Lubricant'],
    notes: [],
  },
  {
    id: 102,
    wo_number: 'WO-2026-102',
    machine_id: 2,
    machine_name: 'Hydraulic Pump #23',
    asset_id: 'PUMP-023',
    title: 'Preventive seal replacement',
    description: 'Replace hydraulic seals as recommended by predictive maintenance system.',
    priority: 'high',
    status: 'open',
    assigned_to: { id: 4, name: 'Fatima Hassan' },
    created_by: { id: 2, name: 'Sara Ahmed' },
    created_at: '2026-02-01T09:30:00Z',
    due_date: '2026-02-02T12:00:00Z',
    estimated_hours: 3,
    actual_hours: null,
    parts_needed: ['Seal kit P180', 'O-rings'],
    notes: [],
  },
  {
    id: 103,
    wo_number: 'WO-2026-103',
    machine_id: 1,
    machine_name: 'CNC Machine #1',
    asset_id: 'CNC-001',
    title: 'Routine maintenance',
    description: 'Scheduled quarterly maintenance check.',
    priority: 'low',
    status: 'completed',
    assigned_to: { id: 3, name: 'Khaled Ibrahim' },
    created_by: { id: 1, name: 'Ahmed Mohamed' },
    created_at: '2026-01-25T10:00:00Z',
    due_date: '2026-01-28T17:00:00Z',
    completed_at: '2026-01-27T15:30:00Z',
    estimated_hours: 2,
    actual_hours: 1.5,
    parts_needed: [],
    notes: [
      {
        id: 1,
        user: 'Khaled Ibrahim',
        text: 'Completed ahead of schedule. All systems nominal.',
        created_at: '2026-01-27T15:30:00Z',
      },
    ],
  },
  {
    id: 104,
    wo_number: 'WO-2026-104',
    machine_id: 6,
    machine_name: 'Industrial Engine #15',
    asset_id: 'ENGINE-015',
    title: 'Inspection and diagnostics',
    description: 'Investigate elevated temperature readings.',
    priority: 'medium',
    status: 'open',
    assigned_to: null,
    created_by: { id: 2, name: 'Sara Ahmed' },
    created_at: '2026-02-01T11:00:00Z',
    due_date: '2026-02-05T17:00:00Z',
    estimated_hours: 2,
    actual_hours: null,
    parts_needed: [],
    notes: [],
  },
];

// Mock Alerts Data
export const mockAlerts: Alert[] = [
  {
    id: 1,
    type: 'prediction',
    severity: 'critical',
    machine_id: 3,
    machine_name: 'Industrial Engine #12',
    asset_id: 'ENGINE-012',
    title: 'High Failure Probability Detected',
    message: 'AI model predicts 82% failure probability within 3 days.',
    created_at: '2026-02-01T07:45:00Z',
    acknowledged: true,
    acknowledged_by: 'Sara Ahmed',
    acknowledged_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 2,
    type: 'threshold',
    severity: 'warning',
    machine_id: 2,
    machine_name: 'Hydraulic Pump #23',
    asset_id: 'PUMP-023',
    title: 'Temperature Threshold Exceeded',
    message: 'Temperature reading 85°C exceeds warning threshold of 80°C.',
    created_at: '2026-02-01T06:30:00Z',
    acknowledged: true,
    acknowledged_by: 'Ahmed Mohamed',
    acknowledged_at: '2026-02-01T07:00:00Z',
  },
  {
    id: 3,
    type: 'anomaly',
    severity: 'warning',
    machine_id: 6,
    machine_name: 'Industrial Engine #15',
    asset_id: 'ENGINE-015',
    title: 'Unusual Vibration Pattern',
    message: 'Anomalous vibration pattern detected. Deviation from normal baseline.',
    created_at: '2026-02-01T10:15:00Z',
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
  },
  {
    id: 4,
    type: 'maintenance_due',
    severity: 'info',
    machine_id: 4,
    machine_name: 'Air Compressor #7',
    asset_id: 'COMP-007',
    title: 'Scheduled Maintenance Due',
    message: 'Quarterly maintenance due in 14 days.',
    created_at: '2026-02-01T00:00:00Z',
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
  },
];

// Dashboard Statistics
export const mockDashboardStats: DashboardStats = {
  total_assets: 128,
  healthy: 110,
  warning: 12,
  critical: 6,
  active_work_orders: 12,
  predicted_failures: 5,
  uptime_percentage: 94.5,
  mtbf: 720, // Mean Time Between Failures (hours)
  mttr: 4.2, // Mean Time To Repair (hours)
};

// Asset Health Distribution for Pie Chart
export const mockHealthDistribution: HealthDistributionItem[] = [
  { name: 'Healthy', value: 110, color: '#4caf50' },
  { name: 'Warning', value: 12, color: '#ff9800' },
  { name: 'Critical', value: 6, color: '#f44336' },
];

// Failure Probability Trend for Line Chart - Multiple time periods
export const mockFailureTrendData: Record<string, FailureTrendItem[]> = {
  daily: [
    { label: 'Jan 25', probability: 12 },
    { label: 'Jan 26', probability: 14 },
    { label: 'Jan 27', probability: 11 },
    { label: 'Jan 28', probability: 15 },
    { label: 'Jan 29', probability: 13 },
    { label: 'Jan 30', probability: 16 },
    { label: 'Jan 31', probability: 14 },
    { label: 'Feb 1', probability: 12 },
    { label: 'Feb 2', probability: 10 },
    { label: 'Feb 3', probability: 11 },
    { label: 'Feb 4', probability: 9 },
  ],
  weekly: [
    { label: 'Week 45', probability: 18 },
    { label: 'Week 46', probability: 16 },
    { label: 'Week 47', probability: 19 },
    { label: 'Week 48', probability: 15 },
    { label: 'Week 49', probability: 14 },
    { label: 'Week 50', probability: 12 },
    { label: 'Week 51', probability: 13 },
    { label: 'Week 52', probability: 11 },
    { label: 'Week 1', probability: 10 },
    { label: 'Week 2', probability: 12 },
    { label: 'Week 3', probability: 9 },
    { label: 'Week 4', probability: 8 },
  ],
  monthly: [
    { label: 'Mar 25', probability: 22 },
    { label: 'Apr 25', probability: 19 },
    { label: 'May 25', probability: 21 },
    { label: 'Jun 25', probability: 18 },
    { label: 'Jul 25', probability: 16 },
    { label: 'Aug 25', probability: 17 },
    { label: 'Sep 25', probability: 14 },
    { label: 'Oct 25', probability: 15 },
    { label: 'Nov 25', probability: 12 },
    { label: 'Dec 25', probability: 11 },
    { label: 'Jan 26', probability: 10 },
    { label: 'Feb 26', probability: 8 },
  ],
  yearly: [
    { label: '2019', probability: 15 },
    { label: '2020', probability: 18 },
    { label: '2021', probability: 12 },
    { label: '2022', probability: 22 },
    { label: '2023', probability: 16 },
    { label: '2024', probability: 10 },
    { label: '2025', probability: 8 },
  ],
};

// Legacy export for backward compatibility
export const mockFailureTrend = mockFailureTrendData.yearly.map(item => ({
  year: item.label,
  probability: item.probability,
}));

// Sensor Trends Data (for multi-line chart)
export const mockSensorTrends: SensorTrendItem[] = [
  { time: '00:00', temperature: 70, vibration: 0.2, pressure: 95 },
  { time: '04:00', temperature: 72, vibration: 0.22, pressure: 96 },
  { time: '08:00', temperature: 75, vibration: 0.25, pressure: 97 },
  { time: '12:00', temperature: 78, vibration: 0.28, pressure: 98 },
  { time: '16:00', temperature: 76, vibration: 0.26, pressure: 97 },
  { time: '20:00', temperature: 73, vibration: 0.23, pressure: 96 },
  { time: '24:00', temperature: 71, vibration: 0.21, pressure: 95 },
];

// AI Insights for Dashboard
export const mockAIInsights: AIInsight[] = [
  {
    id: 1,
    machine_id: 3,
    machine_name: 'Industrial Engine #12',
    asset_id: 'ENGINE-012',
    insight: 'Bearing degradation detected. Recommend replacement within 72 hours.',
    severity: 'critical',
    confidence: 92,
  },
  {
    id: 2,
    machine_id: 2,
    machine_name: 'Hydraulic Pump #23',
    asset_id: 'PUMP-023',
    insight: 'Seal wear pattern indicates potential leak. Schedule inspection.',
    severity: 'warning',
    confidence: 85,
  },
  {
    id: 3,
    machine_id: 6,
    machine_name: 'Industrial Engine #15',
    asset_id: 'ENGINE-015',
    insight: 'Temperature trending upward. Monitor closely for next 48 hours.',
    severity: 'warning',
    confidence: 78,
  },
];

// Maintenance Calendar Events
export const mockMaintenanceEvents: MaintenanceEvent[] = [
  { date: '2026-02-01', type: 'critical', count: 2 },
  { date: '2026-02-03', type: 'warning', count: 1 },
  { date: '2026-02-07', type: 'scheduled', count: 3 },
  { date: '2026-02-10', type: 'warning', count: 2 },
  { date: '2026-02-14', type: 'scheduled', count: 1 },
  { date: '2026-02-15', type: 'critical', count: 1 },
  { date: '2026-02-20', type: 'scheduled', count: 2 },
];

// Reports Data
export const mockReportsData: ReportsData = {
  downtime_reduction: 20,
  prediction_accuracy: 95,
  cost_savings: 150000,
  preventive_vs_reactive: { preventive: 75, reactive: 25 },
  monthly_downtime: [
    { month: 'Jul', hours: 48 },
    { month: 'Aug', hours: 42 },
    { month: 'Sep', hours: 38 },
    { month: 'Oct', hours: 35 },
    { month: 'Nov', hours: 30 },
    { month: 'Dec', hours: 25 },
    { month: 'Jan', hours: 22 },
  ],
  technician_performance: [
    { name: 'Khaled Ibrahim', completed: 45, avg_time: 3.2, rating: 4.8 },
    { name: 'Fatima Hassan', completed: 38, avg_time: 3.5, rating: 4.6 },
  ],
};

// Access Requests (for admin approval)
export const mockAccessRequests: AccessRequest[] = [
  {
    id: 1,
    company_name: 'XYZ Industries',
    industry: 'Manufacturing',
    contact_person: 'Mohamed Ali',
    email: 'mohamed@xyz.com',
    phone: '+20 123 456 7890',
    service_type: ['monitoring', 'predictive'],
    status: 'pending',
    created_at: '2026-01-30T10:00:00Z',
  },
];

// Notifications
export const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'alert',
    title: 'Critical Alert',
    message: 'ENGINE-012 requires immediate attention',
    read: false,
    created_at: '2026-02-01T07:45:00Z',
  },
  {
    id: 2,
    type: 'work_order',
    title: 'Work Order Assigned',
    message: 'WO-2026-102 has been assigned to you',
    read: false,
    created_at: '2026-02-01T09:30:00Z',
  },
  {
    id: 3,
    type: 'system',
    title: 'System Update',
    message: 'AI model has been updated with new predictions',
    read: true,
    created_at: '2026-01-31T22:00:00Z',
  },
];

// Machine Types for dropdown
export const machineTypes: string[] = [
  'Engine',
  'Pump',
  'CNC Machine',
  'Compressor',
  'Conveyor',
  'Generator',
  'Motor',
  'Turbine',
];

// Industries for dropdown
export const industries: string[] = [
  'Manufacturing',
  'Transportation',
  'Energy',
  'Oil & Gas',
  'Mining',
  'Food Processing',
  'Pharmaceuticals',
];

// Timezones for dropdown
export const timezones: SelectOption[] = [
  { value: 'Africa/Cairo', label: 'Cairo (GMT+2)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
];

// Languages for dropdown
export const languages: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'Arabic' },
];
