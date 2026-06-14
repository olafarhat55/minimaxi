import { ROLES, NAV_ITEMS, type Role, type NavItem } from './constants';

export interface PermissionUser {
  role: Role;
}

const PERMISSIONS: Record<Role, string[]> = {
  [ROLES.ADMIN]: [
    'view_dashboard',
    'view_machines',
    'view_machine_details',
    'edit_machines',
    'create_work_order',
    'view_work_orders',
    'view_work_order_details',
    'edit_work_orders',
    'delete_work_orders',
    'start_work_order',
    'complete_work_order',
    'view_maintenance',
    'edit_maintenance',
    'view_reports',
    'export_reports',
    'view_alerts',
    'view_analytics',
    'view_users',
    'view_settings',
  ],

  [ROLES.SYSTEM_ADMIN]: [
    'view_dashboard',
    'view_machines',
    'view_machine_details',
    'edit_machines',
    'create_work_order',
    'view_work_orders',
    'view_work_order_details',
    'edit_work_orders',
    'delete_work_orders',
    'start_work_order',
    'complete_work_order',
    'view_maintenance',
    'edit_maintenance',
    'view_reports',
    'export_reports',
    'view_alerts',
    'view_analytics',
    'view_users',
    'view_settings',
  ],

  [ROLES.COMPANY_ADMIN]: [
    'view_dashboard',
    'view_machines',
    'view_machine_details',
    'view_work_orders',
    'view_work_order_details',
    'view_alerts',
    'view_reports',
    'view_maintenance',
    'view_users',
    'view_settings',
  ],

  [ROLES.ENGINEER]: [
    'view_dashboard',
    'view_machines',
    'view_machine_details',
    'edit_machines',
    'create_work_order',
    'view_work_orders',
    'view_work_order_details',
    'edit_work_orders',
    'delete_work_orders',
    'start_work_order',
    'complete_work_order',
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

export const userCan = (
  user: PermissionUser | null | undefined,
  action: string
): boolean => {
  if (!user || !user.role) return false;
  const userPermissions = PERMISSIONS[user.role];
  if (!userPermissions) return false;
  return userPermissions.includes(action);
};

export const hasRole = (
  user: PermissionUser | null | undefined,
  roles: Role[]
): boolean => {
  if (!user || !user.role) return false;
  return roles.includes(user.role);
};

export const isCompanyAdmin = (
  user: PermissionUser | null | undefined
): boolean => {
  return user?.role === ROLES.COMPANY_ADMIN;
};

export const canManageWorkOrders = (
  user: PermissionUser | null | undefined
): boolean => {
  return user?.role === ROLES.ENGINEER;
};

export const canCancelWorkOrder = (
  _user: PermissionUser | null | undefined
): boolean => {
  return false;
};

export const canChangeWorkOrderStatus = (
  user: PermissionUser | null | undefined
): boolean => {
  return (
    user?.role === ROLES.ENGINEER ||
    user?.role === ROLES.TECHNICIAN
  );
};

export const isAdmin = (
  user: PermissionUser | null | undefined
): boolean => {
  return (
    user?.role === ROLES.ADMIN ||
    user?.role === ROLES.SYSTEM_ADMIN
  );
};

export const isEngineer = (
  user: PermissionUser | null | undefined
): boolean => {
  return user?.role === ROLES.ENGINEER;
};

export const isTechnician = (
  user: PermissionUser | null | undefined
): boolean => {
  return user?.role === ROLES.TECHNICIAN;
};

export const getDefaultRoute = (
  user: PermissionUser | null | undefined
): string => {
  if (!user || !user.role) return '/login';
  switch (user.role) {
    case ROLES.TECHNICIAN:
      return '/my-work-orders';
    case ROLES.ENGINEER:
    case ROLES.COMPANY_ADMIN:
    case ROLES.ADMIN:
    case ROLES.SYSTEM_ADMIN:
    default:
      return '/dashboard';
  }
};

// ✅ بنستخدم NAV_ITEMS من constants مباشرةً بدل ما نكرر التعريف
export const getNavItems = (
  user: PermissionUser | null | undefined
): NavItem[] => {
  if (!user || !user.role) return [];
  return NAV_ITEMS[user.role] || [];
};