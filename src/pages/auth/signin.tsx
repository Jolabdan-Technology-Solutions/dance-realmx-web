import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';

export default function SignIn() {
  const router = useRouter();
  const theme = useTheme();
  const { callbackUrl } = router.query;

  const handleGoogleSignIn = () => {
    signIn('google', {
      callbackUrl: typeof callbackUrl === 'string' ? callbackUrl : '/',
    });
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
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to Dance RealmX
        </Typography>

        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Sign in to access your account and start your dance journey
        </Typography>

        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleSignIn}
          fullWidth
          sx={{
            mb: 2,
            backgroundColor: theme.palette.common.white,
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.grey[100],
            },
          }}
        >
          Continue with Google
        </Button>

        <Typography variant="body2" color="text.secondary" align="center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Paper>
    </Container>
  );
} 