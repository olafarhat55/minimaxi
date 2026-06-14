import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { api } from '../../services/api';
import { timezones, languages } from '../../data/mockData';

interface CompanySettingsProps {
  data: Record<string, any>;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const INDUSTRIES = [
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Oil & Gas', label: 'Oil & Gas' },
  { value: 'Mining', label: 'Mining' },
  { value: 'Utilities', label: 'Utilities' },
];

const CompanySettings = ({ data, onUpdate, onNext, onBack }: CompanySettingsProps) => {
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'Africa/Cairo',
    language: 'en',
    industry: 'Manufacturing',
    ...data,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const settings = await api.getCompanySettings();
        setFormData((prev) => ({
          ...prev,
          name:     settings.name     || prev.name,
          timezone: settings.timezone || prev.timezone,
          language: settings.language || prev.language,
        }));
      } catch (err) {
        console.error('Failed to fetch company settings:', err);
      }
    };
    fetchCompanySettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.updateCompanySettings({
        name:         formData.name,
        timezone:     formData.timezone,
        language:     formData.language,
        industry:     formData.industry,
        service_type: 'PREDICTIVE_MAINTENANCE',
      });
      onUpdate(formData);
      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to save company settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Company Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Configure your company preferences
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ maxWidth: 600 }}>
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!error && !formData.name.trim()}
          />
        </Grid>

        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
          >
            {INDUSTRIES.map((i) => (
              <MenuItem key={i.value} value={i.value}>
                {i.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="Timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
          >
            {timezones.map((tz) => (
              <MenuItem key={tz.value} value={tz.value}>
                {tz.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="Language"
            name="language"
            value={formData.language}
            onChange={handleChange}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} disabled={loading} variant="outlined">
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? 'Saving…' : 'Next'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CompanySettings;