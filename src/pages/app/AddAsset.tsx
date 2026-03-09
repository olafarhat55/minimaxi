import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';
import { api } from '../../services/api';

const assetTypes = ['Engine', 'Pump', 'Compressor', 'Motor', 'Conveyor', 'Turbine'];

const criticalityOptions = [
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'low', label: 'Low', color: '#10B981' },
];

const sensorTypes = ['Temperature', 'Vibration', 'Pressure', 'RPM'] as const;

const sensorUnits: Record<string, string> = {
  Temperature: '°C',
  Vibration: 'mm/s',
  Pressure: 'BAR',
  RPM: 'RPM',
};

interface SensorConfig {
  id: string;
  type: string;
  unit: string;
  warningThreshold: string;
  criticalThreshold: string;
}

interface AssetForm {
  name: string;
  serial_number: string;
  type: string;
  location: string;
  criticality: string;
}

const initialAssetForm: AssetForm = {
  name: '',
  serial_number: '',
  type: '',
  location: '',
  criticality: 'medium',
};

const initialSensor = {
  type: '',
  unit: '',
  warningThreshold: '',
  criticalThreshold: '',
};

const AddAsset = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();

  const [form, setForm] = useState<AssetForm>(initialAssetForm);
  const [sensors, setSensors] = useState<SensorConfig[]>([]);
  const [currentSensor, setCurrentSensor] = useState(initialSensor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sensorError, setSensorError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSensorTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value;
    setCurrentSensor((prev) => ({
      ...prev,
      type,
      unit: sensorUnits[type] || '',
    }));
    setSensorError('');
  };

  const handleSensorFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSensor((prev) => ({ ...prev, [name]: value }));
    setSensorError('');
  };

  const addSensor = () => {
    if (!currentSensor.type) {
      setSensorError('Please select a sensor type');
      return;
    }
    if (!currentSensor.warningThreshold || !currentSensor.criticalThreshold) {
      setSensorError('Please fill in both thresholds');
      return;
    }
    if (Number(currentSensor.warningThreshold) >= Number(currentSensor.criticalThreshold)) {
      setSensorError('Warning threshold must be less than critical threshold');
      return;
    }
    if (sensors.some((s) => s.type === currentSensor.type)) {
      setSensorError('This sensor type is already added');
      return;
    }

    const newSensor: SensorConfig = {
      id: Date.now().toString(),
      ...currentSensor,
    };
    setSensors((prev) => [...prev, newSensor]);
    setCurrentSensor(initialSensor);
    setSensorError('');
  };

  const removeSensor = (id: string) => {
    setSensors((prev) => prev.filter((s) => s.id !== id));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Asset name is required';
    if (!form.serial_number.trim()) newErrors.serial_number = 'Serial number is required';
    if (!form.type) newErrors.type = 'Asset type is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const sensorData: Record<string, number> = {};
      sensors.forEach((s) => {
        sensorData[s.type.toLowerCase()] = 0;
      });

      await api.createMachine({
        name: form.name,
        serial_number: form.serial_number,
        type: form.type,
        location: form.location,
        criticality: form.criticality,
        manufacturer: '',
        model: '',
        installation_date: new Date().toISOString().split('T')[0],
        last_maintenance: new Date().toISOString().split('T')[0],
        sensors: Object.keys(sensorData).length > 0 ? sensorData : undefined,
      });

      setSnackbar({ open: true, message: 'Asset added successfully!', severity: 'success' });
      setTimeout(() => navigate('/machines'), 1200);
    } catch {
      setSnackbar({ open: true, message: 'Failed to add asset. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/machines');
  };

  const sectionSx = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    bgcolor: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
  };

  const tableHeaderSx = {
    bgcolor: isDark ? '#283444' : '#f5f5f5',
    '& th': {
      color: isDark ? '#e5e5e5' : 'inherit',
      fontWeight: 600,
      fontSize: '0.875rem',
      borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
    },
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={handleCancel} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Add Asset
        </Typography>
      </Box>

      {/* Asset Information */}
      <Paper sx={sectionSx} elevation={0}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
          Asset Information
        </Typography>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Asset Name"
              name="name"
              placeholder="Engine"
              value={form.name}
              onChange={handleFormChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Serial Number"
              name="serial_number"
              placeholder="ENG#23"
              value={form.serial_number}
              onChange={handleFormChange}
              error={!!errors.serial_number}
              helperText={errors.serial_number}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Asset Type"
              name="type"
              value={form.type}
              onChange={handleFormChange}
              error={!!errors.type}
              helperText={errors.type}
            >
              {assetTypes.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              placeholder="Line A"
              value={form.location}
              onChange={handleFormChange}
              error={!!errors.location}
              helperText={errors.location}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Criticality
            </Typography>
            <RadioGroup
              row
              name="criticality"
              value={form.criticality}
              onChange={handleFormChange}
            >
              {criticalityOptions.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  control={
                    <Radio
                      sx={{
                        color: opt.color,
                        '&.Mui-checked': { color: opt.color },
                      }}
                    />
                  }
                />
              ))}
            </RadioGroup>
          </Grid>
        </Grid>
      </Paper>

      {/* Sensor Configuration */}
      <Paper sx={sectionSx} elevation={0}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5 }}>
          Sensor Configuration
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Sensor"
              value={currentSensor.type}
              onChange={handleSensorTypeChange}
            >
              {sensorTypes.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Unit"
              name="unit"
              value={currentSensor.unit}
              onChange={handleSensorFieldChange}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Warning Threshold"
              name="warningThreshold"
              type="number"
              value={currentSensor.warningThreshold}
              onChange={handleSensorFieldChange}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="Critical Threshold"
              name="criticalThreshold"
              type="number"
              value={currentSensor.criticalThreshold}
              onChange={handleSensorFieldChange}
            />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addSensor}
          >
            Add Sensor
          </Button>
        </Box>

        {sensorError && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {sensorError}
          </Typography>
        )}

        {/* Sensors Table */}
        {sensors.length > 0 && (
          <TableContainer sx={{ mt: 3, borderRadius: 1, border: `1px solid ${isDark ? '#404040' : '#e0e0e0'}` }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={tableHeaderSx}>
                  <TableCell>Sensor</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Warning Threshold</TableCell>
                  <TableCell>Critical Threshold</TableCell>
                  <TableCell align="center" sx={{ width: 60 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sensors.map((sensor) => (
                  <TableRow key={sensor.id}>
                    <TableCell>{sensor.type}</TableCell>
                    <TableCell>{sensor.unit}</TableCell>
                    <TableCell>{sensor.warningThreshold}</TableCell>
                    <TableCell>{sensor.criticalThreshold}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => removeSensor(sensor.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {sensors.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center', py: 2 }}
          >
            No sensors added yet. Use the form above to add sensors.
          </Typography>
        )}
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
        <Button variant="outlined" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Adding...' : 'Add Asset'}
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddAsset;
