import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  InputAdornment,
  LinearProgress,
  Slider,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  CheckCircle as CheckIcon,
  Refresh as RetrainIcon,
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  FileDownload as DownloadIcon,
  Visibility as ViewIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';
import { timezones, languages } from '../../data/mockData';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssetType {
  id: number;
  name: string;
  description: string;
  active: boolean;
  maintenanceInterval: number;
}

interface SensorThreshold {
  id: number;
  name: string;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
  canOverride: boolean;
  description: string;
}

interface AIModelInfo {
  name: string;
  type: string;
  status: string;
  lastTraining: string;
  nextTraining: string;
  metrics: { accuracy: number; precision: number; recall: number; f1Score: number };
  trainingHistory: Array<{ date: string; duration: string; accuracy: number; status: string }>;
}

interface TrainingLog {
  id: string;
  date: string;
  duration: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  status: 'Success' | 'Failed';
  details: string;
  datasetSize: number;
  parameters: Record<string, string | number>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { value: 'manufacturing',  label: 'Manufacturing'  },
  { value: 'transportation', label: 'Transportation' },
  { value: 'energy',         label: 'Energy'         },
  { value: 'healthcare',     label: 'Healthcare'     },
  { value: 'oil_gas',        label: 'Oil & Gas'      },
  { value: 'mining',         label: 'Mining'         },
  { value: 'utilities',      label: 'Utilities'      },
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const BLANK_ASSET: Omit<AssetType, 'id'> = {
  name: '', description: '', active: true, maintenanceInterval: 90,
};

const BLANK_SENSOR: Omit<SensorThreshold, 'id'> = {
  name: '', unit: '', warningThreshold: 0, criticalThreshold: 0, canOverride: true, description: '',
};

const TRAINING_LOGS: TrainingLog[] = [
  {
    id: 'TRN-015', date: '2026-01-12 10:30', duration: '2h 15m',
    accuracy: 92, precision: 90, recall: 88, f1Score: 89, status: 'Success',
    details: 'Model trained on 5,200 data points. Improved failure prediction accuracy by 2%. No anomalies detected during training run.',
    datasetSize: 5200,
    parameters: { 'N Estimators': 200, 'Max Depth': 15, 'Min Samples Split': 2, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-014', date: '2025-12-12 09:45', duration: '2h 10m',
    accuracy: 90, precision: 88, recall: 86, f1Score: 87, status: 'Success',
    details: 'Regular monthly training. Added 500 new maintenance records from November operational data.',
    datasetSize: 4900,
    parameters: { 'N Estimators': 180, 'Max Depth': 14, 'Min Samples Split': 2, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-013', date: '2025-11-12 11:20', duration: '2h 20m',
    accuracy: 88, precision: 86, recall: 84, f1Score: 85, status: 'Success',
    details: 'Training after system upgrade. Performance stable. Dataset expanded with October operational records.',
    datasetSize: 4600,
    parameters: { 'N Estimators': 175, 'Max Depth': 14, 'Min Samples Split': 2, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-012', date: '2025-10-12 08:00', duration: '2h 18m',
    accuracy: 86, precision: 84, recall: 82, f1Score: 83, status: 'Success',
    details: 'Scheduled monthly training. Incorporated Q3 sensor calibration data. Convergence achieved at epoch 42.',
    datasetSize: 4350,
    parameters: { 'N Estimators': 170, 'Max Depth': 13, 'Min Samples Split': 3, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-011', date: '2025-09-12 10:00', duration: '2h 25m',
    accuracy: 85, precision: 83, recall: 81, f1Score: 82, status: 'Success',
    details: 'End of Q3 training cycle. Incorporated data from 3 new assets added this quarter.',
    datasetSize: 4100,
    parameters: { 'N Estimators': 165, 'Max Depth': 13, 'Min Samples Split': 3, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-010', date: '2025-08-12 09:30', duration: '2h 30m',
    accuracy: 87, precision: 85, recall: 83, f1Score: 84, status: 'Success',
    details: 'Improved accuracy following hyperparameter tuning. N estimators increased to 160 for better ensemble coverage.',
    datasetSize: 3900,
    parameters: { 'N Estimators': 160, 'Max Depth': 12, 'Min Samples Split': 3, 'Learning Rate': 0.12 },
  },
  {
    id: 'TRN-009', date: '2025-07-12 11:00', duration: '2h 05m',
    accuracy: 84, precision: 82, recall: 80, f1Score: 81, status: 'Success',
    details: 'Fastest training session this year. Dataset was pre-processed and cached from previous run.',
    datasetSize: 3700,
    parameters: { 'N Estimators': 155, 'Max Depth': 12, 'Min Samples Split': 3, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-008', date: '2025-06-12 10:15', duration: '1h 55m',
    accuracy: 83, precision: 81, recall: 79, f1Score: 80, status: 'Success',
    details: 'Lightweight training run. Dataset limited to most recent 6 months for faster processing and reduced noise.',
    datasetSize: 3450,
    parameters: { 'N Estimators': 150, 'Max Depth': 11, 'Min Samples Split': 4, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-007', date: '2025-05-12 14:30', duration: '3h 10m',
    accuracy: 81, precision: 79, recall: 77, f1Score: 78, status: 'Failed',
    details: 'Training failed due to data quality issues in April sensor readings. Run aborted at 78% completion. Missing values detected in temperature sensors on Lines B and C. Retry scheduled.',
    datasetSize: 3200,
    parameters: { 'N Estimators': 150, 'Max Depth': 11, 'Min Samples Split': 4, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-006', date: '2025-05-15 09:00', duration: '2h 45m',
    accuracy: 82, precision: 80, recall: 78, f1Score: 79, status: 'Success',
    details: 'Retry after data cleaning. April sensor anomalies removed. Imputation applied to 143 missing readings. Training completed successfully.',
    datasetSize: 3100,
    parameters: { 'N Estimators': 150, 'Max Depth': 11, 'Min Samples Split': 4, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-005', date: '2025-04-12 10:00', duration: '2h 00m',
    accuracy: 80, precision: 78, recall: 76, f1Score: 77, status: 'Success',
    details: 'Regular Q2 training. Good convergence. Stable performance metrics across all asset categories.',
    datasetSize: 2900,
    parameters: { 'N Estimators': 140, 'Max Depth': 11, 'Min Samples Split': 4, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-004', date: '2025-03-12 09:00', duration: '2h 15m',
    accuracy: 79, precision: 77, recall: 75, f1Score: 76, status: 'Success',
    details: 'End of Q1 training. Dataset enriched with winter operational data. Cold weather patterns added to feature set.',
    datasetSize: 2700,
    parameters: { 'N Estimators': 130, 'Max Depth': 10, 'Min Samples Split': 5, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-003', date: '2025-02-12 10:30', duration: '2h 10m',
    accuracy: 77, precision: 75, recall: 73, f1Score: 74, status: 'Success',
    details: 'Mid-Q1 training cycle. Stable performance, no major changes from previous run.',
    datasetSize: 2500,
    parameters: { 'N Estimators': 120, 'Max Depth': 10, 'Min Samples Split': 5, 'Learning Rate': 0.1 },
  },
  {
    id: 'TRN-002', date: '2025-01-12 11:00', duration: '2h 20m',
    accuracy: 75, precision: 73, recall: 71, f1Score: 72, status: 'Success',
    details: 'First training of 2025. Baseline model updated with new year operational data.',
    datasetSize: 2300,
    parameters: { 'N Estimators': 110, 'Max Depth': 10, 'Min Samples Split': 5, 'Learning Rate': 0.08 },
  },
  {
    id: 'TRN-001', date: '2024-12-12 09:30', duration: '2h 30m',
    accuracy: 73, precision: 71, recall: 69, f1Score: 70, status: 'Success',
    details: 'Initial model training. Baseline established from first full year of operational data.',
    datasetSize: 2000,
    parameters: { 'N Estimators': 100, 'Max Depth': 10, 'Min Samples Split': 5, 'Learning Rate': 0.08 },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const Settings = () => {
  const { isDark } = useThemeMode();

  // ── Shared state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState(0);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [snackbar, setSnackbar]     = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // ── Tab 1: General ──────────────────────────────────────────────────────────
  const [company, setCompany] = useState({
    name: '', industry: 'manufacturing', timezone: 'Africa/Cairo',
    dateFormat: 'DD/MM/YYYY', language: 'en',
  });

  // ── Tab 2: Asset Types ──────────────────────────────────────────────────────
  const [assetTypes, setAssetTypes]   = useState<AssetType[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetModal, setAssetModal]   = useState({ open: false, editing: null as AssetType | null });
  const [assetForm, setAssetForm]     = useState<Omit<AssetType, 'id'>>(BLANK_ASSET);
  const [assetErrors, setAssetErrors] = useState<Record<string, string>>({});

  // ── Tab 3: Sensor Thresholds ────────────────────────────────────────────────
  const [sensors, setSensors]           = useState<SensorThreshold[]>([]);
  const [sensorSearch, setSensorSearch] = useState('');
  const [sensorModal, setSensorModal]   = useState({ open: false, editing: null as SensorThreshold | null });
  const [sensorForm, setSensorForm]     = useState<Omit<SensorThreshold, 'id'>>(BLANK_SENSOR);
  const [sensorErrors, setSensorErrors] = useState<Record<string, string>>({});

  // ── Tab 4: AI Model ─────────────────────────────────────────────────────────
  const [aiModel, setAiModel]           = useState<AIModelInfo | null>(null);
  const [retrainDialog, setRetrainDialog] = useState(false);
  const [retraining, setRetraining]     = useState(false);
  const [modelStatus, setModelStatus]   = useState<'active' | 'training'>('active');
  const [advancedSettings, setAdvancedSettings] = useState({
    predictionWindow: 14, confidenceThreshold: 80, autoRetrain: true, retrainFrequency: 'monthly',
  });

  // ── Schedule Training ────────────────────────────────────────────────────────
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    date: '', time: '10:00', recurrence: 'one-time', notify: true, notes: '',
  });
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({});
  const [scheduling, setScheduling] = useState(false);

  // ── Training Logs ────────────────────────────────────────────────────────────
  const [logsDialog, setLogsDialog]     = useState(false);
  const [logsSearch, setLogsSearch]     = useState('');
  const [logsPage, setLogsPage]         = useState(0);
  const [logsSortBy, setLogsSortBy]     = useState('date');
  const [logsSortDir, setLogsSortDir]   = useState<'asc' | 'desc'>('desc');
  const [detailsDialog, setDetailsDialog] = useState<TrainingLog | null>(null);

  // ── Shared delete dialog ────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState({
    open: false, id: 0, name: '', type: '' as 'asset' | 'sensor',
  });

  // ── Load all data on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [companyData, assetData, sensorData, aiData] = await Promise.all([
          api.getCompanySettings(),
          api.getAssetTypes(),
          api.getSensorThresholds(),
          api.getAIModelInfo(),
        ]);
        setCompany({
          name:       companyData.name        || '',
          industry:   (companyData as any).industry   || 'manufacturing',
          timezone:   companyData.timezone    || 'Africa/Cairo',
          dateFormat: (companyData as any).dateFormat || 'DD/MM/YYYY',
          language:   companyData.language    || 'en',
        });
        setAssetTypes(assetData);
        setSensors(sensorData);
        setAiModel(aiData);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const tableHeaderSx = {
    bgcolor: isDark ? '#283444' : '#f5f5f5',
    '& th': {
      color: isDark ? '#e5e5e5' : 'inherit',
      fontWeight: 600,
      fontSize: '0.875rem',
      borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
    },
  };

  const innerPaperSx = {
    bgcolor: isDark ? '#283444' : '#f8fafc',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    borderRadius: 2,
  };

  const rowSx = {
    '&:last-child td': { border: 0 },
    '& td': { borderBottom: isDark ? '1px solid #334155' : '1px solid #f1f5f9' },
  };

  const statusChipSx = (status: string) => {
    if (status === 'Success') return { bgcolor: isDark ? '#0d2818' : '#dcfce7', color: '#16a34a', fontWeight: 600 };
    if (status === 'Failed')  return { bgcolor: isDark ? '#2d0f0f' : '#fee2e2', color: '#dc2626', fontWeight: 600 };
    return { bgcolor: isDark ? '#1a2540' : '#dbeafe', color: '#2563eb', fontWeight: 600 };
  };

  // ── Tab 1: General Settings handlers ─────────────────────────────────────────
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompany((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveCompany = async () => {
    setSaving(true);
    try {
      await api.updateCompanySettings(company);
      showSnackbar('Company settings saved successfully');
    } catch {
      showSnackbar('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Tab 2: Asset Types handlers ───────────────────────────────────────────────
  const filteredAssets = assetTypes.filter(
    (a) => !assetSearch || a.name.toLowerCase().includes(assetSearch.toLowerCase()),
  );

  const openAddAsset = () => {
    setAssetForm(BLANK_ASSET);
    setAssetErrors({});
    setAssetModal({ open: true, editing: null });
  };

  const openEditAsset = (item: AssetType) => {
    setAssetForm({ name: item.name, description: item.description, active: item.active, maintenanceInterval: item.maintenanceInterval });
    setAssetErrors({});
    setAssetModal({ open: true, editing: item });
  };

  const validateAsset = () => {
    const errors: Record<string, string> = {};
    if (!assetForm.name.trim()) {
      errors.name = 'Asset type name is required';
    } else if (assetTypes.some(
      (a) => a.name.toLowerCase() === assetForm.name.trim().toLowerCase() && a.id !== assetModal.editing?.id,
    )) {
      errors.name = 'An asset type with this name already exists';
    }
    setAssetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAsset = async () => {
    if (!validateAsset()) return;
    setSaving(true);
    try {
      if (assetModal.editing) {
        const updated = await api.updateAssetType(assetModal.editing.id, assetForm);
        setAssetTypes((prev) => prev.map((a) => a.id === assetModal.editing!.id ? updated : a));
        showSnackbar('Asset type updated successfully');
      } else {
        const created = await api.createAssetType(assetForm);
        setAssetTypes((prev) => [...prev, created]);
        showSnackbar('Asset type added successfully');
      }
      setAssetModal({ open: false, editing: null });
    } catch {
      showSnackbar('Failed to save asset type', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAsset = async (item: AssetType) => {
    try {
      await api.updateAssetType(item.id, { active: !item.active });
      setAssetTypes((prev) => prev.map((a) => a.id === item.id ? { ...a, active: !a.active } : a));
    } catch {
      showSnackbar('Failed to update status', 'error');
    }
  };

  // ── Tab 3: Sensor Threshold handlers ─────────────────────────────────────────
  const filteredSensors = sensors.filter(
    (s) => !sensorSearch || s.name.toLowerCase().includes(sensorSearch.toLowerCase()),
  );

  const openAddSensor = () => {
    setSensorForm(BLANK_SENSOR);
    setSensorErrors({});
    setSensorModal({ open: true, editing: null });
  };

  const openEditSensor = (item: SensorThreshold) => {
    setSensorForm({
      name: item.name, unit: item.unit,
      warningThreshold: item.warningThreshold, criticalThreshold: item.criticalThreshold,
      canOverride: item.canOverride, description: item.description,
    });
    setSensorErrors({});
    setSensorModal({ open: true, editing: item });
  };

  const validateSensor = () => {
    const errors: Record<string, string> = {};
    if (!sensorForm.name.trim())  errors.name = 'Sensor name is required';
    if (!sensorForm.unit.trim())  errors.unit = 'Unit is required';
    if (sensorForm.warningThreshold === '' as unknown as number || isNaN(Number(sensorForm.warningThreshold))) {
      errors.warningThreshold = 'Warning threshold is required';
    }
    if (sensorForm.criticalThreshold === '' as unknown as number || isNaN(Number(sensorForm.criticalThreshold))) {
      errors.criticalThreshold = 'Critical threshold is required';
    } else if (Number(sensorForm.criticalThreshold) <= Number(sensorForm.warningThreshold)) {
      errors.criticalThreshold = 'Critical threshold must be greater than warning threshold';
    }
    if (sensors.some(
      (s) => s.name.toLowerCase() === sensorForm.name.trim().toLowerCase() && s.id !== sensorModal.editing?.id,
    )) {
      errors.name = 'A sensor with this name already exists';
    }
    setSensorErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSensor = async () => {
    if (!validateSensor()) return;
    setSaving(true);
    try {
      const payload = {
        ...sensorForm,
        warningThreshold:  Number(sensorForm.warningThreshold),
        criticalThreshold: Number(sensorForm.criticalThreshold),
      };
      if (sensorModal.editing) {
        const updated = await api.updateSensorThreshold(sensorModal.editing.id, payload);
        setSensors((prev) => prev.map((s) => s.id === sensorModal.editing!.id ? updated : s));
        showSnackbar('Sensor threshold updated successfully');
      } else {
        const created = await api.createSensorThreshold(payload);
        setSensors((prev) => [...prev, created]);
        showSnackbar('Sensor type added successfully');
      }
      setSensorModal({ open: false, editing: null });
    } catch {
      showSnackbar('Failed to save sensor threshold', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Shared delete handler ────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      if (deleteDialog.type === 'asset') {
        await api.deleteAssetType(deleteDialog.id);
        setAssetTypes((prev) => prev.filter((a) => a.id !== deleteDialog.id));
        showSnackbar('Asset type deleted');
      } else {
        await api.deleteSensorThreshold(deleteDialog.id);
        setSensors((prev) => prev.filter((s) => s.id !== deleteDialog.id));
        showSnackbar('Sensor type deleted');
      }
      setDeleteDialog({ open: false, id: 0, name: '', type: 'asset' });
    } catch {
      showSnackbar('Failed to delete item', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Tab 4: AI Model handlers ──────────────────────────────────────────────────
  const handleRetrain = async () => {
    setRetrainDialog(false);
    setRetraining(true);
    setModelStatus('training');
    try {
      await api.retrainAIModel();
      showSnackbar('Model retraining started successfully. You will be notified when complete.');
      // Simulate training completion after 5 seconds
      setTimeout(() => {
        setRetraining(false);
        setModelStatus('active');
        setAiModel((prev) => prev ? {
          ...prev,
          metrics: { accuracy: 93, precision: 91, recall: 89, f1Score: 90 },
          lastTraining: '18 Feb 2026',
          nextTraining: '18 Mar 2026',
        } : prev);
        showSnackbar('Model training completed! New accuracy: 93%');
      }, 5000);
    } catch {
      showSnackbar('Failed to start model retraining', 'error');
      setRetraining(false);
      setModelStatus('active');
    }
  };

  const handleSaveAdvanced = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    showSnackbar('Advanced settings saved');
  };

  // ── Schedule Training handlers ────────────────────────────────────────────────
  const validateSchedule = (): boolean => {
    const errors: Record<string, string> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    if (!scheduleForm.date) {
      errors.date = 'Please select a training date';
    } else if (scheduleForm.date <= todayStr) {
      errors.date = 'Training date must be in the future';
    }
    setScheduleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleSubmit = async () => {
    if (!validateSchedule()) return;
    setScheduling(true);
    try {
      await api.scheduleTraining(scheduleForm as unknown as Record<string, unknown>);
      const displayDate = new Date(scheduleForm.date + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      showSnackbar(`Training scheduled successfully for ${displayDate}`);
      setScheduleDialog(false);
      setScheduleForm({ date: '', time: '10:00', recurrence: 'one-time', notify: true, notes: '' });
      setScheduleErrors({});
    } catch {
      showSnackbar('Failed to schedule training', 'error');
    } finally {
      setScheduling(false);
    }
  };

  // ── Training Logs handlers ────────────────────────────────────────────────────
  const handleLogsSort = (col: string) => {
    if (logsSortBy === col) {
      setLogsSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setLogsSortBy(col);
      setLogsSortDir('desc');
    }
  };

  const handleExportLogs = () => {
    const headers = ['Training ID', 'Date & Time', 'Duration', 'Accuracy (%)', 'Precision (%)', 'Recall (%)', 'F1-Score (%)', 'Status'];
    const rows = TRAINING_LOGS.map((l) => [
      l.id, l.date, l.duration, l.accuracy, l.precision, l.recall, l.f1Score, l.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Computed: filtered / sorted / paginated logs ──────────────────────────────
  const filteredLogs = TRAINING_LOGS.filter(
    (l) =>
      !logsSearch ||
      l.id.toLowerCase().includes(logsSearch.toLowerCase()) ||
      l.date.includes(logsSearch) ||
      l.status.toLowerCase().includes(logsSearch.toLowerCase()),
  );

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const dir = logsSortDir === 'asc' ? 1 : -1;
    switch (logsSortBy) {
      case 'date':      return dir * a.date.localeCompare(b.date);
      case 'accuracy':  return dir * (a.accuracy  - b.accuracy);
      case 'precision': return dir * (a.precision - b.precision);
      case 'recall':    return dir * (a.recall    - b.recall);
      case 'f1Score':   return dir * (a.f1Score   - b.f1Score);
      default:          return 0;
    }
  });

  const pagedLogs = sortedLogs.slice(logsPage * 10, logsPage * 10 + 10);

  // ── Logs summary stats ────────────────────────────────────────────────────────
  const logSuccessCount = TRAINING_LOGS.filter((l) => l.status === 'Success').length;
  const logSuccessRate  = Math.round((logSuccessCount / TRAINING_LOGS.length) * 100);
  const latestAccuracy  = TRAINING_LOGS[0].accuracy;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        System Settings
      </Typography>

      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          bgcolor: isDark ? '#1e293b' : '#fff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_e, v: number) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="General Settings" />
          <Tab label="Asset Types" />
          <Tab label="Sensors & Thresholds" />
          <Tab label="AI Model" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>

          {/* ═══════════════════════════════════════════════════════════
              TAB 0 — GENERAL SETTINGS
          ═══════════════════════════════════════════════════════════ */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" fontWeight={600}>Company Information</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                Configure your organisation's basic information and regional preferences.
              </Typography>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="name"
                    value={company.name}
                    onChange={handleCompanyChange}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth
                    label="Industry"
                    name="industry"
                    value={company.industry}
                    onChange={handleCompanyChange}
                  >
                    {INDUSTRIES.map((i) => (
                      <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth
                    label="Timezone"
                    name="timezone"
                    value={company.timezone}
                    onChange={handleCompanyChange}
                  >
                    {timezones.map((tz) => (
                      <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth
                    label="Date Format"
                    name="dateFormat"
                    value={company.dateFormat}
                    onChange={handleCompanyChange}
                  >
                    {DATE_FORMATS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth
                    label="Language"
                    name="language"
                    value={company.language}
                    onChange={handleCompanyChange}
                  >
                    {languages.map((l) => (
                      <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveCompany}
                  disabled={saving}
                >
                  Save Changes
                </Button>
              </Box>
            </Box>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 1 — ASSET TYPES
          ═══════════════════════════════════════════════════════════ */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Asset Types</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Define the types of assets and machines in your facility.
                  </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddAsset}>
                  Add Asset Type
                </Button>
              </Box>

              <TextField
                size="small"
                placeholder="Search asset types…"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2, width: 280 }}
              />

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 2 }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={tableHeaderSx}>
                      <TableCell>Asset Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Maintenance Interval</TableCell>
                      <TableCell align="center">Active</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAssets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No asset types found.
                        </TableCell>
                      </TableRow>
                    ) : filteredAssets.map((item) => (
                      <TableRow key={item.id} sx={rowSx}>
                        <TableCell><Typography fontWeight={600}>{item.name}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                        </TableCell>
                        <TableCell align="center">{item.maintenanceInterval} days</TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={item.active}
                            size="small"
                            color="success"
                            onChange={() => handleToggleAsset(item)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditAsset(item)} sx={{ mr: 0.5 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, id: item.id, name: item.name, type: 'asset' })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 2 — SENSORS & THRESHOLDS
          ═══════════════════════════════════════════════════════════ */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>Sensors & Thresholds</Typography>
                    <Tooltip title="These are system-wide default values. Thresholds marked 'Can Override' can be customised per asset.">
                      <HelpIcon fontSize="small" sx={{ color: 'text.secondary', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Configure sensor types and their default threshold values.
                  </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddSensor}>
                  Add Sensor Type
                </Button>
              </Box>

              <TextField
                size="small"
                placeholder="Search sensors…"
                value={sensorSearch}
                onChange={(e) => setSensorSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2, width: 280 }}
              />

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 2 }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={tableHeaderSx}>
                      <TableCell>Sensor Type</TableCell>
                      <TableCell align="center">Unit</TableCell>
                      <TableCell align="center">Default Warning</TableCell>
                      <TableCell align="center">Default Critical</TableCell>
                      <TableCell align="center">Can Override</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSensors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No sensor types found.
                        </TableCell>
                      </TableRow>
                    ) : filteredSensors.map((item) => (
                      <TableRow key={item.id} sx={rowSx}>
                        <TableCell>
                          <Typography fontWeight={600}>{item.name}</Typography>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.unit} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.warningThreshold}
                            size="small"
                            sx={{ bgcolor: isDark ? '#2d1f0a' : '#fff3e0', color: '#f59e0b', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={item.criticalThreshold}
                            size="small"
                            sx={{ bgcolor: isDark ? '#2d0f0f' : '#fee2e2', color: '#dc2626', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {item.canOverride
                            ? <CheckIcon fontSize="small" sx={{ color: '#22c55e' }} />
                            : <Typography variant="body2" color="text.secondary">—</Typography>
                          }
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEditSensor(item)} sx={{ mr: 0.5 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, id: item.id, name: item.name, type: 'sensor' })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 3 — AI MODEL CONFIGURATION
          ═══════════════════════════════════════════════════════════ */}
          {activeTab === 3 && aiModel && (
            <Box>

              {/* Model Info + Metrics */}
              <Paper elevation={0} sx={{ ...innerPaperSx, p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>{aiModel.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {aiModel.type}
                    </Typography>
                  </Box>
                  {/* Dynamic status badge */}
                  <Chip
                    icon={
                      modelStatus === 'active'
                        ? <CheckIcon sx={{ fontSize: '0.9rem !important' }} />
                        : <CircularProgress size={12} sx={{ color: '#f59e0b !important' }} />
                    }
                    label={modelStatus === 'active' ? 'Active' : 'Training'}
                    size="small"
                    sx={
                      modelStatus === 'active'
                        ? { bgcolor: isDark ? '#0d2818' : '#dcfce7', color: '#16a34a', fontWeight: 600 }
                        : { bgcolor: isDark ? '#2d1f0a' : '#fff3e0', color: '#f59e0b', fontWeight: 600 }
                    }
                  />
                </Box>

                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Last Training Date</Typography>
                    <Typography fontWeight={500}>{aiModel.lastTraining}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">Next Scheduled Training</Typography>
                    <Typography fontWeight={500}>{aiModel.nextTraining}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2.5 }} />

                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                  Performance Metrics
                </Typography>
                <Grid container spacing={3}>
                  {[
                    { label: 'Accuracy',  value: aiModel.metrics.accuracy,  color: '#22c55e' },
                    { label: 'Precision', value: aiModel.metrics.precision, color: '#3b82f6' },
                    { label: 'Recall',    value: aiModel.metrics.recall,    color: '#f59e0b' },
                    { label: 'F1-Score',  value: aiModel.metrics.f1Score,   color: '#a855f7' },
                  ].map((m) => (
                    <Grid key={m.label} size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2">{m.label}</Typography>
                        <Typography variant="body2" fontWeight={700}>{m.value}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={m.value}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: isDark ? '#334155' : '#e2e8f0',
                          '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 4 },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={retraining ? <CircularProgress size={16} color="inherit" /> : <RetrainIcon />}
                    onClick={() => setRetrainDialog(true)}
                    disabled={retraining}
                  >
                    {retraining ? 'Retraining…' : 'Retrain Model Now'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ScheduleIcon />}
                    onClick={() => setScheduleDialog(true)}
                  >
                    Schedule Training
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<HistoryIcon />}
                    onClick={() => { setLogsSearch(''); setLogsPage(0); setLogsDialog(true); }}
                  >
                    View Training Logs
                  </Button>
                </Box>

                {/* Progress bar shown while retraining */}
                {retraining && (
                  <Box sx={{ mt: 2.5 }}>
                    <LinearProgress sx={{ borderRadius: 1, height: 6 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Retraining in progress. This may take several hours…
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Training History */}
              <Paper elevation={0} sx={{ ...innerPaperSx, p: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                  Training History
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={tableHeaderSx}>
                        <TableCell>Date</TableCell>
                        <TableCell align="center">Duration</TableCell>
                        <TableCell align="center">Accuracy</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {aiModel.trainingHistory.map((h, i) => (
                        <TableRow key={i} sx={rowSx}>
                          <TableCell>{h.date}</TableCell>
                          <TableCell align="center">{h.duration}</TableCell>
                          <TableCell align="center">
                            <Typography fontWeight={600} color="#22c55e">{h.accuracy}%</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={h.status}
                              size="small"
                              sx={statusChipSx(h.status)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Advanced Settings */}
              <Accordion
                elevation={0}
                sx={{
                  bgcolor: isDark ? '#283444' : '#f8fafc',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: '8px !important',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600}>Advanced Settings</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select fullWidth
                        label="Prediction Window"
                        value={advancedSettings.predictionWindow}
                        onChange={(e) =>
                          setAdvancedSettings((p) => ({ ...p, predictionWindow: Number(e.target.value) }))
                        }
                      >
                        <MenuItem value={7}>7 days</MenuItem>
                        <MenuItem value={14}>14 days</MenuItem>
                        <MenuItem value={30}>30 days</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select fullWidth
                        label="Auto-Retrain Frequency"
                        value={advancedSettings.retrainFrequency}
                        disabled={!advancedSettings.autoRetrain}
                        onChange={(e) =>
                          setAdvancedSettings((p) => ({ ...p, retrainFrequency: e.target.value }))
                        }
                      >
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Confidence Threshold
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {advancedSettings.confidenceThreshold}%
                        </Typography>
                      </Box>
                      <Slider
                        value={advancedSettings.confidenceThreshold}
                        min={50}
                        max={99}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v}%`}
                        onChange={(_e, val) =>
                          setAdvancedSettings((p) => ({ ...p, confidenceThreshold: val as number }))
                        }
                        sx={{ color: '#3b82f6' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Alerts are only raised when AI confidence exceeds this threshold.
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={advancedSettings.autoRetrain}
                            color="primary"
                            onChange={(_, checked) =>
                              setAdvancedSettings((p) => ({ ...p, autoRetrain: checked }))
                            }
                          />
                        }
                        label="Enable automatic model retraining"
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveAdvanced}
                      disabled={saving}
                    >
                      Save Advanced Settings
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

            </Box>
          )}

        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: Add / Edit Asset Type
      ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={assetModal.open}
        onClose={() => setAssetModal({ open: false, editing: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{assetModal.editing ? 'Edit Asset Type' : 'Add Asset Type'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Asset Type Name *"
                value={assetForm.name}
                onChange={(e) => setAssetForm((p) => ({ ...p, name: e.target.value }))}
                error={!!assetErrors.name}
                helperText={assetErrors.name}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={assetForm.description}
                onChange={(e) => setAssetForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Maintenance Interval (days)"
                value={assetForm.maintenanceInterval}
                inputProps={{ min: 1 }}
                onChange={(e) => setAssetForm((p) => ({ ...p, maintenanceInterval: Number(e.target.value) }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assetForm.active}
                    color="success"
                    onChange={(_, checked) => setAssetForm((p) => ({ ...p, active: checked }))}
                  />
                }
                label="Active"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAssetModal({ open: false, editing: null })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveAsset}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {assetModal.editing ? 'Save Changes' : 'Add Asset Type'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: Add / Edit Sensor Threshold
      ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={sensorModal.open}
        onClose={() => setSensorModal({ open: false, editing: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{sensorModal.editing ? 'Edit Sensor Type' : 'Add Sensor Type'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Sensor Name *"
                value={sensorForm.name}
                onChange={(e) => setSensorForm((p) => ({ ...p, name: e.target.value }))}
                error={!!sensorErrors.name}
                helperText={sensorErrors.name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Unit *"
                placeholder="e.g. °C, mm/s, BAR"
                value={sensorForm.unit}
                onChange={(e) => setSensorForm((p) => ({ ...p, unit: e.target.value }))}
                error={!!sensorErrors.unit}
                helperText={sensorErrors.unit}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Warning Threshold *"
                value={sensorForm.warningThreshold}
                onChange={(e) => setSensorForm((p) => ({ ...p, warningThreshold: Number(e.target.value) }))}
                error={!!sensorErrors.warningThreshold}
                helperText={sensorErrors.warningThreshold}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Default Critical Threshold *"
                value={sensorForm.criticalThreshold}
                onChange={(e) => setSensorForm((p) => ({ ...p, criticalThreshold: Number(e.target.value) }))}
                error={!!sensorErrors.criticalThreshold}
                helperText={sensorErrors.criticalThreshold}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={sensorForm.description}
                onChange={(e) => setSensorForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={sensorForm.canOverride}
                    color="primary"
                    onChange={(_, checked) => setSensorForm((p) => ({ ...p, canOverride: checked }))}
                  />
                }
                label="Allow per-asset threshold override"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSensorModal({ open: false, editing: null })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveSensor}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {sensorModal.editing ? 'Save Changes' : 'Add Sensor Type'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: Delete Confirmation
      ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: 0, name: '', type: 'asset' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.name}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteDialog({ open: false, id: 0, name: '', type: 'asset' })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: Retrain Confirmation
      ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={retrainDialog}
        onClose={() => setRetrainDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Model Retraining</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Model retraining will take approximately 2–3 hours and may temporarily affect prediction
            accuracy. The model will remain active during retraining.
            <br /><br />
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRetrainDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleRetrain}>
            Yes, Retrain Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: Schedule Training
      ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={scheduleDialog}
        onClose={() => { setScheduleDialog(false); setScheduleErrors({}); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Model Training</DialogTitle>
        <DialogContent>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Training Date *"
                value={scheduleForm.date}
                onChange={(e) => {
                  setScheduleForm((p) => ({ ...p, date: e.target.value }));
                  setScheduleErrors((p) => ({ ...p, date: '' }));
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                }}
                error={!!scheduleErrors.date}
                helperText={scheduleErrors.date}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="time"
                label="Training Time"
                value={scheduleForm.time}
                onChange={(e) => setScheduleForm((p) => ({ ...p, time: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Recurrence"
                value={scheduleForm.recurrence}
                onChange={(e) => setScheduleForm((p) => ({ ...p, recurrence: e.target.value }))}
              >
                <MenuItem value="one-time">One-time</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Additional Notes (optional)"
                placeholder="e.g. Include Q1 sensor data, focus on compressor assets…"
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={scheduleForm.notify}
                    color="primary"
                    onChange={(_, checked) => setScheduleForm((p) => ({ ...p, notify: checked }))}
                  />
                }
                label="Notify me when training completes"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setScheduleDialog(false); setScheduleErrors({}); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleScheduleSubmit}
            disabled={scheduling}
            startIcon={scheduling ? <CircularProgress size={16} color="inherit" /> : <ScheduleIcon />}
          >
            {scheduling ? 'Scheduling…' : 'Schedule Training'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: Training Logs (full-screen)
      ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={logsDialog}
        onClose={() => setLogsDialog(false)}
        fullScreen
        PaperProps={{
          sx: { bgcolor: isDark ? '#0f172a' : '#f8fafc' },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            bgcolor: isDark ? '#1e293b' : '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={() => setLogsDialog(false)} size="small">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>
              Training History &amp; Logs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportLogs}
            >
              Export All Logs
            </Button>
            <IconButton onClick={() => setLogsDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ p: 3, overflow: 'auto', flex: 1 }}>
          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Total Training Sessions', value: String(TRAINING_LOGS.length) },
              { label: 'Average Duration',         value: '2h 21m'                    },
              { label: 'Success Rate',             value: `${logSuccessRate}%`         },
              { label: 'Latest Accuracy',          value: `${latestAccuracy}%`         },
            ].map((stat) => (
              <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    borderRadius: 2,
                    bgcolor: isDark ? '#1e293b' : '#fff',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  }}
                >
                  <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Search */}
          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search by ID, date, or status…"
              value={logsSearch}
              onChange={(e) => { setLogsSearch(e.target.value); setLogsPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 320 }}
            />
          </Box>

          {/* Logs Table */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: 2 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={tableHeaderSx}>
                  <TableCell>Training ID</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={logsSortBy === 'date'}
                      direction={logsSortBy === 'date' ? logsSortDir : 'asc'}
                      onClick={() => handleLogsSort('date')}
                    >
                      Date &amp; Time
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Duration</TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={logsSortBy === 'accuracy'}
                      direction={logsSortBy === 'accuracy' ? logsSortDir : 'asc'}
                      onClick={() => handleLogsSort('accuracy')}
                    >
                      Accuracy (%)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={logsSortBy === 'precision'}
                      direction={logsSortBy === 'precision' ? logsSortDir : 'asc'}
                      onClick={() => handleLogsSort('precision')}
                    >
                      Precision (%)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={logsSortBy === 'recall'}
                      direction={logsSortBy === 'recall' ? logsSortDir : 'asc'}
                      onClick={() => handleLogsSort('recall')}
                    >
                      Recall (%)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">
                    <TableSortLabel
                      active={logsSortBy === 'f1Score'}
                      direction={logsSortBy === 'f1Score' ? logsSortDir : 'asc'}
                      onClick={() => handleLogsSort('f1Score')}
                    >
                      F1-Score (%)
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No training logs match your search.
                    </TableCell>
                  </TableRow>
                ) : pagedLogs.map((log) => (
                  <TableRow key={log.id} sx={rowSx}>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ fontFamily: 'monospace', color: isDark ? '#93c5fd' : '#2563eb' }}
                      >
                        {log.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell align="center">{log.duration}</TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700} color="#22c55e">
                        {log.accuracy}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{log.precision}%</TableCell>
                    <TableCell align="center">{log.recall}%</TableCell>
                    <TableCell align="center">{log.f1Score}%</TableCell>
                    <TableCell align="center">
                      <Chip label={log.status} size="small" sx={statusChipSx(log.status)} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setDetailsDialog(log)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredLogs.length}
              rowsPerPage={10}
              page={logsPage}
              onPageChange={(_e, p) => setLogsPage(p)}
              rowsPerPageOptions={[10]}
            />
          </TableContainer>
        </Box>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: Training Log Details
      ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!detailsDialog}
        onClose={() => setDetailsDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        {detailsDialog && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Training Details</Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', color: isDark ? '#93c5fd' : '#2563eb' }}
                  >
                    {detailsDialog.id}
                  </Typography>
                </Box>
                <Chip label={detailsDialog.status} size="small" sx={statusChipSx(detailsDialog.status)} />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Overview */}
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Date &amp; Time</Typography>
                  <Typography variant="body2" fontWeight={500}>{detailsDialog.date}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Duration</Typography>
                  <Typography variant="body2" fontWeight={500}>{detailsDialog.duration}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Dataset Size</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {detailsDialog.datasetSize.toLocaleString()} records
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2.5 }} />

              {/* Metrics */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Performance Metrics
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                {[
                  { label: 'Accuracy',  value: detailsDialog.accuracy,  color: '#22c55e' },
                  { label: 'Precision', value: detailsDialog.precision, color: '#3b82f6' },
                  { label: 'Recall',    value: detailsDialog.recall,    color: '#f59e0b' },
                  { label: 'F1-Score',  value: detailsDialog.f1Score,   color: '#a855f7' },
                ].map((m) => (
                  <Grid key={m.label} size={{ xs: 6 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                      <Typography variant="body2">{m.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>{m.value}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={m.value}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: isDark ? '#334155' : '#e2e8f0',
                        '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 3 },
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 2.5 }} />

              {/* Parameters */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Training Parameters
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  bgcolor: isDark ? '#1e293b' : '#f1f5f9',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  borderRadius: 1,
                  p: 1.5,
                  mb: 2.5,
                }}
              >
                {Object.entries(detailsDialog.parameters).map(([k, v]) => (
                  <Box
                    key={k}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 0.5,
                      '&:not(:last-child)': {
                        borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      },
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">{k}</Typography>
                    <Typography variant="body2" fontWeight={600}>{v}</Typography>
                  </Box>
                ))}
              </Paper>

              {/* Notes */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Notes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                {detailsDialog.details}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button onClick={() => setDetailsDialog(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          SNACKBAR
      ═══════════════════════════════════════════════════════════ */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
