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
    'cancel_work_order',
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
    'cancel_work_order',
    'view_maintenance',
    'edit_maintenance',
    'view_reports',
    'export_reports',
    'view_alerts',
    'view_analytics',
    'view_users',
    'view_settings',
  ],

  // ✅ Company Admin: view only — no create/edit/delete/start/complete/cancel
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

  // ✅ Engineer: full WO control — create/edit/delete/cancel (NOT start/complete)
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
    'cancel_work_order',
    'view_maintenance',
    'edit_maintenance',
    'view_reports',
    'export_reports',
    'view_alerts',
    'view_analytics',
  ],

  // ✅ Technician: assigned WOs only — start/complete (NOT create/edit/delete/cancel)
  [ROLES.TECHNICIAN]: [
    'view_dashboard',
    'view_machines',
    'view_machine_details',
    'view_my_work_orders',
    'view_work_order_details',
    'start_work_order',
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

// ─── Work Order permission helpers (match the matrix exactly) ────────────────

/** Engineer only */
export const canCreateWorkOrder = (user: PermissionUser | null | undefined): boolean =>
  userCan(user, 'create_work_order') && user?.role === ROLES.ENGINEER;

/** Engineer only */
export const canEditWorkOrder = (user: PermissionUser | null | undefined): boolean =>
  userCan(user, 'edit_work_orders') && user?.role === ROLES.ENGINEER;

/** Engineer only */
export const canDeleteWorkOrder = (user: PermissionUser | null | undefined): boolean =>
  userCan(user, 'delete_work_orders') && user?.role === ROLES.ENGINEER;

/** Technician only */
export const canStartWork = (user: PermissionUser | null | undefined): boolean =>
  userCan(user, 'start_work_order') && user?.role === ROLES.TECHNICIAN;

/** Technician only */
export const canCompleteWork = (user: PermissionUser | null | undefined): boolean =>
  userCan(user, 'complete_work_order') && user?.role === ROLES.TECHNICIAN;

/** Engineer only */
export const canCancelWorkOrder = (user: PermissionUser | null | undefined): boolean =>
  userCan(user, 'cancel_work_order') && user?.role === ROLES.ENGINEER;

/** Technician can see only their own WOs; Engineer & Company Admin see all */
export const canViewAllWorkOrders = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.ENGINEER ||
  user?.role === ROLES.COMPANY_ADMIN ||
  user?.role === ROLES.ADMIN ||
  user?.role === ROLES.SYSTEM_ADMIN;

// ─── Generic role helpers ────────────────────────────────────────────────────

export const isCompanyAdmin = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.COMPANY_ADMIN;

export const isAdmin = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.ADMIN || user?.role === ROLES.SYSTEM_ADMIN;

export const isEngineer = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.ENGINEER;

export const isTechnician = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.TECHNICIAN;

export const canManageWorkOrders = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.ENGINEER;

export const canChangeWorkOrderStatus = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.ENGINEER || user?.role === ROLES.TECHNICIAN;

export const getDefaultRoute = (user: PermissionUser | null | undefined): string => {
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

export const getNavItems = (user: PermissionUser | null | undefined): NavItem[] => {
  if (!user || !user.role) return [];
  return NAV_ITEMS[user.role] || [];
};


export const canManageAssets = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.ADMIN ||
  user?.role === ROLES.SYSTEM_ADMIN ||
  user?.role === ROLES.COMPANY_ADMIN;


/** Company Admin, Admin, System Admin only */
export const canDeleteAsset = (user: PermissionUser | null | undefined): boolean =>
  user?.role === ROLES.COMPANY_ADMIN ||
  user?.role === ROLES.ADMIN ||
  user?.role === ROLES.SYSTEM_ADMIN;  