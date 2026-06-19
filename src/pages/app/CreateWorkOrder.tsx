import { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  MenuItem, Autocomplete, Chip, IconButton, Alert, CircularProgress, Divider,
} from '@mui/material';
import { ArrowBack as BackIcon, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isEngineer, isAdmin } from '../../utils/permissions';
import type { Machine, User } from '../../types';
import { api } from '../../services/api';

const priorities = [
  { value: 'critical', label: 'Critical', color: '#f44336' },
  { value: 'high',     label: 'High',     color: '#ff5722' },
  { value: 'medium',   label: 'Medium',   color: '#ff9800' },
  { value: 'low',      label: 'Low',      color: '#4caf50' },
];

const fieldSx = { width: '100%' };

const CreateWorkOrder = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();

  const isEditMode         = Boolean(id);
  const preselectedMachine = location.state?.machine;

  const [loading, setLoading]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');
  const [machines, setMachines]     = useState<Machine[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  

  const [formData, setFormData] = useState({
    machine_id:      preselectedMachine?.id || '',
    title:           '',
    description:     '',
    priority:        'medium',
    assigned_to:     null as { id: number; name: string } | null,
    due_date:        '',
    estimated_hours: '',
    parts_needed:    [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [machinesRaw, usersRaw] = await Promise.all([api.getMachines(), api.getUsers()]);
        const ml = Array.isArray(machinesRaw) ? machinesRaw : (machinesRaw as any)?.content ?? [];
        const ul = Array.isArray(usersRaw)    ? usersRaw    : (usersRaw as any)?.content    ?? [];
        setMachines(ml);
        // Filter only technicians from the company users list
        setTechnicians(ul.filter((u: User) => u.role === 'technician'));
      } catch (err) {
        console.error(err);
      }

      if (isEditMode && id) {
        try {
          const wo = await api.getWorkOrderById(id);
          setFormData({
            machine_id:      wo.machine_id != null ? String(wo.machine_id) : '',
            title:           wo.title           ?? '',
            description:     wo.description     ?? '',
            priority:        wo.priority        ?? 'medium',
            assigned_to:     wo.assigned_to ? { id: wo.assigned_to.id, name: wo.assigned_to.name } : null,
            due_date:        wo.due_date
              ? (wo.due_date.length === 10 ? `${wo.due_date}T00:00` : wo.due_date.slice(0, 16))
              : '',
            estimated_hours: wo.estimated_hours != null ? String(wo.estimated_hours) : '',
            parts_needed:    wo.parts_needed    ?? [],
          });
        } catch (err) {
          console.error(err);
          setError('Failed to load work order data.');
        }
      }
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.machine_id)         e.machine_id  = 'Please select an asset';
    if (!formData.title.trim())       e.title       = 'Title is required';
    if (!formData.description.trim()) e.description = 'Description is required';
    if (!formData.due_date)           e.due_date    = 'Due date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError('');
    try {
      if (isEditMode && id) {
      await api.updateWorkOrder(id, {
  title:            formData.title,
  description:      formData.description,
  priority:         formData.priority.toUpperCase(),
  dueDate:          formData.due_date ? formData.due_date.split('T')[0] : undefined,
  assignedToUserId: formData.assigned_to?.id,
  estimatedHours:   formData.estimated_hours ? Number(formData.estimated_hours) : undefined, // ✅ أضيفي دي
});
        setSuccess('Work order updated successfully!');
      } else {
        // بعد
await api.createWorkOrder({
  machine_id:      formData.machine_id,
  title:           formData.title,
  description:     formData.description,
  priority:        formData.priority,
  assigned_to:     formData.assigned_to,
  due_date:        formData.due_date,
  estimated_hours: formData.estimated_hours,
});
        setSuccess('Work order created successfully!');
      }
      setTimeout(() => navigate('/work-orders'), 1500);
    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} work order`);
    } finally {
      setSubmitting(false);
    }
  };

  // Show "Assign to Technician" for both Engineer and Admin roles
  const canAssign = isEngineer(user) || isAdmin(user);

  const selectedMachine = machines.find(m => m.id === formData.machine_id);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}><BackIcon /></IconButton>
        <Typography variant="h5" fontWeight={600}>
          {isEditMode ? 'Edit Work Order' : 'Create Work Order'}
        </Typography>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error   && <Alert severity="error"   sx={{ mb: 3 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

          {/* ── Left: Main Form ── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>Work Order Details</Typography>
                <Divider sx={{ mb: 3 }} />

                {/* Select Asset — create only */}
                {!isEditMode && (
                  <Box sx={{ mb: 3 }}>
                    <Autocomplete
                      options={machines}
                      getOptionLabel={o => `${o.asset_id} - ${o.name}`}
                      value={selectedMachine || null}
                      onChange={(_e, v) => {
                        setFormData(p => ({ ...p, machine_id: v?.id || '' }));
                        setErrors(p => ({ ...p, machine_id: '' }));
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Select Asset *"
                          error={!!errors.machine_id}
                          helperText={errors.machine_id}
                          sx={fieldSx}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {option.asset_id} — {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.type} | {option.location}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </Box>
                )}

                {/* Title */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    sx={fieldSx} label="Title *" name="title"
                    value={formData.title} onChange={handleChange}
                    error={!!errors.title} helperText={errors.title}
                    placeholder="Brief description of the work needed"
                  />
                </Box>

                {/* Description */}
                <Box sx={{ mb: 3 }}>
                  <TextField
                    sx={fieldSx} multiline rows={4} label="Description *" name="description"
                    value={formData.description} onChange={handleChange}
                    error={!!errors.description} helperText={errors.description}
                    placeholder="Detailed description of the work to be performed"
                  />
                </Box>

                {/* Priority + Estimated Hours */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 180 }}>
                    <TextField
                      select sx={fieldSx} label="Priority" name="priority"
                      value={formData.priority} onChange={handleChange}
                    >
                      {priorities.map(p => (
                        <MenuItem key={p.value} value={p.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
                            {p.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 180 }}>
                    <TextField
                      sx={fieldSx} type="number" label="Estimated Hours" name="estimated_hours"
                      value={formData.estimated_hours} onChange={handleChange}
                      inputProps={{ min: 0, step: 0.5 }}
                    />
                  </Box>
                </Box>

                {/* Due Date + Assign To */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 180 }}>
                    <TextField
                      sx={fieldSx} type="datetime-local" label="Due Date *" name="due_date"
                      value={formData.due_date} onChange={handleChange}
                      error={!!errors.due_date} helperText={errors.due_date}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>

                  {/* Assign To — visible for Engineer and Admin */}
                  {canAssign && (
                    <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 180 }}>
                      <Autocomplete
                        options={technicians}
                        getOptionLabel={o => o.name}
                        value={
                          formData.assigned_to
                            ? technicians.find(t => t.id === formData.assigned_to!.id) ?? null
                            : null
                        }
                        onChange={(_e, v) =>
                          setFormData(p => ({ ...p, assigned_to: v ? { id: v.id, name: v.name } : null }))
                        }
                        noOptionsText="No technicians found"
                        renderInput={params => (
                          <TextField
                            {...params}
                            sx={fieldSx}
                            label="Assign to Technician"
                            placeholder="Select technician (optional)"
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                            </Box>
                          </li>
                        )}
                      />
                    </Box>
                  )}
                </Box>

                

              </CardContent>
            </Card>
          </Box>

          {/* ── Right: Sidebar ── */}
          <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>

            {/* Selected Asset Card — create only */}
            {!isEditMode && (
              <Card sx={{ borderRadius: 2, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Selected Asset</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {selectedMachine ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {([
                        ['Asset ID', selectedMachine.asset_id],
                        ['Name',     selectedMachine.name],
                        ['Type',     selectedMachine.type],
                        ['Location', selectedMachine.location],
                      ] as [string, string][]).map(([label, val]) => (
                        <Box key={label}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" fontWeight={500}>{val}</Typography>
                        </Box>
                      ))}
                      <Box>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={selectedMachine.status}
                            size="small"
                            sx={{
                              textTransform: 'capitalize',
                              bgcolor:
                                selectedMachine.status === 'critical' ? '#ffebee' :
                                selectedMachine.status === 'warning'  ? '#fff3e0' : '#e8f5e9',
                              color:
                                selectedMachine.status === 'critical' ? '#f44336' :
                                selectedMachine.status === 'warning'  ? '#ff9800' : '#4caf50',
                            }}
                          />
                        </Box>
                      </Box>
                      {selectedMachine.prediction && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Failure Probability</Typography>
                          <Typography
                            variant="body2" fontWeight={500}
                            color={
                              selectedMachine.prediction.failure_probability >= 70 ? 'error' :
                              selectedMachine.prediction.failure_probability >= 40 ? 'warning.main' : 'success.main'
                            }
                          >
                            {selectedMachine.prediction.failure_probability}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Select an asset to see details
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button type="submit" variant="contained" fullWidth size="large" disabled={submitting}>
                {submitting
                  ? <CircularProgress size={22} />
                  : isEditMode ? 'Save Changes' : 'Create Work Order'
                }
              </Button>
              <Button variant="outlined" fullWidth onClick={() => navigate(-1)} disabled={submitting}>
                Cancel
              </Button>
            </Box>

          </Box>
        </Box>
      </form>
    </Box>
  );
};

export default CreateWorkOrder;