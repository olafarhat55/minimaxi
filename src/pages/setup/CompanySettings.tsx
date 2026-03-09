import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  FormLabel,
  Grid,
  Paper,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { api } from '../../services/api';
import { timezones, languages } from '../../data/mockData';

interface CompanySettingsProps {
  data: Record<string, any>;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

const CompanySettings = ({ data, onUpdate, onNext, onBack }: CompanySettingsProps) => {
  const [formData, setFormData] = useState({
    name: '',
    logo: null,
    timezone: 'Africa/Cairo',
    language: 'en',
    ...data,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const settings = await api.getCompanySettings();
        setFormData((prev) => ({ ...prev, name: settings.name || prev.name }));
      } catch (error) {
        console.error('Failed to fetch company settings:', error);
      }
    };
    fetchCompanySettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.updateCompanySettings(formData);
      onUpdate(formData);
      onNext();
    } catch (error) {
      console.error('Failed to update company settings:', error);
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

      <Grid container spacing={3} sx={{ maxWidth: 600 }}>
        {/* @ts-expect-error MUI v7 Grid item prop */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Company Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>

        {/* <Grid item xs={12}>
          <FormControl fullWidth>
            <FormLabel sx={{ mb: 1, fontSize: 14 }}>Logo</FormLabel>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{
                justifyContent: 'flex-start',
                py: 1.5,
                borderStyle: 'dashed',
              }}
            >
              {formData.logo ? formData.logo.name : 'Add your company logo'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
          </FormControl>
        </Grid> */}

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
        <Button
          onClick={onBack}
          disabled={loading}
          variant="outlined"
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
};

export default CompanySettings;
