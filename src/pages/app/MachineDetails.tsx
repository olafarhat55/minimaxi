import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent,
  Paper, Chip, LinearProgress, Skeleton, IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
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
import { canCreateWorkOrder } from '../../utils/permissions';

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

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={56} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="rounded" height={280} sx={{ flex: 1 }} />
          <Skeleton variant="rounded" height={280} sx={{ flex: 1 }} />
        </Box>
        <Skeleton variant="rounded" height={360} />
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

  const severityColor = getStatusColor(machine.prediction?.severity ?? 'healthy');

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <IconButton onClick={() => navigate('/machines')} size="small">
          <BackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={600}>{machine.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {machine.asset_id} | {machine.type} | {machine.location}
          </Typography>
        </Box>
        <StatusBadge status={machine.status} size="medium" />
      </Box>

      {/* ── Top row: two cards side by side, equal width, full page width ── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          alignItems: 'stretch',
          // stack on mobile, side by side on sm+
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {/* ── Asset Information ── */}
        <Card sx={{ borderRadius: 2, flex: 1, minWidth: 0 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '14px !important' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Asset Information
            </Typography>

            <Box sx={{ flexGrow: 1 }}>
              {[
                ['Serial Number',     machine.serial_number],
                ['Manufacturer',      machine.manufacturer],
                ['Model',             machine.model],
                ['Installation Date', machine.installation_date],
              ]
                .filter(([, val]) => val != null && val !== '')
                .map(([label, val]) => (
                  <Box
                    key={label}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0.75,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={500}>{val}</Typography>
                  </Box>
                ))}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.75,
                }}
              >
                <Typography variant="body2" color="text.secondary">Criticality</Typography>
                <Chip label={machine.criticality} size="small" sx={{ textTransform: 'capitalize', height: 22, fontSize: '0.72rem' }} />
              </Box>
            </Box>

            {canCreateWorkOrder(user) && (
              <Button
                variant="outlined"
                startIcon={<WorkOrderIcon sx={{ fontSize: '14px !important' }} />}
                fullWidth
                size="small"
                sx={{ mt: 1.5, fontSize: '0.75rem' }}
                onClick={() => navigate('/work-orders/new', { state: { machine } })}
              >
                Create Work Order
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── AI Prediction ── */}
        <Card
          sx={{
            borderRadius: 2,
            flex: 1,
            minWidth: 0,
            border: `2px solid ${severityColor}`,
          }}
        >
          <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: '14px !important' }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="subtitle2" fontWeight={600}>AI Prediction</Typography>
                <Chip
                  label="AI-Powered"
                  size="small"
                  sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontSize: '0.65rem', height: 18 }}
                />
              </Box>
              <Chip
                label={(machine.prediction?.severity ?? 'low').toUpperCase()}
                size="small"
                sx={{
                  bgcolor: severityColor + '22',
                  color: severityColor,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 18,
                }}
              />
            </Box>

            {/* Confidence */}
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">AI Confidence</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Math.round((machine.prediction?.confidenceScore ?? 0) * 100)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.round((machine.prediction?.confidenceScore ?? 0) * 100)}
                sx={{
                  height: 6, borderRadius: 4,
                  bgcolor: isDark ? '#333' : '#eee',
                  '& .MuiLinearProgress-bar': { bgcolor: severityColor, borderRadius: 4 },
                }}
              />
            </Box>

            {/* RUL + TTF */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
  {[
    { label: 'Remaining Useful Life', value: machine.prediction?.rulCycles ?? '—', unit: 'cycles' },
    { label: 'Time to Failure',       value: machine.prediction?.ttfHours != null 
        ? (machine.prediction.ttfHours / 24).toFixed(1) 
        : '—',                                                                      unit: 'days'   },
  ].map(({ label, value, unit }) => (
                <Box
                  key={label}
                  sx={{
                    flex: 1,
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: isDark ? '#1e2a3a' : '#f5f5f5',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    {label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary">{unit}</Typography>
                </Box>
              ))}
            </Box>

            {/* Model Accuracy */}
            {machine.prediction?.modelAccuracy != null && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  py: 0.75,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  mb: machine.prediction?.problemSensor ? 1.5 : 0,
                }}
              >
                <Typography variant="body2" color="text.secondary">Model Accuracy</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Math.round(machine.prediction.modelAccuracy * 100)}%
                </Typography>
              </Box>
            )}

            {/* Warning */}
            {machine.prediction?.problemSensor && (
              <Box
                sx={{
                  p: 1,
                  bgcolor: isDark ? '#283444' : '#fff3e0',
                  borderRadius: 1.5,
                  border: '1px solid #ff9800',
                  mt: 'auto',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  ⚠️ Warning
                </Typography>
                <Typography variant="caption">{machine.prediction.explanation}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Live Sensor Data — full width ── */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: '14px !important' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>Live Sensor Data</Typography>
              <Chip
                icon={
                  <CircleIcon
                    sx={{
                      fontSize: '10px !important',
                      color: '#f44336 !important',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                }
                label="Live"
                size="small"
                sx={{ bgcolor: '#ffebee', color: '#f44336', fontSize: '0.65rem', height: 20 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Updated {lastUpdated}
            </Typography>
          </Box>

          {/* Sensor tiles — 3 equal columns */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1.5,
              mb: 2,
            }}
          >
            {Object.entries(displaySensors)
              .filter(([, value]) => value != null)
              .slice(0, 3)
              .map(([key, value]) => {
                const meta = SENSOR_META[key];
                return (
                  <Paper
                    key={key}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      borderRadius: 2,
                      borderColor: meta?.color ?? 'divider',
                      borderWidth: 1.5,
                      transition: 'box-shadow .2s',
                      '&:hover': { boxShadow: `0 0 0 3px ${meta?.color ?? '#ccc'}33` },
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ fontWeight: 500, mb: 0.5, fontSize: '0.68rem' }}
                    >
                      {meta?.label ?? key.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: meta?.color, lineHeight: 1.2 }}>
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </Typography>
                    {meta?.unit && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                        {meta.unit}
                      </Typography>
                    )}
                  </Paper>
                );
              })}
          </Box>

          {/* Trend chart */}
          <Box sx={{ height: 220 }}>
            {sensorError || sensorHistory.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px dashed ${isDark ? '#444' : '#ddd'}`,
                  borderRadius: 2,
                }}
              >
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
                    tick={{ fontSize: 11, fill: isDark ? '#a0a0a0' : '#888' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: isDark ? '#a0a0a0' : '#888' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
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

      <style>
        {`
          @keyframes pulse {
            0%   { opacity: 1; }
            50%  { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default MachineDetails;