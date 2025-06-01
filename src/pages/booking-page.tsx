import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, InstructorAvailability, BookingException } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Calendar, Clock, Check, X, Loader2, ArrowRight, 
  CreditCard, Users, User as UserIcon 
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

// Simple type for time slots
type TimeSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
};

// Booking details type
type BookingDetails = {
  date: Date | null;
  timeSlot: string | null;
  type: "private" | "group";
  notes: string;
  participants: number;
};

export default function BookingPage() {
  const [, navigate] = useLocation();
  const { instructorId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [booking, setBooking] = useState<BookingDetails>({
    date: null,
    timeSlot: null,
    type: "private",
    notes: "",
    participants: 1,
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch instructor details
  const { data: instructor, isLoading: isLoadingInstructor } = useQuery<User>({
    queryKey: [`/api/instructors/${instructorId}`],
    enabled: !!instructorId,
  });

  // Fetch instructor availability
  const { data: availabilitySchedule = [], isLoading: isLoadingAvailability } = useQuery<InstructorAvailability[]>({
    queryKey: [`/api/instructors/${instructorId}/availability`],
    enabled: !!instructorId,
  });

  // Fetch instructor booking exceptions
  const { data: bookingExceptions = [], isLoading: isLoadingExceptions } = useQuery<BookingException[]>({
    queryKey: [`/api/instructors/${instructorId}/exceptions`],
    enabled: !!instructorId,
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!booking.date || !booking.timeSlot) {
        throw new Error("Please select a date and time slot");
      }

      const [startHour, startMinute] = booking.timeSlot.split("-")[0].split(":").map(Number);
      const [endHour, endMinute] = booking.timeSlot.split("-")[1].split(":").map(Number);
      
      const startDate = new Date(booking.date);
      startDate.setHours(startHour, startMinute, 0, 0);
      
      const endDate = new Date(booking.date);
      endDate.setHours(endHour, endMinute, 0, 0);

      const price = booking.type === "private" ? 75 : 45 * booking.participants;

      const res = await apiRequest("POST", "/api/bookings", {
        instructorId: Number(instructorId),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        type: booking.type,
        notes: booking.notes,
        participants: booking.participants,
        price: price,
        status: "pending",
        paymentStatus: "unpaid",
      });
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking Successful",
        description: "Your session has been booked successfully.",
      });
      
      setShowConfirmDialog(false);
      
      // Redirect to my bookings page
      navigate("/my-bookings");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingInstructor || isLoadingAvailability || isLoadingExceptions;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Instructor Not Found</h1>
        <p className="mb-8">The instructor you're looking for doesn't exist.</p>
        <Link href="/connect">
          <Button>Go Back to Connect</Button>
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to book a session.</p>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  // Generate time slots based on instructor availability for the selected date
  const getTimeSlots = (date: Date | null): TimeSlot[] => {
    if (!date) return [];
    
    const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // Get the instructor's availability for this day
    const dayAvailability = availabilitySchedule.filter(a => a.dayOfWeek === dayOfWeek);
    
    // Check if this date has any exceptions
    const hasException = bookingExceptions.some(e => 
      isSameDay(parseISO(e.date.toString()), date)
    );
    
    // If there's an exception or no availability for this day, return empty array
    if (hasException || dayAvailability.length === 0) return [];
    
    // Generate time slots from the availability
    const slots: TimeSlot[] = [];
    
    dayAvailability.forEach(availability => {
      // Convert availability times to hours and minutes
      const [startHour, startMinute] = availability.startTime.split(":").map(Number);
      const [endHour, endMinute] = availability.endTime.split(":").map(Number);
      
      // Generate hourly slots
      let currentHour = startHour;
      let currentMinute = startMinute;
      
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const nextHour = currentMinute + 60 >= 60 ? currentHour + 1 : currentHour;
        const nextMinute = (currentMinute + 60) % 60;
        
        if (nextHour <= endHour) {
          const startTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          const endTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
          
          slots.push({
            startTime: startTimeStr,
            endTime: endTimeStr,
            available: true
          });
        }
        
        currentHour = nextHour;
        currentMinute = nextMinute;
      }
    });
    
    return slots;
  };

  const availableTimeSlots = booking.date ? getTimeSlots(booking.date) : [];

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setBooking({ ...booking, date, timeSlot: null });
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: string) => {
    setBooking({ ...booking, timeSlot });
  };

  // Handle session type selection
  const handleSessionTypeSelect = (type: "private" | "group") => {
    setBooking({ ...booking, type, participants: type === "private" ? 1 : 2 });
  };

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBooking({ ...booking, notes: e.target.value });
  };

  // Handle participants change
  const handleParticipantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setBooking({ ...booking, participants: value });
    }
  };

  // Handle next step button
  const handleNextStep = () => {
    if (currentStep === 1 && (!booking.date || !booking.timeSlot)) {
      toast({
        title: "Incomplete Information",
        description: "Please select both a date and a time slot to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowConfirmDialog(true);
    }
  };

  // Handle previous step button
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header with back navigation */}
      <div className="mb-8">
        <Link href={`/instructors/${instructorId}`}>
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Instructor Profile
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Book a Session with {instructor.first_name} {instructor.last_name}</h1>

      {/* Booking steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 1 ? 'bg-[#00d4ff] text-white' : 'bg-gray-200'}`}>
              <Calendar className="h-5 w-5" />
            </div>
            <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-[#00d4ff]' : 'bg-gray-200'}`}></div>
          </div>
          <div className="flex items-center">
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 2 ? 'bg-[#00d4ff] text-white' : 'bg-gray-200'}`}>
              <Users className="h-5 w-5" />
            </div>
            <div className={`h-1 w-16 ${currentStep >= 3 ? 'bg-[#00d4ff]' : 'bg-gray-200'}`}></div>
          </div>
          <div className="flex items-center">
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${currentStep >= 3 ? 'bg-[#00d4ff] text-white' : 'bg-gray-200'}`}>
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-2">
          <div className="text-center w-32">
            <p className={`text-sm ${currentStep === 1 ? 'font-semibold' : ''}`}>Schedule</p>
          </div>
          <div className="text-center w-32">
            <p className={`text-sm ${currentStep === 2 ? 'font-semibold' : ''}`}>Details</p>
          </div>
          <div className="text-center w-32">
            <p className={`text-sm ${currentStep === 3 ? 'font-semibold' : ''}`}>Review</p>
          </div>
        </div>
      </div>

      {/* Step 1: Select Date and Time */}
      {currentStep === 1 && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <CardDescription>Choose when you'd like to book your session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Calendar */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Select a Date</h3>
                  <CalendarComponent
                    mode="single"
                    selected={booking.date || undefined}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                    disabled={(date) => {
                      // Disable past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      
                      // Disable dates with exceptions
                      const hasException = bookingExceptions.some(e => 
                        isSameDay(parseISO(e.date.toString()), date)
                      );
                      if (hasException) return true;
                      
                      // Disable dates with no availability
                      const dayOfWeek = date.getDay();
                      const hasDayAvailability = availabilitySchedule.some(a => 
                        a.dayOfWeek === dayOfWeek
                      );
                      return !hasDayAvailability;
                    }}
                  />
                </div>

                {/* Time slots */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Select a Time</h3>
                  {booking.date ? (
                    availableTimeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableTimeSlots.map((slot, index) => (
                          <Button
                            key={index}
                            variant={booking.timeSlot === `${slot.startTime}-${slot.endTime}` ? "default" : "outline"}
                            className={`justify-start ${booking.timeSlot === `${slot.startTime}-${slot.endTime}` ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}`}
                            onClick={() => handleTimeSlotSelect(`${slot.startTime}-${slot.endTime}`)}
                            disabled={!slot.available}
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            {slot.startTime} - {slot.endTime}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-md text-center">
                        <p className="text-gray-500">No available time slots for this date.</p>
                        <p className="text-sm text-gray-400 mt-2">Please select a different date.</p>
                      </div>
                    )
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-md text-center">
                      <p className="text-gray-500">Please select a date first.</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleNextStep}
                disabled={!booking.date || !booking.timeSlot}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 2: Session Details */}
      {currentStep === 2 && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Customize your session preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Session Type */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Session Type</h3>
                  <RadioGroup
                    value={booking.type}
                    onValueChange={(value) => handleSessionTypeSelect(value as "private" | "group")}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="private"
                        id="private"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="private"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#00d4ff] peer-data-[state=checked]:bg-[#00d4ff]/10 [&:has([data-state=checked])]:border-[#00d4ff] [&:has([data-state=checked])]:bg-[#00d4ff]/10"
                      >
                        <UserIcon className="mb-2 h-6 w-6" />
                        <div className="text-center">
                          <p className="font-medium">Private Session</p>
                          <p className="text-sm text-gray-500">One-on-one personalized instruction</p>
                          <p className="font-medium mt-2">$75 per hour</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div>
                      <RadioGroupItem
                        value="group"
                        id="group"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="group"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#00d4ff] peer-data-[state=checked]:bg-[#00d4ff]/10 [&:has([data-state=checked])]:border-[#00d4ff] [&:has([data-state=checked])]:bg-[#00d4ff]/10"
                      >
                        <Users className="mb-2 h-6 w-6" />
                        <div className="text-center">
                          <p className="font-medium">Group Session</p>
                          <p className="text-sm text-gray-500">Learn with friends or join others</p>
                          <p className="font-medium mt-2">$45 per person</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {/* Participants (only for group sessions) */}
                {booking.type === "group" && (
                  <div>
                    <Label htmlFor="participants" className="text-sm font-medium">
                      Number of Participants
                    </Label>
                    <div className="mt-1 flex items-center">
                      <Input
                        id="participants"
                        type="number"
                        min={2}
                        max={10}
                        value={booking.participants}
                        onChange={handleParticipantsChange}
                        className="w-24"
                      />
                      <span className="ml-4 text-gray-500">Total: ${booking.participants * 45}</span>
                    </div>
                  </div>
                )}
                
                {/* Session Notes */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Session Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Share any specific goals, skill level, or requests for your session..."
                    value={booking.notes}
                    onChange={handleNotesChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Step 3: Review and Confirm */}
      {currentStep === 3 && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Review and Confirm</CardTitle>
              <CardDescription>Please review your booking details before confirming</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Instructor Info */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">
                    {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-medium">{instructor.first_name} {instructor.last_name}</h3>
                    <p className="text-sm text-gray-500">Professional Dance Instructor</p>
                  </div>
                </div>
                
                {/* Booking Summary */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium">Booking Summary</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {booking.date ? format(booking.date, "EEEE, MMMM d, yyyy") : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {booking.timeSlot ? booking.timeSlot.replace('-', ' - ') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session Type:</span>
                      <span className="font-medium capitalize">{booking.type}</span>
                    </div>
                    {booking.type === "group" && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Participants:</span>
                        <span className="font-medium">{booking.participants}</span>
                      </div>
                    )}
                    {booking.notes && (
                      <div>
                        <span className="text-gray-600 block mb-1">Notes:</span>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Price Summary */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium">Price Summary</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        {booking.type === "private" 
                          ? "1 hour private session" 
                          : `1 hour group session (${booking.participants} participants)`
                        }
                      </span>
                      <span className="font-medium">
                        ${booking.type === "private" 
                          ? "75.00" 
                          : `${booking.participants * 45}.00`
                        }
                      </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span>
                        ${booking.type === "private" 
                          ? "75.00" 
                          : `${booking.participants * 45}.00`
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                Confirm Booking
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to book this session?
              {booking.date && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <p><strong>Date:</strong> {format(booking.date, "EEEE, MMMM d, yyyy")}</p>
                  <p><strong>Time:</strong> {booking.timeSlot?.replace('-', ' - ')}</p>
                  <p><strong>Type:</strong> {booking.type === "private" ? "Private Session" : `Group Session (${booking.participants} participants)`}</p>
                  <p><strong>Total:</strong> ${booking.type === "private" ? "75.00" : `${booking.participants * 45}.00`}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => createBookingMutation.mutate()}
              disabled={createBookingMutation.isPending}
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
            >
              {createBookingMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}