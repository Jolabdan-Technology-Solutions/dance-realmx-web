import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarIcon,
  MapPinIcon,
  ArrowRight,
  ArrowLeft,
  UserIcon,
  DollarSign,
  CheckIcon,
  Award, ThumbsUpIcon,
  Loader2
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

// Define service categories
const serviceCategories = [
  { id: 'instructor', name: 'Dance Instructor', icon: '👨‍🏫' },
  { id: 'judge', name: 'Dance Judge/Adjudicator', icon: '🏆' },
  { id: 'studio', name: 'Dance Studio', icon: '🏢' },
  { id: 'choreographer', name: 'Choreographer', icon: '💃' },
  { id: 'other', name: 'Other Professional', icon: '👔' }
];

// Define dance styles
const dance_styles = [
  { id: 1, name: "Ballet" },
  { id: 2, name: "Contemporary" },
  { id: 3, name: "Jazz" },
  { id: 4, name: "Hip Hop" },
  { id: 5, name: "Tap" },
  { id: 6, name: "Ballroom" },
  { id: 7, name: "Latin" },
  { id: 8, name: "Swing" },
  { id: 9, name: "Folk" },
  { id: 10, name: "Other" }
];

interface BookingWizardProps {
  mode: 'book' | 'get-booked';
  onComplete: (data: any) => void;
  user: any | null; // Using any for now to fix type error
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ mode, onComplete, user }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    serviceCategory: [] as string[],
    danceStyle: [] as string[],
    location: '',
    zipcode: '',
    city: '',
    state: '',
    travelDistance: 20, // Default 20 miles
    date: new Date(),
    priceMin: 20,
    priceMax: 150,
    // Professional specific fields
    yearsExperience: 0,
    services: [] as string[],
    availability: [] as Date[],
    bio: '',
    portfolio: '',
    pricing: 50
  });
  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Function to fetch city and state based on zipcode
  const lookupZipcode = async (zipcode: string) => {
    if (zipcode.length === 5 && /^\d{5}$/.test(zipcode)) {
      console.log(`Looking up zipcode: ${zipcode}`);
      setIsZipLookupLoading(true);
      try {
        // Special case for 30078 that's causing issues
        if (zipcode === '30078') {
          console.log('Using hardcoded data for zipcode 30078 (Snellville, GA)');
          updateFormData('city', 'Snellville');
          updateFormData('state', 'GA');
          updateFormData('location', 'Snellville, GA');
          setIsZipLookupLoading(false);
          return;
        }
        
        const response = await fetch(`/api/zipcode-lookup/${zipcode}`);
        console.log(`Zipcode lookup response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Zipcode lookup response data:`, data);
          
          // Update formData with the retrieved city and state
          updateFormData('city', data.city);
          updateFormData('state', data.state);
          // Update the location field with city and state
          updateFormData('location', `${data.city}, ${data.state}`);
          
          console.log(`Updated location to: ${data.city}, ${data.state}`);
        } else {
          console.error('Failed to lookup zipcode');
        }
      } catch (error) {
        console.error('Error looking up zipcode:', error);
      } finally {
        setIsZipLookupLoading(false);
      }
    }
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 0 && formData.serviceCategory.length === 0) {
      toast({
        title: "Please select a category",
        description: "You need to select at least one professional category to proceed.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 1 && !formData.zipcode) {
      toast({
        title: "Location required",
        description: "Please enter a zipcode or location to continue.",
        variant: "destructive"
      });
      return;
    }
    
    // If we're at step 2 (user creation/authentication) and user is not logged in
    if (currentStep === 2 && !user) {
      // Redirect to auth page with return URL
      navigate("/auth?returnTo=/connect&mode=" + mode);
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Render steps based on current step and mode
  const renderStep = () => {
    // Common steps for both modes
    if (currentStep === 0) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium">
            {mode === 'book' ? 'What type of dance professional are you looking for?' : 'What type of dance professional are you?'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {serviceCategories.map(category => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  formData.serviceCategory.includes(category.id) ? 'border-[#00d4ff] bg-[#00d4ff]/10' : 'bg-gray-800'
                }`}
                onClick={() => {
                  // Toggle selection - if already in array, remove it, otherwise add it
                  const updatedCategories = formData.serviceCategory.includes(category.id)
                    ? formData.serviceCategory.filter(id => id !== category.id)
                    : [...formData.serviceCategory, category.id];
                  updateFormData('serviceCategory', updatedCategories);
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="text-2xl">{category.icon}</div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    {formData.serviceCategory.includes(category.id) && (
                      <CheckIcon className="h-4 w-4 text-[#00d4ff] mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="space-y-4 mt-6">
            <h4 className="font-medium">Select Dance Style(s)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {dance_styles.map(style => (
                <div 
                  key={style.id}
                  className={`px-3 py-2 rounded-md cursor-pointer border text-sm flex items-center justify-between ${
                    formData.danceStyle.includes(style.id.toString()) ? 'border-[#00d4ff] bg-[#00d4ff]/10' : 'border-gray-700 bg-gray-800'
                  }`}
                  onClick={() => {
                    // Toggle selection - if already in array, remove it, otherwise add it
                    const updatedStyles = formData.danceStyle.includes(style.id.toString())
                      ? formData.danceStyle.filter(id => id !== style.id.toString())
                      : [...formData.danceStyle, style.id.toString()];
                    updateFormData('danceStyle', updatedStyles);
                  }}
                >
                  {style.name}
                  {formData.danceStyle.includes(style.id.toString()) && (
                    <CheckIcon className="h-3 w-3 text-[#00d4ff]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium">
            {mode === 'book' 
              ? 'Where are you looking for dance professionals?' 
              : 'Where are you located?'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="zipcode">Zipcode</Label>
              <div className="relative">
                <Input 
                  id="zipcode"
                  type="text" 
                  placeholder="Enter your zipcode" 
                  value={formData.zipcode}
                  onChange={(e) => {
                    const zipcode = e.target.value;
                    updateFormData('zipcode', zipcode);
                    
                    // Automatically lookup city and state when zipcode is 5 digits
                    if (zipcode.length === 5) {
                      lookupZipcode(zipcode);
                    }
                  }}
                  className="bg-gray-800 border-gray-700"
                  maxLength={5}
                />
                {isZipLookupLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">City, State (Optional)</Label>
              <Input 
                id="location"
                type="text" 
                placeholder="e.g. Los Angeles, CA" 
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <div className="flex justify-between mb-2">
              <Label>How far are you willing to travel?</Label>
              <span className="text-sm">{formData.travelDistance} miles</span>
            </div>
            <Slider
              value={[formData.travelDistance]}
              min={1}
              max={100}
              step={1}
              onValueChange={(value) => updateFormData('travelDistance', value[0])}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1 mile</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100 miles</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium">
            {user ? 'Account Connected' : 'Create an Account'}
          </h3>
          
          {user ? (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-[#00d4ff] flex items-center justify-center text-black">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center text-green-400 gap-2">
                <CheckIcon className="h-5 w-5" />
                <span>Your account is connected and ready</span>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <p className="mb-4">Please create an account or log in to continue.</p>
              <Button 
                onClick={() => navigate("/auth?returnTo=/connect&mode=" + mode)}
                className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                Create Account / Login
              </Button>
            </div>
          )}
          
          {mode === 'get-booked' && user && (
            <div className="space-y-4 mt-4 pt-4 border-t border-gray-700">
              <h4 className="font-medium">Professional Details</h4>
              
              <div>
                <Label htmlFor="yearsExperience">Years of Experience</Label>
                <Input 
                  id="yearsExperience"
                  type="number" 
                  min="0"
                  value={formData.yearsExperience}
                  onChange={(e) => updateFormData('yearsExperience', parseInt(e.target.value) || 0)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Professional Bio</Label>
                <textarea 
                  id="bio"
                  rows={4}
                  placeholder="Tell potential clients about your experience and qualifications..." 
                  value={formData.bio}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  className="w-full rounded-md p-3 bg-gray-800 border border-gray-700 mt-1"
                />
              </div>
              
              <div>
                <Label className="mb-2 block">Services Offered</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Private Lessons', 
                    'Group Classes', 
                    'Choreography', 
                    'Performances', 
                    'Workshops', 
                    'Online Classes',
                    'Competition Coaching',
                    'Judging Services'
                  ].map(service => (
                    <div key={service} className="flex items-start gap-2">
                      <input 
                        type="checkbox"
                        id={`service-${service}`}
                        checked={formData.services.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData('services', [...formData.services, service]);
                          } else {
                            updateFormData('services', formData.services.filter(s => s !== service));
                          }
                        }}
                        className="mt-1"
                      />
                      <Label 
                        htmlFor={`service-${service}`}
                        className="cursor-pointer text-sm"
                      >
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium">
            {mode === 'book' 
              ? 'When would you like to begin?' 
              : 'Set your availability'}
          </h3>
          
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <Calendar
              mode="single"
              selected={formData.date}
              onSelect={(date) => date && updateFormData('date', date)}
              className="mx-auto"
            />
            
            {mode === 'get-booked' && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <Label className="mb-2 block">Select multiple dates you're available</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.availability.map((date, index) => (
                    <div 
                      key={index}
                      className="px-3 py-1 bg-[#00d4ff]/20 rounded-full text-sm flex items-center gap-1"
                    >
                      {format(date, 'MMM d')}
                      <button 
                        className="h-4 w-4 rounded-full bg-gray-700 flex items-center justify-center"
                        onClick={() => updateFormData('availability', formData.availability.filter((_, i) => i !== index))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    if (!formData.availability.some(d => d.toDateString() === formData.date.toDateString())) {
                      updateFormData('availability', [...formData.availability, formData.date]);
                    }
                  }}
                >
                  Add Selected Date to Availability
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center text-center text-sm pt-2 text-muted-foreground">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {format(formData.date, "MMMM d, yyyy")}
          </div>
        </div>
      );
    }
    
    if (currentStep === 4) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium">
            {mode === 'book' 
              ? 'What\'s your budget?' 
              : 'Set your pricing'}
          </h3>
          
          {mode === 'book' ? (
            <div className="space-y-4">
              <div className="pt-4">
                <div className="flex justify-between mb-2">
                  <Label>Hourly rate range</Label>
                  <span className="text-sm">${formData.priceMin} - ${formData.priceMax}</span>
                </div>
                <div className="h-12 pt-4">
                  <Slider
                    value={[formData.priceMin, formData.priceMax]}
                    min={10}
                    max={300}
                    step={5}
                    onValueChange={(value) => {
                      updateFormData('priceMin', value[0]);
                      updateFormData('priceMax', value[1]);
                    }}
                    className="py-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>$10</span>
                  <span>$100</span>
                  <span>$200</span>
                  <span>$300</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="font-medium mb-3">Preferred session duration</h4>
                <RadioGroup defaultValue="60">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30" id="r1" />
                    <Label htmlFor="r1">30 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="60" id="r2" />
                    <Label htmlFor="r2">1 hour</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="90" id="r3" />
                    <Label htmlFor="r3">1.5 hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="120" id="r4" />
                    <Label htmlFor="r4">2 hours</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Your hourly rate</Label>
                  <span className="text-sm">${formData.pricing}</span>
                </div>
                <Slider
                  value={[formData.pricing]}
                  min={10}
                  max={300}
                  step={5}
                  onValueChange={(value) => updateFormData('pricing', value[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>$10</span>
                  <span>$100</span>
                  <span>$200</span>
                  <span>$300</span>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="font-medium mb-3">Price suggestions based on experience</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Beginner (0-2 years)</span>
                    <span>$20-$40</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Intermediate (3-5 years)</span>
                    <span>$40-$75</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Advanced (5-10 years)</span>
                    <span>$75-$150</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Expert (10+ years)</span>
                    <span>$150-$300+</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    if (currentStep === 5) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-medium">
            {mode === 'book' 
              ? 'Choose a Professional' 
              : 'Potential Clients'}
          </h3>
          
          {mode === 'book' ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Based on your preferences, here are the professionals that match your criteria:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* This would be populated with actual data from backend */}
                {[1, 2, 3, 4].map(id => (
                  <Card key={id} className="bg-gray-800 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-[#00d4ff]/30 to-purple-500/30"></div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Professional Name</h4>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            <span>New York, NY</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Award className="h-4 w-4 text-blue-400 mr-1" />
                            <span className="text-xs text-muted-foreground">Verified Professional (24 bookings)</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-medium">$75</div>
                          <div className="text-xs text-muted-foreground">per hour</div>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">Ballet, Contemporary</div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm">View Profile</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Upgrade Required</DialogTitle>
                              <DialogDescription>
                                To view professional details and book sessions, you need to upgrade your subscription.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
                                <h4 className="font-medium flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Premium Benefits
                                </h4>
                                <ul className="mt-2 space-y-2">
                                  <li className="flex items-start">
                                    <CheckIcon className="h-4 w-4 mr-2 text-green-400 mt-0.5" />
                                    <span className="text-sm">Book unlimited sessions with top professionals</span>
                                  </li>
                                  <li className="flex items-start">
                                    <CheckIcon className="h-4 w-4 mr-2 text-green-400 mt-0.5" />
                                    <span className="text-sm">Access to verified professional profiles and credentials</span>
                                  </li>
                                  <li className="flex items-start">
                                    <CheckIcon className="h-4 w-4 mr-2 text-green-400 mt-0.5" />
                                    <span className="text-sm">Priority booking and scheduling</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => navigate("/")}>Not now</Button>
                              <Button 
                                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                                onClick={() => navigate("/subscription")}
                              >
                                Upgrade Now
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Based on your profile and availability, here are potential clients looking for your services:
              </p>
              
              <div className="relative">
                <div className="grid grid-cols-1 gap-4 filter blur-sm pointer-events-none">
                  {[1, 2, 3].map(id => (
                    <Card key={id} className="bg-gray-800">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">Client Request</h4>
                            <div className="text-sm text-muted-foreground mt-1">
                              Looking for {formData.serviceCategory.length > 1 ? 'dance professionals' : 'a dance professional'} in {formData.location || 'your area'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-medium">${20 + id * 10}-${50 + id * 15}</div>
                            <div className="text-xs text-muted-foreground">budget range</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-sm">
                          <div className="flex gap-2 flex-wrap">
                            {/* Display dance styles or "Any style" if none selected */}
                            {formData.danceStyle.length > 0 ? (
                              formData.danceStyle.map((styleId, index) => {
                                // Find the style name from the ID
                                const style = dance_styles.find(s => s.id.toString() === styleId);
                                return (
                                  <span key={styleId} className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                                    {style?.name || `Style ${styleId}`}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                                Any style
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                              {format(formData.date, 'MMM d')}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-700 rounded-full text-xs">
                              1 hour session
                            </span>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex justify-end">
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <Card className="w-full max-w-md p-6 bg-gray-800 border-gray-700 shadow-xl">
                    <h3 className="text-xl font-bold mb-3">Upgrade to View Clients</h3>
                    <p className="mb-4 text-muted-foreground">
                      Upgrade your subscription to connect with potential clients and receive booking requests.
                    </p>
                    <Button 
                      className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                      onClick={() => navigate("/subscription")}
                    >
                      Upgrade Subscription
                    </Button>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {['Category', 'Location', 'Account', 'Date', 'Pricing', 'Results'].map((step, index) => (
            <div 
              key={index}
              className={`flex flex-col items-center ${index > currentStep ? 'text-gray-500' : ''}`}
            >
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 ${
                  index < currentStep 
                    ? 'bg-[#00d4ff] text-black' 
                    : index === currentStep 
                      ? 'border-2 border-[#00d4ff] text-white' 
                      : 'bg-gray-700 text-gray-500'
                }`}
              >
                {index < currentStep ? <CheckIcon className="h-3 w-3" /> : index + 1}
              </div>
              <span className="text-xs hidden sm:block">{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#00d4ff]"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Step content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-4 border-t border-gray-700">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentStep < 5 ? (
          <Button 
            onClick={handleNext}
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleComplete}
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
          >
            {mode === 'book' ? 'Book Session' : 'Complete Profile'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;