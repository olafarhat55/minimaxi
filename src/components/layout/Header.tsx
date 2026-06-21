import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Popover,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Button,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Circle as CircleIcon,
  DoneAll as DoneAllIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import { format } from 'date-fns';
import type { Notification } from '../../types';
import MiniMaxiLogo from '../common/MiniMaxiLogo';
import ThemeToggle from '../common/ThemeToggle';

interface HeaderProps {
  onMenuClick: () => void;
  notifications?: Notification[];
  sidebarOpen?: boolean;
  onMarkRead?: (id: number) => void;
  onMarkAllRead?: () => void;
}

const Header = ({
  onMenuClick,
  notifications = [],
  sidebarOpen = false,
  onMarkRead,
  onMarkAllRead,
}: HeaderProps) => {
  const { user, logout } = useAuth();
  const { isDark } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<HTMLElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotificationsClose = () => setNotifAnchorEl(null);

  const handleProfile = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleProfileMenuClose();
    navigate('/settings');
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/logout');
  };

const handleNotifClick = (notif: Notification) => {
  if (!notif.read && onMarkRead) {
    onMarkRead(notif.id);
  }

  handleNotificationsClose();

 if (
  (notif.type === 'work_order' || notif.type === 'wo_status_changed' || notif.type === 'new_work_order') &&
  notif.work_order_id
) {
  const isRatingNotif =
    notif.title?.toLowerCase().includes('completed') ||
    notif.title?.toLowerCase().includes('rate');
  navigate(`/work-orders/${notif.work_order_id}`, {
    state: { openRating: isRatingNotif },
  });
}else if ((notif.type === 'alert' || notif.type === 'sensor_alert') && notif.machine_id) {
    navigate(`/machines/${notif.machine_id}`);
  } else if ((notif.type === 'alert' || notif.type === 'sensor_alert') && !notif.machine_id) {
    navigate('/alerts');
  } else if (notif.type === 'predicted_failure' && notif.machine_id) {
    navigate(`/machines/${notif.machine_id}`);
  } else if (notif.type === 'predicted_failure' && !notif.machine_id) {
    navigate('/alerts');
  } else if (notif.type === 'system') {
    navigate('/notifications');
  } else {
    // fallback لأي type تاني — روح notifications page
    navigate('/notifications');
  }
};

 const getSeverityColor = (type: string) => {
  switch (type) {
    case 'alert':
    case 'sensor_alert':      return 'error';    // ← أضيفي السطر ده
    case 'work_order':        return 'primary';
    case 'predicted_failure': return 'warning';  // ← أضيفي ده كمان
    case 'system':            return 'info';
    default:                  return 'default';
  }
};

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: isDark ? '#1E2A3A' : '#fff',
        color: isDark ? '#F1F5F9' : '#333',
        boxShadow: isDark
          ? '0 1px 3px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <Toolbar>
        {/* Sidebar toggle */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label={sidebarOpen ? 'close sidebar' : 'open sidebar'}
          onClick={onMenuClick}
          sx={{
            mr: 2,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': { transform: 'scale(1.1)' },
          }}
        >
          {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>

        {/* Logo */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <MiniMaxiLogo
            size={34}
            showText={false}
            onClick={() => navigate(user?.role === 'technician' ? '/my-work-orders' : '/dashboard')}
          />
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block', md: 'none' } }}>
          <MiniMaxiLogo
            size={34}
            showText
            onClick={() => navigate(user?.role === 'technician' ? '/my-work-orders' : '/dashboard')}
          />
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <MiniMaxiLogo
            size={36}
            showText
            showTagline
            onClick={() => navigate(user?.role === 'technician' ? '/my-work-orders' : '/dashboard')}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications bell */}
        <IconButton color="inherit" onClick={handleNotificationsOpen} sx={{ mr: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Notifications popover */}
        <Popover
          open={Boolean(notifAnchorEl)}
          anchorEl={notifAnchorEl}
          onClose={handleNotificationsClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 480,
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Popover header */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  color="error"
                  sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Typography>

            {/* Mark all as read button */}
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<DoneAllIcon fontSize="small" />}
                onClick={() => {
                  onMarkAllRead?.();
                }}
                sx={{ fontSize: '0.75rem', textTransform: 'none' }}
              >
                Mark all read
              </Button>
            )}
          </Box>

          {/* Notification list */}
          <List sx={{ p: 0, overflowY: 'auto', flexGrow: 1 }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No notifications"
                  secondary="You're all caught up!"
                  sx={{ textAlign: 'center', py: 2 }}
                />
              </ListItem>
            ) : (
              notifications.slice(0, 8).map((notif) => (
                <ListItemButton
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    bgcolor: notif.read
                      ? 'transparent'
                      : isDark
                        ? 'rgba(90,159,212,0.1)'
                        : 'rgba(25,118,210,0.05)',
                    '&:hover': {
                      bgcolor: isDark
                        ? 'rgba(90,159,212,0.15)'
                        : 'rgba(25,118,210,0.08)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CircleIcon
                      sx={{
                        fontSize: 10,
                        color: notif.read ? 'transparent' : theme.palette.primary.main,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={notif.read ? 400 : 600}>
                          {notif.title}
                        </Typography>
                        <Chip
                          label={notif.type}
                          size="small"
                          color={getSeverityColor(notif.type)}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              ))
            )}
          </List>

          {/* View all footer */}
          {notifications.length > 8 && (
            <Box
              sx={{
                p: 1,
                borderTop: `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  handleNotificationsClose();
                 navigate('/notifications')
                }}
              >
                View all ({notifications.length})
              </Typography>
            </Box>
          )}
        </Popover>

        {/* User avatar + menu */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', ml: 1 }}
          onClick={handleProfileMenuOpen}
        >
          <Avatar
            src={user?.avatar || undefined}
            sx={{
              width: 36,
              height: 36,
              bgcolor: isDark ? '#5a9fd4' : '#2E75B6',
              fontSize: '0.9rem',
              transition: 'background-color 0.3s ease',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={500}>
              {user?.name || 'User'}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'capitalize' }}
            >
              {user?.role || 'Guest'}
            </Typography>
          </Box>
        </Box>

        {/* Profile dropdown menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { backgroundColor: theme.palette.background.paper } }}
        >
          <MenuItem onClick={handleProfile}>
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          {user?.role === 'admin' && (
            <MenuItem onClick={handleSettings}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;