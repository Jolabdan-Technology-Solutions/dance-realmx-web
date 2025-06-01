import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, CheckCircle, Download, ExternalLink, Copy, Link2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CertificateDisplayProps {
  certificateId: number;
}

export function CertificateDisplay({ certificateId }: CertificateDisplayProps) {
  const { toast } = useToast();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch certificate data
  const { data: certificate, isLoading, error } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: async () => {
      const data = await apiRequest(`/certificates/${certificateId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return data;
    },
  });

  const handleDownload = () => {
    window.open(`/api/certificates/${certificateId}/download`, '_blank');
  };

  const handleCopyVerificationLink = () => {
    if (certificate?.verificationCode) {
      const verificationUrl = `${window.location.origin}/verify/${certificate.verificationCode}`;
      navigator.clipboard.writeText(verificationUrl);
      toast({
        title: 'Link Copied',
        description: 'Certificate verification link copied to clipboard',
        duration: 2000,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="aspect-video flex items-center justify-center bg-muted">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (error || !certificate) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load certificate. The certificate might have been revoked or does not exist.
        </AlertDescription>
      </Alert>
    );
  }

  const statusColor = {
    active: 'bg-green-100 text-green-800 hover:bg-green-200',
    revoked: 'bg-red-100 text-red-800 hover:bg-red-200',
    expired: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificate of Completion
            </CardTitle>
            <CardDescription>
              Issued on {getFormattedDate(certificate.issueDate)}
            </CardDescription>
          </div>
          <Badge className={statusColor[certificate.status as keyof typeof statusColor] || statusColor.active}>
            {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden mb-4">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          )}
          <img
            src={`/api/certificates/${certificateId}/preview`}
            alt="Certificate"
            className="w-full h-full object-contain"
            onLoad={() => setImageLoaded(true)}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        </div>
        
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Course</h3>
              <p className="mt-1 font-medium">{certificate.course.title}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Recipient</h3>
              <p className="mt-1 font-medium">{certificate.recipient}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Verification</h3>
            <div className="mt-1 p-3 bg-muted rounded-md flex items-center justify-between">
              <code className="text-xs overflow-hidden text-ellipsis">{certificate.verificationCode}</code>
              <Button variant="ghost" size="icon" onClick={handleCopyVerificationLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              This certificate can be verified using the code above at our verification portal
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-6">
        <Button variant="outline" onClick={handleCopyVerificationLink}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy Verification Link
        </Button>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Download Certificate
        </Button>
      </CardFooter>
    </Card>
  );
}

interface CertificateVerificationProps {
  verificationCode: string;
}

export function CertificateVerification({ verificationCode }: CertificateVerificationProps) {
  // Fetch certificate verification
  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-certificate', verificationCode],
    queryFn: async () => {
      const data = await apiRequest(`/certificates/verify/${verificationCode}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invalid Certificate</AlertTitle>
        <AlertDescription>
          This certificate verification code is invalid or has been revoked.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data.valid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invalid Certificate</AlertTitle>
        <AlertDescription>
          {data.message || 'This certificate is not valid.'}
        </AlertDescription>
      </Alert>
    );
  }

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="border-b pb-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificate Verification
            </CardTitle>
            <CardDescription>
              Verification code: {verificationCode}
            </CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" /> Valid Certificate
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex items-center justify-center mb-8">
          <div className="text-center">
            <div className="rounded-full bg-green-100 p-3 mx-auto w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Certificate Authenticated</h3>
            <p className="text-muted-foreground">
              This certificate has been verified as authentic
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Certificate Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{getFormattedDate(data.certificate.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize">{data.certificate.status}</span>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium mb-2">Course Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course:</span>
                <span>{data.course.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span>{data.recipient.name}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 