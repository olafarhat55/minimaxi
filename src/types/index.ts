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
  severity: string;
  confidenceScore: number;
  rulCycles: number;
  ttfHours: number;
  explanation: string;
  problemSensor: string | null;
  currentValue: number | null;
  normalMin: number | null;
  normalMax: number | null;
  modelAccuracy: number | null;
  modelF1Score: number | null;
}

export interface MachineIssue {
  id?: number;
  date?: string;
  created_at?: string;
  failure_type?: string;
  type?: string;
  resolution?: string;
  downtime?: string;
}

export interface MachineNote {
  id?: number;
  work_order_id?: number;
  work_order_title?: string;
  action_taken?: string;
  root_cause?: string;
  additional_notes?: string;
  time_spent_minutes?: number;
  completed_at?: string;
  // fallback fields
  author?: string;
  created_by?: string;
  created_at?: string;
  date?: string;
  content?: string;
  text?: string;
  note?: string;
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
  // Gateway / data-source fields
  gatewayUrl?: string | null;
  pollingIntervalSeconds?: number | null;
  // Optional embedded data (may come from backend or separate endpoints)
  issues?: MachineIssue[];
  work_orders?: WorkOrder[];
  notes?: MachineNote[];
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

export interface SparePart {
  name: string;
  quantity: number;
  cost: number;
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
  isRated?: boolean;
  is_rated?: boolean;
    action_taken?: string;
  root_cause?: string;
  additional_notes?: string;
  hours_spent?: number;
  minutes_spent?: number;
  spare_parts?: SparePart[];
}

export interface WorkOrderFilters {
  status?: string;
  priority?: string;
  assigned_to?: number;
}

// ============ ALERT ============

export interface Alert {
  id: number;
  type: string;
  severity: string;
  machine_id: number;
  machine_name: string | null;
  asset_id: string | null;
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
  // optional structured fields from backend
  sensorName?: string | null;
  currentValue?: number | null;
  normalMin?: number | null;
  normalMax?: number | null;
  issueType?: string | null;
  urgency?: string | null;
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
  user_id?: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  severity?: string;
  machine_id?: number | null;
  machine_name?: string | null;
  work_order_id?: number | null;
}

// ============ REPORTS ============

export interface MonthlyDowntime {
  month: string;
  hours?: number;         // legacy field — kept for backward compat
  before_hours?: number;  // new
  after_hours?: number;   // new
}

export interface MonthlyCost {
  month: string;
  before: number;
  after: number;
}

export interface AccuracyTrend {
  month: string;
  accuracy: number;
}

export interface TechnicianPerformance {
  name: string;
  completed: number;
  avg_time: number;
  rating: number;
  total_hours?: number;  // new
  success_rate?: number; // new — number 0–100
}

export interface ReportsData {
  downtime_reduction: number;
  prediction_accuracy: number;
  cost_savings: number;
  preventive_vs_reactive: { preventive: number; reactive: number };
  monthly_downtime: MonthlyDowntime[];
  monthly_cost: MonthlyCost[];
  accuracy_trend: AccuracyTrend[];
  technician_performance: TechnicianPerformance[];
  mttr_mtbf?: MttrMtbf;
  top_problem_machines?: TopProblemMachine[];
  top_spare_parts?: TopSparePart[];
}

// ============ REPORTS — NEW SECTIONS ============

export interface MttrMtbf {
  mttr_hours: number;
  mtbf_hours: number;
}

export interface TopProblemMachine {
  machine_id: number;
  machine_name: string;
  work_order_count: number;
  downtime_hours: number;
  score: number; // 0-100, للترتيب/الـ progress bar بس — متعرضوش الرقم الخام
}

export interface TopSparePart {
  name: string;
  usage_count: number;
  total_cost: number; // بالـ $ كامل، مش $K
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

// ============ SETTINGS ============

export interface AssetTypeSetting {
  id: number;
  name: string;
  description: string;
  industry?: string;
  organizationId?: number;
}

export interface SensorThresholdSetting {
  id: number;
  assetTypeId: number;
  sensorTypeId: number;
  warningValue: number;
  criticalValue: number;
  organizationId?: number;
}

export interface AIModelSettings {
  name: string;
  type: string;
  status: string;
  lastTraining: string;
  nextTraining: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  trainingHistory: Array<{
    date: string;
    duration: string;
    accuracy: number;
    status: string;
  }>;
}