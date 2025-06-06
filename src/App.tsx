import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import CurriculumPage from './pages/curriculum';
import CreateResourcePage from './pages/curriculum/create';
import CertificationPage from './pages/certification';
import GenerateCertificatePage from './pages/certification/generate';
import ConnectStripePage from './pages/connect-stripe';
import ProfilePage from './pages/profile';
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import PrivateRoute from './components/auth/PrivateRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Navigate to="/dashboard" replace />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/curriculum"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <CurriculumPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/curriculum/create"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <CreateResourcePage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/certification"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <CertificationPage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/certification/generate"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <GenerateCertificatePage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/connect-stripe"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <ConnectStripePage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <ProfilePage />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 