import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Autocomplete,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/permissions';
import type { Machine, User } from '../../types';

const priorities = [
  { value: 'critical', label: 'Critical', color: '#f44336' },
  { value: 'high', label: 'High', color: '#ff5722' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'low', label: 'Low', color: '#4caf50' },
];

const CreateWorkOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const preselectedMachine = location.state?.machine;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [partInput, setPartInput] = useState('');

  const [formData, setFormData] = useState({
    machine_id: preselectedMachine?.id || '',
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: null,
    due_date: '',
    estimated_hours: '',
    parts_needed: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [machinesData, usersData] = await Promise.all([
          api.getMachines(),
          api.getUsers(),
        ]);
        setMachines(machinesData);
        setTechnicians(usersData.filter((u) => u.role === 'technician'));
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleMachineChange = (event: React.SyntheticEvent, newValue: Machine | null) => {
    setFormData((prev) => ({
      ...prev,
      machine_id: newValue?.id || '',
    }));
    setErrors((prev) => ({ ...prev, machine_id: '' }));
  };

  const handleTechnicianChange = (event: React.SyntheticEvent, newValue: User | null) => {
    setFormData((prev) => ({
      ...prev,
      assigned_to: newValue ? { id: newValue.id, name: newValue.name } : null,
    }));
  };

  const handleAddPart = () => {
    if (partInput.trim() && !formData.parts_needed.includes(partInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        parts_needed: [...prev.parts_needed, partInput.trim()],
      }));
      setPartInput('');
    }
  };

  const handleRemovePart = (partToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      parts_needed: prev.parts_needed.filter((part) => part !== partToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.machine_id) {
      newErrors.machine_id = 'Please select an asset';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    try {
      const workOrderData = {
        ...formData,
        created_by: { id: user.id, name: user.name },
      };

      await api.createWorkOrder(workOrderData);
      setSuccess('Work order created successfully!');

      setTimeout(() => {
        navigate('/work-orders');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create work order');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMachine = machines.find((m) => m.id === formData.machine_id);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={600}>
          Create Work Order
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Form */}
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Work Order Details
                </Typography>

                <Grid container spacing={2}>
                  {/* Asset Selection */}
                  {/* @ts-expect-error MUI v7 Grid item prop */}
                  <Grid item xs={12}>
                    <Autocomplete
                      options={machines}
                      getOptionLabel={(option) => `${option.asset_id} - ${option.name}`}
                      value={selectedMachine || null}
                      onChange={handleMachineChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Asset"
                          required
                          error={!!errors.machine_id}
                          helperText={errors.machine_id}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {option.asset_id} - {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.type} | {option.location}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </Grid>

                  {/* Title */}
                  {/* @ts-expect-error MUI v7 Grid item prop */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      error={!!errors.title}
                      helperText={errors.title}
                      required
                      placeholder="Brief description of the work needed"
                    />
                  </Grid>

                  {/* Description */}
                  {/* @ts-expect-error MUI v7 Grid item prop */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      error={!!errors.description}
                      helperText={errors.description}
                      required
                      placeholder="Detailed description of the work to be performed"
                    />
                  </Grid>

                  {/* Priority & Estimated Hours */}
                  {/* @ts-expect-error MUI v7 Grid item prop */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      select
                      label="Priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                    >
                      {priorities.map((priority) => (
                        <MenuItem key={priority.value} value={priority.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: priority.color,
                              }}
                            />
                            {priority.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* @ts-expect-error MUI v7 Grid item prop */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Estimated Hours"
                      name="estimated_hours"
                      value={formData.estimated_hours}
                      onChange={handleChange}
                      inputProps={{ min: 0, step: 0.5 }}
                    />
                  </Grid>

                  {/* Due Date */}
                  {/* @ts-expect-error MUI v7 Grid item prop */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="datetime-local"
                      label="Due Date"
                      name="due_date"
                      value={formData.due_date}
                      onChange={handleChange}
                      error={!!errors.due_date}
                      helperText={errors.due_date}
                      InputLabelProps={{ shrink: true }}
                      required
                    />
                  </Grid>

                  {/* Technician Assignment (Admin only) */}
                  {isAdmin(user) && (
                    // @ts-expect-error MUI v7 Grid item prop
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        options={technicians}
                        getOptionLabel={(option) => option.name}
                        value={formData.assigned_to ? technicians.find((t) => t.id === formData.assigned_to.id) : null}
                        onChange={handleTechnicianChange}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Assign to Technician"
                            placeholder="Select technician (optional)"
                          />
                        )}
                      />
                    </Grid>
                  )}

                  {/* Parts Needed */}
                  {/* @ts-expect-error MUI v7 Grid item prop */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Parts Needed
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Add part name"
                        value={partInput}
                        onChange={(e) => setPartInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPart();
                          }
                        }}
                        sx={{ flexGrow: 1 }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleAddPart}
                        startIcon={<AddIcon />}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {formData.parts_needed.map((part, index) => (
                        <Chip
                          key={index}
                          label={part}
                          onDelete={() => handleRemovePart(part)}
                          deleteIcon={<CloseIcon />}
                        />
                      ))}
                      {formData.parts_needed.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No parts added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar - Asset Info */}
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={4}>
            {selectedMachine ? (
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Selected Asset
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Asset ID
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {selectedMachine.asset_id}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body2">
                        {selectedMachine.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Type
                      </Typography>
                      <Typography variant="body2">
                        {selectedMachine.type}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2">
                        {selectedMachine.location}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Current Status
                      </Typography>
                      <Chip
                        label={selectedMachine.status}
                        size="small"
                        sx={{
                          mt: 0.5,
                          textTransform: 'capitalize',
                          bgcolor:
                            selectedMachine.status === 'critical'
                              ? '#ffebee'
                              : selectedMachine.status === 'warning'
                              ? '#fff3e0'
                              : '#e8f5e9',
                          color:
                            selectedMachine.status === 'critical'
                              ? '#f44336'
                              : selectedMachine.status === 'warning'
                              ? '#ff9800'
                              : '#4caf50',
                        }}
                      />
                    </Box>
                    {selectedMachine.prediction && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Failure Probability
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          color={
                            selectedMachine.prediction.failure_probability >= 70
                              ? 'error'
                              : selectedMachine.prediction.failure_probability >= 40
                              ? 'warning.main'
                              : 'success.main'
                          }
                        >
                          {selectedMachine.prediction.failure_probability}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ borderRadius: 2, bgcolor: '#fafafa' }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    Select an asset to see details
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Submit Buttons */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Create Work Order'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CreateWorkOrder;
