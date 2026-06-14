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
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Settings as SetupIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { validatePassword, validateConfirmPassword } from '../../utils/validation';
import { useAuth } from '../../context/AuthContext';

const ActivatePage = () => {
  const navigate = useNavigate();
  const { setUserDirectly } = useAuth();
  const [searchParams] = useSearchParams();

  // ── تحديد نوع الفلو: id (قديم) أو token (جديد لـ invited users) ──
  const idParam = searchParams.get('id');
  const tokenParam = searchParams.get('token') ?? '';

  const accessRequestId = idParam !== null ? Number(idParam) : NaN;
  const hasValidRequestId = Number.isFinite(accessRequestId) && accessRequestId > 0;
  const hasValidToken = tokenParam.length > 0;

  // الصفحة صالحة لو في id أو token
  const isPageValid = hasValidRequestId || hasValidToken;

  // نوع الفلو
  const isInviteFlow = !hasValidRequestId && hasValidToken;

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activated, setActivated] = useState(false);
  const [userRole, setUserRole] = useState('');

  const passwordChecks = {
    length:    formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number:    /\d/.test(formData.password),
    special:   /[@$!%*?&]/.test(formData.password),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      const passwordError = validatePassword(value);
      setErrors((prev) => ({ ...prev, password: passwordError }));
      if (formData.confirmPassword) {
        const confirmError = validateConfirmPassword(value, formData.confirmPassword);
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }
    }

    if (name === 'confirmPassword') {
      const confirmError = validateConfirmPassword(formData.password, value);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }

    setError('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    const confirmError = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let result: any;

      if (isInviteFlow) {
        // ── Invite flow: POST /auth/activate-invited ──
        result = await api.activateInvitedUser(tokenParam, formData.password);
      } else {
        // ── Access request flow: POST /auth/activate ──
        result = await api.activateAccount(accessRequestId, formData.password);
      }

      if (result?.token) {
        sessionStorage.setItem('token', result.token);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        setUserDirectly(result.user);
      }

      setUserRole(result?.user?.role || '');
      setActivated(true);
    } catch (err: any) {
      setError(err.message || 'Failed to activate account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PasswordCheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
    <ListItem dense sx={{ py: 0 }}>
      <ListItemIcon sx={{ minWidth: 28 }}>
        {checked
          ? <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
          : <CloseIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        }
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          variant: 'caption',
          color: checked ? 'success.main' : 'text.secondary',
        }}
      />
    </ListItem>
  );

  // ── Success Screen ──────────────────────────────────────────────────
  if (activated) {
    const isAdmin = ['admin', 'system_admin', 'company_admin'].includes(userRole);

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
                {isInviteFlow ? 'Password Set Successfully!' : 'Account Activated!'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isInviteFlow
                  ? 'Your account is ready. Please log in to get started.'
                  : 'Your account is ready. Where would you like to go?'
                }
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* زر Setup My Company — بس للـ admin في الفلو القديم */}
                {!isInviteFlow && isAdmin && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SetupIcon />}
                    onClick={() => navigate('/setup')}
                    sx={{ py: 1.5 }}
                  >
                    Set Up My Company
                  </Button>
                )}

                {/* Invited users يروحوا للـ dashboard مباشرةً */}
                {isInviteFlow ? (
  <Button
    variant="contained"
    size="large"
    startIcon={<LoginIcon />}
    onClick={() => navigate('/login')}
    sx={{ py: 1.5 }}
  >
    Go to Login
  </Button>
) : (
                  <Button
                    variant={isAdmin ? 'outlined' : 'contained'}
                    size="large"
                    startIcon={<LoginIcon />}
                    onClick={() => navigate('/login')}
                    sx={{ py: 1.5 }}
                  >
                    Go to Login
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // ── Activation Form ─────────────────────────────────────────────────
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
              {isInviteFlow ? 'Set Your Password' : 'Activate Your Account'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              {isInviteFlow
                ? 'Welcome! Create a password to activate your account.'
                : 'Welcome! To activate your account, set your password below.'
              }
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {!isPageValid && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Invalid or missing activation link. Please use the link from your email.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="New Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {formData.password && (
                <Box sx={{ bgcolor: '#f5f5f5', borderRadius: 1, p: 1, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Password Requirements:
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    <PasswordCheckItem checked={passwordChecks.length}    label="At least 8 characters" />
                    <PasswordCheckItem checked={passwordChecks.uppercase} label="One uppercase letter (A-Z)" />
                    <PasswordCheckItem checked={passwordChecks.lowercase} label="One lowercase letter (a-z)" />
                    <PasswordCheckItem checked={passwordChecks.number}    label="One number (0-9)" />
                    <PasswordCheckItem checked={passwordChecks.special}   label="One special character (@$!%*?&)" />
                  </List>
                </Box>
              )}

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !isPageValid || !allChecksPassed}
                sx={{ py: 1.5, mt: 3 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ActivatePage;