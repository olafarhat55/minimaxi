import { useState, useEffect, useCallback } from 'react';
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
import { userCan } from '../../utils/permissions';

// ── Real severity values from backend: critical | high | medium | low ────────
const severityConfig: Record<string, { color: string; bgcolor: string; icon: typeof ErrorIcon }> = {
  critical: { color: '#f44336', bgcolor: '#ffebee', icon: ErrorIcon },
  high:     { color: '#f44336', bgcolor: '#ffebee', icon: ErrorIcon },
  medium:   { color: '#ff9800', bgcolor: '#fff3e0', icon: WarningIcon },
  low:      { color: '#2196f3', bgcolor: '#e3f2fd', icon: InfoIcon },
};

// ── Map UI filter → API query params ─────────────────────────────────────────
// Backend supports: ?severity=critical|high|medium|low  OR  ?acknowledged=false
const buildParams = (filter: string): Record<string, string> => {
  switch (filter) {
    case 'unacknowledged': return { acknowledged: 'false' };
    case 'all':            return {};
    default:               return { severity: filter }; // critical | high | medium | low
  }
};

const POLL_INTERVAL = 8000; // 8 ثواني

const Alerts = () => {
  const { user } = useAuth();
  const [loading, setLoading]     = useState(true);
  const [alerts, setAlerts]       = useState<AlertType[]>([]);
  const [allAlerts, setAllAlerts] = useState<AlertType[]>([]); // for stats only
  const [filter, setFilter]       = useState('all');

  // ── full list once — for header stats ──────────────────────────────────────
  useEffect(() => {
    const fetchAll = () => {
      api.getAlerts()
        .then((data: AlertType[]) => setAllAlerts(data))
        .catch(() => {});
    };
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // ── filtered list on every filter change ───────────────────────────────────
  const fetchFiltered = useCallback(async (currentFilter: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data: AlertType[] = await api.getAlerts(buildParams(currentFilter));
      setAlerts(data);
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

  // ── acknowledge ────────────────────────────────────────────────────────────
  const handleAcknowledge = async (alertId: number) => {
    try {
      // PUT /api/alerts/{id}/acknowledge  body: { user: "name" }
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

  // ── stats from full list ───────────────────────────────────────────────────
  const stats = {
    critical:       allAlerts.filter((a) => ['critical', 'high'].includes(a.severity)).length,
    medium:         allAlerts.filter((a) => a.severity === 'medium').length,
    unacknowledged: allAlerts.filter((a) => !a.acknowledged).length,
  };

  // ── skeleton ───────────────────────────────────────────────────────────────
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

      {/* Filter dropdown — values match exact API severity strings */}
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
                sx={{
                  borderRadius: 2,
                  borderLeft: `4px solid ${config.color}`,
                  opacity: alert.acknowledged ? 0.7 : 1,
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
                        {/* machine_name / asset_id can be null for system alerts */}
                        {alert.asset_id && (
                          <Typography variant="caption" color="text.secondary">
                            {alert.asset_id} — {alert.machine_name}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(alert.created_at), 'MMM d, yyyy h:mm a')}
                        </Typography>
                        {alert.acknowledged && (
                          <Typography variant="caption" color="success.main">
                            Acknowledged by {alert.acknowledged_by}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Acknowledge button — only for unacknowledged */}
                    {!alert.acknowledged && user?.role !== 'technician' && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AcknowledgeIcon />}
                        onClick={() => handleAcknowledge(alert.id)}
                        sx={{ alignSelf: 'center' }}
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