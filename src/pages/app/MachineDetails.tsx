import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent,
  Paper, Chip, LinearProgress, Skeleton, IconButton, Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Assignment as WorkOrderIcon,
  Circle as CircleIcon,
  Thermostat as TempIcon,
  Speed as PressureIcon,
  Vibration as VibrationIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

import { connectSocket, disconnectSocket } from '../../services/socket';
import { StatusBadge } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import type { Machine } from '../../types';
import { api, axiosInstance } from '../../services/api';
import { canCreateWorkOrder } from '../../utils/permissions';

// ─── sensor meta ────────────────────────────────────────────────────────────
const SENSOR_META: Record<string, { label: string; color: string; unit: string }> = {
  temperature:          { label: 'Temperature',          color: '#ef5350', unit: '°C'   },
  pressure:             { label: 'Pressure',             color: '#66bb6a', unit: 'bar'  },
  vibration:            { label: 'Vibration',            color: '#42a5f5', unit: 'mm/s' },
  turbine_behavior:     { label: 'Turbine Behavior',     color: '#ffa726', unit: ''     },
  flow_variation:       { label: 'Flow Variation',       color: '#ab47bc', unit: ''     },
  efficiency_parameter: { label: 'Efficiency Parameter', color: '#26c6da', unit: ''     },
  mechanical_stress:    { label: 'Mechanical Stress',    color: '#ec407a', unit: ''     },
};

// ─── sensor tile icon map ────────────────────────────────────────────────────
const SENSOR_ICONS: Record<string, React.ReactNode> = {
  temperature: <TempIcon sx={{ fontSize: 20 }} />,
  pressure:    <PressureIcon sx={{ fontSize: 20 }} />,
  vibration:   <VibrationIcon sx={{ fontSize: 20 }} />,
};

// ─── keyframe ───────────────────────────────────────────────────────────────
const fadeUpKf = {
  '@keyframes fadeUp': {
    from: { opacity: 0, transform: 'translateY(14px)' },
    to:   { opacity: 1, transform: 'translateY(0)' },
  },
  '@keyframes pulse': {
    '0%,100%': { opacity: 1 },
    '50%':     { opacity: 0.35 },
  },
};

// ─── InfoRow helper ──────────────────────────────────────────────────────────
const InfoRow = ({
  label, value, border = true,
}: { label: string; value: React.ReactNode; border?: boolean }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      py: 0.9,
      ...(border && { borderBottom: '1px solid', borderColor: 'divider' }),
    }}
  >
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

