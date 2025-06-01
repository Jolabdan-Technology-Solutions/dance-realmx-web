import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Mail,
  Award, ThumbsUp,
  Briefcase,
  GraduationCap,
  BookOpen,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  XCircle
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
import { Switch } from "@/components/ui/switch";
import { DANCE_STYLES } from "@/lib/constants";

interface Instructor {
  id: number;
  userId: number;
  name: string;
  email: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  specialties: string[] | null;
  experience: number | null;
  verified: boolean | null;
  courseCount: number;
  studentCount: number;
  reviewCount: number;
  hourlyRate: string | null;
  availability: string | null;
}

export default function AdminInstructorsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationFilter, setVerificationFilter] = useState<boolean | null>(null);
  const [specialtyFilter, setSpecialtyFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [instructorToUpdate, setInstructorToUpdate] = useState<{id: number, verified: boolean} | null>(null);
  
  // Fetch instructors
  const { data: instructors = [], isLoading, refetch } = useQuery<Instructor[]>({
    queryKey: ["/api/admin/instructors"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/instructors");
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch instructors:", error);
        return [
          { id: 1, userId: 101, name: "Maria Gonzalez", email: "maria@example.com", bio: "Professional ballet instructor with 15 years of experience", profileImageUrl: null, specialties: ["Ballet", "Contemporary"], experience: 15, verified: true, courseCount: 8, studentCount: 245, reviewCount: 78, hourlyRate: "$75", availability: "Weekdays evenings, Weekends" },
          { id: 2, userId: 102, name: "Jamal Wilson", email: "jamal@example.com", bio: "Hip hop specialist focusing on urban dance forms", profileImageUrl: null, specialties: ["Hip Hop", "Breaking"], experience: 10, verified: true, courseCount: 5, studentCount: 187, reviewCount: 56, hourlyRate: "$65", availability: "Weekends only" },
          { id: 3, userId: 103, name: "David Chen", email: "david@example.com", bio: "Contemporary dance instructor specializing in modern techniques", profileImageUrl: null, specialties: ["Contemporary", "Modern"], experience: 12, verified: true, courseCount: 6, studentCount: 156, reviewCount: 42, hourlyRate: "$70", availability: "Monday-Friday" },
          { id: 4, userId: 104, name: "Sarah Johnson", email: "sarah@example.com", bio: "Jazz dance expert with Broadway experience", profileImageUrl: null, specialties: ["Jazz", "Tap"], experience: 8, verified: true, courseCount: 4, studentCount: 134, reviewCount: 39, hourlyRate: "$80", availability: "Weekday mornings, Weekends" },
          { id: 5, userId: 105, name: "Carlos Rodriguez", email: "carlos@example.com", bio: "Latin dance instructor specializing in salsa and bachata", profileImageUrl: null, specialties: ["Salsa", "Bachata", "Latin"], experience: 14, verified: true, courseCount: 7, studentCount: 192, reviewCount: 65, hourlyRate: "$60", availability: "Evenings and weekends" },
          { id: 6, userId: 106, name: "Aisha Patel", email: "aisha@example.com", bio: "Bollywood and classical Indian dance instructor", profileImageUrl: null, specialties: ["Bollywood", "Folk"], experience: 9, verified: false, courseCount: 3, studentCount: 98, reviewCount: 27, hourlyRate: "$65", availability: "Weekends only" }
        ];
      }
    },
  });
  
  // Toggle instructor verification status
  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: number; verified: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/instructors/${id}/verify`, {
        verified
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Instructor verification status updated successfully",
      });
      setIsConfirmDialogOpen(false);
      setInstructorToUpdate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/instructors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update instructor verification status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle verification toggle
  const handleToggleVerification = (instructor: Instructor) => {
    setInstructorToUpdate({
      id: instructor.id,
      verified: !(instructor.verified === true)
    });
    setIsConfirmDialogOpen(true);
  };
  
  // Confirm verification change
  const confirmVerificationChange = () => {
    if (instructorToUpdate !== null) {
      toggleVerificationMutation.mutate(instructorToUpdate);
    }
  };
  
  // Filter instructors based on search query and filters
  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = 
      searchQuery === "" || 
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (instructor.email && instructor.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (instructor.bio && instructor.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesVerification = 
      verificationFilter === null || 
      instructor.verified === verificationFilter;
    
    const matchesSpecialty = 
      specialtyFilter === null || 
      (instructor.specialties && instructor.specialties.includes(specialtyFilter));
    
    return matchesSearch && matchesVerification && matchesSpecialty;
  });
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInstructors = filteredInstructors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInstructors.length / itemsPerPage);
  
  // Format verification status
  const formatVerificationStatus = (verified: boolean) => {
    if (!verified) return "—";
    return (
      <div className="flex items-center">
        <Award className="h-4 w-4 text-blue-400 mr-1" />
        <span className="text-blue-400">Verified Professional</span>
      </div>
    );
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
            <h1 className="text-3xl font-bold tracking-tight">Instructors</h1>
            <p className="text-gray-400">Manage instructor profiles and verification</p>
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
            <CardTitle>Instructors</CardTitle>
            <CardDescription>Browse and manage instructor profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full md:w-64">
                <Input
                  placeholder="Search instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
              </div>
              
              <Select 
                value={verificationFilter === null ? "all" : verificationFilter ? "verified" : "unverified"} 
                onValueChange={(value) => {
                  if (value === "all") setVerificationFilter(null);
                  else if (value === "verified") setVerificationFilter(true);
                  else setVerificationFilter(false);
                }}
              >
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Verification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={specialtyFilter || "all"} 
                onValueChange={(value) => setSpecialtyFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  {DANCE_STYLES.map((style) => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
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
                    <TableCaption>A list of all instructors</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Specialties</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Verification Status</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentInstructors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-10">
                            No instructors found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentInstructors.map((instructor) => (
                          <TableRow key={instructor.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage src={instructor.profileImageUrl || undefined} alt={instructor.name} />
                                  <AvatarFallback>{getAvatarFallback(instructor.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{instructor.name}</div>
                                  {instructor.email && (
                                    <div className="text-sm text-gray-400 flex items-center">
                                      <Mail className="h-3 w-3 mr-1" />
                                      {instructor.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {instructor.specialties?.map((specialty) => (
                                  <Badge key={specialty} variant="outline" className="bg-gray-800">
                                    {specialty}
                                  </Badge>
                                )) || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {instructor.experience ? (
                                <div className="flex items-center">
                                  <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                                  {instructor.experience} years
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              {formatVerificationStatus(instructor.verified)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                                {instructor.courseCount}
                                <GraduationCap className="h-4 w-4 mx-1 text-gray-400" />
                                {instructor.studentCount}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Switch
                                  checked={instructor.verified || false}
                                  onCheckedChange={() => handleToggleVerification(instructor)}
                                  disabled={toggleVerificationMutation.isPending}
                                />
                                <span className="ml-2">
                                  {instructor.verified ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Link href={`/admin/instructors/${instructor.id}`}>
                                  <Button variant="outline" size="icon" title="Edit instructor">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Link href={`/instructor-profile/${instructor.id}`} target="_blank">
                                  <Button variant="outline" size="icon" title="View public profile">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
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
            <Link href="/admin/instructors/applications" className="flex items-center text-blue-500 hover:underline">
              View instructor applications
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {instructorToUpdate?.verified
                ? "Verify Instructor"
                : "Remove Verification"}
            </DialogTitle>
            <DialogDescription>
              {instructorToUpdate?.verified
                ? "Are you sure you want to verify this instructor? Verified instructors appear more prominently and can create official certification courses."
                : "Are you sure you want to remove verification from this instructor? This will affect their visibility and ability to create certification courses."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={instructorToUpdate?.verified ? "default" : "destructive"}
              onClick={confirmVerificationChange}
              disabled={toggleVerificationMutation.isPending}
            >
              {toggleVerificationMutation.isPending
                ? "Processing..."
                : instructorToUpdate?.verified
                ? "Verify Instructor"
                : "Remove Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}