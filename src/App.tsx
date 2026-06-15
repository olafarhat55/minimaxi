import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common';
import { MainLayout } from './components/layout';
import { getDefaultRoute } from './utils/permissions';

const DefaultRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getDefaultRoute(user)} replace />;
};

import {
  LandingPage,
  LoginPage,
  RequestAccessPage,
  ActivatePage,
  LogoutPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/public';

import { SetupWizard } from './pages/setup';

import {
  Dashboard,
  MachinesList,
  MachineDetails,
  WorkOrders,
  CreateWorkOrder,
  WorkOrderDetails,
  MyWorkOrders,
  MaintenancePlanning,
  Alerts,
  Notifications,
  Reports,
  UserManagement,
  Settings,
  Profile,
  AddAsset,
  MachineHistory,
} from './pages/app';

function App() {
  return (
    <ThemeContextProvider>
      {(theme) => (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/request-access" element={<RequestAccessPage />} />
                <Route path="/activate" element={<ActivatePage />} />
                <Route path="/set-password" element={<ActivatePage />} />
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Setup Wizard */}
                <Route
                  path="/setup/*"
                  element={
                    <ProtectedRoute roles={['admin', 'system_admin', 'company_admin']}>
                      <SetupWizard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected App Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer', 'technician']}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/machines"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer', 'technician']}>
                        <MachinesList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/machines/add"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer']}>
                        <AddAsset />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/machines/:id"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer', 'technician']}>
                        <MachineDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/machines/:id/history"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer', 'technician']}>
                        <MachineHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/work-orders"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer']}>
                        <WorkOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/work-orders/new"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer']}>
                        <CreateWorkOrder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/work-orders/:id/edit"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer']}>
                        <CreateWorkOrder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/work-orders/:id"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer', 'technician']}>
                        <WorkOrderDetails />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/maintenance"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer']}>
                        <MaintenancePlanning />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-work-orders"
                    element={
                      <ProtectedRoute roles={['technician']}>
                        <MyWorkOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/alerts"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer']}>
                        <Alerts />
                      </ProtectedRoute>
                    }
                  />

                  {/* ── Notifications page (all roles) ── */}
                  <Route
                    path="/notifications"
                    element={<Notifications />}
                  />

                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin', 'engineer']}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin']}>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute roles={['admin', 'system_admin', 'company_admin']}>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<DefaultRedirect />} />
                </Route>
              </Routes>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      )}
    </ThemeContextProvider>
  );
}

export default App;