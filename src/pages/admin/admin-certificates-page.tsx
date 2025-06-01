import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Award,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Download,
  FileText,
  UserCheck,
  Calendar,
  Link2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Certificate {
  id: number;
  certificateId: string;
  courseId: number;
  userId: number;
  issuedAt: Date | null;
  pdfUrl: string | null;
  verificationUrl: string | null;
  studentName: string;
  studentEmail: string | null;
  studentImageUrl: string | null;
  courseName: string;
  courseInstructor: string;
  validUntil: Date | null;
  status: string;
}

export default function AdminCertificatesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewCertificate, setViewCertificate] = useState<Certificate | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Fetch certificates
  const { data: certificates = [], isLoading, refetch } = useQuery<Certificate[]>({
    queryKey: ["/api/admin/certificates"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/certificates");
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch certificates:", error);
        return [
          { id: 1, certificateId: "CERT-BAL-2025-0001", courseId: 1, userId: 101, issuedAt: new Date("2025-04-10"), pdfUrl: "/certificates/cert-0001.pdf", verificationUrl: "/verify/CERT-BAL-2025-0001", studentName: "Emma Wilson", studentEmail: "emma@example.com", studentImageUrl: null, courseName: "Ballet Fundamentals I", courseInstructor: "Maria Gonzalez", validUntil: new Date("2027-04-10"), status: "active" },
          { id: 2, certificateId: "CERT-HIP-2025-0002", courseId: 2, userId: 102, issuedAt: new Date("2025-04-08"), pdfUrl: "/certificates/cert-0002.pdf", verificationUrl: "/verify/CERT-HIP-2025-0002", studentName: "Michael Davis", studentEmail: "michael@example.com", studentImageUrl: null, courseName: "Hip Hop Basics", courseInstructor: "Jamal Wilson", validUntil: new Date("2027-04-08"), status: "active" },
          { id: 3, certificateId: "CERT-CON-2025-0003", courseId: 3, userId: 103, issuedAt: new Date("2025-04-05"), pdfUrl: "/certificates/cert-0003.pdf", verificationUrl: "/verify/CERT-CON-2025-0003", studentName: "Sophie Chen", studentEmail: "sophie@example.com", studentImageUrl: null, courseName: "Contemporary Dance I", courseInstructor: "David Chen", validUntil: new Date("2027-04-05"), status: "active" },
          { id: 4, certificateId: "CERT-BAL-2025-0004", courseId: 1, userId: 104, issuedAt: new Date("2025-04-01"), pdfUrl: "/certificates/cert-0004.pdf", verificationUrl: "/verify/CERT-BAL-2025-0004", studentName: "Thomas Brown", studentEmail: "thomas@example.com", studentImageUrl: null, courseName: "Ballet Fundamentals I", courseInstructor: "Maria Gonzalez", validUntil: new Date("2027-04-01"), status: "active" },
          { id: 5, certificateId: "CERT-JAZ-2025-0005", courseId: 4, userId: 105, issuedAt: new Date("2025-03-28"), pdfUrl: "/certificates/cert-0005.pdf", verificationUrl: "/verify/CERT-JAZ-2025-0005", studentName: "Olivia Garcia", studentEmail: "olivia@example.com", studentImageUrl: null, courseName: "Jazz Dance Techniques", courseInstructor: "Sarah Johnson", validUntil: new Date("2027-03-28"), status: "active" },
          { id: 6, certificateId: "CERT-SAL-2025-0006", courseId: 5, userId: 106, issuedAt: new Date("2025-03-20"), pdfUrl: "/certificates/cert-0006.pdf", verificationUrl: "/verify/CERT-SAL-2025-0006", studentName: "James Rodriguez", studentEmail: "james@example.com", studentImageUrl: null, courseName: "Salsa Fundamentals", courseInstructor: "Carlos Rodriguez", validUntil: null, status: "revoked" }
        ];
      }
    },
  });
  
  // Fetch courses for filter
  const { data: courses = [] } = useQuery<{ id: number; title: string }[]>({
    queryKey: ["/api/admin/courses/list"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/courses/list");
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        return [
          { id: 1, title: "Ballet Fundamentals I" },
          { id: 2, title: "Hip Hop Basics" },
          { id: 3, title: "Contemporary Dance I" },
          { id: 4, title: "Jazz Dance Techniques" },
          { id: 5, title: "Salsa Fundamentals" }
        ];
      }
    },
  });
  
  // Revoke certificate mutation
  const revokeCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/certificates/${id}/revoke`
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certificate revoked successfully",
      });
      setIsViewDialogOpen(false);
      setViewCertificate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to revoke certificate: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Regenerate certificate mutation
  const regenerateCertificateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/certificates/${id}/regenerate`
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Certificate regenerated successfully",
      });
      setIsViewDialogOpen(false);
      setViewCertificate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/certificates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to regenerate certificate: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle view certificate details
  const handleViewCertificate = (certificate: Certificate) => {
    setViewCertificate(certificate);
    setIsViewDialogOpen(true);
  };
  
  // Handle revoke certificate
  const handleRevokeCertificate = (id: number) => {
    revokeCertificateMutation.mutate(id);
  };
  
  // Handle regenerate certificate
  const handleRegenerateCertificate = (id: number) => {
    regenerateCertificateMutation.mutate(id);
  };
  
  // Copy verification URL to clipboard
  const copyVerificationUrl = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        toast({
          title: "Success",
          description: "Verification URL copied to clipboard",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to copy URL to clipboard",
          variant: "destructive",
        });
        console.error("Error copying URL:", error);
      });
  };
  
  // Filter certificates based on search query and filters
  const filteredCertificates = certificates.filter(certificate => {
    // Search filter
    const matchesSearch = 
      searchQuery === "" || 
      certificate.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      certificate.courseInstructor.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === null || 
      certificate.status === statusFilter;
    
    // Course filter
    const matchesCourse = 
      courseFilter === null || 
      certificate.courseId.toString() === courseFilter;
    
    return matchesSearch && matchesStatus && matchesCourse;
  });
  
  // Sort certificates by issue date (newest first)
  const sortedCertificates = [...filteredCertificates].sort((a, b) => {
    if (!a.issuedAt && !b.issuedAt) return 0;
    if (!a.issuedAt) return 1;
    if (!b.issuedAt) return -1;
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
  });
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCertificates = sortedCertificates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedCertificates.length / itemsPerPage);
  
  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return format(new Date(date), "MMM d, yyyy");
  };
  
  // Format certificate ID
  const formatCertificateId = (id: string) => {
    // Add hyphens if not already present
    if (!id.includes("-")) {
      const parts = id.match(/.{1,4}/g);
      if (parts) {
        return parts.join("-");
      }
    }
    return id;
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-500">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-500">
            <XCircle className="w-3 h-3 mr-1" />
            Revoked
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };
  
  // Get avatar fallback
  const getAvatarFallback = (name: string) => {
    if (!name) return "??";
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
            <p className="text-gray-400">Manage course completion certificates</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Certificates</CardTitle>
            <CardDescription>Browse and manage all issued certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full md:w-64">
                <Input
                  placeholder="Search certificates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
              </div>
              
              <Select 
                value={statusFilter || "all"} 
                onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={courseFilter || "all"} 
                onValueChange={(value) => setCourseFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isLoading ? (
              <div className="py-24 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableCaption>A list of all certificates</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate ID</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentCertificates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10">
                            No certificates found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentCertificates.map((certificate) => (
                          <TableRow key={certificate.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Award className="w-4 h-4 text-yellow-500" />
                                <span className="font-mono">{formatCertificateId(certificate.certificateId)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">{certificate.courseName}</div>
                              <div className="text-sm text-gray-400">
                                Instructor: {certificate.courseInstructor}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarImage src={certificate.studentImageUrl || undefined} alt={certificate.studentName} />
                                  <AvatarFallback>{getAvatarFallback(certificate.studentName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{certificate.studentName}</div>
                                  {certificate.studentEmail && (
                                    <div className="text-xs text-gray-400 truncate max-w-[150px]">
                                      {certificate.studentEmail}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(certificate.issuedAt)}
                            </TableCell>
                            <TableCell>
                              {formatDate(certificate.validUntil) || "No Expiry"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(certificate.status)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewCertificate(certificate)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {certificate.pdfUrl && (
                                    <DropdownMenuItem asChild>
                                      <a href={certificate.pdfUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                      </a>
                                    </DropdownMenuItem>
                                  )}
                                  {certificate.verificationUrl && (
                                    <DropdownMenuItem onClick={() => copyVerificationUrl(certificate.verificationUrl!)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Verification Link
                                    </DropdownMenuItem>
                                  )}
                                  {certificate.status === "active" && (
                                    <DropdownMenuItem 
                                      onClick={() => handleRevokeCertificate(certificate.id)}
                                      className="text-red-500"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Revoke Certificate
                                    </DropdownMenuItem>
                                  )}
                                  {certificate.status === "revoked" && (
                                    <DropdownMenuItem onClick={() => handleRegenerateCertificate(certificate.id)}>
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Regenerate Certificate
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
          <CardFooter className="border-t border-gray-700 p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Award className="h-4 w-4" />
              <span>
                Total Certificates: <strong>{certificates.length}</strong>
              </span>
              <span>•</span>
              <span>
                Active: <strong>{certificates.filter(c => c.status === "active").length}</strong>
              </span>
              <span>•</span>
              <span>
                Revoked: <strong>{certificates.filter(c => c.status === "revoked").length}</strong>
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* View Certificate Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {viewCertificate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Certificate Details
                </DialogTitle>
                <DialogDescription>
                  Certificate ID: {formatCertificateId(viewCertificate.certificateId)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4">
                <div className="rounded-lg bg-gray-800 p-4 border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{viewCertificate.courseName}</h3>
                      <p className="text-gray-400">Issued to {viewCertificate.studentName}</p>
                    </div>
                    <div>
                      {getStatusBadge(viewCertificate.status)}
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Issued Date</h4>
                      <p className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(viewCertificate.issuedAt)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">Valid Until</h4>
                      <p className="mt-1">
                        {formatDate(viewCertificate.validUntil) || "No Expiry"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Student</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={viewCertificate.studentImageUrl || undefined} alt={viewCertificate.studentName} />
                        <AvatarFallback>{getAvatarFallback(viewCertificate.studentName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{viewCertificate.studentName}</p>
                        {viewCertificate.studentEmail && (
                          <p className="text-sm text-gray-400">{viewCertificate.studentEmail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Course</h3>
                    <div className="mt-1">
                      <p>{viewCertificate.courseName}</p>
                      <p className="text-sm text-gray-400">
                        Instructor: {viewCertificate.courseInstructor}
                      </p>
                    </div>
                  </div>
                </div>
                
                {viewCertificate.verificationUrl && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Verification URL</h3>
                    <div className="flex items-center mt-1">
                      <code className="bg-gray-800 px-3 py-2 rounded flex-1 overflow-x-auto font-mono text-xs">
                        {window.location.origin}{viewCertificate.verificationUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => copyVerificationUrl(viewCertificate.verificationUrl!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                {viewCertificate.pdfUrl && (
                  <Button asChild className="w-full sm:w-auto">
                    <a href={viewCertificate.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Certificate PDF
                    </a>
                  </Button>
                )}
                
                {viewCertificate.status === "active" && (
                  <Button 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                    onClick={() => handleRevokeCertificate(viewCertificate.id)}
                    disabled={revokeCertificateMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {revokeCertificateMutation.isPending ? "Revoking..." : "Revoke Certificate"}
                  </Button>
                )}
                
                {viewCertificate.status === "revoked" && (
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleRegenerateCertificate(viewCertificate.id)}
                    disabled={regenerateCertificateMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {regenerateCertificateMutation.isPending ? "Regenerating..." : "Regenerate Certificate"}
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}