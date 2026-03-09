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
}

const Header = ({ onMenuClick, notifications = [], sidebarOpen = false }: HeaderProps) => {
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

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotifAnchorEl(null);
  };

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

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'error';
      case 'work_order':
        return 'primary';
      case 'system':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: isDark ? '#1E2A3A' : '#fff',
        color: isDark ? '#F1F5F9' : '#333',
        boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
        transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label={sidebarOpen ? 'close sidebar' : 'open sidebar'}
          onClick={onMenuClick}
          sx={{
            mr: 2,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>

        {/* Logo and Brand */}
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <MiniMaxiLogo
            size={34}
            showText={false}
            onClick={() => {
              const homePath = user?.role === 'technician' ? '/my-work-orders' : '/dashboard';
              navigate(homePath);
            }}
          />
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'block', md: 'none' } }}>
          <MiniMaxiLogo
            size={34}
            showText
            onClick={() => {
              const homePath = user?.role === 'technician' ? '/my-work-orders' : '/dashboard';
              navigate(homePath);
            }}
          />
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <MiniMaxiLogo
            size={36}
            showText
            showTagline
            onClick={() => {
              const homePath = user?.role === 'technician' ? '/my-work-orders' : '/dashboard';
              navigate(homePath);
            }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <IconButton
          color="inherit"
          onClick={handleNotificationsOpen}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Popover
          open={Boolean(notifAnchorEl)}
          anchorEl={notifAnchorEl}
          onClose={handleNotificationsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 400,
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
            </Typography>
          </Box>
          <List sx={{ p: 0 }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No notifications"
                  secondary="You're all caught up!"
                  sx={{ textAlign: 'center', py: 2 }}
                />
              </ListItem>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <ListItemButton
                  key={notif.id}
                  sx={{
                    bgcolor: notif.read
                      ? 'transparent'
                      : isDark
                        ? 'rgba(90, 159, 212, 0.1)'
                        : 'rgba(25, 118, 210, 0.05)',
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
                        <Typography variant="body2" fontWeight={500}>
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
                        <Typography variant="caption" display="block">
                          {notif.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                        </Typography>
                      </>
                    }
                  />
                </ListItemButton>
              ))
            )}
          </List>
          {notifications.length > 5 && (
            <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={() => {
                  handleNotificationsClose();
                  navigate('/alerts');
                }}
              >
                View all notifications
              </Typography>
            </Box>
          )}
        </Popover>

        {/* User Menu */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            ml: 1,
          }}
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
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {user?.role || 'Guest'}
            </Typography>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              backgroundColor: theme.palette.background.paper,
            },
          }}
        >
          <MenuItem onClick={handleProfile}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          {user?.role === 'admin' && (
            <MenuItem onClick={handleSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
          )}
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
