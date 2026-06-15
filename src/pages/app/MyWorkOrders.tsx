import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Skeleton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  
  Stack,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  CheckCircle as CompleteIcon,
  PlayArrow as StartIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Build as BuildIcon,
  Assignment as AssignmentIcon,
  Visibility as ViewIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, EmptyState } from '../../components/common';
import type { WorkOrder } from '../../types';

const normalizeStatus = (status?: string) => status?.toLowerCase() ?? '';

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#d32f2f', bg: '#ffebee', label: 'Critical' },
  high: { color: '#e64a19', bg: '#fbe9e7', label: 'High' },
  medium: { color: '#f57c00', bg: '#fff3e0', label: 'Medium' },
  low: { color: '#388e3c', bg: '#e8f5e9', label: 'Low' },
};

interface SparePart {
  name: string;
  quantity: number;
}

interface CompleteFormData {
   actionTaken: string;
  rootCause: string;
  rootCauseOther: string;   // ← أضيفي دي
  hoursSpent: string;
  minutesSpent: string;
  additionalNotes: string;
  spareParts: SparePart[];
}

const defaultCompleteForm = (): CompleteFormData => ({
  actionTaken: '',
  rootCause: '',
  rootCauseOther: '',   // ← أضيفي دي
  hoursSpent: '',
  minutesSpent: '',
  additionalNotes: '',
  spareParts: [],
});

const MyWorkOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [error, setError] = useState('');

  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [completeWO, setCompleteWO] = useState<WorkOrder | null>(null);
  const [completeForm, setCompleteForm] = useState<CompleteFormData>(defaultCompleteForm());
  const [partInput, setPartInput] = useState({ name: '', quantity: '1' });
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const [actionTakenError, setActionTakenError] = useState('');

  const fetchMyWorkOrders = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      /*
        Technician page = "My Tasks".
        We send the technician id to the backend, then we also apply a client-side
        safety filter so this page never displays other technicians' work orders.
      */
      const data = await api.getWorkOrders({
       assigned_to: user.id,
      });

      const list = Array.isArray(data) ? data : (data as any)?.content ?? [];

      const assignedOnly = list.filter((wo: WorkOrder) => {
        const assignedId = wo.assigned_to?.id;
        return assignedId == null || Number(assignedId) === Number(user.id);
      });

      setWorkOrders(assignedOnly);
    } catch (err) {
      console.error('Failed to fetch work orders:', err);
      setError('Failed to load your assigned work orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWorkOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleStartWork = async (woId: number) => {
    try {
      const updated = await api.updateWorkOrder(woId, { status: 'IN_PROGRESS' });

      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === woId
            ? { ...wo, ...(updated as WorkOrder), status: 'in_progress' }
            : wo
        )
      );
    } catch (err) {
      console.error('Failed to start work order:', err);
    }
  };

  const openNoteDialog = (wo: WorkOrder) => {
    setSelectedWO(wo);
    setNewNote('');
    setNoteDialogOpen(true);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedWO || !user) return;

    setAddingNote(true);

    try {
      await api.addWorkOrderNote(selectedWO.id, {
        user: user.name,
        text: newNote.trim(),
      });

      const updated = await api.getWorkOrderById(selectedWO.id);

      setWorkOrders((prev) =>
        prev.map((wo) => (wo.id === selectedWO.id ? updated : wo))
      );

      setNoteDialogOpen(false);
      setNewNote('');
      setSelectedWO(null);
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const openCompleteDialog = (wo: WorkOrder) => {
    setCompleteWO(wo);
    setCompleteForm(defaultCompleteForm());
    setPartInput({ name: '', quantity: '1' });
    setCompleteError('');
    setActionTakenError('');
  };

  const handleAddPart = () => {
    const name = partInput.name.trim();
    const quantity = parseInt(partInput.quantity) || 1;

    if (!name) return;

    setCompleteForm((prev) => ({
      ...prev,
      spareParts: [...prev.spareParts, { name, quantity }],
    }));

    setPartInput({ name: '', quantity: '1' });
  };

  const handleRemovePart = (index: number) => {
    setCompleteForm((prev) => ({
      ...prev,
      spareParts: prev.spareParts.filter((_, i) => i !== index),
    }));
  };

  const handleCompleteSubmit = async () => {
    if (!completeWO || !user) return;

    if (!completeForm.actionTaken.trim()) {
      setActionTakenError('Action Taken is required.');
      return;
    }

    setCompleting(true);
    setCompleteError('');

    try {
      const token = sessionStorage.getItem('token');
      const baseUrl = ((import.meta.env.VITE_API_URL as string) || 'https://minimaxi-backend-production-3500.up.railway.app/api')
        .replace(/\/api\/?$/, '');

      const response = await fetch(`${baseUrl}/api/work-orders/${completeWO.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          actionTaken: completeForm.actionTaken.trim(),
          rootCause: completeForm.rootCause === 'Other'
  ? completeForm.rootCauseOther.trim() || 'Other'
  : completeForm.rootCause.trim() || undefined,
          spareParts: completeForm.spareParts.length > 0 ? completeForm.spareParts : undefined,
          hoursSpent: completeForm.hoursSpent ? parseInt(completeForm.hoursSpent) : undefined,
          minutesSpent: completeForm.minutesSpent ? parseInt(completeForm.minutesSpent) : undefined,
          additionalNotes: completeForm.additionalNotes.trim() || undefined,
          completedByUserId: user.id,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message ?? `Error ${response.status}`);
      }

      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === completeWO.id
            ? { ...wo, status: 'completed', completed_at: new Date().toISOString() }
            : wo
        )
      );

      setCompleteWO(null);
    } catch (err: any) {
      setCompleteError(err.message ?? 'Failed to complete work order. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const activeWOs = workOrders.filter((wo) => {
    const status = normalizeStatus(wo.status);
    return status !== 'completed' && status !== 'cancelled' && status !== 'closed';
  });

  const completedWOs = workOrders.filter((wo) => {
    const status = normalizeStatus(wo.status);
    return status === 'completed' || status === 'closed';
  });

  const SectionLabel = ({ label, count, color }: { label: string; count: number; color: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ width: 4, height: 24, borderRadius: 2, bgcolor: color }} />
      <Typography variant="h6" fontWeight={700}>
        {label}
      </Typography>
      <Chip
        label={count}
        size="small"
        sx={{
          bgcolor: `${color}18`,
          color,
          fontWeight: 700,
          height: 24,
          minWidth: 32,
        }}
      />
    </Box>
  );

  const renderActions = (wo: WorkOrder) => {
    const status = normalizeStatus(wo.status);
    const isDone = status === 'completed' || status === 'closed';

    if (isDone) {
      return (
        <Button
          variant="outlined"
          size="medium"
          startIcon={<ViewIcon />}
          onClick={() => navigate(`/machines/${wo.machine_id}`)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, width: '100%' }}
        >
          View Asset
        </Button>
      );
    }

    return (
      <Stack spacing={1}>
        <Button
          variant="outlined"
          size="medium"
          startIcon={<ViewIcon />}
          onClick={() => navigate(`/machines/${wo.machine_id}`)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          View Asset
        </Button>

        

        {(status === 'open' || status === 'assigned') && (
          <Button
            variant="contained"
            size="medium"
            startIcon={<StartIcon />}
            onClick={() => handleStartWork(wo.id)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Start Work
          </Button>
        )}

        {status === 'in_progress' && (
          <Button
            variant="contained"
            size="medium"
            color="success"
            startIcon={<CompleteIcon />}
            onClick={() => openCompleteDialog(wo)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            Mark Complete
          </Button>
        )}
      </Stack>
    );
  };

  const renderCard = (wo: WorkOrder) => {
    const status = normalizeStatus(wo.status);
    const isDone = status === 'completed' || status === 'closed';
    const priority = wo.priority?.toLowerCase() ?? 'low';
    const pConfig = priorityConfig[priority] ?? {
      color: '#757575',
      bg: '#f5f5f5',
      label: priority,
    };

    return (
      <Card
        key={wo.id}
        elevation={0}
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderLeft: `5px solid ${isDone ? '#4caf50' : pConfig.color}`,
          boxShadow: '0 6px 20px rgba(0,0,0,0.07)',
          opacity: isDone ? 0.86 : 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 26px rgba(0,0,0,0.10)',
          },
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(0, 1fr) 220px 190px',
              },
              gap: { xs: 2, md: 0 },
              alignItems: 'center',
            }}
          >
            {/* Left Section */}
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {wo.wo_number}
                </Typography>

                <Chip
                  label={pConfig.label}
                  size="small"
                  sx={{
                    bgcolor: pConfig.bg,
                    color: pConfig.color,
                    fontWeight: 700,
                    border: `1px solid ${pConfig.color}30`,
                  }}
                />

                <StatusBadge status={wo.status} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                <AssignmentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" noWrap>
                  {wo.asset_id} · {wo.machine_name}
                </Typography>
              </Box>

              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{
                  mb: 0.75,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {wo.title}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  lineHeight: 1.7,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {wo.description || '—'}
              </Typography>
            </Box>

            {/* Middle Section */}
            <Box
              sx={{
                px: { xs: 2.5, md: 3 },
                py: { xs: 0, md: 3 },
                borderLeft: { xs: 'none', md: '1px solid' },
                borderRight: { xs: 'none', md: '1px solid' },
                borderTop: { xs: '1px solid', md: 'none' },
                borderBottom: { xs: '1px solid', md: 'none' },
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <CalendarIcon sx={{ fontSize: 22, color: 'text.secondary', mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {wo.due_date ? format(new Date(wo.due_date), 'MMM d, yyyy') : '—'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <TimeIcon sx={{ fontSize: 22, color: 'text.secondary', mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Est. Time
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {wo.estimated_hours ? `${wo.estimated_hours} hrs` : '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right Section */}
            <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              {renderActions(wo)}
            </Box>
          </Box>

          {wo.notes?.length > 0 && (
            <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                <NotesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  NOTES
                </Typography>
              </Box>

              <Stack spacing={1}>
                {wo.notes.slice(0, 2).map((note) => (
                  <Box key={note.id} sx={{ bgcolor: 'background.paper', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="body2">{note.text}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {note.user} · {note.created_at ? format(new Date(note.created_at), 'MMM d, h:mm a') : ''}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1280 }}>
        <Skeleton variant="text" height={46} width={260} sx={{ mb: 2 }} />
        <Stack spacing={3}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={170} sx={{ borderRadius: 4 }} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1280 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          My Work Orders
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage your assigned maintenance tasks
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {workOrders.length === 0 ? (
        <EmptyState
          title="No work orders assigned"
          description="You don't have any work orders assigned to you yet."
        />
      ) : (
        <Stack spacing={5}>
          <Box>
            <SectionLabel label="Active" count={activeWOs.length} color="#1976d2" />
            {activeWOs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No active work orders.
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {activeWOs.map(renderCard)}
              </Stack>
            )}
          </Box>

          <Box>
            <SectionLabel label="Completed" count={completedWOs.length} color="#4caf50" />
            {completedWOs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No completed work orders yet.
              </Typography>
            ) : (
              <Stack spacing={2.5}>
                {completedWOs.map(renderCard)}
              </Stack>
            )}
          </Box>
        </Stack>
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
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Add Note
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedWO?.wo_number}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Describe what you observed or did..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mt: 1 }}
            disabled={addingNote}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setNoteDialogOpen(false);
              setNewNote('');
              setSelectedWO(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleAddNote}
            disabled={!newNote.trim() || addingNote}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {addingNote ? <CircularProgress size={18} /> : 'Add Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Work Order Dialog */}
      <Dialog
        open={!!completeWO}
        onClose={() => !completing && setCompleteWO(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Complete Work Order
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completeWO?.wo_number} — {completeWO?.machine_name}
              </Typography>
            </Box>

            <IconButton onClick={() => setCompleteWO(null)} disabled={completing} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={2.5}>
            {completeError && (
              <Alert severity="error" onClose={() => setCompleteError('')} sx={{ borderRadius: 2 }}>
                {completeError}
              </Alert>
            )}

            <TextField
              label="Action Taken *"
              multiline
              rows={3}
              fullWidth
              placeholder="Describe what was done to resolve the issue..."
              value={completeForm.actionTaken}
              onChange={(e) => {
                setCompleteForm((p) => ({ ...p, actionTaken: e.target.value }));
                setActionTakenError('');
              }}
              error={!!actionTakenError}
              helperText={actionTakenError}
              disabled={completing}
            />

          <FormControl fullWidth disabled={completing}>
  <InputLabel>Root Cause</InputLabel>
  <Select
    label="Root Cause"
    value={completeForm.rootCause}
    onChange={(e) => setCompleteForm((p) => ({ ...p, rootCause: e.target.value }))}
  >
    <MenuItem value="Vibration">Vibration</MenuItem>
    <MenuItem value="Overheating">Overheating</MenuItem>
    <MenuItem value="Wear and Tear">Wear and Tear</MenuItem>
    <MenuItem value="Electrical Fault">Electrical Fault</MenuItem>
    <MenuItem value="Mechanical Failure">Mechanical Failure</MenuItem>
    <MenuItem value="Other">Other</MenuItem>
  </Select>
</FormControl>
{completeForm.rootCause === 'Other' && (
  <TextField
    label="Please specify"
    fullWidth
    placeholder="Describe the root cause..."
    value={completeForm.rootCauseOther}
    onChange={(e) =>
      setCompleteForm((p) => ({ ...p, rootCauseOther: e.target.value }))
    }
    disabled={completing}
  />
)}
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                TIME SPENT
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Hours"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={completeForm.hoursSpent}
                  onChange={(e) => setCompleteForm((p) => ({ ...p, hoursSpent: e.target.value }))}
                  disabled={completing}
                />
                <TextField
                  label="Minutes"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0, max: 59 }}
                  value={completeForm.minutesSpent}
                  onChange={(e) => setCompleteForm((p) => ({ ...p, minutesSpent: e.target.value }))}
                  disabled={completing}
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                SPARE PARTS USED
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="Part name"
                  value={partInput.name}
                  onChange={(e) => setPartInput((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPart();
                    }
                  }}
                  sx={{ flexGrow: 1 }}
                  disabled={completing}
                />
                <TextField
                  size="small"
                  label="Qty"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={partInput.quantity}
                  onChange={(e) => setPartInput((p) => ({ ...p, quantity: e.target.value }))}
                  sx={{ width: 90 }}
                  disabled={completing}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddPart}
                  disabled={!partInput.name.trim() || completing}
                  sx={{ textTransform: 'none', borderRadius: 2, minWidth: 70 }}
                >
                  Add
                </Button>
              </Box>

              {completeForm.spareParts.length > 0 ? (
                <Stack spacing={0.75}>
                  {completeForm.spareParts.map((part, i) => (
                    <Box
                      key={`${part.name}-${i}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BuildIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2">{part.name}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Chip label={`×${part.quantity}`} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                        <IconButton size="small" onClick={() => handleRemovePart(i)} disabled={completing}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No parts added yet.
                </Typography>
              )}
            </Box>

            <TextField
              label="Additional Notes"
              multiline
              rows={2}
              fullWidth
              placeholder="Any extra observations or follow-up actions needed..."
              value={completeForm.additionalNotes}
              onChange={(e) => setCompleteForm((p) => ({ ...p, additionalNotes: e.target.value }))}
              disabled={completing}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5 }}>
          <Button
            onClick={() => setCompleteWO(null)}
            disabled={completing}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={completing ? <CircularProgress size={16} color="inherit" /> : <CompleteIcon />}
            onClick={handleCompleteSubmit}
            disabled={completing}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {completing ? 'Saving...' : 'Mark as Completed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyWorkOrders;