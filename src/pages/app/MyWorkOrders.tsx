import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Skeleton,
  LinearProgress,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, EmptyState } from '../../components/common';
import type { WorkOrder } from '../../types';

const priorityColors: Record<string, string> = {
  critical: '#f44336',
  high: '#ff5722',
  medium: '#ff9800',
  low: '#4caf50',
};

const MyWorkOrders = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    const fetchMyWorkOrders = async () => {
      setLoading(true);
      try {
        const data = await api.getWorkOrders({ assigned_to: user.id });
        setWorkOrders(data);
      } catch (error) {
        console.error('Failed to fetch work orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyWorkOrders();
  }, [user.id]);

  const handleUpdateStatus = async (woId: number, newStatus: string) => {
    try {
      const updated = await api.updateWorkOrder(woId, { status: newStatus });
      setWorkOrders(workOrders.map((wo) => (wo.id === woId ? updated : wo)));
    } catch (error) {
      console.error('Failed to update work order:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedWO) return;

    try {
      await api.addWorkOrderNote(selectedWO.id, {
        user: user.name,
        text: newNote,
      });
      // Refresh the work order
      const updated = await api.getWorkOrderById(selectedWO.id);
      setWorkOrders(workOrders.map((wo) => (wo.id === selectedWO.id ? updated : wo)));
      setNoteDialogOpen(false);
      setNewNote('');
      setSelectedWO(null);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const activeWOs = workOrders.filter((wo) => wo.status !== 'completed');
  const completedWOs = workOrders.filter((wo) => wo.status === 'completed');

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            // @ts-expect-error MUI v7 Grid item prop
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const renderWorkOrderCard = (wo: WorkOrder) => (
    <Card
      key={wo.id}
      sx={{
        borderRadius: 2,
        borderLeft: `4px solid ${priorityColors[wo.priority]}`,
        opacity: wo.status === 'completed' ? 0.7 : 1,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {wo.wo_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {wo.asset_id} - {wo.machine_name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={wo.priority}
              size="small"
              sx={{
                bgcolor: `${priorityColors[wo.priority]}15`,
                color: priorityColors[wo.priority],
                textTransform: 'capitalize',
              }}
            />
            <StatusBadge status={wo.status} />
          </Box>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          {wo.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {wo.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Due Date
            </Typography>
            <Typography variant="body2">
              {wo.due_date && format(new Date(wo.due_date), 'MMM d, yyyy h:mm a')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Est. Time
            </Typography>
            <Typography variant="body2">
              {wo.estimated_hours} hours
            </Typography>
          </Box>
        </Box>

        {wo.parts_needed && wo.parts_needed.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Parts Needed
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {wo.parts_needed.map((part, index) => (
                <Chip key={index} label={part} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {wo.status === 'open' && (
            <Button
              variant="contained"
              size="small"
              startIcon={<StartIcon />}
              onClick={() => handleUpdateStatus(wo.id, 'in_progress')}
            >
              Start Work
            </Button>
          )}
          {wo.status === 'in_progress' && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedWO(wo);
                  setNoteDialogOpen(true);
                }}
              >
                Add Note
              </Button>
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<CompleteIcon />}
                onClick={() => handleUpdateStatus(wo.id, 'completed')}
              >
                Mark Complete
              </Button>
            </>
          )}
        </Box>

        {/* Notes */}
        {wo.notes && wo.notes.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Notes
            </Typography>
            {wo.notes.map((note) => (
              <Box
                key={note.id}
                sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1, mt: 1 }}
              >
                <Typography variant="body2">{note.text}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {note.user} - {format(new Date(note.created_at), 'MMM d, h:mm a')}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        My Work Orders
      </Typography>

      {workOrders.length === 0 ? (
        <EmptyState
          title="No work orders assigned"
          description="You don't have any work orders assigned to you yet."
        />
      ) : (
        <>
          {/* Active Work Orders */}
          {activeWOs.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Active ({activeWOs.length})
              </Typography>
              <Grid container spacing={3}>
                {activeWOs.map((wo) => (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={12} md={6} key={wo.id}>
                    {renderWorkOrderCard(wo)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Completed Work Orders */}
          {completedWOs.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Completed ({completedWOs.length})
              </Typography>
              <Grid container spacing={3}>
                {completedWOs.map((wo) => (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={12} md={6} key={wo.id}>
                    {renderWorkOrderCard(wo)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}

      {/* Add Note Dialog */}
      <Dialog
        open={noteDialogOpen}
        onClose={() => {
          setNoteDialogOpen(false);
          setNewNote('');
          setSelectedWO(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Note to {selectedWO?.wo_number}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter your note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNoteDialogOpen(false);
            setNewNote('');
            setSelectedWO(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNote}
            disabled={!newNote.trim()}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyWorkOrders;
