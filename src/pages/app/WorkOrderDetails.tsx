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
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common';
import { isAdmin } from '../../utils/permissions';
import type { WorkOrder } from '../../types';

const priorityColors: Record<string, string> = {
  critical: '#f44336',
  high: '#ff5722',
  medium: '#ff9800',
  low: '#4caf50',
};

const WorkOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWorkOrder = async () => {
      setLoading(true);
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updateData: Record<string, string> = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      const updated = await api.updateWorkOrder(id, updateData);
      setWorkOrder(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      await api.addWorkOrderNote(id, {
        user: user.name,
        text: newNote,
      });
      const updated = await api.getWorkOrderById(id);
      setWorkOrder(updated);
      setNewNote('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={300} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={400} />
          </Grid>
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/work-orders')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight={600}>
              {workOrder.wo_number}
            </Typography>
            <StatusBadge status={workOrder.status} />
            <Chip
              label={workOrder.priority}
              size="small"
              sx={{
                bgcolor: `${priorityColors[workOrder.priority]}15`,
                color: priorityColors[workOrder.priority],
                textTransform: 'capitalize',
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {workOrder.asset_id} - {workOrder.machine_name}
          </Typography>
        </Box>
        {isAdmin(user) && workOrder.status !== 'completed' && (
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
        {/* Main Content */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={8}>
          {/* Work Order Details */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {workOrder.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {workOrder.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={3}>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {workOrder.created_by?.name || 'N/A'}
                  </Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(workOrder.created_at), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body2">
                    {workOrder.due_date
                      ? format(new Date(workOrder.due_date), 'MMM d, yyyy h:mm a')
                      : 'Not set'}
                  </Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">
                    Estimated Hours
                  </Typography>
                  <Typography variant="body2">
                    {workOrder.estimated_hours || 'N/A'} hours
                  </Typography>
                </Grid>
              </Grid>

              {workOrder.parts_needed && workOrder.parts_needed.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Parts Needed
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {workOrder.parts_needed.map((part, index) => (
                      <Chip key={index} label={part} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notes & Updates
              </Typography>

              {/* Add Note */}
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
                />
                <IconButton
                  color="primary"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                >
                  <SendIcon />
                </IconButton>
              </Box>

              {/* Notes Timeline */}
              {workOrder.notes && workOrder.notes.length > 0 ? (
                <Box>
                  {workOrder.notes.map((note, index) => (
                    <Box
                      key={note.id || index}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        p: 2,
                        bgcolor: '#f5f5f5',
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: '#2E75B6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.9rem',
                          flexShrink: 0,
                        }}
                      >
                        {note.user?.charAt(0) || 'U'}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {note.user}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(note.created_at), 'MMM d, h:mm a')}
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

        {/* Sidebar */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={4}>
          {/* Assignment Info */}
          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assignment
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: workOrder.assigned_to ? '#2E75B6' : '#e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <PersonIcon />
                </Box>
                <Box>
                  <Typography variant="subtitle2">
                    {workOrder.assigned_to?.name || 'Unassigned'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Technician
                  </Typography>
                </Box>
              </Box>

              {workOrder.completed_at && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Completed: {format(new Date(workOrder.completed_at), 'MMM d, yyyy h:mm a')}
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
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {workOrder.status === 'open' && (
                  <Button
                    variant="contained"
                    startIcon={<StartIcon />}
                    onClick={() => handleStatusChange('in_progress')}
                    fullWidth
                  >
                    Start Work
                  </Button>
                )}
                {workOrder.status === 'in_progress' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CompleteIcon />}
                    onClick={() => handleStatusChange('completed')}
                    fullWidth
                  >
                    Mark Complete
                  </Button>
                )}
                {workOrder.status !== 'completed' && workOrder.status !== 'cancelled' && isAdmin(user) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleStatusChange('cancelled')}
                    fullWidth
                  >
                    Cancel Work Order
                  </Button>
                )}
                {workOrder.status === 'completed' && (
                  <Alert severity="success" sx={{ py: 0.5 }}>
                    This work order has been completed
                  </Alert>
                )}
                {workOrder.status === 'cancelled' && (
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
