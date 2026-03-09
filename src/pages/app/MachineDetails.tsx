import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Skeleton,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  Assignment as WorkOrderIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { StatusBadge } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { isTechnician } from '../../utils/permissions';
import type { Machine } from '../../types';

const MachineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [sensorHistory, setSensorHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('0s ago');

  useEffect(() => {
    const fetchMachineDetails = async () => {
      setLoading(true);
      try {
        const [machineData, historyData] = await Promise.all([
          api.getMachineById(id),
          api.getMachineSensorHistory(id, 24),
        ]);
        setMachine(machineData);
        setSensorHistory(historyData.slice(-10));
      } catch (error) {
        console.error('Failed to fetch machine details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMachineDetails();

    // Connect socket for real-time updates
    const socket = connectSocket();

    socket.on('machine_update', (data) => {
      if (data.machine_id === parseInt(id)) {
        setMachine((prev) => ({
          ...prev,
          sensors: data.sensors,
        }));
        setSensorHistory((prev) => {
          const newData = [...prev];
          if (newData.length > 10) newData.shift();
          newData.push({
            timestamp: data.timestamp,
            ...data.sensors,
          });
          return newData;
        });
        setLastUpdated('0s ago');
      }
    });

    const interval = setInterval(() => {
      setLastUpdated((prev) => {
        const seconds = parseInt(prev) || 0;
        return `${seconds + 3}s ago`;
      });
    }, 3000);

    return () => {
      disconnectSocket();
      clearInterval(interval);
    };
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return '#4caf50';
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={200} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={4}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={8}>
            <Skeleton variant="rounded" height={300} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!machine) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Machine not found
        </Typography>
        <Button onClick={() => navigate('/machines')} sx={{ mt: 2 }}>
          Back to Assets
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/machines')}>
          <BackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={600}>
            {machine.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {machine.asset_id} | {machine.type} | {machine.location}
          </Typography>
        </Box>
        <StatusBadge status={machine.status} size="medium" />
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Info & Prediction */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={4}>
          {/* Asset Information */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Asset Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Serial Number</Typography>
                  <Typography variant="body2" fontWeight={500}>{machine.serial_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Manufacturer</Typography>
                  <Typography variant="body2" fontWeight={500}>{machine.manufacturer}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Model</Typography>
                  <Typography variant="body2" fontWeight={500}>{machine.model}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Installation Date</Typography>
                  <Typography variant="body2" fontWeight={500}>{machine.installation_date}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Criticality</Typography>
                  <Chip
                    label={machine.criticality}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* AI Prediction */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 2,
              border: `2px solid ${getStatusColor(machine.prediction.status)}`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  AI Prediction
                </Typography>
                <Chip
                  label="AI-Powered"
                  size="small"
                  sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontSize: '0.7rem' }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Failure Probability
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {machine.prediction.failure_probability}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={machine.prediction.failure_probability}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: '#eee',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStatusColor(machine.prediction.status),
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Remaining Useful Life
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {machine.prediction.rul} cycles
                  </Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Time to Failure
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {machine.prediction.ttf}
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ p: 2, bgcolor: isDark ? '#283444' : '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Recommendation
                </Typography>
                <Typography variant="body2">
                  {machine.prediction.recommendation}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Action Buttons - Hidden for Technicians (read-only access) */}
          {!isTechnician(user) && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                fullWidth
              >
                Export PDF
              </Button>
              <Button
                variant="contained"
                startIcon={<WorkOrderIcon />}
                fullWidth
                onClick={() => navigate('/work-orders/new', { state: { machine } })}
              >
                Create Work Order
              </Button>
            </Box>
          )}
        </Grid>

        {/* Right Column - Live Data & History */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={8}>
          {/* Live Sensor Data */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Live Sensor Data
                  </Typography>
                  <Chip
                    icon={<CircleIcon sx={{ fontSize: '10px !important', color: '#f44336 !important', animation: 'pulse 1.5s infinite' }} />}
                    label="Live"
                    size="small"
                    sx={{ bgcolor: '#ffebee', color: '#f44336', fontSize: '0.7rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Last updated: {lastUpdated}
                </Typography>
              </Box>

              {/* Current Sensor Values */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(machine.sensors).map(([key, value]) => (
                  // @ts-expect-error MUI v7 Grid item prop
                  <Grid item xs={6} sm={3} key={key}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {key.replace('_', ' ')}
                      </Typography>
                      <Typography variant="h5" fontWeight={600}>
                        {typeof value === 'number' ? value.toFixed(1) : value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Sensor Chart */}
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#eee'} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      tick={{ fontSize: 10, fill: isDark ? '#a0a0a0' : '#666' }}
                    />
                    <YAxis tick={{ fontSize: 10, fill: isDark ? '#a0a0a0' : '#666' }} />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      contentStyle={{
                        backgroundColor: isDark ? '#283444' : '#fff',
                        border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
                        color: isDark ? '#e0e0e0' : '#333',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke={isDark ? '#ef5350' : '#f44336'}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="pressure"
                      stroke={isDark ? '#66bb6a' : '#4caf50'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* History Tabs */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Tabs
                value={activeTab}
                onChange={(_e: React.SyntheticEvent, v: number) => setActiveTab(v)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Past Failures" />
                <Tab label="Work Orders" />
                <Tab label="Notes" />
              </Tabs>

              {activeTab === 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: isDark ? '#283444' : '#f5f5f5',
                          '& th': {
                            color: isDark ? '#e5e5e5' : 'inherit',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
                          },
                        }}
                      >
                        <TableCell>Date</TableCell>
                        <TableCell>Failure Type</TableCell>
                        <TableCell>Resolution</TableCell>
                        <TableCell>Downtime</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">No past failures recorded</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 1 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: isDark ? '#283444' : '#f5f5f5',
                          '& th': {
                            color: isDark ? '#e5e5e5' : 'inherit',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
                          },
                        }}
                      >
                        <TableCell>WO Number</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                          <Typography color="text.secondary">No work orders for this asset</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {activeTab === 2 && (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No notes added yet</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default MachineDetails;
