import { Box, Button, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SetupHeaderProps {
  showSkip?: boolean;
}

const SetupHeader = ({ showSkip = true }: SetupHeaderProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    navigate('/logout');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 3,
        py: 2,
        px: 3,
        borderBottom: '1px solid #e0e0e0',
        bgcolor: 'white',
      }}
    >
      {showSkip && (
        <Link
          component="button"
          onClick={handleSkip}
          sx={{
            color: '#2E75B6',
            textDecoration: 'none',
            fontSize: 14,
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Skip and go to dashboard
        </Link>
      )}
      <Button
        variant="outlined"
        onClick={handleSignOut}
        sx={{
          borderColor: '#2E75B6',
          color: '#2E75B6',
          '&:hover': {
            borderColor: '#1a4971',
            bgcolor: 'rgba(46, 117, 182, 0.04)',
          },
        }}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default SetupHeader;
