import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface Certificate {
  id: string;
  studentName: string;
  courseName: string;
  issueDate: string;
  status: 'PENDING' | 'ISSUED' | 'REVOKED';
  certificateUrl?: string;
}

const CertificationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('/api/certificates');
      const data = await response.json();
      setCertificates(data);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = () => {
    navigate('/certification/generate');
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ISSUED':
        return 'success';
      case 'REVOKED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Certificates
        </Typography>
        {user?.roles.includes('INSTRUCTOR') && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateCertificate}
          >
            Generate Certificate
          </Button>
        )}
      </Box>

      {loading ? (
        <Typography>Loading certificates...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell>{certificate.studentName}</TableCell>
                  <TableCell>{certificate.courseName}</TableCell>
                  <TableCell>
                    {new Date(certificate.issueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={certificate.status}
                      color={getStatusColor(certificate.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {certificate.certificateUrl && (
                      <Button
                        size="small"
                        onClick={() => window.open(certificate.certificateUrl, '_blank')}
                      >
                        View
                      </Button>
                    )}
                    {user?.roles.includes('INSTRUCTOR') && certificate.status === 'ISSUED' && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRevokeCertificate(certificate.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default CertificationPage; 