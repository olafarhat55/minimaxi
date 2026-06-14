import { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { api } from '../../services/api';
import { industries } from '../../data/mockData';
import {
  validateEmail,
  validatePhone,
  validateName,
  validateCompanyName,
} from '../../utils/validation';

const serviceTypes = [
  { value: 'monitoring', label: 'Real-time Monitoring' },
  { value: 'predictive', label: 'Predictive Maintenance' },
  { value: 'both', label: 'Both Services' },
];

const RequestAccessPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    contact_person: '',
    email: '',
    phone: '',
    service_type: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let fieldError = '';
    switch (name) {
      case 'company_name':  fieldError = validateCompanyName(value); break;
      case 'email':         fieldError = validateEmail(value);        break;
      case 'phone':         fieldError = validatePhone(value);        break;
      case 'contact_person':fieldError = validateName(value);         break;
      default: break;
    }
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
    setError('');
  };

  const handleServiceChange = (value: string) => {
    setFormData((prev) => {
      const current = prev.service_type;
      if (current.includes(value)) {
        return { ...prev, service_type: current.filter((v) => v !== value) };
      } else {
        return { ...prev, service_type: [...current, value] };
      }
    });
    setErrors((prev) => ({ ...prev, service_type: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const companyError = validateCompanyName(formData.company_name);
    if (companyError) newErrors.company_name = companyError;
    if (!formData.industry) newErrors.industry = 'Please select an industry';
    const contactError = validateName(formData.contact_person);
    if (contactError) newErrors.contact_person = contactError;
    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    if (formData.service_type.length === 0)
      newErrors.service_type = 'Please select at least one service';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildRequestBody = () => ({
    company_name:         formData.company_name,
    contact_person_name:  formData.contact_person,
    email:                formData.email,
    phone:                formData.phone,
    industry:             formData.industry,
    requested_service:
      formData.service_type.length === 1
        ? formData.service_type[0].toUpperCase()
        : 'BOTH',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await api.requestAccess(buildRequestBody());
      setSubmittedEmail(formData.email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend — بتعيد نفس الـ request بدون form event ──────────────────────
  const handleResend = async () => {
    setLoading(true);
    setResendSuccess(false);
    setError('');
    try {
      await api.requestAccess(buildRequestBody());
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
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
                Request Submitted Successfully!
              </Typography>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                We've sent an activation link to your email:
              </Typography>

              <Typography
                variant="body1"
                fontWeight={600}
                sx={{ mb: 3, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, display: 'inline-block' }}
              >
                {submittedEmail}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please check your inbox and click the activation link to continue.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {resendSuccess && (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      bgcolor: '#f0fdf4',
      border: '1px solid #86efac',
      borderRadius: 2,
      px: 2,
      py: 1.5,
      mb: 2,
    }}
  >
    <CheckCircleIcon sx={{ color: '#22c55e', fontSize: 20 }} />
    <Typography variant="body2" color="#15803d" fontWeight={500}>
      Email resent successfully! Please check your inbox.
    </Typography>
  </Box>
)}

              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <EmailIcon />}
                  onClick={handleResend}
                  disabled={loading}
                  sx={{ py: 1.5, px: 4 }}
                >
                  {loading ? 'Sending...' : 'Resend Email'}
                </Button>
                
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // ── Request Form ──────────────────────────────────────────────────────────
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
              Request Access
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
              Fill out the form below to get started
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth label="Company Name" name="company_name"
                value={formData.company_name} onChange={handleChange}
                margin="normal" error={!!errors.company_name}
                helperText={errors.company_name || 'Letters, numbers, spaces, &, ., - (3-100 chars)'}
                required
              />

              <TextField
                fullWidth select label="Industry" name="industry"
                value={formData.industry} onChange={handleChange}
                margin="normal" error={!!errors.industry}
                helperText={errors.industry} required
              >
                {industries.map((industry) => (
                  <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth label="Contact Person" name="contact_person"
                value={formData.contact_person} onChange={handleChange}
                margin="normal" error={!!errors.contact_person}
                helperText={errors.contact_person || 'Letters only (2-50 chars)'}
                required
              />

              <TextField
                fullWidth label="Email" name="email" type="email"
                value={formData.email} onChange={handleChange}
                margin="normal" error={!!errors.email}
                helperText={errors.email || 'e.g., user@company.com'}
                required
              />

              <TextField
                fullWidth label="Phone" name="phone"
                value={formData.phone} onChange={handleChange}
                margin="normal" error={!!errors.phone}
                helperText={errors.phone || 'Egyptian format: 01012345678 or +201012345678'}
                placeholder="01012345678" required
              />

              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Service Type *
                </Typography>
                <FormGroup>
                  {serviceTypes.map((service) => (
                    <FormControlLabel
                      key={service.value}
                      control={
                        <Checkbox
                          checked={formData.service_type.includes(service.value)}
                          onChange={() => handleServiceChange(service.value)}
                        />
                      }
                      label={service.label}
                    />
                  ))}
                </FormGroup>
                {errors.service_type && (
                  <Typography variant="caption" color="error">
                    {errors.service_type}
                  </Typography>
                )}
              </Box>

              <Button
                type="submit" fullWidth variant="contained" size="large"
                disabled={loading} sx={{ py: 1.5, mt: 2, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit Request'}
              </Button>
            </form>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" underline="hover">
                Sign In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RequestAccessPage;