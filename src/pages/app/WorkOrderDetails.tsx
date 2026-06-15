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
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api, frontStatusToBackend } from '../../services/api';
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

const priorityColors: Record<string, string> = {
  critical: '#f44336',
  high:     '#ff5722',
  medium:   '#ff9800',
  low:      '#4caf50',
};

const safeFormat = (dateStr: string | null | undefined, fmt: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return format(d, fmt);
  } catch {
    return '';
  }
};

const hasValue = (v: any): boolean =>
  v !== null && v !== undefined && v !== '' && v !== 'N/A' && v !== 0;

const WorkOrderDetails = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading]             = useState(true);
  const [workOrder, setWorkOrder]         = useState<WorkOrder | null>(null);
  const [newNote, setNewNote]             = useState('');
  const [addingNote, setAddingNote]       = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError]                 = useState('');
  const [errorDetail, setErrorDetail]     = useState('');
  const [actionError, setActionError]     = useState('');

  // ─── Fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchWorkOrder = async () => {
      setLoading(true);
      setError('');
      setErrorDetail('');
      try {
        const data = await api.getWorkOrderById(id);
        if (!data) {
          setError('Work order not found');
          return;
        }
        setWorkOrder(data);
      } catch (err: any) {
        console.error('Failed to fetch work order:', err);
        // Extract meaningful error message from backend
        const msg =
          err?.message ??
          err?.error ??
          err?.detail ??
          (typeof err === 'string' ? err : null);
        setError('Failed to load work order');
        if (msg && msg !== 'Failed to load work order') {
          setErrorDetail(msg);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  // ─── Status change ───────────────────────────────────────────────────────
  const handleStatusChange = async (frontendStatus: string) => {
    if (!id) return;
    setStatusLoading(true);
    setActionError('');
    try {
      const updated = await api.updateWorkOrder(id, {
        status: frontStatusToBackend(frontendStatus),
      });
      setWorkOrder(updated);
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to update status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  // ─── Add note ────────────────────────────────────────────────────────────
  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    setAddingNote(true);
    try {
      await api.addWorkOrderNote(id, { text: newNote });
      const updated = await api.getWorkOrderById(id);
      setWorkOrder(updated);
      setNewNote('');
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to add note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={300} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={400} /></Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={250} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !workOrder) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {error || 'Work order not found'}
        </Typography>
        {errorDetail && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {errorDetail}
          </Typography>
        )}
        <Button onClick={() => navigate('/work-orders')} sx={{ mt: 2 }}>
          Back to Work Orders
        </Button>
      </Box>
    );
  }

  const status = workOrder.status;
  const isDone = status === 'completed' || status === 'cancelled' || status === 'closed';

  const viewOnly  = isCompanyAdmin(user);
  const hasActions = canStartWork(user) || canCompleteWork(user) || canCancelWorkOrder(user);

  const createdBy   = workOrder.created_by?.name;
  const createdAt   = safeFormat(workOrder.created_at, 'MMM d, yyyy h:mm a');
  const dueDate     = safeFormat(workOrder.due_date, 'MMM d, yyyy');
  const estHours    = workOrder.estimated_hours;
  const actualHours = workOrder.actual_hours;
  const completedAt = safeFormat(workOrder.completed_at, 'MMM d, yyyy h:mm a');

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/work-orders')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h5" fontWeight={600}>{workOrder.wo_number}</Typography>
            <StatusBadge status={status} />
            <Chip
              label={workOrder.priority}
              size="small"
              sx={{
                bgcolor: `${priorityColors[workOrder.priority] ?? '#9e9e9e'}18`,
                color:    priorityColors[workOrder.priority] ?? '#9e9e9e',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {workOrder.asset_id} — {workOrder.machine_name}
          </Typography>
        </Box>

        {canEditWorkOrder(user) && !isDone && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/work-orders/${id}/edit`)}
          >
            Edit
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* ── Left: Main Content ──────────────────────────────────────────── */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={8}>

          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {workOrder.title}
              </Typography>

              {workOrder.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {workOrder.description}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                {hasValue(createdBy) && (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Created By</Typography>
                    <Typography variant="body2" fontWeight={500}>{createdBy}</Typography>
                  </Grid>
                )}
                {hasValue(createdAt) && (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Created At</Typography>
                    <Typography variant="body2">{createdAt}</Typography>
                  </Grid>
                )}
                {hasValue(dueDate) && (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Due Date</Typography>
                    <Typography variant="body2">{dueDate}</Typography>
                  </Grid>
                )}
                {hasValue(estHours) && (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Estimated Hours</Typography>
                    <Typography variant="body2">{estHours} hrs</Typography>
                  </Grid>
                )}
                {isDone && hasValue(actualHours) && (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Actual Hours</Typography>
                    <Typography variant="body2">{actualHours} hrs</Typography>
                  </Grid>
                )}
                {isDone && hasValue(completedAt) && (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Completed At</Typography>
                    <Typography variant="body2">{completedAt}</Typography>
                  </Grid>
                )}
              </Grid>

              {workOrder.parts_needed?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Parts Needed
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {workOrder.parts_needed.map((part: string, i: number) => (
                      <Chip key={i} label={part} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

         
        </Grid>

        {/* ── Right: Sidebar ──────────────────────────────────────────────── */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={4}>

          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Assignment</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: workOrder.assigned_to ? '#2E75B6' : '#e0e0e0',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white',
                  }}
                >
                  <PersonIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {workOrder.assigned_to?.name || 'Unassigned'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Technician</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Actions card — hidden for Company Admin */}
          {!viewOnly && (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Actions</Typography>

                {actionError && (
                  <Alert severity="error" sx={{ mb: 2, py: 0.5 }} onClose={() => setActionError('')}>
                    {actionError}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {(status === 'open' || status === 'assigned') && canStartWork(user) && (
                    <Button
                      variant="contained"
                      startIcon={statusLoading ? <CircularProgress size={16} color="inherit" /> : <StartIcon />}
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={statusLoading}
                      fullWidth
                    >
                      Start Work
                    </Button>
                  )}

                  {status === 'in_progress' && canCompleteWork(user) && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={statusLoading ? <CircularProgress size={16} color="inherit" /> : <CompleteIcon />}
                      onClick={() => handleStatusChange('completed')}
                      disabled={statusLoading}
                      fullWidth
                    >
                      Mark Complete
                    </Button>
                  )}

                  {!isDone && canCancelWorkOrder(user) && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={statusLoading ? <CircularProgress size={16} color="inherit" /> : <CancelIcon />}
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={statusLoading}
                      fullWidth
                    >
                      Cancel Work Order
                    </Button>
                  )}

                  {status === 'completed' && (
                    <Alert severity="success" sx={{ py: 0.5 }}>
                      This work order has been completed.
                    </Alert>
                  )}
                  {(status === 'cancelled' || status === 'closed') && (
                    <Alert severity="error" sx={{ py: 0.5 }}>
                      This work order has been cancelled.
                    </Alert>
                  )}

                  {!isDone && !hasActions && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                      No actions available for your role.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkOrderDetails;