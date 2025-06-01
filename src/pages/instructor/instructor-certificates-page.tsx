import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MailIcon, MoreVertical, Plus, Search, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Certificate {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  profileImageUrl: string | null;
  courseId: number;
  courseName: string;
  templateId: number;
  templateName: string;
  status: string;
  issuedDate: string;
  expiryDate: string | null;
}

export default function InstructorCertificatesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ['/api/instructor/certificates'],
    retry: false,
  });

  const filteredCertificates = certificates?.filter(certificate => {
    const matchesSearch = searchTerm === "" || 
      certificate.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certificate.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      certificate.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "issued") return matchesSearch && certificate.status === "issued";
    if (activeTab === "revoked") return matchesSearch && certificate.status === "revoked";
    if (activeTab === "expired") return matchesSearch && certificate.status === "expired";
    return matchesSearch;
  });

  const handleEmailCertificate = async () => {
    if (!selectedCertificate) return;
    
    try {
      await apiRequest('POST', '/api/instructor/certificates/email', { 
        certificateId: selectedCertificate.id 
      });
      
      toast({
        title: "Certificate sent",
        description: `The certificate has been emailed to ${selectedCertificate.studentName}.`,
      });
      
      setIsEmailDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error sending certificate",
        description: "Failed to send the certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const revokeCertificate = async (certificateId: number) => {
    try {
      await apiRequest('POST', '/api/instructor/certificates/revoke', { certificateId });
      
      toast({
        title: "Certificate revoked",
        description: "The certificate has been revoked successfully.",
      });
      
      // Invalidate the certificates query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/instructor/certificates'] });
    } catch (error) {
      toast({
        title: "Error revoking certificate",
        description: "Failed to revoke the certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return <Badge className="bg-green-600">Issued</Badge>;
      case "revoked":
        return <Badge className="bg-red-600">Revoked</Badge>;
      case "expired":
        return <Badge variant="outline" className="border-yellow-600 text-yellow-500">Expired</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Certificates</h1>
          <p className="text-gray-400">Issue and manage course completion certificates</p>
        </div>
        <Button 
          className="flex gap-2"
          onClick={() => window.location.href = "/instructor/certificates/issue"}
        >
          <Plus size={16} />
          Issue Certificate
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Certificate Management</CardTitle>
          <CardDescription className="text-gray-400">
            View, issue, and revoke certificates for your course students.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search certificates..."
                className="pl-8 bg-gray-800 border-gray-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2 top-2.5"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            <div>
              <Tabs defaultValue="all" className="w-[400px]" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 bg-gray-800">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="issued">Issued</TabsTrigger>
                  <TabsTrigger value="revoked">Revoked</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !filteredCertificates?.length ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? (
                <p>No certificates match your search criteria</p>
              ) : (
                <p>No certificates issued yet</p>
              )}
            </div>
          ) : (
            <div className="border rounded-md border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-800/50 border-gray-800">
                    <TableHead className="text-gray-400 w-[250px]">Student</TableHead>
                    <TableHead className="text-gray-400">Course</TableHead>
                    <TableHead className="text-gray-400">Template</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Issued Date</TableHead>
                    <TableHead className="text-gray-400">Expiry Date</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCertificates?.map((certificate) => (
                    <TableRow key={certificate.id} className="hover:bg-gray-800/50 border-gray-800">
                      <TableCell className="font-medium flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {certificate.profileImageUrl ? (
                            <AvatarImage src={certificate.profileImageUrl} alt={certificate.studentName} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(certificate.studentName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="text-white font-medium">{certificate.studentName}</div>
                          <div className="text-gray-400 text-sm">{certificate.studentEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {certificate.courseName}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {certificate.templateName}
                      </TableCell>
                      <TableCell>{getStatusBadge(certificate.status)}</TableCell>
                      <TableCell className="text-gray-300">
                        {formatDate(certificate.issuedDate)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {formatDate(certificate.expiryDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-white">
                            <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-gray-800"
                              onClick={() => {
                                setSelectedCertificate(certificate);
                                setIsEmailDialogOpen(true);
                              }}
                            >
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                              Download PDF
                            </DropdownMenuItem>
                            {certificate.status !== "revoked" && (
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-gray-800 text-red-500"
                                onClick={() => revokeCertificate(certificate.id)}
                              >
                                Revoke
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Certificate Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Email Certificate</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send the certificate to the student via email.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="py-4">
              <p className="text-gray-300 mb-2">
                <span className="font-medium">Student:</span> {selectedCertificate.studentName}
              </p>
              <p className="text-gray-300 mb-2">
                <span className="font-medium">Email:</span> {selectedCertificate.studentEmail}
              </p>
              <p className="text-gray-300 mb-2">
                <span className="font-medium">Course:</span> {selectedCertificate.courseName}
              </p>
              <p className="text-gray-300 mb-2">
                <span className="font-medium">Certificate Status:</span> {selectedCertificate.status}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="flex gap-2"
              onClick={handleEmailCertificate}
            >
              <MailIcon size={16} />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}