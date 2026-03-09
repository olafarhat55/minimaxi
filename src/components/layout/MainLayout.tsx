import { useState, useEffect, useCallback } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { api } from '../../services/api';
import { useThemeMode } from '../../context/ThemeContext';

const SIDEBAR_STORAGE_KEY = 'minimaxi_sidebar_open';

const MainLayout = () => {
  const theme = useTheme();
  const { isDark } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Initialize from localStorage for desktop, false for mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data as any[]);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Save preference to localStorage (only for desktop)
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Header onMenuClick={handleMenuClick} notifications={notifications} sidebarOpen={sidebarOpen} />
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
    </Box>
  );
};

export default MainLayout;
