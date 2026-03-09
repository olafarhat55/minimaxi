import { Box, Typography } from '@mui/material';

interface SetupStep {
  label: string;
  path: string;
}

const steps: SetupStep[] = [
  { label: 'Company Settings', path: '/setup/company' },
  { label: 'Add Machines', path: '/setup/machines' },
  { label: 'Add Users', path: '/setup/users' },
  { label: 'Finish & Go to Dashboard', path: '/setup/complete' },
];

interface SetupSidebarProps {
  activeStep?: number;
}

const SetupSidebar = ({ activeStep = 0 }: SetupSidebarProps) => {
  return (
    <Box
      sx={{
        width: 220,
        minHeight: '100vh',
        bgcolor: '#2C3548',
        color: 'white',
        py: 4,
        px: 2,
        position: 'fixed',
        left: 0,
        top: 0,
      }}
    >
      {/* Logo */}
      <Box sx={{ mb: 5, px: 1 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <img
            src="/images/logo.png"
            alt="minimaxi logo"
            style={{
              height: 28,
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
          minimaxi
        </Typography>
      </Box>

      {/* Steps */}
      <Box sx={{ position: 'relative' }}>
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

          return (
            <Box
              key={step.label}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                mb: index < steps.length - 1 ? 0 : 0,
                position: 'relative',
              }}
            >
              {/* Vertical Line */}
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 9,
                    top: 20,
                    width: 2,
                    height: 40,
                    bgcolor: isCompleted ? '#2E75B6' : 'rgba(255,255,255,0.2)',
                  }}
                />
              )}

              {/* Circle */}
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: isActive || isCompleted ? '#2E75B6' : 'rgba(255,255,255,0.3)',
                  bgcolor: isActive || isCompleted ? '#2E75B6' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mr: 1.5,
                  mt: 0.25,
                }}
              >
                {isCompleted && (
                  <Typography sx={{ fontSize: 10, fontWeight: 700 }}>✓</Typography>
                )}
              </Box>

              {/* Label */}
              <Box sx={{ pb: 4 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                    lineHeight: 1.4,
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default SetupSidebar;
