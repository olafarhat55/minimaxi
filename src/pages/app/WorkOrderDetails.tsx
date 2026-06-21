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
  Send as SendIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
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
  const location = useLocation();

  const [loading, setLoading]             = useState(true);
  const [workOrder, setWorkOrder]         = useState<WorkOrder | null>(null);
  const [newNote, setNewNote]             = useState('');
  const [addingNote, setAddingNote]       = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError]                 = useState('');
  const [errorDetail, setErrorDetail]     = useState('');
  const [actionError, setActionError]     = useState('');

  // ─── Completion form state ────────────────────────────────────────────────
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completeForm, setCompleteForm] = useState({
    actionTaken: '',
    rootCause: '',
    hoursSpent: '',
    minutesSpent: '',
    additionalNotes: '',
  });
  const [spareParts, setSpareParts] = useState<
    { name: string; quantity: number; cost: number }[]
  >([]);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeError, setCompleteError] = useState('');

  // ─── Rating state ─────────────────────────────────────────────────────────
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingValue, setRatingValue]           = useState<number | null>(null);
  const [ratingFeedback, setRatingFeedback]     = useState('');
  const [ratingLoading, setRatingLoading]       = useState(false);
  const [ratingError, setRatingError]           = useState('');
  const [alreadyRated, setAlreadyRated]         = useState(false);

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

      // لو الـ work order اتقيّمت قبل كده
      if (data?.isRated || data?.is_rated) {
        setAlreadyRated(true);
      }

      // لو جاي من notification rating
if (location.state?.openRating) {
  const isAlreadyRated = data?.isRated || data?.is_rated;
  const isCreator = data?.created_by?.id === user?.id;
  const isEngineer = user?.role === 'engineer';
  if ((isCreator || isEngineer) && !isAlreadyRated) {
    setRatingDialogOpen(true);
  }
}
    } catch (err: any) {
      console.error('Failed to fetch work order:', err);
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

  // ─── Status change (for Start / Cancel only) ─────────────────────────────
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

  // ─── Spare parts helpers ──────────────────────────────────────────────────
  const addSparePart = () =>
    setSpareParts((prev) => [...prev, { name: '', quantity: 1, cost: 0 }]);

  const updateSparePart = (
    index: number,
    field: 'name' | 'quantity' | 'cost',
    value: string | number
  ) =>
    setSpareParts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );

  const removeSparePart = (index: number) =>
    setSpareParts((prev) => prev.filter((_, i) => i !== index));

  // ─── Submit completion ────────────────────────────────────────────────────
  const handleCompleteSubmit = async () => {
    if (!id) return;
    setCompleteLoading(true);
    setCompleteError('');
    try {
      const payload = {
        actionTaken:    completeForm.actionTaken,
        rootCause:      completeForm.rootCause,
        spareParts:     spareParts.map((p) => ({
          name:     p.name,
          quantity: Number(p.quantity),
          cost:     Number(p.cost) || 0,
        })),
        hoursSpent:      Number(completeForm.hoursSpent)   || 0,
        minutesSpent:    Number(completeForm.minutesSpent) || 0,
        additionalNotes: completeForm.additionalNotes,
        completedByUserId: user?.id,
      };
     await axiosInstance.post(`/work-orders/${id}/complete`, payload);
      const updated = await api.getWorkOrderById(id);
      setWorkOrder(updated);
      setCompleteDialogOpen(false);

      // لو الـ user هو creator أو engineer → افتح rating dialog
      const isCreator  = workOrder?.created_by?.id === user?.id;
      const isEngineer = user?.role === 'engineer';
      if (isCreator || isEngineer) {
        setRatingDialogOpen(true);
      }
    } catch (err: any) {
      setCompleteError(err?.message ?? 'Failed to complete work order.');
    } finally {
      setCompleteLoading(false);
    }
  };

  // ─── Submit rating ────────────────────────────────────────────────────────
  const handleRatingSubmit = async () => {
    if (!id || !ratingValue) return;
    setRatingLoading(true);
    setRatingError('');
    try {
    await axiosInstance.post(`/work-orders/${id}/rate`, {
  ratedByUserId: user?.id,
  stars:         ratingValue,
  feedback:      ratingFeedback,
});
      setAlreadyRated(true);
      setRatingDialogOpen(false);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.toLowerCase().includes('already rated')) {
        setAlreadyRated(true);
        setRatingDialogOpen(false);
      } else {
        setRatingError(msg || 'Failed to submit rating.');
      }
    } finally {
      setRatingLoading(false);
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

  const status  = workOrder.status;
  const isDone  = status === 'completed' || status === 'cancelled' || status === 'closed';

  const viewOnly   = isCompanyAdmin(user);
  const hasActions = canStartWork(user) || canCompleteWork(user) || canCancelWorkOrder(user);

  const createdBy   = workOrder.created_by?.name;
  const createdAt   = safeFormat(workOrder.created_at,  'MMM d, yyyy h:mm a');
  const dueDate     = safeFormat(workOrder.due_date,    'MMM d, yyyy');
  const estHours    = workOrder.estimated_hours;
  const actualHours = workOrder.actual_hours;
  const completedAt = safeFormat(workOrder.completed_at, 'MMM d, yyyy h:mm a');

  const canRate =
    status === 'completed' &&
    !alreadyRated &&
    (workOrder.created_by?.id === user?.id || user?.role === 'engineer');

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
    {/* Assignment + Actions في card واحدة */}
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        {/* Assignment */}
        <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1.5 }}>
          ASSIGNMENT
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: '50%',
              bgcolor: workOrder.assigned_to ? '#2E75B6' : '#e0e0e0',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white',
              flexShrink: 0,
            }}
          >
            <PersonIcon />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {workOrder.assigned_to?.name || 'Unassigned'}
            </Typography>
            <Typography variant="caption" color="text.secondary">Technician</Typography>
          </Box>
        </Box>

        {/* Actions */}
        {!viewOnly && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1.5 }}>
              ACTIONS
            </Typography>

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
                  startIcon={<CompleteIcon />}
                  onClick={() => setCompleteDialogOpen(true)}
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

              {canRate && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<StarIcon />}
                  onClick={() => setRatingDialogOpen(true)}
                  fullWidth
                >
                  Rate Technician
                </Button>
              )}

              {status === 'completed' && alreadyRated && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  You have already rated this work order. Thank you!
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
          </>
        )}
      </CardContent>
    </Card>
  </Grid>
