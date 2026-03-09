import { useEffect } from 'react';
import { Box, Container, Card, CardContent, Typography, Button } from '@mui/material';
import { FlightTakeoff as AirplaneIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    // Clear session on mount
    logout();
  }, [logout]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2E75B6 0%, #1a4971 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: '#e3f2fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <AirplaneIcon sx={{ fontSize: 60, color: '#2E75B6' }} />
            </Box>

            <Typography variant="h4" fontWeight={600} gutterBottom>
              See You Again!
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Thanks for using Minimaxi. You are now successfully signed out.
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              startIcon={<span>←</span>}
              sx={{ px: 4 }}
            >
              Return to login
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LogoutPage;
