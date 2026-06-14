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
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { api, frontStatusToBackend } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common';
import { isAdmin } from '../../utils/permissions';
import type { WorkOrder } from '../../types';

const priorityColors: Record<string, string> = {
  critical: '#f44336',
  high:     '#ff5722',
  medium:   '#ff9800',
  low:      '#4caf50',
};

// Safe date formatter — avoids crash when date string is invalid
const safeFormat = (dateStr: string | null | undefined, fmt: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'N/A';
    return format(d, fmt);
  } catch {
    return 'N/A';
  }
};

const WorkOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [workOrder, setWorkOrder]     = useState<WorkOrder | null>(null);
  const [newNote, setNewNote]         = useState('');
  const [addingNote, setAddingNote]   = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError]             = useState('');
  const [actionError, setActionError] = useState('');

  // ─── Fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetchWorkOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getWorkOrderById(id);
        setWorkOrder(data);
      } catch (err) {
        console.error('Failed to fetch work order:', err);
        setError('Failed to load work order');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkOrder();
  }, [id]);

  // ─── Status change ───────────────────────────────────────────────────────
  // Backend expects UPPERCASE status. "cancelled" in UI → "CLOSED" in backend.
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
      console.error('Failed to update status:', err);
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
      // Re-fetch to get updated notes list from backend
      const updated = await api.getWorkOrderById(id);
      setWorkOrder(updated);
      setNewNote('');
    } catch (err: any) {
      console.error('Failed to add note:', err);
      setActionError(err?.message ?? 'Failed to add note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };

  // ─── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={300} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={400} /></Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={400} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (error || !workOrder) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          {error || 'Work order not found'}
        </Typography>
        <Button onClick={() => navigate('/work-orders')} sx={{ mt: 2 }}>
          Back to Work Orders
        </Button>
      </Box>
    );
  }

  // Determine which action buttons to show based on normalised (lowercase) status
  const status = workOrder.status; // already lowercase after normalizeWorkOrder
  const isDone = status === 'completed' || status === 'cancelled' || status === 'closed';

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/work-orders')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight={600}>
              {workOrder.wo_number}
            </Typography>
            <StatusBadge status={status} />
            <Chip
              label={workOrder.priority}
              size="small"
              sx={{
                bgcolor: `${priorityColors[workOrder.priority] ?? '#9e9e9e'}15`,
                color:    priorityColors[workOrder.priority] ?? '#9e9e9e',
                textTransform: 'capitalize',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {workOrder.asset_id} - {workOrder.machine_name}
          </Typography>
        </Box>

        {/* Edit button — visible to admin when WO is not done */}
        {isAdmin(user) && !isDone && (
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
        {/* ── Main Content ──────────────────────────────────────────────── */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={8}>

          {/* Details card */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{workOrder.title}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {workOrder.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Created By</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {workOrder.created_by?.name || 'N/A'}
                  </Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography variant="body2">
                    {safeFormat(workOrder.created_at, 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Due Date</Typography>
                  <Typography variant="body2">
                    {safeFormat(workOrder.due_date, 'MMM d, yyyy')}
                  </Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Estimated Hours</Typography>
                  <Typography variant="body2">
                    {workOrder.estimated_hours ?? 'N/A'} hours
                  </Typography>
                </Grid>
              </Grid>

              {workOrder.parts_needed?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Parts Needed</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {workOrder.parts_needed.map((part: string, i: number) => (
                      <Chip key={i} label={part} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notes card */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Notes & Updates</Typography>

              {/* Add note input */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  multiline
                  maxRows={3}
                  disabled={addingNote}
                />
                <IconButton
                  color="primary"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                >
                  {addingNote ? <CircularProgress size={20} /> : <SendIcon />}
                </IconButton>
              </Box>

              {/* Notes list */}
              {workOrder.notes?.length > 0 ? (
                <Box>
                  {workOrder.notes.map((note: any, index: number) => (
                    <Box
                      key={note.id ?? index}
                      sx={{ display: 'flex', gap: 2, mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}
                    >
                      <Box
                        sx={{
                          width: 36, height: 36, borderRadius: '50%',
                          bgcolor: '#2E75B6', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '0.9rem', flexShrink: 0,
                        }}
                      >
                        {note.user?.charAt(0)?.toUpperCase() || 'U'}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>{note.user}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {safeFormat(note.created_at, 'MMM d, h:mm a')}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{note.text}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No notes yet. Add the first note above.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={4}>

          {/* Assignment */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Assignment</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: workOrder.assigned_to ? '#2E75B6' : '#e0e0e0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  }}
                >
                  <PersonIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2">
                    {workOrder.assigned_to?.name || 'Unassigned'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Technician</Typography>
                </Box>
              </Box>

              {workOrder.completed_at && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Completed: {safeFormat(workOrder.completed_at, 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Box>
              )}
              {workOrder.actual_hours && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Actual time: {workOrder.actual_hours} hours
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Actions</Typography>

              {actionError && (
                <Alert severity="error" sx={{ mb: 2, py: 0.5 }} onClose={() => setActionError('')}>
                  {actionError}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* open or assigned → start work */}
                {(status === 'open' || status === 'assigned') && (
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

                {/* in_progress → complete */}
                {status === 'in_progress' && (
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

                {/* admin cancel — available when not done */}
                {!isDone && isAdmin(user) && (
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

                {/* Terminal states */}
                {status === 'completed' && (
                  <Alert severity="success" sx={{ py: 0.5 }}>
                    This work order has been completed
                  </Alert>
                )}
                {(status === 'cancelled' || status === 'closed') && (
                  <Alert severity="error" sx={{ py: 0.5 }}>
                    This work order has been cancelled
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkOrderDetails;