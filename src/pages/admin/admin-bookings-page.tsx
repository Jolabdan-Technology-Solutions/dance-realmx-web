import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  CalendarRange,
  Search,
  RefreshCw,
  Eye,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  User,
  Tag,
  Filter,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  GraduationCap,
  Loader2,
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
  DialogTrigger,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, parseISO, isToday, isPast, isThisWeek } from "date-fns";

interface Booking {
  id: number;
  name: string;
  description: string | null;
  status: string;
  price: string | null;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  createdById: number | null;
  studentName: string;
  instructorName: string;
  studentEmail: string | null;
  instructorEmail: string | null;
  studentImageUrl: string | null;
  instructorImageUrl: string | null;
  danceStyle: string | null;
  isPublic: boolean | null;
  capacity: number | null;
  attendees: number | null;
  paymentStatus: string | null;
  notes: string | null;
}

// Define additional interfaces for professionals and clients
interface BookingProfessional {
  id: number;
  userId: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  providerType: string | null;
  danceStyles: string[] | null;
  location: string | null;
  rate: string | null;
  availability: string | null;
  bookingsCount: number;
  pendingBookings: number;
  completedBookings: number;
  rating: number;
  roles: string[] | null;
}

interface BookingClient {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  bookingsCount: number;
  pendingBookings: number;
  completedBookings: number;
  lastBookingDate: Date | null;
  danceStyles: string[] | null;
  hasProfile: boolean;
  profileId: number | null;
  roles: string[] | null;
}

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [bookingAction, setBookingAction] = useState<{
    id: number;
    action: string;
  } | null>(null);

  // Fetch professionals
  const {
    data: professionals = [],
    isLoading: isProfessionalsLoading,
    refetch: refetchProfessionals,
  } = useQuery<BookingProfessional[]>({
    queryKey: ["/api/admin/booking-professionals"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/profiles/professionals", {
          method: "GET",
        });
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch booking professionals:", error);
        return [];
      }
    },
  });

  // Fetch clients
  const {
    data: clients = [],
    isLoading: isClientsLoading,
    refetch: refetchClients,
  } = useQuery<BookingClient[]>({
    queryKey: ["/api/admin/booking-clients"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/profiles/clients", {
          method: "GET",
        });
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch booking clients:", error);
        return [];
      }
    },
  });

  // Fetch bookings
  const {
    data: bookings = [],
    isLoading: isBookingsLoading,
    refetch: refetchBookings,
  } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
    queryFn: async () => {
      try {
        const res = await apiRequest("/api/bookings", {
          method: "GET",
        });
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return [];
      }
    },
  });

  // Function to refetch all data
  const refetchAll = () => {
    refetchProfessionals();
    refetchClients();
    refetchBookings();
  };

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest(`/api/bookings/${id}/status`, {
        method: "PATCH",
        data: { status },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
      setIsActionDialogOpen(false);
      setBookingAction(null);
      refetchAll();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update booking status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle view booking details
  const handleViewBooking = (booking: Booking) => {
    setViewBooking(booking);
    setIsViewDialogOpen(true);
  };

  // Handle booking action (confirm, cancel)
  const handleBookingAction = (id: number, action: string) => {
    setBookingAction({ id, action });
    setIsActionDialogOpen(true);
  };

  // Confirm booking action
  const confirmBookingAction = () => {
    if (bookingAction) {
      const newStatus =
        bookingAction.action === "confirm" ? "confirmed" : "cancelled";
      updateBookingStatusMutation.mutate({
        id: bookingAction.id,
        status: newStatus,
      });
    }
  };

  // Filter bookings based on search query and filters
  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      booking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.instructorName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (booking.description &&
        booking.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (booking.location &&
        booking.location.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus =
      statusFilter === null || booking.status === statusFilter;

    // Time filter
    let matchesTime = true;
    if (timeFilter === "today") {
      matchesTime = isToday(new Date(booking.startDate));
    } else if (timeFilter === "upcoming") {
      matchesTime =
        !isPast(new Date(booking.startDate)) ||
        isToday(new Date(booking.startDate));
    } else if (timeFilter === "past") {
      matchesTime =
        isPast(new Date(booking.startDate)) &&
        !isToday(new Date(booking.startDate));
    } else if (timeFilter === "thisWeek") {
      matchesTime = isThisWeek(new Date(booking.startDate));
    }

    return matchesSearch && matchesStatus && matchesTime;
  });

  // Sort bookings by date (newest first)
  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = sortedBookings.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  // Format time
  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  // Format date and time
  const formatDateTime = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-green-900/30 text-green-400 border-green-500"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-900/30 text-yellow-400 border-yellow-500"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-900/30 text-red-400 border-red-500"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get payment status badge
  const getPaymentBadge = (status: string | null) => {
    if (!status) return null;

    switch (status.toLowerCase()) {
      case "paid":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <Check className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            <DollarSign className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get avatar fallback
  const getAvatarFallback = (name: string) => {
    if (!name) return "??";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
            <p className="text-gray-400">Manage lesson and workshop bookings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => refetchProfessionals()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="professionals" className="space-y-4">
          <TabsList className="grid grid-cols-3 md:w-[600px]">
            <TabsTrigger value="professionals">Professionals</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          {/* PROFESSIONALS TAB */}
          <TabsContent value="professionals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dance Professionals</CardTitle>
                <CardDescription>
                  Manage all professional dance instructors, choreographers and
                  studios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
                  <div className="relative w-full md:w-64">
                    <Input
                      placeholder="Search professionals..."
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
                    onValueChange={(value) =>
                      setStatusFilter(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="instructor">Instructors</SelectItem>
                      <SelectItem value="choreographer">
                        Choreographers
                      </SelectItem>
                      <SelectItem value="studio">Studios</SelectItem>
                      <SelectItem value="judge">Judges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Professional</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dance Styles</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isProfessionalsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : professionals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No booking professionals found
                          </TableCell>
                        </TableRow>
                      ) : (
                        professionals.map((professional) => (
                          <TableRow key={professional.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  {professional.profileImageUrl ? (
                                    <AvatarImage
                                      src={professional.profileImageUrl}
                                      alt={professional.username}
                                    />
                                  ) : (
                                    <AvatarFallback>
                                      {professional.firstName?.charAt(0) ||
                                        professional.username.charAt(0)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {professional.firstName &&
                                    professional.lastName
                                      ? `${professional.firstName} ${professional.lastName}`
                                      : professional.username}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {professional.email ||
                                      "@" + professional.username}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-blue-900/30 text-blue-400 border-blue-500"
                              >
                                {professional.providerType || "Instructor"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {professional.danceStyles
                                ? professional.danceStyles.join(", ")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {professional.location || "N/A"}
                            </TableCell>
                            <TableCell>{professional.rate || "N/A"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Edit Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    View Bookings
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Link
                                      href="/admin/users/1"
                                      className="flex items-center w-full"
                                    >
                                      User Account
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" className="ml-auto">
                    <Link href="/connect" className="flex items-center">
                      <span>View Connect Directory</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLIENTS TAB */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Clients</CardTitle>
                <CardDescription>
                  Manage all clients who book lessons and workshops
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
                  <div className="relative w-full md:w-64">
                    <Input
                      placeholder="Search clients..."
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
                    onValueChange={(value) =>
                      setStatusFilter(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Dance Interests</TableHead>
                        <TableHead>Preferred Rate</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Example client data - replace with real API data */}
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">John Doe</p>
                              <p className="text-xs text-gray-400">
                                john.doe@example.com
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>3 total</TableCell>
                        <TableCell>Ballet, Jazz</TableCell>
                        <TableCell>$50-70/hr</TableCell>
                        <TableCell>May 2, 2025</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
                              <DropdownMenuItem>View Bookings</DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link
                                  href="/admin/users/4"
                                  className="flex items-center w-full"
                                >
                                  User Account
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BOOKINGS TAB */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>
                  Browse and manage all lesson and workshop bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
                  <div className="relative w-full md:w-64">
                    <Input
                      placeholder="Search bookings..."
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
                    onValueChange={(value) =>
                      setStatusFilter(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={timeFilter || "all"}
                    onValueChange={(value) =>
                      setTimeFilter(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isLoading ? (
                  <div className="py-24 flex items-center justify-center">
                    <div
                      className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                      aria-label="Loading"
                    />
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border">
                      <Table>
                        <TableCaption>A list of all bookings</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Booking</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Instructor</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentBookings.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-10"
                              >
                                No bookings found matching your criteria
                              </TableCell>
                            </TableRow>
                          ) : (
                            currentBookings.map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell>
                                  <div className="max-w-xs">
                                    <div className="font-medium truncate">
                                      {booking.name}
                                    </div>
                                    <div className="text-sm text-gray-400 flex items-center">
                                      {booking.danceStyle && (
                                        <>
                                          <Tag className="h-3 w-3 mr-1" />
                                          {booking.danceStyle}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center">
                                      <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                      <span>
                                        {formatDate(booking.startDate)}
                                      </span>
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                      <span>
                                        {formatTime(booking.startDate)}
                                        {booking.endDate &&
                                          ` - ${formatTime(booking.endDate)}`}
                                      </span>
                                    </div>
                                    {booking.location && (
                                      <div className="flex items-center text-sm text-gray-400">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        <span className="truncate max-w-[150px]">
                                          {booking.location}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage
                                        src={
                                          booking.instructorImageUrl ||
                                          undefined
                                        }
                                        alt={booking.instructorName}
                                      />
                                      <AvatarFallback>
                                        {getAvatarFallback(
                                          booking.instructorName
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{booking.instructorName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage
                                        src={
                                          booking.studentImageUrl || undefined
                                        }
                                        alt={booking.studentName}
                                      />
                                      <AvatarFallback>
                                        {getAvatarFallback(booking.studentName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{booking.studentName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {getStatusBadge(booking.status)}
                                    {booking.paymentStatus && (
                                      <div className="mt-1">
                                        {getPaymentBadge(booking.paymentStatus)}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleViewBooking(booking)
                                        }
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      {booking.status === "pending" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleBookingAction(
                                              booking.id,
                                              "confirm"
                                            )
                                          }
                                        >
                                          <Check className="h-4 w-4 mr-2" />
                                          Confirm Booking
                                        </DropdownMenuItem>
                                      )}
                                      {booking.status !== "cancelled" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleBookingAction(
                                              booking.id,
                                              "cancel"
                                            )
                                          }
                                          className="text-red-500"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Cancel Booking
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
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              className={
                                currentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                          <PaginationItem>
                            <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages)
                                )
                              }
                              className={
                                currentPage === totalPages
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Bookings</CardTitle>
                <CardDescription>Bookings scheduled for today</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Today's bookings filtered automatically in the component */}
                <BookingList
                  bookings={bookings.filter((booking) =>
                    isToday(new Date(booking.startDate))
                  )}
                  isLoading={isLoading}
                  onViewBooking={handleViewBooking}
                  onActionBooking={handleBookingAction}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>
                  Future bookings across all instructors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Upcoming bookings filtered automatically in the component */}
                <BookingList
                  bookings={bookings.filter(
                    (booking) =>
                      !isPast(new Date(booking.startDate)) ||
                      isToday(new Date(booking.startDate))
                  )}
                  isLoading={isLoading}
                  onViewBooking={handleViewBooking}
                  onActionBooking={handleBookingAction}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Bookings</CardTitle>
                <CardDescription>
                  Bookings awaiting confirmation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Pending bookings filtered automatically in the component */}
                <BookingList
                  bookings={bookings.filter(
                    (booking) => booking.status.toLowerCase() === "pending"
                  )}
                  isLoading={isLoading}
                  onViewBooking={handleViewBooking}
                  onActionBooking={handleBookingAction}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Booking Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {viewBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <span className="mr-2">{viewBooking.name}</span>
                  {getStatusBadge(viewBooking.status)}
                </DialogTitle>
                <DialogDescription>
                  Booking ID: {viewBooking.id}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Date & Time
                    </h3>
                    <p className="mt-1">
                      {formatDateTime(viewBooking.startDate)}
                    </p>
                    {viewBooking.endDate && (
                      <p className="text-sm text-gray-400">
                        Until {formatDateTime(viewBooking.endDate)}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Location
                    </h3>
                    <p className="mt-1">
                      {viewBooking.location || "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400">
                    Description
                  </h3>
                  <p className="mt-1">
                    {viewBooking.description || "No description provided"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Instructor
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={viewBooking.instructorImageUrl || undefined}
                          alt={viewBooking.instructorName}
                        />
                        <AvatarFallback>
                          {getAvatarFallback(viewBooking.instructorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{viewBooking.instructorName}</p>
                        {viewBooking.instructorEmail && (
                          <p className="text-sm text-gray-400">
                            {viewBooking.instructorEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Student
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={viewBooking.studentImageUrl || undefined}
                          alt={viewBooking.studentName}
                        />
                        <AvatarFallback>
                          {getAvatarFallback(viewBooking.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{viewBooking.studentName}</p>
                        {viewBooking.studentEmail && (
                          <p className="text-sm text-gray-400">
                            {viewBooking.studentEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Price</h3>
                    <p className="mt-1">{viewBooking.price || "Free"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Payment Status
                    </h3>
                    <div className="mt-1">
                      {getPaymentBadge(viewBooking.paymentStatus) ||
                        "Not specified"}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">
                      Dance Style
                    </h3>
                    <p className="mt-1">
                      {viewBooking.danceStyle || "Not specified"}
                    </p>
                  </div>
                </div>

                {viewBooking.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Notes</h3>
                    <p className="mt-1">{viewBooking.notes}</p>
                  </div>
                )}

                {viewBooking.isPublic && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">
                        Capacity
                      </h3>
                      <p className="mt-1">
                        {viewBooking.capacity || "Unlimited"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-400">
                        Attendees
                      </h3>
                      <p className="mt-1">{viewBooking.attendees || 0}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                {viewBooking.status === "pending" && (
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleBookingAction(viewBooking.id, "confirm");
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Booking
                  </Button>
                )}
                {viewBooking.status !== "cancelled" && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleBookingAction(viewBooking.id, "cancel");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bookingAction?.action === "confirm"
                ? "Confirm Booking"
                : "Cancel Booking"}
            </DialogTitle>
            <DialogDescription>
              {bookingAction?.action === "confirm"
                ? "Are you sure you want to confirm this booking? This will notify both the instructor and student."
                : "Are you sure you want to cancel this booking? This will notify both the instructor and student."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
            >
              No, Go Back
            </Button>
            <Button
              variant={
                bookingAction?.action === "confirm" ? "default" : "destructive"
              }
              onClick={confirmBookingAction}
              disabled={updateBookingStatusMutation.isPending}
            >
              {updateBookingStatusMutation.isPending
                ? "Processing..."
                : bookingAction?.action === "confirm"
                  ? "Yes, Confirm Booking"
                  : "Yes, Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// BookingList component for reusable booking lists
function BookingList({
  bookings,
  isLoading,
  onViewBooking,
  onActionBooking,
}: {
  bookings: Booking[];
  isLoading: boolean;
  onViewBooking: (booking: Booking) => void;
  onActionBooking: (id: number, action: string) => void;
}) {
  // Sort bookings by date (soonest first for upcoming, latest first for past)
  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Format date
  const formatDate = (date: Date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  // Format time
  const formatTime = (date: Date) => {
    return format(new Date(date), "h:mm a");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-green-900/30 text-green-400 border-green-500"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-900/30 text-yellow-400 border-yellow-500"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-900/30 text-red-400 border-red-500"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get avatar fallback
  const getAvatarFallback = (name: string) => {
    if (!name) return "??";
    const nameParts = name.split(" ");
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div
          className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (sortedBookings.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-800/50 rounded-lg">
        <CalendarRange className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No bookings found</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          There are no bookings matching the current criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedBookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="p-4 md:p-6 md:w-1/4 bg-gray-800 flex flex-col justify-center">
              <div className="text-center md:text-left">
                <h3 className="font-medium">{formatDate(booking.startDate)}</h3>
                <p className="text-gray-400">
                  {formatTime(booking.startDate)}
                  {booking.endDate && ` - ${formatTime(booking.endDate)}`}
                </p>
                <div className="mt-2">{getStatusBadge(booking.status)}</div>
              </div>
            </div>

            <div className="p-4 md:p-6 md:w-3/4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-medium text-lg">{booking.name}</h3>
                  <p className="text-gray-400">
                    {booking.description || "No description provided"}
                  </p>

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{booking.studentName}</span>
                      <span className="mx-2 text-gray-500">•</span>
                      <Badge variant="outline" className="ml-1">
                        Student
                      </Badge>
                    </div>

                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{booking.instructorName}</span>
                      <span className="mx-2 text-gray-500">•</span>
                      <Badge variant="outline" className="ml-1">
                        Instructor
                      </Badge>
                    </div>

                    {booking.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{booking.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => onViewBooking(booking)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>

                  {booking.status === "pending" && (
                    <Button
                      variant="outline"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => onActionBooking(booking.id, "confirm")}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Confirm
                    </Button>
                  )}

                  {booking.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => onActionBooking(booking.id, "cancel")}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
