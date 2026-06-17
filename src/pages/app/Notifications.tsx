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
  Avatar,
  Divider,
} from '@mui/material';
import {
  Notifications as NotifIcon,
  DoneAll as DoneAllIcon,
  Warning as WarningIcon,
  Build as WorkOrderIcon,
  Info as SystemIcon,
  Circle as UnreadDot,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { api } from '../../services/api';
import { EmptyState } from '../../components/common';
import type { Notification } from '../../types';

// ── Type config ───────────────────────────────────────────────────────────────
const typeConfig: Record<
  string,
  { label: string; color: string; bgcolor: string; icon: typeof NotifIcon }
> = {
  alert: {
    label: 'Alert',
    color: '#f44336',
    bgcolor: '#ffebee',
    icon: WarningIcon,
  },
  work_order: {
    label: 'Work Order',
    color: '#1976d2',
    bgcolor: '#e3f2fd',
    icon: WorkOrderIcon,
  },
  system: {
    label: 'System',
    color: '#0288d1',
    bgcolor: '#e1f5fe',
    icon: SystemIcon,
  },
predicted_failure: {
  label: 'Prediction',
  color: '#9c27b0',
  bgcolor: '#f3e5f5',
  icon: WarningIcon,
},
};

const getFallbackConfig = (type: string) =>
  typeConfig[type] ?? {
    label: type,
    color: '#757575',
    bgcolor: '#f5f5f5',
    icon: NotifIcon,
  };

const POLL_INTERVAL = 10000; // 10 ثواني

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data as Notification[]);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ── Mark single as read ───────────────────────────────────────────────────
  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    console.log('clicked notif:', notif);
  if (!notif.read) {
    try {
      await api.markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }
  if (notif.type === 'work_order' && notif.work_order_id) {
    navigate(`/work-orders/${notif.work_order_id}`);
  }
};

  // ── Mark all as read ──────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (filter === 'unread')  return !n.read;
    if (filter === 'alert')      return n.type === 'alert';
    if (filter === 'work_order') return n.type === 'work_order';
    if (filter === 'system')     return n.type === 'system';
    return true;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={60} sx={{ mb: 3 }} />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" height={88} sx={{ mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </Typography>
        </Box>

        {unreadCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {/* ── Stats chips ── */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={`${notifications.length} Total`}
          sx={{ bgcolor: '#f5f5f5', color: '#424242' }}
        />
        <Chip
          label={`${unreadCount} Unread`}
          sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}
        />
        <Chip
          label={`${notifications.filter((n) => n.type === 'alert').length} Alerts`}
          sx={{ bgcolor: '#ffebee', color: '#c62828' }}
        />
        <Chip
          label={`${notifications.filter((n) => n.type === 'work_order').length} Work Orders`}
          sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }}
        />
      </Box>

      {/* ── Filter ── */}
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 200 }}
          label="Filter"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="unread">Unread</MenuItem>
          <MenuItem value="alert">Alerts</MenuItem>
          <MenuItem value="work_order">Work Orders</MenuItem>
          <MenuItem value="system">System</MenuItem>
        </TextField>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={NotifIcon}
          title="No notifications"
          description="Nothing here for the selected filter."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((notif) => {
            const config = getFallbackConfig(notif.type);
            const Icon   = config.icon;

            return (
  <Card
    key={notif.id}
    sx={{
      borderRadius: 2,
      borderLeft: `4px solid ${notif.read ? '#e0e0e0' : config.color}`,
      opacity: notif.read ? 0.75 : 1,
      transition: 'opacity 0.2s',
      cursor: (notif.type === 'work_order' && notif.work_order_id) || !notif.read
        ? 'pointer'
        : 'default',
      '&:hover': { boxShadow: 3 },
    }}
    onClick={() => handleNotificationClick(notif)}
  >
    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Icon avatar */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: config.bgcolor,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color: config.color, fontSize: 20 }} />
        </Avatar>

        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.5,
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight={notif.read ? 400 : 600}
              noWrap
            >
              {notif.title}
            </Typography>
            <Chip
              label={config.label}
              size="small"
              sx={{
                bgcolor: config.bgcolor,
                color: config.color,
                fontSize: '0.65rem',
                height: 18,
              }}
            />
            {!notif.read && (
              <UnreadDot
                sx={{ fontSize: 10, color: config.color, ml: 'auto' }}
              />
            )}
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 0.5 }}
          >
            {notif.message}
          </Typography>

          <Typography variant="caption" color="text.disabled">
            {format(new Date(notif.created_at), 'MMM d, yyyy · h:mm a')}
          </Typography>
        </Box>

        {/* Mark read button */}
        {!notif.read && (
          <Button
            size="small"
            variant="text"
            onClick={(e) => {
              e.stopPropagation();
              handleMarkRead(notif.id);
            }}
            sx={{
              fontSize: '0.7rem',
              textTransform: 'none',
              flexShrink: 0,
              alignSelf: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            Mark read
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

export default Notifications;