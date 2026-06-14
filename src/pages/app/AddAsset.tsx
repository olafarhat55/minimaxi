import { useState, useEffect } from 'react';
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
  Collapse,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Router as RouterIcon,
  Memory as SimulatorIcon,
  Cloud as MqttIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../../context/ThemeContext';
import { api } from '../../services/api';

const FALLBACK_ASSET_TYPES = ['Engine', 'Pump', 'Compressor', 'Motor', 'Conveyor', 'Turbine'];

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

type DataSourceType = 'simulator' | 'mqtt' | 'rest_api';

interface DataSourceConfig {
  type: DataSourceType;
  gatewayUrl: string;
  apiKey: string;
  pollingInterval: string;
}

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

const initialDataSource: DataSourceConfig = {
  type: 'simulator',
  gatewayUrl: 'https://factory-demo-api.minimaxi.com',
  apiKey: 'sk-gw-demo-xxxxxxxxxxxxxxxx',
  pollingInterval: '30',
};

const dataSourceOptions: { value: DataSourceType; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'simulator',
    label: 'Internal Simulator',
    description: 'Generate synthetic sensor data for testing and development',
    icon: <SimulatorIcon sx={{ fontSize: 20 }} />,
  },
  {
    value: 'mqtt',
    label: 'MQTT Broker',
    description: 'Subscribe to real-time sensor topics via MQTT protocol',
    icon: <MqttIcon sx={{ fontSize: 20 }} />,
  },
  {
    value: 'rest_api',
    label: 'REST API Gateway',
    description: 'Poll an enterprise API gateway that aggregates PLC and IoT sensor data',
    icon: <RouterIcon sx={{ fontSize: 20 }} />,
  },
];

