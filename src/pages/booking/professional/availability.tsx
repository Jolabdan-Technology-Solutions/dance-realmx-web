import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';
import { BookingAvailability } from '../../../types/booking';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const ProfessionalAvailabilityPage: React.FC = () => {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<BookingAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAvailability, setNewAvailability] = useState<Partial<BookingAvailability>>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: true,
  });

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch('/api/bookings/availability');
      const data = await response.json();
      setAvailabilities(data);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailability = async () => {
    try {
      const response = await fetch('/api/bookings/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAvailability,
          professionalId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add availability');
      }

      fetchAvailabilities();
      setNewAvailability({
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isRecurring: true,
      });
    } catch (error) {
      console.error('Error adding availability:', error);
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/availability/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete availability');
      }

      fetchAvailabilities();
    } catch (error) {
      console.error('Error deleting availability:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Availability
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add New Availability
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={newAvailability.dayOfWeek}
                label="Day of Week"
                onChange={(e) =>
                  setNewAvailability({
                    ...newAvailability,
                    dayOfWeek: Number(e.target.value),
                  })
                }
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <MenuItem key={day} value={index}>
                    {day}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="time"
              label="Start Time"
              value={newAvailability.startTime}
              onChange={(e) =>
                setNewAvailability({
                  ...newAvailability,
                  startTime: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              type="time"
              label="End Time"
              value={newAvailability.endTime}
              onChange={(e) =>
                setNewAvailability({
                  ...newAvailability,
                  endTime: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={newAvailability.isRecurring}
                  onChange={(e) =>
                    setNewAvailability({
                      ...newAvailability,
                      isRecurring: e.target.checked,
                    })
                  }
                />
              }
              label="Recurring"
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddAvailability}
              fullWidth
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Current Availability
      </Typography>

      {loading ? (
        <Typography>Loading availabilities...</Typography>
      ) : (
        <Grid container spacing={2}>
          {availabilities.map((availability) => (
            <Grid item xs={12} md={6} key={availability.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">
                        {DAYS_OF_WEEK[availability.dayOfWeek]}
                      </Typography>
                      <Typography color="text.secondary">
                        {availability.startTime} - {availability.endTime}
                      </Typography>
                      {availability.isRecurring && (
                        <Typography variant="body2" color="primary">
                          Recurring
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteAvailability(availability.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ProfessionalAvailabilityPage; 