import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  TextField,
  IconButton,
  Skeleton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating as MuiRating,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Engineering as EngineeringIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Memory as SensorIcon,
} from '@mui/icons-material';

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { api, axiosInstance, frontStatusToBackend } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common';
import {
  canEditWorkOrder,
  canStartWork,
  canCompleteWork,
  canCancelWorkOrder,
  isCompanyAdmin,
} from '../../utils/permissions';
import type { WorkOrder } from '../../types';

// ─── Parsed AI insight structure ──────────────────────────────────────────────
interface ParsedInsight {
  severity: string | null;
  issueType: string | null;
  sensorName: string | null;
  currentValue: string | null;
  normalRange: string | null;
  rul: string | null;
  confidence: string | null;
  machineName: string | null;
  rawTitle: string;
  rawDescription: string;
  isAiGenerated: boolean;
}

const parseWorkOrderContent = (title: string, description?: string): ParsedInsight => {
  const result: ParsedInsight = {
    severity: null, issueType: null, sensorName: null,
    currentValue: null, normalRange: null, rul: null,
    confidence: null, machineName: null,
    rawTitle: title, rawDescription: description ?? '',
    isAiGenerated: false,
  };

  // Detect AI-generated work orders
  const combinedText = `${title} ${description ?? ''}`;
  const aiPatterns = [
    /\bsensor_\w+/i,
    /anomaly detected/i,
    /inspect\s+sensor/i,
    /issue type\s*=/i,
    /remaining useful life/i,
    /model confidence/i,
    /normal range\s*[=:(]/i,
  ];
  const isAI = aiPatterns.some((p) => p.test(combinedText));
  if (!isAI) return result;
  result.isAiGenerated = true;

  // Severity from title prefix e.g. [HIGH], CRITICAL:
  const sevMatch = title.match(/^\[?(CRITICAL|HIGH|MEDIUM|LOW)\]?[:.\s]/i);
  if (sevMatch) result.severity = sevMatch[1].toUpperCase();

  // Issue type
  const issueMatch = combinedText.match(/issue\s*type\s*[=:]\s*([A-Z_]+)/i);
  if (issueMatch) result.issueType = issueMatch[1];

  // Sensor name — matches: "sensor_9", "inspect sensor_9", "Problem sensor: sensor_9"
  const sensorMatch1 =
    combinedText.match(/(?:problem\s+sensor\s*[:\s]+|inspect\s+)(sensor_?\w+)/i) ||
    combinedText.match(/\b(sensor_\w+)\b/i);
  if (sensorMatch1) {
    const rawSensor = sensorMatch1[1] ?? sensorMatch1[0];
    result.sensorName = rawSensor.replace(/^sensor_?/i, 'Sensor ').trim();
  }

  // Machine name from title (after dash or for)
  const machineMatch = title.match(/(?:—|-|for)\s+([^.\[]+?)(?:\.|$|\[)/i);
  if (machineMatch) result.machineName = machineMatch[1].trim();

  // Current value
  const cvMatch = combinedText.match(/(?:current\s*value|reading)\s*[=:]\s*([\d.,]+)/i);
  if (cvMatch) result.currentValue = cvMatch[1];

  // Normal range
  const nrMatch = combinedText.match(/normal\s*range\s*[=:([\s]*([\d.,]+)\s*[-–]\s*([\d.,]+)/i);
  if (nrMatch) result.normalRange = `${nrMatch[1]} – ${nrMatch[2]}`;

  // RUL
  const rulMatch = combinedText.match(/remaining\s*useful\s*life(?:\s*\([^)]*\))?\s*[=:]\s*([\d.]+)/i);
  if (rulMatch) result.rul = rulMatch[1];

  // Confidence
  const confMatch = combinedText.match(/(?:model\s*)?confidence\s*[=:]\s*([\d.]+%?)/i);
  if (confMatch) {
    const raw = confMatch[1].replace('%', '');
    const num = parseFloat(raw);
    result.confidence = num > 1 ? `${num.toFixed(1)}%` : `${(num * 100).toFixed(1)}%`;
  }

  return result;
};

// ─── Severity color mapping ───────────────────────────────────────────────────
const severityConfig: Record<string, { bg: string; color: string; label: string }> = {
  CRITICAL: { bg: '#fef2f2', color: '#dc2626', label: 'Critical' },
  HIGH:     { bg: '#fff7ed', color: '#ea580c', label: 'High' },
  MEDIUM:   { bg: '#fffbeb', color: '#d97706', label: 'Medium' },
  LOW:      { bg: '#f0fdf4', color: '#16a34a', label: 'Low' },
};

const priorityColors: Record<string, string> = {
  critical: '#dc2626',
  high:     '#ea580c',
  medium:   '#d97706',
  low:      '#16a34a',
};

const safeFormat = (dateStr: string | null | undefined, fmt: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, fmt);
  } catch { return ''; }
};

const hasValue = (v: any): boolean =>
  v !== null && v !== undefined && v !== '' && v !== 'N/A' && v !== 0;

// ─── AI Insight Badge Card ────────────────────────────────────────────────────
const AIInsightHeader = ({ parsed }: { parsed: ParsedInsight }) => {
  const sev = parsed.severity ?? 'HIGH';
  const sevCfg = severityConfig[sev] ?? severityConfig.HIGH;

  return (
    <Box sx={{
      border: '1px solid',
      borderColor: sevCfg.color + '33',
      borderRadius: 2,
      bgcolor: sevCfg.bg,
      p: 2.5,
      mb: 0,
    }}>
      {/* Top row: severity + issue type */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          bgcolor: sevCfg.color + '18', borderRadius: 1,
          px: 1.25, py: 0.4,
        }}>
          <WarningIcon sx={{ fontSize: 14, color: sevCfg.color }} />
          <Typography variant="caption" fontWeight={700} sx={{ color: sevCfg.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {sevCfg.label}
          </Typography>
        </Box>
        {parsed.issueType && (
          <Chip
            label={parsed.issueType}
            size="small"
            icon={<BuildIcon style={{ fontSize: 12 }} />}
            sx={{ bgcolor: 'white', border: `1px solid ${sevCfg.color}33`, color: sevCfg.color, fontWeight: 600, height: 24 }}
          />
        )}
        {parsed.machineName && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            {parsed.machineName}
          </Typography>
        )}
      </Box>

      {/* Sensor name */}
      {parsed.sensorName && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SensorIcon sx={{ fontSize: 16, color: sevCfg.color }} />
          <Typography variant="body2" fontWeight={600} sx={{ color: sevCfg.color }}>
            {parsed.sensorName} anomaly detected
          </Typography>
        </Box>
      )}

      {/* Metrics row */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 1.5,
      }}>
        {parsed.currentValue && (
          <Box sx={{ bgcolor: 'white', borderRadius: 1.5, p: 1.25, border: '1px solid', borderColor: sevCfg.color + '22' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>Reading</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: sevCfg.color }}>{parsed.currentValue}</Typography>
          </Box>
        )}
        {parsed.normalRange && (
          <Box sx={{ bgcolor: 'white', borderRadius: 1.5, p: 1.25, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>Normal Range</Typography>
            <Typography variant="body2" fontWeight={600}>{parsed.normalRange}</Typography>
          </Box>
        )}
        {parsed.rul && (
          <Box sx={{ bgcolor: 'white', borderRadius: 1.5, p: 1.25, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>Remaining Life</Typography>
            <Typography variant="body2" fontWeight={600}>{parsed.rul} cycles</Typography>
          </Box>
        )}
        {parsed.confidence && (
          <Box sx={{ bgcolor: 'white', borderRadius: 1.5, p: 1.25, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>Confidence</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{
                flex: 1, height: 4, bgcolor: '#e5e7eb', borderRadius: 2, overflow: 'hidden',
              }}>
                <Box sx={{
                  height: '100%',
                  width: parsed.confidence,
                  bgcolor: parseFloat(parsed.confidence) >= 80 ? '#16a34a' : parseFloat(parsed.confidence) >= 60 ? '#d97706' : '#dc2626',
                  borderRadius: 2,
                }} />
              </Box>
              <Typography variant="body2" fontWeight={700}>{parsed.confidence}</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─── Info item ────────────────────────────────────────────────────────────────
const InfoItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
      {icon && <Box component="span" sx={{ display: 'inline-flex', '& svg': { fontSize: 12 } }}>{icon}</Box>}
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

const WorkOrderDetails = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

  const [loading, setLoading]             = useState(true);
  const [workOrder, setWorkOrder]         = useState<WorkOrder | null>(null);
  const [newNote, setNewNote]             = useState('');
  const [addingNote, setAddingNote]       = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError]                 = useState('');
  const [errorDetail, setErrorDetail]     = useState('');
  const [actionError, setActionError]     = useState('');

  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    actionTaken: '', rootCause: '', hoursSpent: '', minutesSpent: '', additionalNotes: '',
  });
  const [spareParts, setSpareParts] = useState([]);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const [ratingValue, setRatingValue]       = useState<number | null>(null);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingLoading, setRatingLoading]   = useState(false);
  const [ratingError, setRatingError]       = useState('');
  const [alreadyRated, setAlreadyRated]     = useState(false);
  const [completionNote, setCompletionNote] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchWorkOrder = async () => {
      setLoading(true);
      setError(''); setErrorDetail('');
      try {
        const data = await api.getWorkOrderById(id);
        if (!data) { setError('Work order not found'); return; }
        setWorkOrder(data);
        if (data?.isRated || data?.is_rated) setAlreadyRated(true);
        if (data.status === 'completed') {
          try {
            const res = await axiosInstance.get(`/work-orders/${id}/notes`);
            const arr = Array.isArray(res) ? res : [];
            if (arr.length > 0) setCompletionNote(arr[arr.length - 1]);
          } catch { /* silent */ }
        }
        if (location.state?.openRating) {
          setTimeout(() => {
            document.getElementById('completion-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 400);
        }
      } catch (err: any) {
        const msg = err?.message ?? err?.error ?? err?.detail ?? (typeof err === 'string' ? err : null);
        setError('Failed to load work order');
        if (msg && msg !== 'Failed to load work order') setErrorDetail(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  const handleStatusChange = async (frontendStatus: string) => {
    if (!id) return;
    setStatusLoading(true); setActionError('');
    try {
      const updated = await api.updateWorkOrder(id, { status: frontStatusToBackend(frontendStatus) });
      setWorkOrder(updated);
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to update status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setAddingNote(true);
    try {
      await api.addWorkOrderNote(id, { text: newNote });
      const updated = await api.getWorkOrderById(id);
      setWorkOrder(updated);
      setNewNote('');
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  };

  const addSparePart = () => setSpareParts((prev) => [...prev, { name: '', quantity: 1, cost: 0 }]);
  const updateSparePart = (index: number, field: 'name' | 'quantity' | 'cost', value: string | number) =>
    setSpareParts((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  const removeSparePart = (index: number) => setSpareParts((prev) => prev.filter((_, i) => i !== index));

  const handleCompleteSubmit = async () => {
    if (!id) return;
    setCompleteLoading(true); setCompleteError('');
    try {
      const payload = {
        actionTaken:       completeForm.actionTaken,
        rootCause:         completeForm.rootCause,
        spareParts:        spareParts.map((p) => ({ name: p.name, quantity: Number(p.quantity), cost: Number(p.cost) || 0 })),
        hoursSpent:        Number(completeForm.hoursSpent)   || 0,
        minutesSpent:      Number(completeForm.minutesSpent) || 0,
        additionalNotes:   completeForm.additionalNotes,
        completedByUserId: user?.id,
      };
      await axiosInstance.post(`/work-orders/${id}/complete`, payload);
      const updated = await api.getWorkOrderById(id);
      setWorkOrder(updated);
      setCompleteDialogOpen(false);
      setTimeout(() => {
        document.getElementById('completion-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err: any) {
      setCompleteError(err?.message ?? 'Failed to complete work order.');
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!id || !ratingValue) return;
    setRatingLoading(true); setRatingError('');
    try {
      await axiosInstance.post(`/work-orders/${id}/rate`, {
        ratedByUserId: user?.id, stars: ratingValue, feedback: ratingFeedback,
      });
      setAlreadyRated(true);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.toLowerCase().includes('already rated')) setAlreadyRated(true);
      else setRatingError(msg || 'Failed to submit rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={300} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={120} />
      </Box>
    );
  }

  if (error || !workOrder) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>{error || 'Work order not found'}</Typography>
        {errorDetail && <Typography variant="body2" color="error" sx={{ mb: 2 }}>{errorDetail}</Typography>}
        <Button onClick={() => navigate('/work-orders')} sx={{ mt: 2 }}>Back to Work Orders</Button>
      </Box>
    );
  }

  const status  = workOrder.status;
  const isDone  = status === 'completed' || status === 'cancelled' || status === 'closed';
  const viewOnly   = isCompanyAdmin(user);
  const hasActions = canStartWork(user) || canCompleteWork(user) || canCancelWorkOrder(user);

  const createdBy   = workOrder.created_by?.name;
  const createdAt   = safeFormat(workOrder.created_at,   'MMM d, yyyy · h:mm a');
  const dueDate     = safeFormat(workOrder.due_date,     'MMM d, yyyy');
  const estHours    = workOrder.estimated_hours;
  const actualHours = workOrder.actual_hours;
  const completedAt = safeFormat(workOrder.completed_at, 'MMM d, yyyy · h:mm a');

  const canRate =
    status === 'completed' && !alreadyRated &&
    (workOrder.created_by?.id === user?.id || user?.role === 'engineer');

  const hasCompletionData = workOrder.status === 'completed';

  // Parse AI content
  const parsed = parseWorkOrderContent(workOrder.title, workOrder.description);

  return (
    <Box sx={{ maxWidth: 900 }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/work-orders')} sx={{ mt: 0.25 }}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography variant="h5" fontWeight={700} letterSpacing={-0.5}>
              {workOrder.wo_number}
            </Typography>
            <StatusBadge status={status} />
            <Chip
              label={workOrder.priority}
              size="small"
              sx={{
                bgcolor: `${priorityColors[workOrder.priority] ?? '#9e9e9e'}15`,
                color:    priorityColors[workOrder.priority] ?? '#9e9e9e',
                fontWeight: 700, textTransform: 'capitalize',
                border: `1px solid ${priorityColors[workOrder.priority] ?? '#9e9e9e'}33`,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {workOrder.asset_id} · {workOrder.machine_name}
          </Typography>
        </Box>

        {canEditWorkOrder(user) && !isDone && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/work-orders/${id}/edit`)} size="small">
            Edit
          </Button>
        )}
      </Box>

      {/* ── Main Info Card ─────────────────────────────────────────────────── */}
      <Card sx={{ borderRadius: 2.5, mb: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>

          {/* AI-generated: structured header */}
          {parsed.isAiGenerated ? (
            <AIInsightHeader parsed={parsed} />
          ) : (
            /* Regular work order: title + description */
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>{workOrder.title}</Typography>
              {workOrder.description && (
                <Typography variant="body2" color="text.secondary">{workOrder.description}</Typography>
              )}
            </Box>
          )}

          <Divider sx={{ my: 2.5 }} />

          {/* Meta grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 2,
          }}>
            {hasValue(createdBy) && (
              <InfoItem label="Created by" value={createdBy!} icon={<PersonIcon />} />
            )}
            {hasValue(createdAt) && (
              <InfoItem label="Created at" value={createdAt} icon={<CalendarIcon />} />
            )}
            {hasValue(dueDate) && (
              <InfoItem label="Due date" value={dueDate} icon={<CalendarIcon />} />
            )}
            {hasValue(estHours) && (
              <InfoItem label="Estimated" value={`${estHours} hrs`} icon={<TimeIcon />} />
            )}
            {isDone && hasValue(actualHours) && (
              <InfoItem label="Actual time" value={`${actualHours} hrs`} icon={<TimeIcon />} />
            )}
            {isDone && hasValue(completedAt) && (
              <InfoItem label="Completed at" value={completedAt} icon={<CalendarIcon />} />
            )}
          </Box>

          {workOrder.parts_needed?.length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                PARTS NEEDED
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {workOrder.parts_needed.map((part: string, i: number) => (
                  <Chip key={i} label={part} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Assignment + Actions Card ───────────────────────────────────────── */}
      <Card sx={{ borderRadius: 2.5, mb: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Grid container spacing={3} alignItems="flex-start">
            {/* Assignment */}
            {/* @ts-expect-error MUI v7 Grid item prop */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.8, display: 'block', mb: 1.5 }}>
                ASSIGNED TO
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '50%',
                  bgcolor: workOrder.assigned_to ? '#1e40af' : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: workOrder.assigned_to ? 'white' : '#9ca3af',
                  flexShrink: 0, fontSize: 18,
                  fontWeight: 700,
                }}>
                  {workOrder.assigned_to
                    ? workOrder.assigned_to.name.charAt(0).toUpperCase()
                    : <PersonIcon />}
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {workOrder.assigned_to?.name || 'Unassigned'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EngineeringIcon sx={{ fontSize: 12 }} /> Technician
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Actions */}
            {!viewOnly && (
              // @ts-expect-error MUI v7 Grid item prop
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.8, display: 'block', mb: 1.5 }}>
                  ACTIONS
                </Typography>

                {actionError && (
                  <Alert severity="error" sx={{ mb: 2, py: 0.5, borderRadius: 1.5 }} onClose={() => setActionError('')}>
                    {actionError}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(status === 'open' || status === 'assigned') && canStartWork(user) && (
                    <Button
                      variant="contained"
                      startIcon={statusLoading ? <CircularProgress size={16} color="inherit" /> : <StartIcon />}
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={statusLoading}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Start Work
                    </Button>
                  )}

                  {status === 'in_progress' && canCompleteWork(user) && (
                    <Button
                      variant="contained" color="success"
                      startIcon={<CompleteIcon />}
                      onClick={() => setCompleteDialogOpen(true)}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Mark Complete
                    </Button>
                  )}

                  {!isDone && canCancelWorkOrder(user) && (
                    <Button
                      variant="outlined" color="error"
                      startIcon={statusLoading ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={statusLoading}
                      sx={{ borderRadius: 1.5 }}
                    >
                      Cancel
                    </Button>
                  )}

                  {status === 'completed' && (
                    <Alert severity="success" sx={{ py: 0.5, width: '100%', borderRadius: 1.5 }}>
                      This work order has been completed.
                    </Alert>
                  )}
                  {status === 'completed' && alreadyRated && (
                    <Alert severity="info" sx={{ py: 0.5, width: '100%', borderRadius: 1.5 }}>
                      You've already rated this work order. Thank you!
                    </Alert>
                  )}
                  {(status === 'cancelled' || status === 'closed') && (
                    <Alert severity="error" sx={{ py: 0.5, width: '100%', borderRadius: 1.5 }}>
                      This work order has been cancelled.
                    </Alert>
                  )}
                  {!isDone && !hasActions && (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                      No actions available for your role.
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* ── Completion Report ───────────────────────────────────────────────── */}
      {hasCompletionData && (
        <Box id="completion-section">
          <Card sx={{ borderRadius: 2.5, mb: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CompleteIcon sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="h6" fontWeight={600}>Completion Report</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Work order resolved and closed
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              {/* ── Row 1: Action Taken (full width) ── */}
              {(completionNote?.action_taken ?? workOrder.action_taken) && (
                <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 2, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}
                    sx={{ letterSpacing: 0.7, display: 'block', mb: 0.75 }}>
                    ACTION TAKEN
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {completionNote?.action_taken ?? workOrder.action_taken}
                  </Typography>
                </Box>
              )}

              {/* ── Row 2: Root Cause + Time Spent side by side ── */}
              {(() => {
                const rootCause = completionNote?.root_cause ?? workOrder.root_cause;
                const timeMinutes = completionNote?.time_spent_minutes;
                const hoursSpent = workOrder.hours_spent;
                const minutesSpent = workOrder.minutes_spent;
                const hasTime = timeMinutes || hoursSpent || minutesSpent;
                if (!rootCause && !hasTime) return null;
                return (
                  <Box sx={{ display: 'grid', gridTemplateColumns: rootCause && hasTime ? '1fr 1fr' : '1fr', gap: 2, mb: 2 }}>
                    {rootCause && (
                      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}
                          sx={{ letterSpacing: 0.7, display: 'block', mb: 0.75 }}>
                          ROOT CAUSE
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                          {rootCause}
                        </Typography>
                      </Box>
                    )}
                    {hasTime && (
                      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 2 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700}
                          sx={{ letterSpacing: 0.7, display: 'block', mb: 0.75 }}>
                          TIME SPENT
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body1" fontWeight={600}>
                            {timeMinutes
                              ? `${Math.floor(timeMinutes / 60)}h${timeMinutes % 60 > 0 ? ` ${timeMinutes % 60}m` : ''}`
                              : `${hoursSpent ? `${hoursSpent}h` : ''} ${minutesSpent ? `${minutesSpent}m` : ''}`.trim()
                            }
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                );
              })()}

              {/* ── Row 3: Additional Notes ── */}
              {(completionNote?.additional_notes ?? workOrder.additional_notes) && (
                <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 2, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}
                    sx={{ letterSpacing: 0.7, display: 'block', mb: 0.75 }}>
                    ADDITIONAL NOTES
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                    {completionNote?.additional_notes ?? workOrder.additional_notes}
                  </Typography>
                </Box>
              )}

              {/* ── Row 4: Spare Parts Table ── */}
              {(() => {
                const parts = completionNote?.spare_parts ?? workOrder.spare_parts;
                if (!parts?.length) return null;
                const total = parts.reduce((sum: number, p: any) => sum + (p.cost || 0) * (p.quantity || 0), 0);
                return (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                      sx={{ letterSpacing: 0.7, display: 'block', mb: 1 }}>
                      SPARE PARTS USED
                    </Typography>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                      <Box sx={{
                        display: 'grid', gridTemplateColumns: '1fr 80px 100px',
                        px: 2, py: 1.25, bgcolor: 'action.hover',
                        borderBottom: '1px solid', borderColor: 'divider',
                      }}>
                        {['Part name', 'Qty', 'Unit cost'].map((h) => (
                          <Typography key={h} variant="caption" fontWeight={700} color="text.secondary"
                            sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                          </Typography>
                        ))}
                      </Box>
                      {parts.map((part: any, i: number) => (
                        <Box key={i} sx={{
                          display: 'grid', gridTemplateColumns: '1fr 80px 100px',
                          px: 2, py: 1.25,
                          borderBottom: i < parts.length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' },
                          transition: 'background 0.15s',
                        }}>
                          <Typography variant="body2" fontWeight={500}>{part.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{part.quantity}</Typography>
                          <Typography variant="body2" color={part.cost > 0 ? 'text.primary' : 'text.secondary'}>
                            {(part.cost != null && part.cost > 0) ? `$${Number(part.cost).toFixed(2)}` : '—'}
                          </Typography>
                        </Box>
                      ))}
                      {total > 0 && (
                        <Box sx={{
                          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                          gap: 2, px: 2, py: 1.25,
                          borderTop: '2px solid', borderColor: 'divider',
                          bgcolor: 'action.hover',
                        }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>TOTAL</Typography>
                          <Typography variant="body2" fontWeight={700}>${total.toFixed(2)}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })()}

              {!completionNote?.action_taken && !workOrder.action_taken && (
                <Typography variant="body2" color="text.secondary">No completion details available yet.</Typography>
              )}
            </CardContent>
          </Card>

          {/* ── Rating card ─────────────────────────────────────────────────── */}
          {(canRate || alreadyRated) && (
            <Card sx={{ borderRadius: 2.5, mb: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StarIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                  <Typography variant="h6" fontWeight={600}>Rate Technician</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {alreadyRated ? (
                  <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                    You've already rated this work order. Thank you for your feedback!
                  </Alert>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      How satisfied are you with how{' '}
                      <strong>{workOrder.assigned_to?.name || 'the technician'}</strong>{' '}
                      handled this work order?
                    </Typography>
                    {ratingError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{ratingError}</Alert>}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                      <MuiRating value={ratingValue} onChange={(_, val) => setRatingValue(val)} size="large" />
                      {ratingValue && (
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratingValue]}
                        </Typography>
                      )}
                    </Box>
                    <TextField
                      label="Feedback (optional)"
                      multiline rows={3} fullWidth
                      value={ratingFeedback}
                      onChange={(e) => setRatingFeedback(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button
                        variant="contained"
                        startIcon={ratingLoading ? <CircularProgress size={16} color="inherit" /> : <StarIcon />}
                        onClick={handleRatingSubmit}
                        disabled={ratingLoading || !ratingValue}
                        sx={{ borderRadius: 1.5 }}
                      >
                        Submit Rating
                      </Button>
                      <Button variant="text" onClick={() => setAlreadyRated(true)} disabled={ratingLoading} sx={{ borderRadius: 1.5 }}>
                        Skip
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* ── Complete Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={completeDialogOpen} onClose={() => !completeLoading && setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={600}>Complete Work Order</DialogTitle>
        <DialogContent dividers>
          {completeError && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{completeError}</Alert>}

          <TextField
            label="Action Taken *" multiline rows={2} fullWidth
            value={completeForm.actionTaken}
            onChange={(e) => setCompleteForm((f) => ({ ...f, actionTaken: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Root Cause" multiline rows={2} fullWidth
            value={completeForm.rootCause}
            onChange={(e) => setCompleteForm((f) => ({ ...f, rootCause: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Hours Spent" type="number" fullWidth inputProps={{ min: 0 }}
              value={completeForm.hoursSpent}
              onChange={(e) => setCompleteForm((f) => ({ ...f, hoursSpent: e.target.value }))}
            />
            <TextField
              label="Minutes Spent" type="number" fullWidth inputProps={{ min: 0, max: 59 }}
              value={completeForm.minutesSpent}
              onChange={(e) => setCompleteForm((f) => ({ ...f, minutesSpent: e.target.value }))}
            />
          </Box>

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Spare Parts Used</Typography>
          {spareParts.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No spare parts added yet.</Typography>
          )}
          {spareParts.map((part, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
              <TextField label="Part Name" size="small" sx={{ flex: 2 }} value={part.name}
                onChange={(e) => updateSparePart(i, 'name', e.target.value)} />
              <TextField label="Qty" type="number" size="small" sx={{ flex: 1 }} inputProps={{ min: 1 }}
                value={part.quantity} onChange={(e) => updateSparePart(i, 'quantity', Number(e.target.value))} />
              <TextField
                label="Unit Cost $" type="text" size="small" sx={{ flex: 1 }}
                inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
                value={part.cost === 0 ? '' : part.cost}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) updateSparePart(i, 'cost', val === '' ? 0 : Number(val));
                }}
              />
              <IconButton size="small" color="error" onClick={() => removeSparePart(i)}><DeleteIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Button size="small" startIcon={<AddIcon />} onClick={addSparePart} sx={{ mb: 2 }}>Add Part</Button>

          <TextField
            label="Additional Notes" multiline rows={2} fullWidth
            value={completeForm.additionalNotes}
            onChange={(e) => setCompleteForm((f) => ({ ...f, additionalNotes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCompleteDialogOpen(false)} disabled={completeLoading}>Cancel</Button>
          <Button
            variant="contained" color="success"
            onClick={handleCompleteSubmit}
            disabled={completeLoading || !completeForm.actionTaken.trim()}
            startIcon={completeLoading ? <CircularProgress size={16} color="inherit" /> : <CompleteIcon />}
            sx={{ borderRadius: 1.5 }}
          >
            Confirm Complete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkOrderDetails;