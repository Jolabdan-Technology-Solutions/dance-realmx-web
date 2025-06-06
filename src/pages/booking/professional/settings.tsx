import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
} from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';
import { BookingSettings } from '../../../types/booking';

const ProfessionalBookingSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Partial<BookingSettings>>({
    minNoticeHours: 24,
    maxAdvanceDays: 30,
    cancellationPolicy: {
      allowedUntilHours: 24,
      refundPercentage: 100,
    },
    bufferTime: 15,
    defaultDuration: 60,
    defaultPrice: 50,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/bookings/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/bookings/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          professionalId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Loading settings...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Booking Settings
      </Typography>

      <Paper sx={{ p: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully!
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Notice (hours)"
              value={settings.minNoticeHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minNoticeHours: Number(e.target.value),
                })
              }
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Maximum Advance Booking (days)"
              value={settings.maxAdvanceDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxAdvanceDays: Number(e.target.value),
                })
              }
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Cancellation Policy
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Cancellation Allowed Until (hours before)"
              value={settings.cancellationPolicy?.allowedUntilHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cancellationPolicy: {
                    ...settings.cancellationPolicy,
                    allowedUntilHours: Number(e.target.value),
                  },
                })
              }
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Refund Percentage"
              value={settings.cancellationPolicy?.refundPercentage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cancellationPolicy: {
                    ...settings.cancellationPolicy,
                    refundPercentage: Number(e.target.value),
                  },
                })
              }
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Default Booking Settings
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Buffer Time (minutes)"
              value={settings.bufferTime}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bufferTime: Number(e.target.value),
                })
              }
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Default Duration (minutes)"
              value={settings.defaultDuration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultDuration: Number(e.target.value),
                })
              }
              InputProps={{ inputProps: { min: 15, step: 15 } }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Default Price"
              value={settings.defaultPrice}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultPrice: Number(e.target.value),
                })
              }
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfessionalBookingSettingsPage; 