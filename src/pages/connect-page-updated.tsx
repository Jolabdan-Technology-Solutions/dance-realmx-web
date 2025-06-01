import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { User, Booking } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { 
  Search, Award, Calendar, MapPin, Clock, 
  ChevronRight, Loader2, Users, UserCheck,
  Video, Award, Bookmark, Filter, Check, DollarSign, Clock4,
  Briefcase, Clipboard, CalendarClock, CheckCircle2, Heart, UserCircle,
  Home, Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Instructor Card Component with Booking Flow
function InstructorCard({ instructor }: { instructor: User }) {
  const { user } = useAuth();
  
  // Format instructor's name initials for avatar
  const getInitials = () => {
    if (!instructor.first_name && !instructor.last_name) return "??";
    return `${instructor.first_name?.[0] || ""}${instructor.last_name?.[0] || ""}`;
  };

  // Display role badge with proper styling
  const RoleBadge = () => {
    let label = "Instructor";
    let colorClass = "bg-blue-50 text-blue-700 border-blue-200";
    
    if (instructor.role === 'judge') {
      label = "Judge";
      colorClass = "bg-purple-50 text-purple-700 border-purple-200";
    } else if (instructor.role === 'studio') {
      label = "Studio";
      colorClass = "bg-green-50 text-green-700 border-green-200";
    } else if (instructor.role === 'choreographer') {
      label = "Choreographer";
      colorClass = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (instructor.role === 'professional') {
      label = "Professional";
      colorClass = "bg-pink-50 text-pink-700 border-pink-200";
    }
    
    return (
      <Badge variant="outline" className={colorClass}>
        {label}
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="h-48 bg-gradient-to-r from-[#00d4ff]/5 to-[#00d4ff]/10 flex items-center justify-center overflow-hidden">
        {instructor.profile_image_url ? (
          <img
            src={instructor.profile_image_url}
            alt={`${instructor.first_name} ${instructor.last_name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-32 w-32 rounded-full bg-[#00d4ff]/20 flex items-center justify-center text-4xl font-bold text-[#00d4ff]">
            {getInitials()}
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{instructor.first_name} {instructor.last_name}</CardTitle>
              <RoleBadge />
            </div>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              New York, NY
            </CardDescription>
          </div>
          <div className="flex items-center bg-amber-50 px-2 py-1 rounded">
            <Award className="h-4 w-4 text-blue-400" />
            <span className="ml-1 text-sm font-medium text-amber-700">5.0</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2 flex-grow">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ballet</Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Contemporary</Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Jazz</Badge>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-3">
          {instructor.seller_bio || 
            "Professional dance instructor with years of experience teaching students of all levels. Specializes in classical and contemporary dance forms."
          }
        </p>
        
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>10+ years exp.</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>200+ students</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 border-t">
        <div>
          <p className="text-xs text-muted-foreground">Starting from</p>
          <p className="font-bold text-[#00d4ff]">$75/hour</p>
        </div>
        
        <Link href={`/connect/book/${instructor.id}`}>
          <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" size="sm">
            Book Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Booking Request Component for instructors to see incoming requests
function BookingRequestCard({ booking, onStatusChange }: { booking: Booking, onStatusChange?: (bookingId: number, status: string) => void }) {
  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    };
  };
  
  const getBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case 'confirmed':
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case 'declined':
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'completed':
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case 'cancelled':
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };
  
  const { date, time } = formatTime(booking.startTime);
  
  const handleAcceptBooking = async () => {
    if (onStatusChange) {
      onStatusChange(booking.id, 'confirmed');
    }
  };
  
  const handleDeclineBooking = async (reason: string) => {
    if (onStatusChange) {
      onStatusChange(booking.id, 'declined');
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={booking.studentProfileImage} alt={booking.studentName || "Student"} />
              <AvatarFallback className="bg-[#00d4ff]/20 text-[#00d4ff]">
                {getInitials(booking.studentName || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{booking.studentName || "Student"}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>{date}</span>
                <Clock className="h-3.5 w-3.5 mx-1 ml-3" />
                <span>{time}</span>
              </div>
            </div>
          </div>
          <Badge className={getBadgeStyles(booking.status)}>{booking.status}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="grid grid-cols-2 gap-4 my-2">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Session Type</h4>
            <p className="font-medium">{booking.serviceType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
            <p className="font-medium">{booking.duration} {booking.duration === 1 ? "hour" : "hours"}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
            <p className="font-medium">{booking.location}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Price</h4>
            <p className="font-medium text-[#00d4ff]">${parseFloat(booking.price).toFixed(2)}</p>
          </div>
        </div>
        
        {booking.notes && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
            <p className="text-sm">{booking.notes}</p>
          </div>
        )}
      </CardContent>
      
      {booking.status === 'pending' && (
        <CardFooter className="pt-2 flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                Accept
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Accept Booking Request</DialogTitle>
                <DialogDescription>
                  You're accepting a booking request from {booking.studentName} for a {booking.serviceType.toLowerCase()} on {date} at {time}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Add a message (optional)</h3>
                  <Textarea placeholder="Looking forward to our session! Is there anything specific you'd like me to prepare?" />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I confirm that I'll be available at the requested time
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      You can reschedule up to 24 hours before the session.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                    onClick={handleAcceptBooking}
                  >
                    Confirm Acceptance
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                Decline
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Decline Booking Request</DialogTitle>
                <DialogDescription>
                  Please provide a reason for declining the booking request.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <RadioGroup defaultValue="unavailable">
                  <div className="flex items-start space-x-2 mb-3">
                    <RadioGroupItem value="unavailable" id="unavailable" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="unavailable">I'm not available at this time</Label>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 mb-3">
                    <RadioGroupItem value="full" id="full" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="full">My schedule is full</Label>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 mb-3">
                    <RadioGroupItem value="skills" id="skills" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="skills">The student needs a different skill level</Label>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="other">Other reason</Label>
                    </div>
                  </div>
                </RadioGroup>
                
                <div className="mt-4">
                  <Label htmlFor="decline-message">Message (optional)</Label>
                  <Textarea 
                    id="decline-message" 
                    placeholder="Add a personalized message explaining why you're declining" 
                    className="mt-1.5"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDeclineBooking('unavailable')}
                  >
                    Decline Request
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}

// Step-by-Step Booking Form Component
function BookingFlowContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceType, setServiceType] = useState<string | null>(null);
  const [danceStyle, setDanceStyle] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [dateTime, setDateTime] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");
  
  const steps = [
    { id: 1, name: "Service" },
    { id: 2, name: "Dance Style" },
    { id: 3, name: "Location" },
    { id: 4, name: "Date & Time" },
    { id: 5, name: "Details" },
    { id: 6, name: "Review" }
  ];
  
  const goToNextStep = () => {
    setCurrentStep(prev => prev < steps.length ? prev + 1 : prev);
  };
  
  const goToPreviousStep = () => {
    setCurrentStep(prev => prev > 1 ? prev - 1 : prev);
  };
  
  // Step 1: Choose service type - following the DRX workflow for "Who/What are you looking to book?"
  const ServiceTypeStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Who/What are you looking to book?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${serviceType === 'instructor' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setServiceType('instructor')}
        >
          <CardContent className="p-6">
            <UserCheck className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Dance Instructor</h3>
            <p className="text-muted-foreground text-sm">Book a professional dance instructor for private or group lessons.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${serviceType === 'choreographer' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setServiceType('choreographer')}
        >
          <CardContent className="p-6">
            <Users className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Choreographer</h3>
            <p className="text-muted-foreground text-sm">Hire a choreographer for custom routines, performances, or special events.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${serviceType === 'studio' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setServiceType('studio')}
        >
          <CardContent className="p-6">
            <MapPin className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Studio Space</h3>
            <p className="text-muted-foreground text-sm">Rent dance studio space for practice, rehearsals, or small performances.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${serviceType === 'videographer' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setServiceType('videographer')}
        >
          <CardContent className="p-6">
            <Video className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Videographer / Photographer</h3>
            <p className="text-muted-foreground text-sm">Capture your dance performances, competitions, or promotional content.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${serviceType === 'judge' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setServiceType('judge')}
        >
          <CardContent className="p-6">
            <Award className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Judge / Adjudicator</h3>
            <p className="text-muted-foreground text-sm">Book qualified judges for competitions, showcases, or examinations.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${serviceType === 'technician' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setServiceType('technician')}
        >
          <CardContent className="p-6">
            <Briefcase className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Sound/Lighting Technician</h3>
            <p className="text-muted-foreground text-sm">Technical support for sound, lighting, and stage production for dance events.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${serviceType === 'other' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setServiceType('other')}
        >
          <CardContent className="p-6">
            <Bookmark className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Other</h3>
            <p className="text-muted-foreground text-sm">Looking for another type of dance professional not listed here.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button 
          onClick={goToNextStep}
          disabled={!serviceType}
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
  
  // Step 2: Choose dance style
  const DanceStyleStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">What dance style are you interested in?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {['Ballet', 'Contemporary', 'Jazz', 'Hip Hop', 'Ballroom', 'Latin', 'Tap', 'Modern', 'Folk'].map((style) => (
          <Card 
            key={style}
            className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${danceStyle === style.toLowerCase() ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
            onClick={() => setDanceStyle(style.toLowerCase())}
          >
            <CardContent className="p-4 flex items-center">
              <div className="w-12 h-12 rounded-full bg-[#00d4ff]/10 flex items-center justify-center mr-4">
                <span className="text-[#00d4ff] font-bold">{style[0]}</span>
              </div>
              <h3 className="font-medium">{style}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline"
          onClick={goToPreviousStep}
        >
          Back
        </Button>
        <Button 
          onClick={goToNextStep}
          disabled={!danceStyle}
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
  
  // Step 3: Choose location
  const LocationStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Where would you like your sessions to take place?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${location === 'instructor-studio' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setLocation('instructor-studio')}
        >
          <CardContent className="p-6">
            <MapPin className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Instructor's Studio</h3>
            <p className="text-muted-foreground text-sm">Visit the instructor's professional dance space with proper equipment and facilities.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${location === 'my-location' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setLocation('my-location')}
        >
          <CardContent className="p-6">
            <Home className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Your Location</h3>
            <p className="text-muted-foreground text-sm">Have the instructor come to your home or preferred space.</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${location === 'rental-studio' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setLocation('rental-studio')}
        >
          <CardContent className="p-6">
            <Building className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Rental Studio</h3>
            <p className="text-muted-foreground text-sm">Meet at a professionally rented dance studio (additional fees may apply).</p>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer hover:border-[#00d4ff] transition-colors ${location === 'virtual' ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
          onClick={() => setLocation('virtual')}
        >
          <CardContent className="p-6">
            <Video className="h-8 w-8 mb-4 text-[#00d4ff]" />
            <h3 className="font-bold mb-2">Virtual Session</h3>
            <p className="text-muted-foreground text-sm">Connect virtually for a remote lesson via video call.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline"
          onClick={goToPreviousStep}
        >
          Back
        </Button>
        <Button 
          onClick={goToNextStep}
          disabled={!location}
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
  
  // Step 4: Choose date and time
  const DateTimeStep = () => {
    const dates = [
      "2025-04-20", "2025-04-21", "2025-04-22", 
      "2025-04-23", "2025-04-24", "2025-04-25",
      "2025-04-26", "2025-04-27"
    ];
    
    const times = [
      "09:00", "10:00", "11:00", "12:00", 
      "13:00", "14:00", "15:00", "16:00", 
      "17:00", "18:00", "19:00", "20:00"
    ];
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">When would you like to schedule your session?</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Select a date</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dates.map((date) => {
                const displayDate = new Date(date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                
                return (
                  <Button 
                    key={date}
                    variant="outline"
                    className={`justify-start ${dateTime?.startsWith(date) ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
                    onClick={() => {
                      const time = dateTime?.split(' ')[1] || times[0];
                      setDateTime(`${date} ${time}`);
                    }}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {displayDate}
                  </Button>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Select a time</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {times.map((time) => {
                const formattedTime = new Date(`2025-01-01T${time}`).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                
                return (
                  <Button 
                    key={time}
                    variant="outline"
                    className={`justify-start ${dateTime?.endsWith(time) ? 'border-[#00d4ff] bg-[#00d4ff]/5' : ''}`}
                    onClick={() => {
                      const date = dateTime?.split(' ')[0] || dates[0];
                      setDateTime(`${date} ${time}`);
                    }}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {formattedTime}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline"
            onClick={goToPreviousStep}
          >
            Back
          </Button>
          <Button 
            onClick={goToNextStep}
            disabled={!dateTime}
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          >
            Continue
          </Button>
        </div>
      </div>
    );
  };
  
  // Step 5: Enter additional details
  const DetailsStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Tell us more about your needs</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="event-name" className="block mb-2">Event or Session Name</Label>
          <Input id="event-name" placeholder="e.g., Private Ballet Lesson, Wedding Dance Preparation" />
        </div>
        
        <div>
          <Label htmlFor="session-duration" className="block mb-2">Session Duration</Label>
          <Select defaultValue="60">
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="180">3 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="skill-level" className="block mb-2">Your Skill Level</Label>
          <Select defaultValue="intermediate">
            <SelectTrigger>
              <SelectValue placeholder="Select your skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner - Little to no experience</SelectItem>
              <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
              <SelectItem value="advanced">Advanced - Extensive experience</SelectItem>
              <SelectItem value="professional">Professional - Expert level</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="participants" className="block mb-2">Number of Participants</Label>
          <Select defaultValue="1">
            <SelectTrigger>
              <SelectValue placeholder="Select number of participants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Just me (1 person)</SelectItem>
              <SelectItem value="2">2 people</SelectItem>
              <SelectItem value="3-5">Small group (3-5 people)</SelectItem>
              <SelectItem value="6-10">Medium group (6-10 people)</SelectItem>
              <SelectItem value="10+">Large group (10+ people)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="notes" className="block mb-2">Additional Notes</Label>
          <Textarea 
            id="notes" 
            placeholder="Share any specific goals, requirements, or accommodations needed"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            className="h-32"
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline"
          onClick={goToPreviousStep}
        >
          Back
        </Button>
        <Button 
          onClick={goToNextStep}
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
  
  // Step 6: Review and Submit
  const ReviewStep = () => {
    const formatDateTime = () => {
      if (!dateTime) return "Not specified";
      
      const [date, time] = dateTime.split(' ');
      const displayDate = new Date(date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
      
      const formattedTime = new Date(`2025-01-01T${time}`).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      
      return `${displayDate} at ${formattedTime}`;
    };
    
    const getServiceTypeName = () => {
      const serviceTypeMap: {[key: string]: string} = {
        'instructor': 'Dance Instructor',
        'choreographer': 'Choreographer',
        'studio': 'Studio Space',
        'videographer': 'Videographer / Photographer',
        'judge': 'Judge / Adjudicator',
        'technician': 'Sound/Lighting Technician',
        'other': 'Other Service'
      };
      
      return serviceType ? serviceTypeMap[serviceType] : "Not specified";
    };
    
    const getLocationName = () => {
      const locationMap: {[key: string]: string} = {
        'instructor-studio': "Instructor's Studio",
        'my-location': "Your Location",
        'rental-studio': "Rental Studio",
        'virtual': "Virtual Session"
      };
      
      return location ? locationMap[location] : "Not specified";
    };
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Review Your Booking Request</h2>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Service Type</h4>
                  <p className="font-medium">{getServiceTypeName()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Dance Style</h4>
                  <p className="font-medium">{danceStyle ? danceStyle.charAt(0).toUpperCase() + danceStyle.slice(1) : "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                  <p className="font-medium">{getLocationName()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Date & Time</h4>
                  <p className="font-medium">{formatDateTime()}</p>
                </div>
                <div className="md:col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Additional Notes</h4>
                  <p className="font-medium">{additionalInfo || "No additional notes provided."}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Session Fee</h4>
                  <span className="font-bold">$75.00</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
                  <span>Service fee</span>
                  <span>$5.00</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">Total</h4>
                  <span className="font-bold text-[#00d4ff]">$80.00</span>
                </div>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-md">
                <div className="flex gap-2 text-amber-800">
                  <Clock className="h-5 w-5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Pending Confirmation</p>
                    <p>Your request will be sent to the professional for confirmation. You won't be charged until they accept.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline"
            onClick={goToPreviousStep}
          >
            Back
          </Button>
          <Button 
            onClick={() => setCurrentStep(7)} // Go to confirmation
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          >
            Submit Booking Request
          </Button>
        </div>
      </div>
    );
  };
  
  // Step 7: Confirmation
  const ConfirmationStep = () => (
    <div className="space-y-6 text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold">Booking Request Submitted</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Your booking request has been sent to the professional. You will be notified once they confirm or respond to your request.
      </p>
      
      <div className="pt-6">
        <Button 
          onClick={() => window.location.href = "/connect"}
          className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
        >
          Return to Connect Page
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-3xl mx-auto">
      {currentStep < 7 && (
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`flex-1 relative ${
                  step.id < currentStep ? 'text-[#00d4ff]' : 
                  step.id === currentStep ? 'text-foreground' : 
                  'text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.id < currentStep ? 'bg-[#00d4ff] text-white' : 
                      step.id === currentStep ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]' : 
                      'bg-gray-100 text-muted-foreground'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                </div>
                <div className="mt-2 text-xs text-center font-medium">
                  {step.name}
                </div>
                {step.id < steps.length && (
                  <div className={`absolute top-4 left-full w-full h-0.5 -translate-y-1/2 -translate-x-4 ${
                    step.id < currentStep ? 'bg-[#00d4ff]' : 'bg-gray-200'
                  }`} style={{ width: 'calc(100% - 2rem)' }}/>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {currentStep === 1 && <ServiceTypeStep />}
      {currentStep === 2 && <DanceStyleStep />}
      {currentStep === 3 && <LocationStep />}
      {currentStep === 4 && <DateTimeStep />}
      {currentStep === 5 && <DetailsStep />}
      {currentStep === 6 && <ReviewStep />}
      {currentStep === 7 && <ConfirmationStep />}
    </div>
  );
}

// Main component
export default function ConnectPageUpdated() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("");

  // Fetch instructors
  const { data: instructors = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/instructors"],
  });

  // Fetch instructor specializations
  const { data: specializations = [], isLoading: isLoadingSpecializations } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/specializations"],
  });
  
  // For instructors - fetch bookings where they are the instructor
  const { data: myBookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/bookings", { instructorId: user?.id }],
    queryFn: async () => {
      if (!user || (
        user.role !== "instructor" && 
        user.role !== "judge" && 
        user.role !== "studio" && 
        user.role !== "choreographer" && 
        user.role !== "professional" && 
        user.role !== "admin"
      )) return [];
      
      const res = await fetch(`/api/bookings?instructorId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    enabled: !!user && (
      user.role === "instructor" || 
      user.role === "judge" || 
      user.role === "studio" || 
      user.role === "choreographer" || 
      user.role === "professional" || 
      user.role === "admin"
    )
  });

  // Filter instructors
  const filteredInstructors = instructors.filter((instructor) => {
    let matchesSearch = true;
    let matchesSpecialization = true;
    
    if (searchQuery) {
      const fullName = `${instructor.first_name} ${instructor.last_name}`.toLowerCase();
      const bio = instructor.seller_bio?.toLowerCase() || "";
      matchesSearch = fullName.includes(searchQuery.toLowerCase()) || bio.includes(searchQuery.toLowerCase());
    }
    
    if (specializationFilter) {
      // Ideally, we would have a many-to-many relationship between instructors and specializations
      matchesSpecialization = true; // For now, don't filter until we implement the relationship
    }
    
    return matchesSearch && matchesSpecialization;
  });

  // Handle booking status changes
  const handleBookingStatusChange = async (bookingId: number, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        // Invalidate queries to refetch data
        queryClient.invalidateQueries(["/api/bookings"]);
      } else {
        console.error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dance Realm Connect</h1>
        <p className="text-muted-foreground">
          Find and book dance professionals or get booked for your services
        </p>
      </div>
      
      {/* Main Tabs - Book or Get Booked */}
      <Tabs defaultValue="book" className="mb-8">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="book" className="text-lg py-3">Book</TabsTrigger>
          <TabsTrigger value="get-booked" className="text-lg py-3">Get Booked</TabsTrigger>
        </TabsList>
        
        {/* Book Tab Content */}
        <TabsContent value="book">
          {/* Search and Filters */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name or keyword..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dance Style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Styles</SelectItem>
                    {specializations.map((specialization) => (
                      <SelectItem key={specialization.id} value={specialization.name.toLowerCase()}>
                        {specialization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-locations">All Locations</SelectItem>
                    <SelectItem value="new-york">New York</SelectItem>
                    <SelectItem value="los-angeles">Los Angeles</SelectItem>
                    <SelectItem value="chicago">Chicago</SelectItem>
                    <SelectItem value="miami">Miami</SelectItem>
                    <SelectItem value="online">Online Only</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any-time">Any Time</SelectItem>
                    <SelectItem value="weekdays">Weekdays</SelectItem>
                    <SelectItem value="weekends">Weekends</SelectItem>
                    <SelectItem value="evenings">Evenings</SelectItem>
                    <SelectItem value="mornings">Mornings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="lg:w-auto" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Book options - either find professionals or use the booking flow */}
          <Sheet>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">Dance Professionals</h2>
              <SheetTrigger asChild>
                <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                  Create Booking
                </Button>
              </SheetTrigger>
            </div>
            
            <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Create a Booking Request</SheetTitle>
                <SheetDescription>
                  Follow the steps below to create a booking request for a dance professional.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <BookingFlowContent />
              </div>
            </SheetContent>
          </Sheet>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
            </div>
          ) : filteredInstructors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInstructors.map((instructor) => (
                <InstructorCard key={instructor.id} instructor={instructor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-800 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium mb-2">No professionals found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your search filters or try a different search term.
              </p>
            </div>
          )}
        </TabsContent>
        
        {/* Get Booked Tab Content */}
        <TabsContent value="get-booked">
          {/* Services Offering and Talent Profile Setup */}
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Get Booked as a Dance Professional</h2>
              
              {user?.role !== 'instructor' && 
               user?.role !== 'judge' && 
               user?.role !== 'studio' && 
               user?.role !== 'choreographer' && 
               user?.role !== 'professional' ? (
                <Card className="mb-6 bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>Create Your Professional Profile</CardTitle>
                    <CardDescription>
                      Start offering your dance services and get booked by clients.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">What services do you offer?</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {[
                          { label: 'Dance Instruction', icon: <UserCheck className="h-4 w-4 mr-2" /> },
                          { label: 'Studio Rental', icon: <MapPin className="h-4 w-4 mr-2" /> },
                          { label: 'Judging / Adjudicating', icon: <Award className="h-4 w-4 mr-2" /> },
                          { label: 'Choreography', icon: <Users className="h-4 w-4 mr-2" /> },
                          { label: 'Private Lessons', icon: <UserCircle className="h-4 w-4 mr-2" /> },
                          { label: 'Virtual Coaching', icon: <Video className="h-4 w-4 mr-2" /> },
                          { label: 'Masterclasses', icon: <Briefcase className="h-4 w-4 mr-2" /> },
                          { label: 'Tech Support', icon: <DollarSign className="h-4 w-4 mr-2" /> }
                        ].map((service, idx) => (
                          <div key={idx} className="flex items-center">
                            <Checkbox id={`service-${idx}`} className="mr-2" />
                            <Label htmlFor={`service-${idx}`} className="flex items-center text-sm cursor-pointer">
                              {service.icon}
                              {service.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Complete your talent profile</h3>
                      <ul className="space-y-3 mb-4">
                        <li className="flex items-center text-sm">
                          <Check className="h-4 w-4 mr-2 text-green-400" />
                          Add a professional bio and experience
                        </li>
                        <li className="flex items-center text-sm">
                          <Check className="h-4 w-4 mr-2 text-green-400" />
                          Specify your dance styles and genres
                        </li>
                        <li className="flex items-center text-sm">
                          <Check className="h-4 w-4 mr-2 text-green-400" />
                          Upload photos or videos for your portfolio
                        </li>
                        <li className="flex items-center text-sm">
                          <Check className="h-4 w-4 mr-2 text-green-400" />
                          Set your pricing options and availability
                        </li>
                      </ul>
                    </div>
                    
                    <Button 
                      className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                      onClick={() => navigate("/profile/edit?become_professional=true")}
                    >
                      Create Your Professional Profile
                    </Button>
                  </CardContent>
                </Card>
              ) : isLoadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
                </div>
              ) : (
                <>
                  {/* Professional Dashboard */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">Your Professional Dashboard</h2>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => navigate("/profile/edit")}
                      >
                        <UserCircle className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                    
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4 flex items-center">
                          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                            <CalendarClock className="h-6 w-6 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Upcoming Bookings</p>
                            <p className="text-2xl font-bold">
                              {myBookings.filter(b => b.status === 'confirmed' && new Date(b.startTime) > new Date()).length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4 flex items-center">
                          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mr-3">
                            <Clock4 className="h-6 w-6 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pending Requests</p>
                            <p className="text-2xl font-bold">
                              {myBookings.filter(b => b.status === 'pending').length}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4 flex items-center">
                          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                            <DollarSign className="h-6 w-6 text-green-500" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">This Month Earnings</p>
                            <p className="text-2xl font-bold">
                              ${myBookings
                                .filter(b => b.status === 'completed' && new Date(b.startTime).getMonth() === new Date().getMonth())
                                .reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0)
                                .toFixed(2)
                              }
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {/* Booking Requests Sections */}
                  <div className="space-y-8">
                    {/* Upcoming Bookings */}
                    <div>
                      <h3 className="text-xl font-medium mb-4">Upcoming Bookings</h3>
                      {myBookings.filter(b => b.status === 'confirmed' && new Date(b.startTime) > new Date()).length > 0 ? (
                        <div className="space-y-4">
                          {myBookings
                            .filter(b => b.status === 'confirmed' && new Date(b.startTime) > new Date())
                            .map(booking => (
                              <BookingRequestCard 
                                key={booking.id} 
                                booking={booking} 
                                onStatusChange={(id, status) => {
                                  handleBookingStatusChange(id, status);
                                }}
                              />
                            ))
                          }
                        </div>
                      ) : (
                        <Card className="bg-gray-800 border-gray-700 text-center py-8">
                          <CardContent>
                            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium mb-1">No upcoming bookings</p>
                            <p className="text-muted-foreground">
                              You don't have any upcoming confirmed sessions.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {/* Pending Booking Requests */}
                    <div>
                      <h3 className="text-xl font-medium mb-4">Pending Requests</h3>
                      {myBookings.filter(b => b.status === 'pending').length > 0 ? (
                        <div className="space-y-4">
                          {myBookings
                            .filter(b => b.status === 'pending')
                            .map(booking => (
                              <BookingRequestCard 
                                key={booking.id} 
                                booking={booking} 
                                onStatusChange={(id, status) => {
                                  handleBookingStatusChange(id, status);
                                }}
                              />
                            ))
                          }
                        </div>
                      ) : (
                        <Card className="bg-gray-800 border-gray-700 text-center py-8">
                          <CardContent>
                            <Clock4 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium mb-1">No pending requests</p>
                            <p className="text-muted-foreground">
                              You don't have any pending booking requests.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    {/* Past Bookings */}
                    <div>
                      <h3 className="text-xl font-medium mb-4">Past Sessions</h3>
                      {myBookings.filter(b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.startTime) <= new Date())).length > 0 ? (
                        <div className="space-y-4">
                          {myBookings
                            .filter(b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.startTime) <= new Date()))
                            .slice(0, 3) // Showing only recent 3
                            .map(booking => (
                              <BookingRequestCard 
                                key={booking.id} 
                                booking={booking}
                              />
                            ))
                          }
                          
                          {myBookings.filter(b => b.status === 'completed' || (b.status === 'confirmed' && new Date(b.startTime) <= new Date())).length > 3 && (
                            <div className="text-center">
                              <Button variant="link" className="text-[#00d4ff]">
                                View All Past Sessions
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Card className="bg-gray-800 border-gray-700 text-center py-8">
                          <CardContent>
                            <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-lg font-medium mb-1">No past sessions</p>
                            <p className="text-muted-foreground">
                              You don't have any completed booking sessions.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}