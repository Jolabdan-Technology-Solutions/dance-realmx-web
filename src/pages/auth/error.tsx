import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'Configuration':
        return 'There is a problem with the server configuration. Please try again later.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification link may have expired or has already been used.';
      default:
        return 'An error occurred during sign in. Please try again.';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />

        <Typography variant="h4" component="h1" gutterBottom>
          Authentication Error
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          align="center"
          sx={{ mb: 4 }}
        >
          {typeof error === 'string' ? getErrorMessage(error) : 'An error occurred during sign in.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/auth/signin')}
          >
            Try Again
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push('/')}
          >
            Go Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
} 