import { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { validateEmail } from '../../utils/validation';
import { api } from '../../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setOtpError('');
    try {
      await api.forgotPassword(email);
      setResendSuccess(true);
      // hide success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      setOtpError('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError('Please enter the OTP code.');
      return;
    }
    if (otp.trim().length < 4) {
      setOtpError('OTP code is too short.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    try {
      // Navigate to reset-password page passing email + otp
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp.trim())}`);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── "Check Your Email" screen ─────────────────────────────────────
  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2E75B6 0%, #1a4971 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Card sx={{ borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />

              <Typography variant="h5" fontWeight={600} gutterBottom>
                Check Your Email
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                If an account exists with
              </Typography>

              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  mb: 1,
                  p: 1.5,
                  bgcolor: '#f5f5f5',
                  borderRadius: 1,
                  display: 'inline-block',
                }}
              >
                {email}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                you will receive a password reset code shortly.
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* OTP input */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Enter the OTP code sent to your email:
              </Typography>

              {otpError && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  {otpError}
                </Alert>
              )}

              {resendSuccess && (
                <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
                  A new OTP has been sent to your email.
                </Alert>
              )}

              <TextField
                fullWidth
                label="OTP Code"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setOtpError('');
                }}
                margin="normal"
                placeholder="e.g. 437798"
                inputProps={{ maxLength: 10 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                error={!!otpError}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                disabled={otpLoading}
                onClick={handleVerifyOtp}
                sx={{ mb: 1.5 }}
              >
                {otpLoading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="medium"
                disabled={resendLoading}
                onClick={handleResend}
                sx={{ mb: 2 }}
              >
                {resendLoading ? <CircularProgress size={20} color="inherit" /> : 'Resend Email'}
              </Button>

              <Box>
                <Button
                  variant="text"
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/login')}
                  sx={{ color: 'text.secondary' }}
                >
                  Back to Login
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // ── Initial "Forgot Password" form ────────────────────────────────
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2E75B6 0%, #1a4971 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <img
            src="/images/logo.png"
            alt="minimaxi logo"
            style={{ height: 48, width: 'auto', objectFit: 'contain' }}
          />
          <Typography variant="h4" fontWeight={700} sx={{ color: 'white' }}>
            minimaxi
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} textAlign="center" gutterBottom>
              Forgot Password?
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              Enter your email address and we'll send you a code to reset your password.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                margin="normal"
                error={!!error}
                placeholder="user@company.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5, mt: 3, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Code'}
              </Button>

              <Button
                fullWidth
                variant="text"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/login')}
                sx={{ color: 'text.secondary' }}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;