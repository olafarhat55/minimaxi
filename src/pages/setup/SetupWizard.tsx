import { useState } from 'react';
import { Box } from '@mui/material';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import SetupWelcome from './SetupWelcome';
import CompanySettings from './CompanySettings';
import AddMachines from './AddMachines';
import AddUsers from './AddUsers';
import SetupComplete from './SetupComplete';
import { SetupSidebar, SetupHeader } from '../../components/setup';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const SetupWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [setupData, setSetupData] = useState({
    company: {},
    machines: [],
    users: [],
  });

  // Determine active step based on current path
  const getActiveStep = (): number => {
    const path = location.pathname;
    if (path.includes('/company')) return 0;
    if (path.includes('/machines')) return 1;
    if (path.includes('/users')) return 2;
    if (path.includes('/complete')) return 3;
    return -1; // Welcome page
  };

  const handleUpdateData = (key: string, data: any) => {
    setSetupData((prev) => ({ ...prev, [key]: data }));
  };

  const handleComplete = async () => {
    try {
      await api.completeSetup();
      updateUser({ first_login: false });
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete setup:', error);
    }
  };

  const activeStep = getActiveStep();
  const isWelcomePage = activeStep === -1;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar - Only show on non-welcome pages */}
      {!isWelcomePage && <SetupSidebar activeStep={activeStep} />}

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          ml: isWelcomePage ? 0 : '220px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <SetupHeader showSkip={!isWelcomePage && activeStep !== 3} />

        {/* Content Area */}
        <Box sx={{ flex: 1, p: 4 }}>
          <Box sx={{ maxWidth: 900, mx: 'auto' }}>
            <Routes>
              <Route
                index
                element={
                  <SetupWelcome
                    userName={user?.name}
                    onNext={() => navigate('/setup/company')}
                  />
                }
              />
              <Route
                path="company"
                element={
                  <CompanySettings
                    data={setupData.company}
                    onUpdate={(data) => handleUpdateData('company', data)}
                    onNext={() => navigate('/setup/machines')}
                    onBack={() => navigate('/setup')}
                  />
                }
              />
              <Route
                path="machines"
                element={
                  <AddMachines
                    machines={setupData.machines}
                    onUpdate={(data) => handleUpdateData('machines', data)}
                    onNext={() => navigate('/setup/users')}
                    onBack={() => navigate('/setup/company')}
                  />
                }
              />
              <Route
                path="users"
                element={
                  <AddUsers
                    users={setupData.users}
                    onUpdate={(data) => handleUpdateData('users', data)}
                    onNext={() => navigate('/setup/complete')}
                    onBack={() => navigate('/setup/machines')}
                  />
                }
              />
              <Route
                path="complete"
                element={
                  <SetupComplete
                    userName={user?.name}
                    onComplete={handleComplete}
                    onBack={() => navigate('/setup/users')}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/setup" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SetupWizard;
