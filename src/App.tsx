import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ThemeContextProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common';
import { MainLayout } from './components/layout';
import { getDefaultRoute } from './utils/permissions';

// Redirect to the user's role-appropriate default page
const DefaultRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getDefaultRoute(user)} replace />;
};

// Public Pages
import {
  LandingPage,
  LoginPage,
  RequestAccessPage,
  ActivatePage,
  LogoutPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/public';

// Setup Pages
import { SetupWizard } from './pages/setup';

// App Pages
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
  Reports,
  UserManagement,
  Settings,
  Profile,
  AddAsset,
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
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Setup Wizard - Admin Only */}
                <Route
                  path="/setup/*"
                  element={
                    <ProtectedRoute roles={['admin']}>
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
                  {/* Dashboard - All roles (Technician sees basic overview) */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer', 'technician']}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Machines/Assets - All roles (Technician is read-only) */}
                  <Route
                    path="/machines"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer', 'technician']}>
                        <MachinesList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/machines/add"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer']}>
                        <AddAsset />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/machines/:id"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer', 'technician']}>
                        <MachineDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* Work Orders - Admin & Engineer (full access) */}
                  <Route
                    path="/work-orders"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer']}>
                        <WorkOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/work-orders/new"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer']}>
                        <CreateWorkOrder />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/work-orders/:id"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer']}>
                        <WorkOrderDetails />
                      </ProtectedRoute>
                    }
                  />

                  {/* Maintenance Planning - Admin & Engineer */}
                  <Route
                    path="/maintenance"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer']}>
                        <MaintenancePlanning />
                      </ProtectedRoute>
                    }
                  />

                  {/* My Work Orders - Technician only */}
                  <Route
                    path="/my-work-orders"
                    element={
                      <ProtectedRoute roles={['technician']}>
                        <MyWorkOrders />
                      </ProtectedRoute>
                    }
                  />

                  {/* Alerts - Admin & Engineer only */}
                  <Route
                    path="/alerts"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer']}>
                        <Alerts />
                      </ProtectedRoute>
                    }
                  />

                  {/* Reports - Admin & Engineer */}
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute roles={['admin', 'engineer']}>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />

                  {/* User Management - Admin Only */}
                  <Route
                    path="/users"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <UserManagement />
                      </ProtectedRoute>
                    }
                  />

                  {/* Settings - Admin Only */}
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute roles={['admin']}>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />

                  {/* Profile - All authenticated users */}
                  <Route path="/profile" element={<Profile />} />

                  {/* Default redirect based on user role */}
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
