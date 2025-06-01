import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Booking } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Calendar, Clock, User, CheckCircle, 
  XCircle, AlertTriangle, Filter, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Fetch user's bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my-bookings"],
    enabled: !!user,
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status: "cancelled" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      setShowCancelDialog(false);
      setBookingToCancel(null);
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Cancel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter bookings based on status and search query
  const filteredBookings = bookings.filter((booking) => {
    // Filter by status
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }
    
    // Filter by search query (instructor name, etc.)
    if (searchQuery) {
      // In a real app, you'd search by instructor name which would be fetched and linked to booking
      return false;
    }
    
    return true;
  });

  // Group bookings by status for tab counts
  const pendingBookings = bookings.filter(booking => booking.status === "pending").length;
  const confirmedBookings = bookings.filter(booking => booking.status === "confirmed").length;
  const completedBookings = bookings.filter(booking => booking.status === "completed").length;
  const cancelledBookings = bookings.filter(booking => booking.status === "cancelled").length;

  // Format date and time
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate duration between start and end time
  const calculateDuration = (startTime: string | Date, endTime: string | Date) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (durationHours > 0) {
      return `${durationHours}h ${durationMinutes > 0 ? `${durationMinutes}m` : ''}`;
    } else {
      return `${durationMinutes}m`;
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = (booking: Booking) => {
    setBookingToCancel(booking);
    setShowCancelDialog(true);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to view your bookings.</p>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>
      
      {/* Filters and search */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow flex items-center relative">
            <Search className="absolute left-3 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Tabs for booking status */}
      <Tabs defaultValue="all" onValueChange={setStatusFilter} value={statusFilter}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All Bookings <span className="ml-2 text-xs rounded-full bg-gray-100 px-2 py-0.5">{bookings.length}</span>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending <span className="ml-2 text-xs rounded-full bg-gray-100 px-2 py-0.5">{pendingBookings}</span>
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed <span className="ml-2 text-xs rounded-full bg-gray-100 px-2 py-0.5">{confirmedBookings}</span>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed <span className="ml-2 text-xs rounded-full bg-gray-100 px-2 py-0.5">{completedBookings}</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled <span className="ml-2 text-xs rounded-full bg-gray-100 px-2 py-0.5">{cancelledBookings}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Bookings Found</h2>
          <p className="text-gray-500 mb-6">
            {statusFilter === "all" 
              ? "You don't have any bookings yet." 
              : `You don't have any ${statusFilter} bookings.`}
          </p>
          <Link href="/connect">
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              Book a Session
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle>Dance Session</CardTitle>
                  {getStatusBadge(booking.status)}
                </div>
                <CardDescription>
                  {booking.type === "private" ? "Private Session" : "Group Session"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-0">
                {/* Instructor info */}
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>IN</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Instructor Name</p>
                    <Link href={`/instructors/${booking.instructorId}`}>
                      <p className="text-sm text-blue-600 hover:underline">View Profile</p>
                    </Link>
                  </div>
                </div>
                
                {/* Booking details */}
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p>{formatDate(booking.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                      <p className="text-sm text-gray-500">
                        Duration: {calculateDuration(booking.startTime, booking.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p>${Number(booking.price).toFixed(2)}</p>
                    </div>
                  </div>
                  {booking.notes && (
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 mr-3 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Notes</p>
                        <p>{booking.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                {(booking.status === "pending" || booking.status === "confirmed") && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleCancelBooking(booking)}
                    className="w-full text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Booking
                  </Button>
                )}
                
                {booking.status === "completed" && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <Award className="h-4 w-4 text-blue-400" />
                    Write a Review
                  </Button>
                )}
                
                {booking.status === "cancelled" && (
                  <Link href="/connect">
                    <Button 
                      className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Again
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Cancel Booking Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
              
              {bookingToCancel && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <p><strong>Date:</strong> {formatDate(bookingToCancel.startTime)}</p>
                  <p><strong>Time:</strong> {formatTime(bookingToCancel.startTime)} - {formatTime(bookingToCancel.endTime)}</p>
                  <p><strong>Type:</strong> {bookingToCancel.type === "private" ? "Private Session" : "Group Session"}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingToCancel && cancelBookingMutation.mutate(bookingToCancel.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelBookingMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper icon
function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}