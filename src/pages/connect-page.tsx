import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { 
  Search, Calendar, MapPin, Clock, 
  ChevronRight, Loader2, Users, UserCheck,
  Video, Bookmark, Filter, Check, DollarSign, Clock4,
  CheckCircle
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

// Instructor Card Component with Booking Flow
function InstructorCard({ instructor }: { instructor: User }) {
  const { user } = useAuth();
  const [selectedSessionType, setSelectedSessionType] = useState("private");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  // Format instructor's name initials for avatar
  const getInitials = () => {
    if (!instructor.first_name && !instructor.last_name) return "??";
    return `${instructor.first_name?.[0] || ""}${instructor.last_name?.[0] || ""}`;
  };

  // Placeholder availability data (in a real app, this would come from the API)
  const availableDates = [
    { date: "2025-04-20", available: true },
    { date: "2025-04-21", available: true },
    { date: "2025-04-22", available: true },
    { date: "2025-04-23", available: true },
    { date: "2025-04-24", available: false },
  ];
  
  const availableTimes = [
    { time: "09:00", available: true },
    { time: "10:00", available: true },
    { time: "11:00", available: false },
    { time: "13:00", available: true },
    { time: "14:00", available: true },
    { time: "15:00", available: true },
    { time: "16:00", available: false },
    { time: "17:00", available: true },
  ];
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Calculate session price based on type
  const getSessionPrice = () => {
    switch (selectedSessionType) {
      case "private":
        return "$75";
      case "group":
        return "$45/person";
      case "workshop":
        return "$35/person";
      default:
        return "$75";
    }
  };
  
  return (
    <Card className="overflow-hidden flex flex-col">
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
            <CardTitle>{instructor.first_name} {instructor.last_name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
              New York, NY
            </CardDescription>
          </div>
          <div className="flex items-center bg-green-50 px-2 py-1 rounded">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="ml-1 text-sm font-medium text-green-700">Verified</span>
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
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
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
        
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                View Profile
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={instructor.profile_image_url || ""} />
                    <AvatarFallback className="text-2xl bg-[#00d4ff]/20 text-[#00d4ff]">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{instructor.first_name} {instructor.last_name}</SheetTitle>
                    <div className="flex items-center text-muted-foreground mt-1 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      New York, NY
                    </div>
                  </div>
                </div>
              </SheetHeader>
              
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center bg-green-50 px-2 py-1 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="ml-1 text-sm font-medium text-green-700">Verified Professional</span>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  {instructor.seller_bio || `${instructor.first_name} is a professional dance instructor with over 10 years of experience teaching students of all levels. Specializes in classical and contemporary dance forms, with a focus on proper technique and creative expression.
                  
                  Having trained at Juilliard and performed with the New York City Ballet for 5 years, ${instructor.first_name} brings professional expertise to every class.`}
                </p>
                
                <h3 className="font-medium mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ballet</Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Contemporary</Badge>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Jazz</Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Choreography</Badge>
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">Flexibility</Badge>
                </div>
                
                <h3 className="font-medium mb-2">Experience & Credentials</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-600 shrink-0" />
                    <span className="text-sm">BFA in Dance from Juilliard</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-600 shrink-0" />
                    <span className="text-sm">Former professional dancer with New York City Ballet (2015-2020)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-600 shrink-0" />
                    <span className="text-sm">Certified in dance education and injury prevention</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 mr-2 text-green-600 shrink-0" />
                    <span className="text-sm">10+ years teaching experience with all age groups</span>
                  </li>
                </ul>
                
                <h3 className="font-medium mb-2">Session Types</h3>
                <div className="space-y-3 mb-6">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium">Private Session</h4>
                      <span className="font-bold text-[#00d4ff]">$75/hour</span>
                    </div>
                    <p className="text-sm text-muted-foreground">One-on-one personalized instruction tailored to your specific needs and goals.</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium">Group Session</h4>
                      <span className="font-bold text-[#00d4ff]">$45/person</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Learn with friends in a collaborative environment. Bring 2-5 people.</p>
                  </div>
                  
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-1">
                      <h4 className="font-medium">Specialized Workshop</h4>
                      <span className="font-bold text-[#00d4ff]">$35/person</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Deep dive into specific techniques. Group rates available.</p>
                  </div>
                </div>
                
                <h3 className="font-medium mb-2">Reviews</h3>
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">Jane Doe</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-500 font-medium">Verified Review</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Amazing instructor! I've improved so much in just a few sessions. Highly recommend for ballet technique.</p>
                  </div>
                  
                  <div className="border-b pb-3">
                    <div className="flex justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>MS</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">Michael Smith</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-500 font-medium">Verified Review</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Patient, knowledgeable, and makes learning dance fun! Our group session was the highlight of our week.</p>
                  </div>
                </div>
              </div>
              
              <SheetFooter className="mt-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                      Book a Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Book a Session with {instructor.first_name}</DialogTitle>
                      <DialogDescription>
                        Select your session details and preferred time slot.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Session Type</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant={selectedSessionType === "private" ? "default" : "outline"}
                              className={selectedSessionType === "private" ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
                              onClick={() => setSelectedSessionType("private")}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Private
                            </Button>
                            <Button
                              variant={selectedSessionType === "group" ? "default" : "outline"}
                              className={selectedSessionType === "group" ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
                              onClick={() => setSelectedSessionType("group")}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Group
                            </Button>
                            <Button
                              variant={selectedSessionType === "workshop" ? "default" : "outline"}
                              className={selectedSessionType === "workshop" ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
                              onClick={() => setSelectedSessionType("workshop")}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Workshop
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Select Date</h4>
                          <div className="grid grid-cols-5 gap-2">
                            {availableDates.map((dateObj) => (
                              <Button
                                key={dateObj.date}
                                variant={selectedDate === dateObj.date ? "default" : "outline"}
                                className={`flex flex-col h-auto py-2 ${selectedDate === dateObj.date ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""} ${!dateObj.available ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={!dateObj.available}
                                onClick={() => setSelectedDate(dateObj.date)}
                              >
                                <span className="text-xs">{new Date(dateObj.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                <span className="text-sm font-bold">{new Date(dateObj.date).getDate()}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {selectedDate && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">Select Time</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {availableTimes.map((timeObj) => (
                                <Button
                                  key={timeObj.time}
                                  variant={selectedTime === timeObj.time ? "default" : "outline"}
                                  className={`${selectedTime === timeObj.time ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""} ${!timeObj.available ? "opacity-50 cursor-not-allowed" : ""}`}
                                  disabled={!timeObj.available}
                                  onClick={() => setSelectedTime(timeObj.time)}
                                >
                                  {timeObj.time}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
                          <textarea 
                            className="w-full border rounded-md p-2 text-sm h-20 resize-none"
                            placeholder="Tell the instructor about your experience level, specific goals, or any questions..."
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                          ></textarea>
                        </div>
                        
                        <div className="border rounded-md p-3 bg-slate-50">
                          <h4 className="text-sm font-medium mb-2">Booking Summary</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Session Type:</span>
                              <span className="font-medium capitalize">{selectedSessionType}</span>
                            </div>
                            {selectedDate && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">{formatDate(selectedDate)}</span>
                              </div>
                            )}
                            {selectedTime && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Time:</span>
                                <span className="font-medium">{selectedTime}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t mt-2 pt-2">
                              <span className="text-muted-foreground">Price:</span>
                              <span className="font-bold text-[#00d4ff]">{getSessionPrice()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" disabled={!selectedDate || !selectedTime}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Complete Booking
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                Book Now
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Book a Session with {instructor.first_name}</DialogTitle>
                <DialogDescription>
                  Select your session details and preferred time slot.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Session Type</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={selectedSessionType === "private" ? "default" : "outline"}
                        className={selectedSessionType === "private" ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
                        onClick={() => setSelectedSessionType("private")}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Private
                      </Button>
                      <Button
                        variant={selectedSessionType === "group" ? "default" : "outline"}
                        className={selectedSessionType === "group" ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
                        onClick={() => setSelectedSessionType("group")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Group
                      </Button>
                      <Button
                        variant={selectedSessionType === "workshop" ? "default" : "outline"}
                        className={selectedSessionType === "workshop" ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""}
                        onClick={() => setSelectedSessionType("workshop")}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Workshop
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Select Date</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {availableDates.map((dateObj) => (
                        <Button
                          key={dateObj.date}
                          variant={selectedDate === dateObj.date ? "default" : "outline"}
                          className={`flex flex-col h-auto py-2 ${selectedDate === dateObj.date ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""} ${!dateObj.available ? "opacity-50 cursor-not-allowed" : ""}`}
                          disabled={!dateObj.available}
                          onClick={() => setSelectedDate(dateObj.date)}
                        >
                          <span className="text-xs">{new Date(dateObj.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                          <span className="text-sm font-bold">{new Date(dateObj.date).getDate()}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Select Time</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {availableTimes.map((timeObj) => (
                          <Button
                            key={timeObj.time}
                            variant={selectedTime === timeObj.time ? "default" : "outline"}
                            className={`${selectedTime === timeObj.time ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" : ""} ${!timeObj.available ? "opacity-50 cursor-not-allowed" : ""}`}
                            disabled={!timeObj.available}
                            onClick={() => setSelectedTime(timeObj.time)}
                          >
                            {timeObj.time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
                    <textarea 
                      className="w-full border rounded-md p-2 text-sm h-20 resize-none"
                      placeholder="Tell the instructor about your experience level, specific goals, or any questions..."
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="border rounded-md p-3 bg-slate-50">
                    <h4 className="text-sm font-medium mb-2">Booking Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Session Type:</span>
                        <span className="font-medium capitalize">{selectedSessionType}</span>
                      </div>
                      {selectedDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-medium">{formatDate(selectedDate)}</span>
                        </div>
                      )}
                      {selectedTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Time:</span>
                          <span className="font-medium">{selectedTime}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t mt-2 pt-2">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-bold text-[#00d4ff]">{getSessionPrice()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90" disabled={!selectedDate || !selectedTime}>
                  <DollarSign className="h-4 w-4 mr-1" />
                  Complete Booking
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ConnectPage() {
  const { user } = useAuth();
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

  // Filter instructors
  const filteredInstructors = instructors.filter((instructor) => {
    // Filter by search query
    if (
      searchQuery &&
      !`${instructor.first_name} ${instructor.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(instructor.seller_bio || "").toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    
    // Filter by specialization
    if (specializationFilter) {
      // In a real app, we'd check if the instructor has this specialization
      // This is a simplification
      return true;
    }
    
    // Filter by location
    if (locationFilter) {
      // In a real app, we'd check if the instructor is in this location
      // This is a simplification
      return true;
    }
    
    // Filter by availability
    if (availabilityFilter) {
      // In a real app, we'd check if the instructor is available on this day
      // This is a simplification
      return true;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Connect with Dance Instructors</h1>
        <p className="text-gray-600 text-xl max-w-3xl mx-auto">
          Book private lessons, group sessions, or workshops with our expert dance instructors.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
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
                <SelectItem value="all-styles">All Styles</SelectItem>
                {specializations.map((specialization) => (
                  <SelectItem key={specialization.id} value={specialization.id.toString()}>
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
              </SelectContent>
            </Select>
            
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any-day">Any Day</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="tuesday">Tuesday</SelectItem>
                <SelectItem value="wednesday">Wednesday</SelectItem>
                <SelectItem value="thursday">Thursday</SelectItem>
                <SelectItem value="friday">Friday</SelectItem>
                <SelectItem value="saturday">Saturday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Instructors or Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredInstructors.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-500">No instructors found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstructors.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </div>
      )}

      {/* Booking Options Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Flexible Booking Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-[#00d4ff]/20 flex items-center justify-center mb-4">
                <UserCheck className="h-6 w-6 text-[#00d4ff]" />
              </div>
              <CardTitle>Private Sessions</CardTitle>
              <CardDescription>
                One-on-one personalized instruction tailored to your needs and goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Focused individual attention</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Customized lesson plan</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Flexible scheduling</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <p className="font-bold text-lg">From $75/hour</p>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-[#00d4ff]/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-[#00d4ff]" />
              </div>
              <CardTitle>Group Sessions</CardTitle>
              <CardDescription>
                Learn with friends or join others for a collaborative dance experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Bring 2-5 people</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Affordable per-person rate</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Fun, social learning environment</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <p className="font-bold text-lg">From $45/person</p>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-[#00d4ff]/20 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-[#00d4ff]" />
              </div>
              <CardTitle>Specialized Workshops</CardTitle>
              <CardDescription>
                Intensive sessions focused on specific dance techniques and styles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Deep dive into specific techniques</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>Group rates available</span>
                </li>
                <li className="flex items-center">
                  <ChevronRight className="h-4 w-4 mr-2 text-[#00d4ff]" />
                  <span>For dancers of all levels</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <p className="font-bold text-lg">From $35/person</p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Become an Instructor */}
      <div className="mt-16 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">Are You a Dance Instructor?</h2>
            <p className="text-gray-700 mb-6">
              Join our network of professional dance educators and connect with students around the world.
              Set your own rates, manage your schedule, and grow your teaching practice.
            </p>
            <Button className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
              Apply to Teach
            </Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold mb-4">Benefits of Teaching with DanceRealmX</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <ChevronRight className="h-5 w-5 mr-2 text-[#00d4ff] mt-0.5" />
                <span>Access to a global community of dance students</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-5 w-5 mr-2 text-[#00d4ff] mt-0.5" />
                <span>Scheduling and payment management tools</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-5 w-5 mr-2 text-[#00d4ff] mt-0.5" />
                <span>Marketing and promotion of your classes</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="h-5 w-5 mr-2 text-[#00d4ff] mt-0.5" />
                <span>Professional development and networking opportunities</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
            </TabsList>
            <TabsContent value="bookings">
              <Card>
                <CardHeader>
                  <CardTitle>How do I book a session?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    To book a session, browse our instructors, select one that matches your needs,
                    and click the "Book" button on their profile. You'll be able to select a date and time,
                    choose between private or group sessions, and complete your booking.
                  </p>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Can I cancel my booking?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Yes, you can cancel your booking up to 24 hours before the scheduled session without any penalty.
                    For cancellations made within 24 hours of the session, a 50% fee will be charged.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>What should I wear to a dance session?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    You should wear comfortable clothing that allows for a full range of motion.
                    For specific dance styles, your instructor might recommend particular attire.
                    Footwear depends on the dance style, but comfortable dance shoes or clean sneakers are generally acceptable.
                  </p>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>What if I'm a complete beginner?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Our instructors work with dancers of all levels, including complete beginners.
                    When booking your session, you can note your experience level, and your instructor will
                    tailor the lesson to your abilities and goals.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>What payment methods are accepted?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    We accept all major credit cards, debit cards, and digital wallets like Apple Pay and Google Pay.
                    Payment is processed securely at the time of booking.
                  </p>
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Are there package discounts available?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    Yes, many instructors offer package discounts when you book multiple sessions.
                    These packages can offer savings of up to 20% compared to individual bookings.
                    Check instructor profiles for specific package options.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}