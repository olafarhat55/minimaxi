import { ROLES, type Role, type NavItem } from './constants';

// Minimal user shape needed by permission utilities
export interface PermissionUser {
  role: Role;
}

// Permission definitions by role
const PERMISSIONS: Record<Role, string[]> = {
  [ROLES.ADMIN]: ['all'],
  [ROLES.ENGINEER]: [
    'view_dashboard',
    'view_machines',
    'view_machine_details',
    'edit_machines',
    'create_work_order',
    'view_work_orders',
    'edit_work_orders',
    'delete_work_orders',
    'view_maintenance',
    'edit_maintenance',
    'view_reports',
    'export_reports',
    'view_alerts',
    'view_analytics',
  ],
  [ROLES.TECHNICIAN]: [
    'view_dashboard',
    'view_machines',
    'view_machine_details',
    'view_my_work_orders',
    'update_work_order',
    'complete_work_order',
    'add_work_order_notes',
  ],
};

/**
 * Check if a user has permission to perform an action
 */
export const userCan = (user: PermissionUser | null | undefined, action: string): boolean => {
  if (!user || !user.role) return false;

  const userPermissions = PERMISSIONS[user.role];

  if (!userPermissions) return false;
  if (userPermissions.includes('all')) return true;

  return userPermissions.includes(action);
};

/**
 * Check if user has any of the specified roles
 */
export const hasRole = (user: PermissionUser | null | undefined, roles: Role[]): boolean => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: PermissionUser | null | undefined): boolean => {
  return user?.role === ROLES.ADMIN;
};

/**
 * Check if user is engineer
 */
export const isEngineer = (user: PermissionUser | null | undefined): boolean => {
  return user?.role === ROLES.ENGINEER;
};

/**
 * Check if user is technician
 */
export const isTechnician = (user: PermissionUser | null | undefined): boolean => {
  return user?.role === ROLES.TECHNICIAN;
};

/**
 * Get the default route for a user based on their role
 */
export const getDefaultRoute = (user: PermissionUser | null | undefined): string => {
  if (!user || !user.role) return '/login';

  switch (user.role) {
    case ROLES.TECHNICIAN:
      return '/my-work-orders';
    case ROLES.ENGINEER:
    case ROLES.ADMIN:
    default:
      return '/dashboard';
  }
};

/**
 * Get navigation items for a user based on their role
 */
export const getNavItems = (user: PermissionUser | null | undefined): NavItem[] => {
  if (!user || !user.role) return [];

  const navConfig: Record<Role, NavItem[]> = {
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

  return navConfig[user.role] || [];
};
