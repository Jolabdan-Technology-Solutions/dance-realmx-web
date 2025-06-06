import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const ConnectStripePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: user?.accountType || 'SELLER',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Stripe Connect account');
      }

      const { accountLink } = await response.json();
      window.location.href = accountLink;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/connect/create-account-link', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create account link');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.stripeAccountStatus === 'ACTIVE') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Connect Your Stripe Account
        </Typography>

        <Typography variant="body1" paragraph>
          To start selling on Dance Realm, you need to connect your Stripe account.
          This will allow you to receive payments for your courses and resources.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
          {!user?.stripeAccountId ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Connect Stripe Account'
              )}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Complete Onboarding'
              )}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ConnectStripePage; 