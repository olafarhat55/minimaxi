import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  TextField,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {
  CheckCircle as AcknowledgeIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  NotificationsActive as AlertIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/common';
import type { Alert as AlertType } from '../../types';

const severityConfig: Record<string, { color: string; bgcolor: string; icon: typeof ErrorIcon }> = {
  critical: { color: '#f44336', bgcolor: '#ffebee', icon: ErrorIcon },
  high:     { color: '#f44336', bgcolor: '#ffebee', icon: ErrorIcon },
  medium:   { color: '#ff9800', bgcolor: '#fff3e0', icon: WarningIcon },
  low:      { color: '#2196f3', bgcolor: '#e3f2fd', icon: InfoIcon },
};

const buildParams = (filter: string): Record<string, string> => {
  switch (filter) {
    case 'unacknowledged': return { acknowledged: 'false' };
    case 'all':            return {};
    default:               return { severity: filter };
  }
};

const POLL_INTERVAL = 8000;

const Alerts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [alerts, setAlerts]       = useState<AlertType[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertType[]>([]);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    const fetchAll = () => {
      api.getAlerts()
        .then((data: AlertType[]) => {
          const sorted = [...data].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setAllAlerts(sorted);
        })
        .catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const fetchFiltered = useCallback(async (currentFilter: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data: AlertType[] = await api.getAlerts(buildParams(currentFilter));
      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAlerts(sorted);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiltered(filter);
    const interval = setInterval(() => fetchFiltered(filter, true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [filter, fetchFiltered]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId, user.name);
      const now = new Date().toISOString();

      const patch = (list: AlertType[]) =>
        list.map((a) =>
          a.id === alertId
            ? { ...a, acknowledged: true, acknowledged_by: user.name, acknowledged_at: now }
            : a,
        );

      setAlerts(patch);
      setAllAlerts(patch);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const stats = {
    critical:       allAlerts.filter((a) => ['critical', 'high'].includes(a.severity)).length,
    medium:         allAlerts.filter((a) => a.severity === 'medium').length,
    unacknowledged: allAlerts.filter((a) => !a.acknowledged).length,
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={100} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>Alerts</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip label={`${stats.critical} Critical / High`} sx={{ bgcolor: '#ffebee', color: '#f44336' }} />
          <Chip label={`${stats.medium} Medium`}            sx={{ bgcolor: '#fff3e0', color: '#ff9800' }} />
          <Chip label={`${stats.unacknowledged} Unread`}    sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
        </Box>
      </Box>

      {/* Filter dropdown */}
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">All Alerts</MenuItem>
          <MenuItem value="unacknowledged">Unacknowledged</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
      </Box>

      {/* List */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={AlertIcon}
          title="No alerts"
          description="There are no alerts matching your filter."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity] ?? severityConfig.low;
            const SeverityIcon = config.icon;

            return (
              <Card
                key={alert.id}
                onClick={() => {
                  if (alert.machine_id) {
                    navigate(`/machines/${alert.machine_id}`);
                  }
                }}
                sx={{
                  borderRadius: 2,
                  borderLeft: `4px solid ${config.color}`,
                  opacity: alert.acknowledged ? 0.7 : 1,
                  cursor: alert.machine_id ? 'pointer' : 'default',
                  '&:hover': alert.machine_id ? { boxShadow: 3 } : {},
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Severity icon */}
                    <Box
                      sx={{
                        width: 48, height: 48,
                        borderRadius: 2,
                        bgcolor: config.bgcolor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <SeverityIcon sx={{ color: config.color }} />
                    </Box>

                    {/* Content */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          size="small"
                          sx={{ bgcolor: config.bgcolor, color: config.color, textTransform: 'capitalize', fontSize: '0.7rem' }}
                        />
                        <Chip
                          label={alert.type}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {alert.message}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {alert.asset_id && (
                          <Typography variant="caption" color="text.secondary">
                            {alert.asset_id} — {alert.machine_name}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Acknowledge button or badge */}
                    {alert.acknowledged ? (
                      <Box sx={{
                        alignSelf: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        bgcolor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: 2,
                        px: 1.5,
                        py: 0.5,
                      }}>
                        <AcknowledgeIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                        <Typography variant="caption" color="#16a34a" fontWeight={600}>
                          Acknowledged by {alert.acknowledged_by}
                        </Typography>
                      </Box>
                    ) : user?.role !== 'technician' && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AcknowledgeIcon sx={{ fontSize: 16 }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(alert.id);
                        }}
                        sx={{
                          alignSelf: 'center',
                          borderRadius: '20px',
                          borderColor: '#1976d2',
                          color: '#1976d2',
                          bgcolor: 'rgba(25, 118, 210, 0.04)',
                          px: 2,
                          py: 0.5,
                          minWidth: 'fit-content',
                          whiteSpace: 'nowrap',
                          textTransform: 'none',
                          fontWeight: 600,
                          '& .MuiButton-startIcon': {
                            marginRight: 0.5,
                            marginLeft: 0,
                          },
                          '&:hover': {
                            bgcolor: 'rgba(25, 118, 210, 0.08)',
                            borderColor: '#1976d2',
                          },
                        }}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Alerts;