</Grid>

      {/* ── Completion Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={completeDialogOpen}
        onClose={() => !completeLoading && setCompleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={600}>Complete Work Order</DialogTitle>
        <DialogContent dividers>
          {completeError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {completeError}
            </Alert>
          )}

          <TextField
            label="Action Taken *"
            multiline
            rows={2}
            fullWidth
            value={completeForm.actionTaken}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, actionTaken: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <TextField
            label="Root Cause"
            multiline
            rows={2}
            fullWidth
            value={completeForm.rootCause}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, rootCause: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Hours Spent"
              type="number"
              fullWidth
              inputProps={{ min: 0 }}
              value={completeForm.hoursSpent}
              onChange={(e) =>
                setCompleteForm((f) => ({ ...f, hoursSpent: e.target.value }))
              }
            />
            <TextField
              label="Minutes Spent"
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 59 }}
              value={completeForm.minutesSpent}
              onChange={(e) =>
                setCompleteForm((f) => ({ ...f, minutesSpent: e.target.value }))
              }
            />
          </Box>

          {/* Spare Parts */}
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Spare Parts Used
          </Typography>

          {spareParts.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No spare parts added yet.
            </Typography>
          )}

          {spareParts.map((part, i) => (
            <Box
              key={i}
              sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}
            >
              <TextField
                label="Part Name"
                size="small"
                sx={{ flex: 2 }}
                value={part.name}
                onChange={(e) => updateSparePart(i, 'name', e.target.value)}
              />
              <TextField
                label="Qty"
                type="number"
                size="small"
                sx={{ flex: 1 }}
                inputProps={{ min: 1 }}
                value={part.quantity}
                onChange={(e) =>
                  updateSparePart(i, 'quantity', Number(e.target.value))
                }
              />
              <TextField
  label="Unit Cost $"
  type="text"
  size="small"
  sx={{ flex: 1 }}
  inputProps={{ inputMode: 'decimal', pattern: '[0-9]*\\.?[0-9]*' }}
  value={part.cost === 0 ? '' : part.cost}
  onChange={(e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      updateSparePart(i, 'cost', val === '' ? 0 : Number(val));
    }
  }}
/>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeSparePart(i)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addSparePart}
            sx={{ mb: 2 }}
          >
            Add Part
          </Button>

          <TextField
            label="Additional Notes"
            multiline
            rows={2}
            fullWidth
            value={completeForm.additionalNotes}
            onChange={(e) =>
              setCompleteForm((f) => ({ ...f, additionalNotes: e.target.value }))
            }
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setCompleteDialogOpen(false)}
            disabled={completeLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCompleteSubmit}
            disabled={completeLoading || !completeForm.actionTaken.trim()}
            startIcon={
              completeLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CompleteIcon />
              )
            }
          >
            Confirm Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Rating Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={ratingDialogOpen}
        onClose={() => !ratingLoading && setRatingDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={600}>Rate Technician Work</DialogTitle>
        <DialogContent dividers>
          {ratingError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {ratingError}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            How satisfied are you with how this work order was handled?
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <MuiRating
              value={ratingValue}
              onChange={(_, val) => setRatingValue(val)}
              size="large"
            />
          </Box>

          <TextField
            label="Feedback (optional)"
            multiline
            rows={3}
            fullWidth
            value={ratingFeedback}
            onChange={(e) => setRatingFeedback(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setRatingDialogOpen(false)}
            disabled={ratingLoading}
          >
            Skip
          </Button>
          <Button
            variant="contained"
            onClick={handleRatingSubmit}
            disabled={ratingLoading || !ratingValue}
            startIcon={
              ratingLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <StarIcon />
              )
            }
          >
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkOrderDetails;