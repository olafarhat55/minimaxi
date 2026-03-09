import { Box, Typography, Button, Paper } from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';

interface SetupCompleteProps {
  userName?: string;
  onComplete: () => void;
  onBack: () => void;
}

const SetupComplete = ({ userName, onComplete, onBack }: SetupCompleteProps) => {
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
          bgcolor: '#e8f5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 60, color: '#4caf50' }} />
      </Box>

      <Typography variant="h4" fontWeight={600} gutterBottom>
        Setup Is Completed
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 500, mb: 4 }}
      >
        Your environment is now ready, {userName || 'Admin'}. Head to the dashboard to monitor
        machine health, track work orders, and take data-driven maintenance decisions.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button onClick={onBack} variant="outlined">
          Back
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={onComplete}
          sx={{ px: 6 }}
        >
          Go To Dashboard
        </Button>
      </Box>
    </Paper>
  );
};

export default SetupComplete;
