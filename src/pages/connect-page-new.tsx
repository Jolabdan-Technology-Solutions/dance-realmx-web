import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import BookingWizard from '@/components/connect/booking-wizard';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, BarChart4, CalendarClock, Clock4, DollarSign } from "lucide-react";

export default function ConnectPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('book');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get all instructors (professionals)
  const { data: instructors = [], isLoading: isLoadingInstructors } = useQuery({
    queryKey: ['/api/instructors'],
  });
  
  // Get user's bookings if authenticated
  const { data: myBookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings/me'],
    enabled: !!user,
  });
  
  // Set active tab and sync URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/connect?tab=${value}`, { replace: true });
  };
  
  // Handle completion of booking wizard
  const handleWizardComplete = (data: any) => {
    console.log('Wizard completed with data:', data);
    if (activeTab === 'book') {
      toast({
        title: "Booking Request Sent",
        description: "Your booking request has been submitted successfully.",
      });
    } else {
      toast({
        title: "Professional Profile Updated",
        description: "Your professional profile has been updated successfully.",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4 max-w-[95%]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Connect</h1>
        <p className="text-muted-foreground">
          Find dance professionals or offer your services to dancers around the world.
        </p>
      </div>
      
      <Tabs 
        defaultValue="book" 
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-8"
      >
        <TabsList className="grid grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="book">Book Professionals</TabsTrigger>
          <TabsTrigger value="get-booked">Get Booked</TabsTrigger>
        </TabsList>
        
        {/* Book Tab Content */}
        <TabsContent value="book">
          <BookingWizard 
            mode="book"
            onComplete={handleWizardComplete}
            user={user}
          />
        </TabsContent>
        
        {/* Get Booked Tab Content */}
        <TabsContent value="get-booked">
          <BookingWizard 
            mode="get-booked"
            onComplete={handleWizardComplete}
            user={user}
          />
        </TabsContent>
      </Tabs>
      
      {/* Professional showcase (visible on both tabs at bottom) */}
      <div className="mt-16">
        <Separator className="mb-8" />
        
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl font-bold mb-3">Why Join Our Platform?</h2>
          <p className="text-muted-foreground">
            Whether you're looking to expand your dance knowledge or share your expertise, 
            our platform connects dance enthusiasts and professionals worldwide.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <CalendarClock className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Flexible Scheduling</CardTitle>
              <CardDescription>
                Choose your own hours and manage your bookings on your terms.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <CardTitle>Set Your Rates</CardTitle>
              <CardDescription>
                You decide how much to charge for your services and expertise.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
                <BarChart4 className="h-6 w-6 text-amber-500" />
              </div>
              <CardTitle>Grow Your Business</CardTitle>
              <CardDescription>
                Reach new clients and expand your dance teaching business.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-3">
                <Clock4 className="h-6 w-6 text-pink-500" />
              </div>
              <CardTitle>Save Time</CardTitle>
              <CardDescription>
                Our platform handles booking, scheduling, and payments for you.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        
        <div className="mt-12 text-center">
          <Button 
            onClick={() => navigate("/subscription")}
            className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
            size="lg"
          >
            Upgrade to Premium
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Premium members can send unlimited booking requests
          </p>
        </div>
      </div>
    </div>
  );
}