// ────────────────────────────────────────────────────────────────────────────
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
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const fetchMachineDetails = async () => {
      setLoading(true);
      try {
        const machineData = await api.getMachineById(id);
        setMachine(machineData);
        if (machineData.asset_id) fetchGatewayReadings(machineData.asset_id);
      } catch (e) {
        console.error('Failed to fetch machine details:', e);
      } finally {
        setLoading(false);
      }
      try {
        setSensorError(false);
        const historyData = await api.getMachineSensorHistory(id, 24);
        setSensorHistory(
          historyData.slice(-20).map((item: any) => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          }))
        );
      } catch {
        setSensorError(true);
        setSensorHistory([]);
      }
    };

    fetchMachineDetails();

    const socket = connectSocket();
    socket.on('machine_update', (data) => {
      if (data.machine_id === parseInt(id!)) {
        setMachine((prev) => (prev ? { ...prev, sensors: data.sensors } : prev));
        setSensorHistory((prev) => {
          const next = [...prev];
          if (next.length > 20) next.shift();
          next.push({ timestamp: data.timestamp, ...data.sensors });
          return next;
        });
        setLastUpdated('0s ago');
      }
    });

    const interval = setInterval(() => {
      setLastUpdated((prev) => `${(parseInt(prev) || 0) + 3}s ago`);
    }, 3000);

    return () => { disconnectSocket(); clearInterval(interval); };
  }, [id, fetchGatewayReadings]);

  useEffect(() => {
    if (!machine?.asset_id) return;
    const gi = setInterval(() => fetchGatewayReadings(machine.asset_id), 30000);
    return () => clearInterval(gi);
  }, [machine?.asset_id, fetchGatewayReadings]);

  // ── theme tokens ────────────────────────────────────────────────────────
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const tileBg   = isDark ? '#162032' : '#f8fafc';
  const chartBg  = isDark ? '#1e2a3a' : '#ffffff';
  const gridClr  = isDark ? '#2a3a4a' : '#f0f0f0';
  const tickClr  = isDark ? '#8899aa' : '#9ca3af';

  // ── derived ─────────────────────────────────────────────────────────────
  const displaySensors = Object.keys(gatewayReadings).length > 0
    ? { temperature: gatewayReadings['sensor_1'], pressure: gatewayReadings['sensor_2'], vibration: gatewayReadings['sensor_7'] }
    : {
        temperature: sensorHistory[sensorHistory.length - 1]?.temperature,
        pressure:    sensorHistory[sensorHistory.length - 1]?.pressure,
        vibration:   sensorHistory[sensorHistory.length - 1]?.vibration,
      };

  const activeChartKeys = Object.keys(SENSOR_META).filter(
    (key) => sensorHistory.some((item) => item[key] != null),
  );

  const severity      = machine?.prediction?.severity ?? 'healthy';
  const severityColor =
    severity === 'critical' ? '#ef4444' :
    severity === 'high' || severity === 'medium' ? '#f59e0b' : '#22c55e';

  // ── loading / not found ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Skeleton variant="rounded" height={290} sx={{ flex: 1, borderRadius: 2 }} />
          <Skeleton variant="rounded" height={290} sx={{ flex: 1, borderRadius: 2 }} />
        </Box>
        <Skeleton variant="rounded" height={380} sx={{ borderRadius: 2 }} />
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

  const confidence = Math.round((machine.prediction?.confidenceScore ?? 0) * 100);

  return (
    <Box sx={{ ...fadeUpKf }}>

      {/* ── Header bar ───────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2.5,
          p: 2,
          borderRadius: 2.5,
          bgcolor: 'background.paper',
          border: `1px solid ${border}`,
          animation: 'fadeUp .3s ease both',
        }}
      >
        <IconButton
          onClick={() => navigate('/machines')}
          size="small"
          sx={{
            border: `1px solid ${border}`,
            borderRadius: 1.5,
            '&:hover': { bgcolor: 'primary.main', color: '#fff', borderColor: 'primary.main' },
            transition: 'all .2s',
          }}
        >
          <BackIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.2px' }}>
            {machine.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {machine.asset_id}&ensp;·&ensp;{machine.type}&ensp;·&ensp;{machine.location}
          </Typography>
        </Box>

        <StatusBadge status={machine.status} size="medium" />
      </Box>

      {/* ── Top cards row ────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2.5,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'stretch',
        }}
      >

        {/* ── Asset Information ── */}
        <Card
          elevation={0}
          sx={{
            flex: 1, minWidth: 0, borderRadius: 2.5,
            border: `1px solid ${border}`,
            animation: 'fadeUp .38s ease both',
          }}
        >
          <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, letterSpacing: '-0.1px' }}>
              Asset Information
            </Typography>

            <Box sx={{ flexGrow: 1 }}>
              {([
                ['Serial Number',     machine.serial_number],
                ['Manufacturer',      machine.manufacturer],
                ['Model',             machine.model],
                ['Installation Date', machine.installation_date],
              ] as [string, string | undefined][])
                .filter(([, v]) => v != null && v !== '')
                .map(([label, val], i, arr) => (
                  <InfoRow key={label} label={label} value={val} border={i < arr.length - 1} />
                ))}

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Criticality</Typography>
                <Chip
                  label={machine.criticality}
                  size="small"
                  sx={{
                    textTransform: 'capitalize',
                    height: 24,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    bgcolor:
                      machine.criticality === 'HIGH' || machine.criticality === 'CRITICAL'
                        ? 'rgba(239,68,68,0.12)'
                        : machine.criticality === 'MEDIUM'
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(34,197,94,0.12)',
                    color:
                      machine.criticality === 'HIGH' || machine.criticality === 'CRITICAL'
                        ? '#ef4444'
                        : machine.criticality === 'MEDIUM'
                          ? '#f59e0b'
                          : '#22c55e',
                  }}
                />
              </Box>
            </Box>

            {canCreateWorkOrder(user) && (
              <Button
                variant="outlined"
                startIcon={<WorkOrderIcon sx={{ fontSize: '15px !important' }} />}
                fullWidth
                size="small"
                onClick={() => navigate('/work-orders/new', { state: { machine } })}
                sx={{
                  mt: 2,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  py: 0.8,
                }}
              >
                Create Work Order
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── AI Prediction ── */}
        <Card
          elevation={0}
          sx={{
            flex: 1, minWidth: 0, borderRadius: 2.5,
            border: `2px solid ${severityColor}`,
            animation: 'fadeUp .42s ease both',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${severityColor}0a 0%, transparent 60%)`,
              pointerEvents: 'none',
            },
          }}
        >
          <CardContent sx={{ p: '20px !important', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Title row */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>AI Prediction</Typography>
                <Chip
                  label="AI-Powered"
                  size="small"
                  sx={{ bgcolor: 'rgba(25,118,210,0.1)', color: '#1976d2', fontSize: '0.65rem', height: 20, fontWeight: 600 }}
                />
              </Box>
              <Chip
                label={severity.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: severityColor + '22',
                  color: severityColor,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                  border: `1px solid ${severityColor}55`,
                }}
              />
            </Box>

            {/* Confidence bar */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>AI Confidence</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ color: severityColor }}>{confidence}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={confidence}
                sx={{
                  height: 7, borderRadius: 4,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  '& .MuiLinearProgress-bar': { bgcolor: severityColor, borderRadius: 4 },
                }}
              />
            </Box>

            {/* RUL + TTF tiles */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
              {/* RUL */}
              <Box
                sx={{
                  flex: 1, p: 1.5, borderRadius: 2,
                  bgcolor: tileBg,
                  border: `1px solid ${border}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" sx={{ mb: 0.5 }}>
                  Remaining Useful Life
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1, color: severityColor }}>
                  {machine.prediction?.rulCycles ?? '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">cycles</Typography>
              </Box>

              {/* TTF */}
              <Box
                sx={{
                  flex: 1, p: 1.5, borderRadius: 2,
                  bgcolor: tileBg,
                  border: `1px solid ${border}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" sx={{ mb: 0.5 }}>
                  Expected Failure
                </Typography>
                {machine.prediction?.ttfHours != null ? (() => {
                  const d = new Date(Date.now() + machine.prediction.ttfHours * 3600000);
                  return (
                    <>
                      <Typography variant="body1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                        {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </>
                  );
                })() : (
                  <Typography variant="h5" fontWeight={800}>—</Typography>
                )}
              </Box>
            </Box>

            {/* Model accuracy */}
            {machine.prediction?.modelAccuracy != null && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderTop: `1px solid ${border}` }}>
                <Typography variant="body2" color="text.secondary">Model Accuracy</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {Math.round(machine.prediction.modelAccuracy * 100)}%
                </Typography>
              </Box>
            )}

            {/* Warning box */}
            {machine.prediction?.problemSensor && (
              <Box
                sx={{
                  mt: 'auto', pt: 1.5,
                  p: 1.5,
                  bgcolor: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb',
                  borderRadius: 1.5,
                  border: '1px solid rgba(245,158,11,0.35)',
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ color: '#f59e0b', display: 'block', mb: 0.25 }}>
                  ⚠ Warning
                </Typography>
                <Typography variant="caption" color="text.secondary">{machine.prediction.explanation}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Live Sensor Data ─────────────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${border}`,
          animation: 'fadeUp .48s ease both',
        }}
      >
        <CardContent sx={{ p: '20px !important' }}>

          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>Live Sensor Data</Typography>
              <Chip
                icon={
                  <CircleIcon
                    sx={{
                      fontSize: '8px !important',
                      color: '#ef4444 !important',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                }
                label="Live"
                size="small"
                sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.65rem', height: 20, fontWeight: 600 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Updated {lastUpdated}
            </Typography>
          </Box>

          {/* Sensor tiles — 3 columns */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              mb: 2.5,
            }}
          >
            {Object.entries(displaySensors)
              .filter(([, v]) => v != null)
              .slice(0, 3)
              .map(([key, value], idx) => {
                const meta = SENSOR_META[key];
                return (
                  <Paper
                    key={key}
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      borderRadius: 2,
                      border: `1.5px solid ${meta?.color ?? 'divider'}`,
                      bgcolor: tileBg,
                      animation: `fadeUp ${0.5 + idx * 0.06}s ease both`,
                      transition: 'transform .2s, box-shadow .2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 24px ${meta?.color ?? '#ccc'}33`,
                      },
                    }}
                  >
                    {SENSOR_ICONS[key] && (
                      <Box sx={{ color: meta?.color, mb: 0.5 }}>{SENSOR_ICONS[key]}</Box>
                    )}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      display="block"
                      sx={{ mb: 0.75, fontSize: '0.7rem', letterSpacing: '0.03em' }}
                    >
                      {meta?.label ?? key.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: meta?.color, lineHeight: 1.1 }}>
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </Typography>
                    {meta?.unit && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {meta.unit}
                      </Typography>
                    )}
                  </Paper>
                );
              })}
          </Box>

          {/* Trend chart */}
          <Box sx={{ height: 230 }}>
            {sensorError || sensorHistory.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px dashed ${isDark ? '#334' : '#ddd'}`,
                  borderRadius: 2,
                  bgcolor: tileBg,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {sensorError ? 'Sensor history unavailable' : 'No sensor history to display'}
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorHistory} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridClr} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: tickClr }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: tickClr }} tickLine={false} axisLine={false} width={38} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartBg,
                      border: `1px solid ${border}`,
                      borderRadius: 10,
                      color: isDark ? '#e0e0e0' : '#333',
                      fontSize: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                    formatter={(v: string) => SENSOR_META[v]?.label ?? v.replace(/_/g, ' ')}
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
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MachineDetails;