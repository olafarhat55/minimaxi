import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Button, Card, CardContent, 
  Paper, Chip, LinearProgress, Skeleton, IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon, PictureAsPdf as PdfIcon,
  Assignment as WorkOrderIcon, Circle as CircleIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

import { connectSocket, disconnectSocket } from '../../services/socket';
import { StatusBadge } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import type { Machine } from '../../types';
import { api, axiosInstance } from '../../services/api';
import { isTechnician, canCreateWorkOrder } from '../../utils/permissions';

const SENSOR_META: Record<string, { label: string; color: string; unit: string }> = {
  temperature:          { label: 'Temperature',          color: '#ef5350', unit: '°C'   },
  pressure:             { label: 'Pressure',             color: '#66bb6a', unit: 'bar'  },
  vibration:            { label: 'Vibration',            color: '#42a5f5', unit: 'mm/s' },
  turbine_behavior:     { label: 'Turbine Behavior',     color: '#ffa726', unit: ''     },
  flow_variation:       { label: 'Flow Variation',       color: '#ab47bc', unit: ''     },
  efficiency_parameter: { label: 'Efficiency Parameter', color: '#26c6da', unit: ''     },
  mechanical_stress:    { label: 'Mechanical Stress',    color: '#ec407a', unit: ''     },
};

const MachineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useThemeMode();
  const [loading, setLoading] = useState(true);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [sensorHistory, setSensorHistory] = useState<any[]>([]);
  const [sensorError, setSensorError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('0s ago');

  

 
 
  const [gatewayReadings, setGatewayReadings] = useState<Record<string, number>>({});

  const fetchGatewayReadings = useCallback(async (assetId: string) => {
    try {
      const data: any = await axiosInstance.get(`/gateway/assets/${assetId}/readings`);
      setGatewayReadings(data.readings || {});
      setLastUpdated('just now');
    } catch (err) {
      console.error('Gateway fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    const fetchMachineDetails = async () => {
      setLoading(true);
      try {
        const machineData = await api.getMachineById(id);
        setMachine(machineData);

      
        if (machineData.asset_id) {
          fetchGatewayReadings(machineData.asset_id);
        }
      } catch (error) {
        console.error('Failed to fetch machine details:', error);
      } finally {
        setLoading(false);
      }

      try {
        setSensorError(false);
        const historyData = await api.getMachineSensorHistory(id, 24);
        const formatted = historyData.slice(-20).map((item: any) => ({
          ...item,
          time: new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
          }),
        }));
        setSensorHistory(formatted);
      } catch (error) {
        console.error('Failed to fetch sensor history:', error);
        setSensorError(true);
        setSensorHistory([]);
      }
    };

    fetchMachineDetails();

    const socket = connectSocket();
    socket.on('machine_update', (data) => {
      if (data.machine_id === parseInt(id)) {
        setMachine((prev) => ({ ...prev, sensors: data.sensors }));
        setSensorHistory((prev) => {
          const newData = [...prev];
          if (newData.length > 20) newData.shift();
          newData.push({ timestamp: data.timestamp, ...data.sensors });
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
  }, [id, fetchGatewayReadings]);

  useEffect(() => {
    if (!machine?.asset_id) return;
    const gatewayInterval = setInterval(() => {
      fetchGatewayReadings(machine.asset_id);
    }, 30000);
    return () => clearInterval(gatewayInterval);
  }, [machine?.asset_id, fetchGatewayReadings]);

 

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return '#f44336';
      case 'warning':  return '#ff9800';
      default:         return '#4caf50';
    }
  };

  const tableHeadSx = {
    bgcolor: isDark ? '#283444' : '#f5f5f5',
    '& th': {
      color: isDark ? '#e5e5e5' : 'inherit',
      fontWeight: 600,
      fontSize: '0.875rem',
      borderBottom: isDark ? '1px solid #404040' : '1px solid #e0e0e0',
    },
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} width={200} sx={{ mb: 3 }} />
        <Grid container spacing={3} alignItems="flex-start">
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={4}><Skeleton variant="rounded" height={300} /></Grid>
          {/* @ts-expect-error MUI v7 Grid item prop */}
          <Grid item xs={12} md={8}><Skeleton variant="rounded" height={300} /></Grid>
        </Grid>
      </Box>
    );
  }

  if (!machine) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">Machine not found</Typography>
        <Button onClick={() => navigate('/machines')} sx={{ mt: 2 }}>Back to Assets</Button>
      </Box>
    );
  }

  const displaySensors = Object.keys(gatewayReadings).length > 0
    ? {
        temperature: gatewayReadings['sensor_1'],
        pressure:    gatewayReadings['sensor_2'],
        vibration:   gatewayReadings['sensor_7'],
      }
    : {
        temperature: sensorHistory[sensorHistory.length - 1]?.temperature,
        pressure:    sensorHistory[sensorHistory.length - 1]?.pressure,
        vibration:   sensorHistory[sensorHistory.length - 1]?.vibration,
      };

  const activeChartKeys = Object.keys(SENSOR_META).filter(
    (key) => sensorHistory.some((item) => item[key] != null),
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/machines')}><BackIcon /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={600}>{machine.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {machine.asset_id} | {machine.type} | {machine.location}
          </Typography>
        </Box>
        <StatusBadge status={machine.status} size="medium" />
      </Box>

      <Grid
        container
        spacing={3}
        alignItems="flex-start"
        sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}
      >
        {/* ── Left Column ── */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={4} sx={{ flexShrink: 0, width: { md: '33.333%' } }}>

          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Asset Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  ['Serial Number',     machine.serial_number],
                  ['Manufacturer',      machine.manufacturer],
                  ['Model',             machine.model],
                  ['Installation Date', machine.installation_date],
                ].map(([label, val]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{val}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Criticality</Typography>
                  <Chip label={machine.criticality} size="small" sx={{ textTransform: 'capitalize' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, borderRadius: 2, border: `2px solid ${getStatusColor(machine.prediction?.status ?? 'healthy')}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>AI Prediction</Typography>
                <Chip label="AI-Powered" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontSize: '0.7rem' }} />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Failure Probability</Typography>
                  <Typography variant="body2" fontWeight={600}>{machine.prediction?.failure_probability ?? 0}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={machine.prediction?.failure_probability ?? 0}
                  sx={{
                    height: 10, borderRadius: 5, bgcolor: '#eee',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getStatusColor(machine.prediction?.status ?? 'healthy'),
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Remaining Useful Life</Typography>
                  <Typography variant="h6" fontWeight={600}>{machine.prediction?.rul ?? '—'} cycles</Typography>
                </Grid>
                {/* @ts-expect-error MUI v7 Grid item prop */}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Time to Failure</Typography>
                  <Typography variant="h6" fontWeight={600}>{machine.prediction?.ttf ?? '—'}</Typography>
                </Grid>
              </Grid>
              <Box sx={{ p: 2, bgcolor: isDark ? '#283444' : '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Recommendation
                </Typography>
                <Typography variant="body2">{machine.prediction?.recommendation ?? '—'}</Typography>
              </Box>
            </CardContent>
          </Card>

         <Box sx={{ display: 'flex', gap: 2 }}>
 
  {canCreateWorkOrder(user) && (
    <Button
      variant="contained" startIcon={<WorkOrderIcon />} fullWidth
      onClick={() => navigate('/work-orders/new', { state: { machine } })}
    >
      Create Work Order
    </Button>
  )}
</Box>
        </Grid>

        {/* ── Right Column ── */}
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12} md={8} sx={{ flexGrow: 1, minWidth: 0 }}>

          {/* Live Sensor Data */}
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={600}>Live Sensor Data</Typography>
                  <Chip
                    icon={<CircleIcon sx={{ fontSize: '10px !important', color: '#f44336 !important', animation: 'pulse 1.5s infinite' }} />}
                    label="Live" size="small"
                    sx={{ bgcolor: '#ffebee', color: '#f44336', fontSize: '0.7rem' }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Updated {lastUpdated}
                </Typography>
              </Box>

              {/* Sensor tiles */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Object.entries(displaySensors)
                  .filter(([, value]) => value != null)
                  .slice(0, 3)
                  .map(([key, value]) => {
                    const meta = SENSOR_META[key];
                    return (
                      // @ts-expect-error MUI v7 Grid item prop
                      <Grid item xs={4} key={key}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            textAlign: 'center',
                            borderRadius: 2,
                            borderColor: meta?.color ?? 'divider',
                            borderWidth: 1.5,
                            transition: 'box-shadow .2s',
                            '&:hover': { boxShadow: `0 0 0 3px ${meta?.color ?? '#ccc'}33` },
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontWeight: 500 }}>
                            {meta?.label ?? key.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="h5" fontWeight={700} sx={{ color: meta?.color }}>
                            {typeof value === 'number' ? value.toFixed(1) : value}
                          </Typography>
                          {meta?.unit && (
                            <Typography variant="caption" color="text.secondary">{meta.unit}</Typography>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
              </Grid>

              {/* Trend chart */}
              <Box sx={{ height: 260 }}>
                {sensorError || sensorHistory.length === 0 ? (
                  <Box sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px dashed ${isDark ? '#444' : '#ddd'}`,
                    borderRadius: 2,
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      {sensorError ? 'Sensor history unavailable' : 'No sensor history to display'}
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sensorHistory} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#333' : '#f0f0f0'} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: isDark ? '#a0a0a0' : '#888' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: isDark ? '#a0a0a0' : '#888' }}
                        tickLine={false}
                        axisLine={false}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#1e2a3a' : '#fff',
                          border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
                          borderRadius: 8,
                          color: isDark ? '#e0e0e0' : '#333',
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                        formatter={(value: string) =>
                          SENSOR_META[value]?.label ?? value.replace(/_/g, ' ')
                        }
                      />
                      {activeChartKeys.map((key) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={key}
                          stroke={SENSOR_META[key].color}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Box>
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