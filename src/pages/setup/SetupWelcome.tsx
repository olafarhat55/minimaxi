import { Box, Typography, Button, Paper } from '@mui/material';
import { RocketLaunch as RocketIcon } from '@mui/icons-material';

interface SetupWelcomeProps {
  userName?: string;
  onNext: () => void;
}

const SetupWelcome = ({ userName, onNext }: SetupWelcomeProps) => {
  return (
    <Paper
      sx={{
        p: 6,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: 400,
      }}
    >
      <Box
        sx={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: '#e3f2fd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <RocketIcon sx={{ fontSize: 50, color: '#2E75B6' }} />
      </Box>

      <Typography variant="h4" fontWeight={600} gutterBottom>
        Welcome, {userName || 'Admin'}!
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 450, mb: 4 }}
      >
        Let's set up your workspace
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={onNext}
        sx={{ px: 6, py: 1.5 }}
      >
        Start Setup
      </Button>
    </Paper>
  );
};

export default SetupWelcome;