const AddAsset = () => {
  const navigate = useNavigate();
  const { isDark } = useThemeMode();

  const [form, setForm] = useState<AssetForm>(initialAssetForm);
  const [assetTypesList, setAssetTypesList] = useState<string[]>(FALLBACK_ASSET_TYPES);
  const [sensors, setSensors] = useState<SensorConfig[]>([]);
  const [currentSensor, setCurrentSensor] = useState(initialSensor);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sensorError, setSensorError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dataSource, setDataSource] = useState<DataSourceConfig>(initialDataSource);
  const [showApiKey, setShowApiKey] = useState(false);

  // ── جلب الـ asset types من الـ API ──────────────────────────
  useEffect(() => {
    api.getAssetTypes()
      .then((data: any[]) => {
        const names = data.map((a) => a.name).filter(Boolean);
        if (names.length > 0) setAssetTypesList(names);
      })
      .catch(() => {
        // fallback للقيم الـ hardcoded لو الـ API فشل
        setAssetTypesList(FALLBACK_ASSET_TYPES);
      });
  }, []);

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

  const handleDataSourceTypeChange = (value: DataSourceType) => {
    setDataSource((prev) => ({ ...prev, type: value }));
  };

  const handleDataSourceFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDataSource((prev) => ({ ...prev, [name]: value }));
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
      await api.createMachine({
        organizationId: 17,
        name: form.name,
        serialNumber: form.serial_number,
        type: form.type,
        location: form.location,
        criticality: form.criticality.toUpperCase(),
        installationDate: new Date().toISOString().split('T')[0],
        dataSourceType: dataSource.type,
        gatewayUrl: dataSource.type === 'rest_api' ? dataSource.gatewayUrl : null,
        pollingIntervalSeconds: dataSource.type === 'rest_api'
          ? parseInt(dataSource.pollingInterval)
          : 30,
        sensors: sensors.map((s) => ({
          type: s.type,
          unit: s.unit,
          warningThreshold: parseFloat(s.warningThreshold),
          criticalThreshold: parseFloat(s.criticalThreshold),
        })),
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
              {assetTypesList.map((t) => (
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
                      <IconButton size="small" color="error" onClick={() => removeSensor(sensor.id)}>
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
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center', py: 2 }}>
            No sensors added yet. Use the form above to add sensors.
          </Typography>
        )}
      </Paper>

      {/* Data Source Configuration */}
      <Paper sx={sectionSx} elevation={0}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          Data Source Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose how this asset streams sensor readings into the platform.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {dataSourceOptions.map((opt) => {
            const selected = dataSource.type === opt.value;
            return (
              <Grid key={opt.value} size={{ xs: 12, sm: 4 }}>
                <Box
                  onClick={() => handleDataSourceTypeChange(opt.value)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `2px solid ${selected ? '#1976d2' : isDark ? '#334155' : '#e2e8f0'}`,
                    bgcolor: selected
                      ? isDark ? 'rgba(25,118,210,0.12)' : '#e3f2fd'
                      : isDark ? '#0f172a' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: '#1976d2',
                      bgcolor: isDark ? 'rgba(25,118,210,0.08)' : '#f0f7ff',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: selected ? '#1976d2' : isDark ? '#1e293b' : '#e2e8f0',
                        color: selected ? '#fff' : 'text.secondary',
                        flexShrink: 0,
                      }}
                    >
                      {opt.icon}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Radio
                        checked={selected}
                        onChange={() => handleDataSourceTypeChange(opt.value)}
                        size="small"
                        sx={{ p: 0, color: selected ? '#1976d2' : 'text.disabled' }}
                      />
                      <Typography variant="body2" fontWeight={600}>
                        {opt.label}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ pl: '52px', display: 'block' }}>
                    {opt.description}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>

        {/* REST API Gateway fields */}
        <Collapse in={dataSource.type === 'rest_api'} unmountOnExit>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: isDark ? '#0f172a' : '#f8fafc',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 2.5,
                py: 1.5,
                px: 2,
                borderRadius: 1.5,
                bgcolor: isDark ? '#1e293b' : '#fff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              }}
            >
              {[
                { label: 'PLCs & IoT', sub: 'Factory floor' },
                null,
                { label: 'API Gateway', sub: 'Every 30s' },
                null,
                { label: 'AI Model', sub: 'Prediction' },
                null,
                { label: 'Alert / WO', sub: 'Action' },
              ].map((node, idx) =>
                node === null ? (
                  <Typography key={idx} variant="body2" color="text.disabled" sx={{ mx: 0.5 }}>→</Typography>
                ) : (
                  <Box key={idx} sx={{ textAlign: 'center', px: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="primary">{node.label}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                      {node.sub}
                    </Typography>
                  </Box>
                )
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <TextField
                  fullWidth
                  label="Gateway URL"
                  name="gatewayUrl"
                  value={dataSource.gatewayUrl}
                  onChange={handleDataSourceFieldChange}
                  placeholder="https://your-gateway.example.com"
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label="API Key"
                  name="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={dataSource.apiKey}
                  onChange={handleDataSourceFieldChange}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowApiKey((v) => !v)} edge="end">
                          {showApiKey ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  fullWidth
                  label="Polling Interval"
                  name="pollingInterval"
                  type="number"
                  value={dataSource.pollingInterval}
                  onChange={handleDataSourceFieldChange}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="caption" color="text.secondary">sec</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
              The platform will poll the gateway every {dataSource.pollingInterval || '30'} seconds, forward readings
              to the AI model, and automatically generate alerts or work orders based on the prediction result.
            </Typography>
          </Box>
        </Collapse>

        {/* MQTT */}
        <Collapse in={dataSource.type === 'mqtt'} unmountOnExit>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: isDark ? '#0f172a' : '#f8fafc',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              MQTT broker configuration will be available in a future release.
            </Typography>
          </Box>
        </Collapse>

        {/* Simulator */}
        <Collapse in={dataSource.type === 'simulator'} unmountOnExit>
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: isDark ? '#0f172a' : '#f8fafc',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              The internal simulator will generate realistic sensor readings automatically. No additional configuration
              needed — ideal for demos and development environments.
            </Typography>
          </Box>
        </Collapse>
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