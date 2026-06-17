import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Toolbar,
  useTheme,
  useMediaQuery,
  Snackbar,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Work as WorkOrderToastIcon,
  WarningAmber as AlertToastIcon,
  InfoOutlined as SystemToastIcon,
  Notifications as DefaultToastIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';

const SIDEBAR_STORAGE_KEY = 'minimaxi_sidebar_open';

// ── شكل التوست حسب نوع الإشعار ───────────────────────────────────────────────
const toastConfig: Record<string, { icon: typeof WorkOrderToastIcon; color: string }> = {
  alert:             { icon: AlertToastIcon,     color: '#f44336' },
  work_order:        { icon: WorkOrderToastIcon, color: '#1976d2' },
  system:            { icon: SystemToastIcon,    color: '#0288d1' },
  predicted_failure: { icon: AlertToastIcon,     color: '#9c27b0' },
};

const getToastConfig = (type: string) =>
  toastConfig[type] ?? { icon: DefaultToastIcon, color: '#757575' };

const MainLayout = () => {
  const theme = useTheme();
  const { isDark } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [toastNotif, setToastNotif] = useState<any | null>(null);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      setSidebarOpen(saved !== null ? JSON.parse(saved) : true);
    }
  }, [isMobile]);

  const POLL_INTERVAL = 10000; // 10 ثانية

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.error('Could not play notification sound', e);
    }
  };

  const fetchNotifications = useCallback(async (silent = false) => {
    try {
      const data = (await api.getNotifications()) as any[];

      if (!isFirstLoadRef.current) {
        const newOnes = data.filter((n) => !seenIdsRef.current.has(n.id) && !n.read);
        if (newOnes.length > 0) {
          playNotificationSound();
          setToastNotif(newOnes[0]);
        }
      }

      seenIdsRef.current = new Set(data.map((n) => n.id));
      isFirstLoadRef.current = false;
      setNotifications(data);
    } catch (error) {
      if (!silent) console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const saveSidebarPreference = useCallback((isOpen: boolean) => {
    if (!isMobile) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isOpen));
    }
  }, [isMobile]);

  const handleMenuClick = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    saveSidebarPreference(newState);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
    if (!isMobile) {
      saveSidebarPreference(false);
    }
  };

  const toastCfg = getToastConfig(toastNotif?.type ?? '');
  const ToastIcon = toastCfg.icon;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Header
        onMenuClick={handleMenuClick}
        notifications={notifications}
        sidebarOpen={sidebarOpen}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />
      <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
          minHeight: '100vh',
          minWidth: 0,
          overflow: 'hidden',
          transition: 'background-color 0.3s ease, margin 0.3s ease',
        }}
      >
        <Toolbar />
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>

      <Snackbar
        open={!!toastNotif}
        autoHideDuration={5000}
        onClose={() => setToastNotif(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Paper
          elevation={4}
          onClick={() => {
            setToastNotif(null);
            navigate('/notifications');
          }}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5,
            p: 2,
            width: 360,
            borderRadius: 3,
            border: `2px solid ${toastCfg.color}`,
            background: `linear-gradient(135deg, #ffffff 55%, ${toastCfg.color}1A 100%)`,
            cursor: 'pointer',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: `${toastCfg.color}1A`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ToastIcon sx={{ color: toastCfg.color, fontSize: 20 }} />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1e293b' }}>
              {toastNotif?.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 0.25 }}>
              {toastNotif?.message}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setToastNotif(null);
            }}
            sx={{ p: 0.5, flexShrink: 0 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Snackbar>
    </Box>
  );
};

export default MainLayout;