// User Roles
export const ROLES = {
  ADMIN: 'admin',
  ENGINEER: 'engineer',
  TECHNICIAN: 'technician',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Machine Status
export const MACHINE_STATUS = {
  RUNNING: 'running',
  WARNING: 'warning',
  CRITICAL: 'critical',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline',
} as const;

export type MachineStatus = (typeof MACHINE_STATUS)[keyof typeof MACHINE_STATUS];

// Work Order Status
export const WORK_ORDER_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUS)[keyof typeof WORK_ORDER_STATUS];

// Work Order Priority
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

// Alert Types
export const ALERT_TYPE = {
  PREDICTION: 'prediction',
  THRESHOLD: 'threshold',
  ANOMALY: 'anomaly',
  MAINTENANCE_DUE: 'maintenance_due',
} as const;

export type AlertType = (typeof ALERT_TYPE)[keyof typeof ALERT_TYPE];

// Alert Severity
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type AlertSeverity = (typeof ALERT_SEVERITY)[keyof typeof ALERT_SEVERITY];

// Navigation Item
export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

// Navigation Items by Role
export const NAV_ITEMS: Record<Role, NavItem[]> = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { label: 'Assets', path: '/machines', icon: 'PrecisionManufacturing' },
    { label: 'Work Orders', path: '/work-orders', icon: 'Assignment' },
    { label: 'Maintenance', path: '/maintenance', icon: 'Build' },
    { label: 'Reports', path: '/reports', icon: 'Assessment' },
    { label: 'Alerts', path: '/alerts', icon: 'NotificationsActive' },
    { label: 'Users', path: '/users', icon: 'People' },
    { label: 'Settings', path: '/settings', icon: 'Settings' },
  ],
  [ROLES.ENGINEER]: [
    { label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { label: 'Assets', path: '/machines', icon: 'PrecisionManufacturing' },
    { label: 'Work Orders', path: '/work-orders', icon: 'Assignment' },
    { label: 'Maintenance', path: '/maintenance', icon: 'Build' },
    { label: 'Reports', path: '/reports', icon: 'Assessment' },
    { label: 'Alerts', path: '/alerts', icon: 'NotificationsActive' },
  ],
  [ROLES.TECHNICIAN]: [
    { label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' },
    { label: 'Assets', path: '/machines', icon: 'PrecisionManufacturing' },
    { label: 'My Work Orders', path: '/my-work-orders', icon: 'Assignment' },
  ],
};

// Chart Colors
export const CHART_COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
} as const;

// Status Colors
export const STATUS_COLORS: Record<MachineStatus, string> = {
  [MACHINE_STATUS.RUNNING]: '#4caf50',
  [MACHINE_STATUS.WARNING]: '#ff9800',
  [MACHINE_STATUS.CRITICAL]: '#f44336',
  [MACHINE_STATUS.MAINTENANCE]: '#2196f3',
  [MACHINE_STATUS.OFFLINE]: '#9e9e9e',
};

// API Endpoints (for mock/real API)
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  MACHINES: '/api/machines',
  WORK_ORDERS: '/api/work-orders',
  ALERTS: '/api/alerts',
  USERS: '/api/users',
  ANALYTICS: '/api/analytics',
} as const;
