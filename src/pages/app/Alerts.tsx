import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Skeleton,
  Grid,
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
  warning: { color: '#ff9800', bgcolor: '#fff3e0', icon: WarningIcon },
  info: { color: '#2196f3', bgcolor: '#e3f2fd', icon: InfoIcon },
};

const Alerts = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const data = await api.getAlerts();
        setAlerts(data);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId, user.name);
      setAlerts(alerts.map((a) =>
        a.id === alertId
          ? { ...a, acknowledged: true, acknowledged_by: user.name, acknowledged_at: new Date().toISOString() }
          : a
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unacknowledged') return !a.acknowledged;
    return a.severity === filter;
  });

  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    unacknowledged: alerts.filter((a) => !a.acknowledged).length,
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
        <Typography variant="h5" fontWeight={600}>
          Alerts
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Chip label={`${stats.critical} Critical`} sx={{ bgcolor: '#ffebee', color: '#f44336' }} />
          <Chip label={`${stats.warning} Warning`} sx={{ bgcolor: '#fff3e0', color: '#ff9800' }} />
          <Chip label={`${stats.unacknowledged} Unread`} sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }} />
        </Box>
      </Box>

      {/* Filter */}
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
          <MenuItem value="critical">Critical Only</MenuItem>
          <MenuItem value="warning">Warning Only</MenuItem>
          <MenuItem value="info">Info Only</MenuItem>
        </TextField>
      </Box>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={AlertIcon}
          title="No alerts"
          description="There are no alerts matching your filter."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredAlerts.map((alert) => {
            const config = severityConfig[alert.severity] || severityConfig.info;
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
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: config.bgcolor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <SeverityIcon sx={{ color: config.color }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {alert.title}
                        </Typography>
                        <Chip
                          label={alert.severity}
                          size="small"
                          sx={{
                            bgcolor: config.bgcolor,
                            color: config.color,
                            textTransform: 'capitalize',
                            fontSize: '0.7rem',
                          }}
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
                        <Typography variant="caption" color="text.secondary">
                          {alert.asset_id} - {alert.machine_name}
                        </Typography>
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
                    {!alert.acknowledged && (
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
