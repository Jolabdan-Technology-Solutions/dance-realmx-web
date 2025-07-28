import { Course } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Redirect, Link } from "wouter";
import {
  PlusCircle,
  BookOpen,
  Award,
  FileBox,
  Search,
  Download,
  Eye,
  Users,
  UserPlus,
  Plus,
  Edit,
  Loader2,
  TrendingUp,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RequireSubscription } from "@/components/subscription/require-subscription";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function InstructorDashboardPage() {
  return (
    <RequireSubscription 
      requiredLevel={10} 
      featureName="Instructor Dashboard"
      description="Access your instructor tools, manage courses, track student progress, and view analytics."
      upgradePrompt="Upgrade to Educator or higher to access the instructor dashboard."
    >
      <InstructorDashboardPageContent />
    </RequireSubscription>
  );
}

function InstructorDashboardPageContent() {
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated or not instructor/admin
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.role !== "INSTRUCTOR_ADMIN" && user.role !== "ADMIN") {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses">
          <InstructorCourses />
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <h2 className="text-2xl font-semibold mb-4">My Students</h2>
          <StudentsList />
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <h2 className="text-2xl font-semibold mb-4">Certificates Issued</h2>
          <CertificatesList />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <h2 className="text-2xl font-semibold mb-4">My Teaching Resources</h2>
          <ResourcesList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component for managing instructor courses
// Component for managing instructor courses
function InstructorCourses() {
  const { user } = useAuth();

  // Get courses created by the instructor
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["/api/courses", { instructorId: user?.id }],
    queryFn: async () => {
      const res = await fetch(`/api/courses?instructorId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json(); // Fixed: was res?data, should be res.json()
    },
    enabled: !!user?.id,
  });

  if (coursesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Courses</h2>
        <Link to="/instructor/courses/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Course
          </Button>
        </Link>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course:any) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="bg-muted p-8 rounded-lg text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Courses Created Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start creating your first course to share your expertise with
            students.
          </p>
          <Link to="/instructor/courses/create">
            <Button>Create Your First Course</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Course card component
function CourseCard({ course }: { course: Course }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{course.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${course.visible ? "bg-green-500" : "bg-gray-400"}`}
          ></span>
          {course.visible ? "Published" : "Draft"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {course.imageUrl && (
          <div className="w-full h-40 overflow-hidden rounded-md mb-4">
            <img
              src={
                course.imageUrl.startsWith("http")
                  ? course.imageUrl
                  : `${window.location.protocol}//${window.location.host}${course.imageUrl.includes("?") ? course.imageUrl : `${course.imageUrl}?t=${Date.now()}`}`
              }
              alt={course.title}
              className="w-full h-full object-cover"
              onLoad={() =>
                console.log(
                  `Course image loaded successfully for: ${course.title}`
                )
              }
              onError={(e) => {
                console.error(
                  "Error loading course image in instructor dashboard:",
                  course.title,
                  course.imageUrl
                );
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span class="text-primary text-5xl">
                        ${course.title?.[0] || "D"}
                      </span>
                    </div>
                  `;
                }
              }}
            />
          </div>
        )}
        <p className="text-sm line-clamp-3">{course.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href={`/instructor/courses/${course.id}`}>
          <Button variant="outline">Manage</Button>
        </Link>
        <Link href={`/courses/${course.id}`}>
          <Button variant="ghost">View</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Students management component
function StudentsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch students enrolled in instructor's courses
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["/api/instructor/enrollments"],
    queryFn: async () => {
      const res = await fetch(
        `/api/instructor/enrollments?instructorId=${user?.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch student enrollments");
      return res;
    },
    enabled: !!user?.id,
  });

  const sendInviteEmail = async (studentId: number) => {
    try {
      await apiRequest("/api/instructor/students/invite", {
        method: "POST",
        data: { studentId },
      });
      toast({
        title: "Invitation sent",
        description: "The student has been sent an email invitation.",
      });
    } catch (error) {
      toast({
        title: "Error sending invitation",
        description: "Failed to send the invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter students based on search term
  const filteredStudents =
    enrollments?.filter(
      (enrollment: any) =>
        enrollment.studentName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        enrollment.studentEmail
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        enrollment.courseName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case "completed":
        return <Badge className="bg-blue-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Link href="/instructor/students/add">
          <Button className="flex gap-2">
            <UserPlus size={16} />
            Add Student
          </Button>
        </Link>
      </div>

      {currentStudents.length === 0 ? (
        <div className="bg-muted p-8 rounded-lg text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Students Found</h3>
          <p className="text-muted-foreground">
            You don't have any students enrolled in your courses yet, or no
            students match your search criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStudents.map((enrollment: any) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={enrollment.studentAvatar} />
                          <AvatarFallback>
                            {enrollment.studentName
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {enrollment.studentName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {enrollment.studentEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{enrollment.courseName}</TableCell>
                    <TableCell>
                      {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${enrollment.progressPercentage || 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm whitespace-nowrap">
                          {enrollment.progressPercentage || 0}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/instructor/students/${enrollment.studentId}`}
                          >
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInviteEmail(enrollment.studentId)}
                        >
                          Invite
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Certificate management component
function CertificatesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const itemsPerPage = 10;

  // Fetch certificates data
  const { data: certificates, isLoading } = useQuery({
    queryKey: ["/api/instructor/certificates"],
    queryFn: async () => {
      const res = await fetch(
        `/api/instructor/certificates?instructorId=${user?.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch certificates");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Filter certificates based on search term and active tab
  const filteredCertificates =
    certificates?.filter(
      (certificate: any) =>
        (certificate.studentName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
          certificate.courseName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          certificate.certificateId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (activeTab === "all" || certificate.status?.toLowerCase() === activeTab)
    ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCertificates = filteredCertificates.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatCertificateId = (id: string) => {
    if (!id) return "N/A";
    return id.length > 12
      ? `${id.substring(0, 6)}...${id.substring(id.length - 6)}`
      : id;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "issued":
        return <Badge className="bg-green-600">Issued</Badge>;
      case "revoked":
        return <Badge className="bg-red-600">Revoked</Badge>;
      case "expired":
        return (
          <Badge
            variant="outline"
            className="border-yellow-600 text-yellow-500"
          >
            Expired
          </Badge>
        );
      case "pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Function to revoke a certificate
  const revokeCertificate = async (certificateId: number) => {
    try {
      await apiRequest(`/api/instructor/certificates/${certificateId}/revoke`, {
        method: "PATCH",
        data: {},
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/instructor/certificates"],
      });
      toast({
        title: "Certificate Revoked",
        description: "The certificate has been successfully revoked.",
      });
    } catch (error) {
      toast({
        title: "Error Revoking Certificate",
        description: "Failed to revoke the certificate. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4 items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="issued">Issued</TabsTrigger>
              <TabsTrigger value="revoked">Revoked</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button
          className="flex gap-2"
          onClick={() =>
            (window.location.href = "/instructor/certificates/issue")
          }
        >
          <Plus size={16} />
          Issue Certificate
        </Button>
      </div>

      {currentCertificates.length === 0 ? (
        <div className="bg-muted p-8 rounded-lg text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No Certificates Found</h3>
          <p className="text-muted-foreground">
            You haven't issued any certificates yet, or no certificates match
            your search criteria.
          </p>
          <Button
            className="mt-4"
            onClick={() =>
              (window.location.href = "/instructor/certificates/issue")
            }
          >
            Issue Your First Certificate
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCertificates.map((certificate: any) => (
                  <TableRow key={certificate.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-mono">
                          {formatCertificateId(certificate.certificateId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={certificate.studentAvatar} />
                          <AvatarFallback>
                            {certificate.studentName
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span>{certificate.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{certificate.courseName}</TableCell>
                    <TableCell>{formatDate(certificate.issuedAt)}</TableCell>
                    <TableCell>{getStatusBadge(certificate.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/certificates/${certificate.id}`}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link
                            href={`/certificates/${certificate.id}/download`}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Link>
                        </Button>
                        {certificate.status !== "revoked" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeCertificate(certificate.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Resources management component
function ResourcesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 2 rows of 3 cards

  // Fetch instructor's teaching resources
  const { data: resources, isLoading } = useQuery({
    queryKey: ["/api/resources/seller"],
    queryFn: async () => {
      const res = await fetch(`/api/resources/seller?sellerId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Filter resources based on search term
  const filteredResources =
    resources?.filter(
      (resource: any) =>
        resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        resource.danceStyle?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResources = filteredResources.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return <Badge className="bg-green-600">Active</Badge>;
      case "pending_approval":
        return <Badge className="bg-yellow-600">Pending Approval</Badge>;
      case "draft":
        return <Badge className="bg-gray-500">Draft</Badge>;
      case "rejected":
        return <Badge className="bg-red-600">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: string | number | null) => {
    if (price === null || price === undefined) return "Free";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return numPrice === 0 ? "Free" : `$${numPrice.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          className="flex gap-2"
          onClick={() => (window.location.href = "/seller/upload-resource")}
        >
          <Plus size={16} />
          Create Resource
        </Button>
      </div>

      {currentResources.length === 0 ? (
        <div className="bg-muted p-8 rounded-lg text-center">
          <FileBox className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">
            No Teaching Resources Found
          </h3>
          <p className="text-muted-foreground">
            You haven't created any teaching resources yet, or no resources
            match your search criteria.
          </p>
          <Button
            className="mt-4"
            onClick={() => (window.location.href = "/seller/upload-resource")}
          >
            Create Your First Resource
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentResources.map((resource: any) => (
              <Card key={resource.id} className="overflow-hidden flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  {resource.imageUrl ? (
                    <img
                      src={
                        resource.imageUrl.includes("?")
                          ? resource.imageUrl
                          : `${resource.imageUrl}?t=${Date.now()}`
                      }
                      alt={resource.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error(
                          "Error loading resource image:",
                          resource.title,
                          resource.imageUrl
                        );
                        e.currentTarget.src = "/placeholders/resource.svg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <FileBox className="h-16 w-16 text-primary" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(resource.status || "pending_approval")}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="truncate">{resource.title}</CardTitle>
                  <CardDescription>
                    {resource.danceStyle || "All Styles"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm line-clamp-3 mb-2">
                    {resource.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">
                      {formatPrice(resource.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {resource.salesCount || 0} sales
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/curriculum/${resource.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/curriculum/${resource.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        onClick={() => setCurrentPage(i + 1)}
                        isActive={currentPage === i + 1}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
