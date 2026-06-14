import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Typography, Button, Card, CardContent, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
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
import { isTechnician } from '../../utils/permissions';
import type { Machine } from '../../types';
import { api, axiosInstance } from '../../services/api';

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
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('0s ago');

  const [issues, setIssues] = useState<any[]>([]);
  const [machineWorkOrders, setMachineWorkOrders] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
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

        if (machineData.issues)      setIssues(machineData.issues);
        if (machineData.work_orders) setMachineWorkOrders(machineData.work_orders);
        if (machineData.notes)       setNotes(machineData.notes);

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

  useEffect(() => {
    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === 0 && issues.length === 0) {
          const data = await api.getMachineIssues(id);
          setIssues(Array.isArray(data) ? data : []);
        }
        if (activeTab === 1 && machineWorkOrders.length === 0) {
          const data = await api.getMachineWorkOrders(id);
          setMachineWorkOrders(Array.isArray(data) ? data : []);
        }
        if (activeTab === 2 && notes.length === 0) {
          const data = await api.getMachineNotes(id);
          setNotes(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch tab data:', error);
      } finally {
        setTabLoading(false);
      }
    };

    if (id) fetchTabData();
  }, [activeTab, id]);

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

          {!isTechnician(user) && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<PdfIcon />} fullWidth>Export PDF</Button>
              <Button
                variant="contained" startIcon={<WorkOrderIcon />} fullWidth
                onClick={() => navigate('/work-orders/new', { state: { machine } })}
              >
                Create Work Order
              </Button>
            </Box>
          )}
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

              <Box sx={{ minHeight: 280, overflow: 'hidden' }}>
                {tabLoading && <Skeleton variant="rounded" height={120} />}

                {/* Past Failures */}
                {!tabLoading && activeTab === 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={tableHeadSx}>
                          <TableCell>Date</TableCell>
                          <TableCell>Summary</TableCell>
                          <TableCell>Severity</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Source</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {issues.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                              <Typography color="text.secondary">No past failures recorded</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          issues.map((issue: any, i: number) => (
                            <TableRow key={issue.id ?? i} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                {issue.created_at
                                  ? new Date(issue.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                    })
                                  : issue.date ?? '—'}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {issue.summary ?? issue.failure_type ?? issue.type ?? '—'}
                                </Typography>
                                {issue.details && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {issue.details}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {issue.severity ? (
                                  <Chip
                                    label={issue.severity}
                                    size="small"
                                    sx={{
                                      textTransform: 'capitalize',
                                      bgcolor:
                                        issue.severity === 'high'   ? '#ffebee' :
                                        issue.severity === 'medium' ? '#fff3e0' : '#e8f5e9',
                                      color:
                                        issue.severity === 'high'   ? '#f44336' :
                                        issue.severity === 'medium' ? '#ff9800' : '#4caf50',
                                    }}
                                  />
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                {issue.status ? (
                                  <Chip label={issue.status} size="small" sx={{ textTransform: 'capitalize' }} />
                                ) : '—'}
                              </TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>
                                {issue.source ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Work Orders */}
                {!tabLoading && activeTab === 1 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={tableHeadSx}>
                          <TableCell>WO Number</TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {machineWorkOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                              <Typography color="text.secondary">No work orders for this asset</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          machineWorkOrders.map((wo: any, i: number) => (
                            <TableRow
                              key={wo.id ?? i}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/work-orders/${wo.id}`)}
                            >
                              <TableCell>{wo.wo_number ?? wo.id}</TableCell>
                              <TableCell>{wo.title ?? '—'}</TableCell>
                              <TableCell>
                                <Chip label={wo.status} size="small" sx={{ textTransform: 'capitalize' }} />
                              </TableCell>
                              <TableCell>
                                {wo.created_at
                                  ? new Date(wo.created_at).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                    })
                                  : wo.date ?? '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Notes */}
                {!tabLoading && activeTab === 2 && (
                  notes.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">No notes added yet</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {notes.map((note: any, i: number) => (
                        <Box
                          key={note.id ?? i}
                          sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? '#283444' : '#f5f5f5' }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {note.work_order_title ?? note.author ?? note.created_by ?? 'Note'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {note.completed_at
                                ? new Date(note.completed_at).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                  })
                                : note.created_at ?? note.date ?? ''}
                            </Typography>
                          </Box>
                          {(note.action_taken ?? note.content ?? note.text ?? note.note) && (
                            <Typography variant="body2" sx={{ mb: note.root_cause || note.additional_notes ? 1 : 0 }}>
                              {note.action_taken ?? note.content ?? note.text ?? note.note}
                            </Typography>
                          )}
                          {note.root_cause && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              <strong>Root cause:</strong> {note.root_cause}
                            </Typography>
                          )}
                          {note.additional_notes && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              <strong>Notes:</strong> {note.additional_notes}
                            </Typography>
                          )}
                          {note.time_spent_minutes != null && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                              ⏱ {note.time_spent_minutes} min
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )
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