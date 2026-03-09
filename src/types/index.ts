import type { Role, MachineStatus, WorkOrderStatus, Priority, AlertType, AlertSeverity } from '../utils/constants';

// ============ USER ============

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar: string | null;
  first_login: boolean;
  company_id: number;
  created_at: string;
  status?: string;
}

/** User record that includes password (mock data only) */
export interface MockUser extends User {
  password: string;
}

// ============ COMPANY ============

export interface Company {
  id: number;
  name: string;
  logo: string | null;
  timezone: string;
  language: string;
  service_type: string;
  industry: string;
  setup_completed: boolean;
}

// ============ MACHINE ============

export interface MachinePrediction {
  failure_probability: number;
  rul: number;
  ttf: string;
  status: string;
  recommendation: string;
}

export interface Machine {
  id: number;
  asset_id: string;
  name: string;
  type: string;
  location: string;
  serial_number: string;
  manufacturer: string;
  model: string;
  installation_date: string;
  criticality: string;
  status: string;
  last_maintenance: string;
  sensors: Record<string, number>;
  prediction: MachinePrediction;
}

// ============ WORK ORDER ============

export interface PersonRef {
  id: number;
  name: string;
}

export interface WorkOrderNote {
  id: number | string;
  user: string;
  text: string;
  created_at: string;
}

export interface WorkOrder {
  id: number;
  wo_number: string;
  machine_id: number;
  machine_name: string;
  asset_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: PersonRef | null;
  created_by: PersonRef;
  created_at: string;
  due_date: string;
  completed_at?: string;
  estimated_hours: number;
  actual_hours: number | null;
  parts_needed: string[];
  notes: WorkOrderNote[];
}

// ============ ALERT ============

export interface Alert {
  id: number;
  type: string;
  severity: string;
  machine_id: number;
  machine_name: string;
  asset_id: string;
  title: string;
  message: string;
  created_at: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

// ============ DASHBOARD ============

export interface DashboardStats {
  total_assets: number;
  healthy: number;
  warning: number;
  critical: number;
  active_work_orders: number;
  predicted_failures: number;
  uptime_percentage: number;
  mtbf: number;
  mttr: number;
}

export interface HealthDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface FailureTrendItem {
  label: string;
  probability: number;
}

export interface SensorTrendItem {
  time: string;
  temperature: number;
  vibration: number;
  pressure: number;
}

export interface AIInsight {
  id: number;
  machine_id: number;
  machine_name: string;
  asset_id: string;
  insight: string;
  severity: string;
  confidence: number;
}

// ============ MAINTENANCE ============

export interface MaintenanceEvent {
  date: string;
  type: string;
  count: number;
}

// ============ NOTIFICATIONS ============

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ============ REPORTS ============

export interface TechnicianPerformance {
  name: string;
  completed: number;
  avg_time: number;
  rating: number;
}

export interface ReportsData {
  downtime_reduction: number;
  prediction_accuracy: number;
  cost_savings: number;
  preventive_vs_reactive: { preventive: number; reactive: number };
  monthly_downtime: { month: string; hours: number }[];
  technician_performance: TechnicianPerformance[];
}

// ============ ACCESS REQUESTS ============

export interface AccessRequest {
  id: number;
  company_name: string;
  industry: string;
  contact_person: string;
  email: string;
  phone: string;
  service_type: string[];
  status: string;
  created_at: string;
}

// ============ DROPDOWNS ============

export interface SelectOption {
  value: string;
  label: string;
}
