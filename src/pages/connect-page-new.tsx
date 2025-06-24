// import React, { useState } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { useAuth } from '@/hooks/use-auth';
// import { useLocation } from 'wouter';
// import { useToast } from "@/hooks/use-toast";
// import BookingWizard from '@/components/connect/booking-wizard';

// // UI Components
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { Loader2, BarChart4, CalendarClock, Clock4, DollarSign } from "lucide-react";

// export default function ConnectPage() {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState('book');
//   const [, navigate] = useLocation();
//   const { toast } = useToast();
  
//   // Get all instructors (professionals)
//   const { data: instructors = [], isLoading: isLoadingInstructors } = useQuery({
//     queryKey: ['/api/instructors'],
//   });
  
//   // Get user's bookings if authenticated
//   const { data: myBookings = [], isLoading: isLoadingBookings } = useQuery({
//     queryKey: ['/api/bookings/me'],
//     enabled: !!user,
//   });
  
//   // Set active tab and sync URL
//   const handleTabChange = (value: string) => {
//     setActiveTab(value);
//     navigate(`/connect?tab=${value}`, { replace: true });
//   };
  
//   // Handle completion of booking wizard
//   const handleWizardComplete = (data: any) => {
//     console.log('Wizard completed with data:', data);
//     if (activeTab === 'book') {
//       toast({
//         title: "Booking Request Sent",
//         description: "Your booking request has been submitted successfully.",
//       });
//     } else {
//       toast({
//         title: "Professional Profile Updated",
//         description: "Your professional profile has been updated successfully.",
//       });
//     }
//   };
  
//   return (
//     <div className="container mx-auto py-10 px-4 max-w-[95%]">
//       {/* <div className="mb-8">
//         <h1 className="text-3xl font-bold mb-2 text-center">Connect</h1>
//         <p className="text-muted-foreground">
//           Find dance professionals or offer your services to dancers around the world.
//         </p>
//       </div>
//        */}
//       <Tabs 
//         defaultValue="book" 
//         value={activeTab}
//         onValueChange={handleTabChange}
//         className="space-y-8"
//       >
//         <TabsList className="grid grid-cols-2 max-w-md mx-auto">
//           <TabsTrigger value="book">Book Professionals</TabsTrigger>
//           <TabsTrigger value="get-booked">Get Booked</TabsTrigger>
//         </TabsList>
        
//         {/* Book Tab Content */}
//         <TabsContent value="book">
//           <BookingWizard 
//             mode="book"
//             onComplete={handleWizardComplete}
//             user={user}
//           />
//         </TabsContent>
        
//         {/* Get Booked Tab Content */}
//         <TabsContent value="get-booked">
//           <BookingWizard 
//             mode="get-booked"
//             onComplete={handleWizardComplete}
//             user={user}
//           />
//         </TabsContent>
//       </Tabs>
      
//       {/* Professional showcase (visible on both tabs at bottom) */}
//       <div className="mt-16">
//         <Separator className="mb-8" />
        
//         <div className="text-center max-w-3xl mx-auto mb-10">
//           <h2 className="text-2xl font-bold mb-3">Why Join Our Platform?</h2>
//           <p className="text-muted-foreground">
//             Whether you're looking to expand your dance knowledge or share your expertise, 
//             our platform connects dance enthusiasts and professionals worldwide.
//           </p>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <Card className="bg-gray-800 border-gray-700">
//             <CardHeader className="pb-2">
//               <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
//                 <CalendarClock className="h-6 w-6 text-blue-500" />
//               </div>
//               <CardTitle>Flexible Scheduling</CardTitle>
//               <CardDescription>
//                 Choose your own hours and manage your bookings on your terms.
//               </CardDescription>
//             </CardHeader>
//           </Card>
          
//           <Card className="bg-gray-800 border-gray-700">
//             <CardHeader className="pb-2">
//               <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
//                 <DollarSign className="h-6 w-6 text-green-500" />
//               </div>
//               <CardTitle>Set Your Rates</CardTitle>
//               <CardDescription>
//                 You decide how much to charge for your services and expertise.
//               </CardDescription>
//             </CardHeader>
//           </Card>
          
//           <Card className="bg-gray-800 border-gray-700">
//             <CardHeader className="pb-2">
//               <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
//                 <BarChart4 className="h-6 w-6 text-amber-500" />
//               </div>
//               <CardTitle>Grow Your Business</CardTitle>
//               <CardDescription>
//                 Reach new clients and expand your dance teaching business.
//               </CardDescription>
//             </CardHeader>
//           </Card>
          
//           <Card className="bg-gray-800 border-gray-700">
//             <CardHeader className="pb-2">
//               <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-3">
//                 <Clock4 className="h-6 w-6 text-pink-500" />
//               </div>
//               <CardTitle>Save Time</CardTitle>
//               <CardDescription>
//                 Our platform handles booking, scheduling, and payments for you.
//               </CardDescription>
//             </CardHeader>
//           </Card>
//         </div>
        
//         <div className="mt-12 text-center">
//           <Button 
//             onClick={() => navigate("/subscription")}
//             className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
//             size="lg"
//           >
//             Upgrade to Premium
//           </Button>
//           <p className="text-xs text-muted-foreground mt-2">
//             Premium members can send unlimited booking requests
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// "use client"

// import { useState } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { useAuth } from "@/hooks/use-auth"
// import { useLocation } from "wouter"
// import { useToast } from "@/hooks/use-toast"
// import BookingWizard from "@/components/connect/booking-wizard"

// // UI Components
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { BarChart4, CalendarClock, Clock4, DollarSign, Star, Users, Award } from "lucide-react"

// export default function ConnectPage() {
//   const { user } = useAuth()
//   const [activeTab, setActiveTab] = useState("book")
//   const [, navigate] = useLocation()
//   const { toast } = useToast()

//   // Get all instructors (professionals)
//   const { data: instructors = [], isLoading: isLoadingInstructors } = useQuery({
//     queryKey: ["/api/instructors"],
//   })

//   // Get user's bookings if authenticated
//   const { data: myBookings = [], isLoading: isLoadingBookings } = useQuery({
//     queryKey: ["/api/bookings/me"],
//     enabled: !!user,
//   })

//   // Set active tab and sync URL
//   const handleTabChange = (value: string) => {
//     setActiveTab(value)
//     navigate(`/connect?tab=${value}`, { replace: true })
//   }

//   // Handle completion of booking wizard
//   const handleWizardComplete = (data: any) => {
//     console.log("Wizard completed with data:", data)
//     if (activeTab === "book") {
//       toast({
//         title: "Booking Request Sent",
//         description: "Your booking request has been submitted successfully.",
//       })
//     } else {
//       toast({
//         title: "Professional Profile Updated",
//         description: "Your professional profile has been updated successfully.",
//       })
//     }
//   }

//   return (
//     <div className="min-h-screen">
//       {/* Hero Section with Booking Wizard */}
//       <div className="relative">
//         <Tabs defaultValue="book" value={activeTab} onValueChange={handleTabChange} className="relative z-20">
//           {/* Floating Tab Selector */}
//           <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30 mt-64">
//             <TabsList className="bg-black/40 backdrop-blur-lg border border-white/20 shadow-2xl mb-4">
//               <TabsTrigger
//                 value="book"
//                 className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-300"
//               >
//                 Book Professionals
//               </TabsTrigger>
//               <TabsTrigger
//                 value="get-booked"
//                 className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-300"
//               >
//                 Get Booked
//               </TabsTrigger>
//             </TabsList>
//           </div>

//           {/* Book Tab Content */}
//           <TabsContent value="book" className="mt-0">
//             <BookingWizard mode="book" onComplete={handleWizardComplete} user={user} />
//           </TabsContent>

//           {/* Get Booked Tab Content */}
//           <TabsContent value="get-booked" className="mt-0">
//             <BookingWizard mode="get-booked" onComplete={handleWizardComplete} user={user} />
//           </TabsContent>
//         </Tabs>
//       </div>

//       {/* Features Section */}
//       <div className="bg-gray-900 py-20">
//         <div className="container mx-auto px-4 max-w-7xl">
//           <div className="text-center max-w-3xl mx-auto mb-16">
//             <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Why Choose Our Platform?</h2>
//             <p className="text-lg text-gray-300 leading-relaxed">
//               Whether you're looking to expand your dance knowledge or share your expertise, our platform connects dance
//               enthusiasts and professionals worldwide with unmatched quality and convenience.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <CalendarClock className="h-8 w-8 text-blue-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Flexible Scheduling</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   Choose your own hours and manage your bookings on your terms. Complete control over your schedule.
//                 </CardDescription>
//               </CardHeader>
//             </Card>

//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <DollarSign className="h-8 w-8 text-green-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Set Your Rates</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   You decide how much to charge for your services and expertise. Transparent pricing, fair compensation.
//                 </CardDescription>
//               </CardHeader>
//             </Card>

//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <BarChart4 className="h-8 w-8 text-amber-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Grow Your Business</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   Reach new clients and expand your dance teaching business with our powerful marketing tools.
//                 </CardDescription>
//               </CardHeader>
//             </Card>

//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <Clock4 className="h-8 w-8 text-pink-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Save Time</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   Our platform handles booking, scheduling, and payments for you. Focus on what you do best.
//                 </CardDescription>
//               </CardHeader>
//             </Card>
//           </div>
//         </div>
//       </div>

//       {/* Stats Section */}
//       <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-16">
//         <div className="container mx-auto px-4 max-w-6xl">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
//             <div className="space-y-2">
//               <div className="flex items-center justify-center mb-4">
//                 <Users className="h-8 w-8 mr-3 text-[#00d4ff]" />
//                 <span className="text-4xl font-bold">1000+</span>
//               </div>
//               <h3 className="text-xl font-semibold">Active Professionals</h3>
//               <p className="text-gray-300">Verified dance instructors and experts</p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-center mb-4">
//                 <Star className="h-8 w-8 mr-3 text-[#00d4ff]" />
//                 <span className="text-4xl font-bold">4.9</span>
//               </div>
//               <h3 className="text-xl font-semibold">Average Rating</h3>
//               <p className="text-gray-300">Based on thousands of reviews</p>
//             </div>

//             <div className="space-y-2">
//               <div className="flex items-center justify-center mb-4">
//                 <Award className="h-8 w-8 mr-3 text-[#00d4ff]" />
//                 <span className="text-4xl font-bold">50K+</span>
//               </div>
//               <h3 className="text-xl font-semibold">Successful Bookings</h3>
//               <p className="text-gray-300">Lessons completed worldwide</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* CTA Section */}
//       <div className="bg-gray-900 py-20">
//         <div className="container mx-auto px-4 max-w-4xl text-center">
//           <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Ready to Get Started?</h2>
//           <p className="text-xl text-gray-300 mb-8 leading-relaxed">
//             Join thousands of dance professionals and students who trust our platform for their dance journey.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//             <Button
//               onClick={() => navigate("/subscription")}
//               className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 px-8 py-3 text-lg"
//               size="lg"
//             >
//               Upgrade to Premium
//             </Button>
//             <Button
//               variant="outline"
//               onClick={() => setActiveTab("book")}
//               className="px-8 py-3 text-lg border-gray-700 text-white hover:bg-gray-800"
//               size="lg"
//             >
//               Start Booking Now
//             </Button>
//           </div>

//           <p className="text-sm text-gray-400 mt-6">
//             Premium members get unlimited booking requests, priority support, and advanced features
//           </p>
//         </div>
//       </div>
//     </div>
//   )
// }




// "use client"

// import { useState } from "react"
// import { useQuery } from "@tanstack/react-query"
// import { useAuth } from "@/hooks/use-auth"
// import { useLocation } from "wouter"

// // UI Components
// import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Button } from "@/components/ui/button"
// import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
// import { BarChart4, CalendarClock, Clock4, DollarSign, Star, Users, Award, ArrowRight } from "lucide-react"

// export default function ConnectPage() {
//   const { user } = useAuth()
//   const [activeTab, setActiveTab] = useState("book")
//   const [, navigate] = useLocation()

//   // Get all instructors (professionals)
//   const { data: instructors = [], isLoading: isLoadingInstructors } = useQuery({
//     queryKey: ["/api/instructors"],
//   })

//   // Get user's bookings if authenticated
//   const { data: myBookings = [], isLoading: isLoadingBookings } = useQuery({
//     queryKey: ["/api/bookings/me"],
//     enabled: !!user,
//   })

//   // Handle tab change and navigation
//   const handleTabChange = (value: string) => {
//     setActiveTab(value)
//     if (value === "book") {
//       navigate("/connect/book")
//     } else {
//       navigate("/connect/get-booked")
//     }
//   }

//   return (
//     <div className="min-h-screen">
//       {/* Hero Section with Navigation */}
//       <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-20">
//         <div className="container mx-auto px-4 max-w-6xl text-center">
//           <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">Connect with Dance Professionals</h1>
//           <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
//             Whether you're looking to learn from the best or share your expertise, our platform connects dance
//             enthusiasts and professionals worldwide.
//           </p>

//           {/* Tab Selector for Navigation */}
//           <div className="flex justify-center mb-8">
//             <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
//               <TabsList className="bg-black/40 backdrop-blur-lg border border-white/20 shadow-2xl">
//                 <TabsTrigger
//                   value="book"
//                   className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-300"
//                 >
//                   Book Professionals
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="get-booked"
//                   className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-300"
//                 >
//                   Get Booked
//                 </TabsTrigger>
//               </TabsList>
//             </Tabs>
//           </div>

//           {/* Navigation Buttons */}
//           <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
//             <Button
//               onClick={() => navigate("/connect/book")}
//               className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg group"
//               size="lg"
//             >
//               Find Dance Professionals
//               <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
//             </Button>
//             <Button
//               onClick={() => navigate("/connect/get-booked")}
//               variant="outline"
//               className="px-8 py-4 text-lg border-white/20 text-white hover:bg-white/10 group"
//               size="lg"
//             >
//               Become a Professional
//               <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Features Section */}
//       <div className="bg-gray-900 py-20">
//         <div className="container mx-auto px-4 max-w-7xl">
//           <div className="text-center max-w-3xl mx-auto mb-16">
//             <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Why Choose Our Platform?</h2>
//             <p className="text-lg text-gray-300 leading-relaxed">
//               Whether you're looking to expand your dance knowledge or share your expertise, our platform connects dance
//               enthusiasts and professionals worldwide with unmatched quality and convenience.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <CalendarClock className="h-8 w-8 text-blue-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Flexible Scheduling</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   Choose your own hours and manage your bookings on your terms. Complete control over your schedule.
//                 </CardDescription>
//               </CardHeader>
//             </Card>

//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <DollarSign className="h-8 w-8 text-green-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Set Your Rates</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   You decide how much to charge for your services and expertise. Transparent pricing, fair compensation.
//                 </CardDescription>
//               </CardHeader>
//             </Card>

//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <BarChart4 className="h-8 w-8 text-amber-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Grow Your Business</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   Reach new clients and expand your dance teaching business with our powerful marketing tools.
//                 </CardDescription>
//               </CardHeader>
//             </Card>

//             <Card className="bg-gray-800 border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
//               <CardHeader className="pb-4">
//                 <div className="h-16 w-16 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
//                   <Clock4 className="h-8 w-8 text-pink-500" />
//                 </div>
//                 <CardTitle className="text-xl mb-2 text-white">Save Time</CardTitle>
//                 <CardDescription className="text-base leading-relaxed text-gray-300">
//                   Our platform handles booking, scheduling, and payments for you. Focus on what you do best.
//                 </CardDescription>
//               </CardHeader>
//             </Card>
//           </div>
//         </div>
//       </div>

     
//   )
// }


"use client"

import { useState } from "react"
import { useLocation } from "wouter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CalendarCheck,
  UserPlus,
  ArrowRight,
  Star,
  Users,
  Award,
  CheckCircle,
  TrendingUp,
  Clock,
  DollarSign,
  Globe,
  Shield,
} from "lucide-react"

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState("book")
  const [, navigate] = useLocation()

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{
            backgroundImage:
              "url('https://images.theconversation.com/files/430015/original/file-20211103-27-1gojlp9.jpg?ixlib=rb-4.1.0&q=20&auto=format&w=320&fit=clip&dpr=2&usm=12&cs=strip')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-8 pb-6 max-w-6xl">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              Professional Dance Platform
            </Badge>
            <h1 className="text-5xl md:text-5xl font-bold mb-4 text-white leading-tight">
              Connect with Dance
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Professionals
              </span>
            </h1>
            <p className="text-xl md:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light">
              The premier platform connecting passionate dancers with world-class instructors
            </p>
          </div>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-2 rounded-2xl">
                <TabsTrigger
                  value="book"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-gray-300 px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300"
                >
                  <CalendarCheck className="w-5 h-5 mr-2" />
                  Book Professionals
                </TabsTrigger>
                <TabsTrigger
                  value="get-booked"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-gray-300 px-8 py-4 text-lg font-medium rounded-xl transition-all duration-300"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Get Booked
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Book Professionals Tab */}
            <TabsContent value="book" className="mt-0">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-12">
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 mb-8">
                      <CalendarCheck className="w-10 h-10 text-blue-400" />
                    </div>
                    <h2 className="text-4xl md:text-3xl font-bold mb-6 text-white">
                      Find Your Perfect
                      <span className="block text-blue-400">Dance Instructor</span>
                    </h2>
                    <p className="text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light">
                      Connect with verified dance professionals worldwide. Filter by style, experience, and availability
                      to find the perfect instructor for your journey.
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Verified Professionals</h3>
                      <p className="text-gray-300">All instructors are background-checked and certified</p>
                    </div>
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Flexible Scheduling</h3>
                      <p className="text-gray-300">Book lessons that fit your busy lifestyle</p>
                    </div>
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Star className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Top Rated</h3>
                      <p className="text-gray-300">4.9+ average rating from thousands of students</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => navigate("/connect/book")}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-12 py-6 text-xl font-semibold rounded-2xl group shadow-2xl transition-all duration-300 hover:scale-105"
                      size="lg"
                    >
                      Start Your Dance Journey
                      <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Get Booked Tab */}
            <TabsContent value="get-booked" className="mt-0">
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-12">
                  <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 mb-8">
                      <UserPlus className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-4xl md:text-3xl font-bold mb-6 text-white">
                      Share Your Dance
                      <span className="block text-emerald-400">Expertise</span>
                    </h2>
                    <p className="text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto font-light">
                      Transform your passion into a thriving business. Join our community of elite dance professionals
                      and connect with students worldwide.
                    </p>
                  </div>

                  {/* Benefits Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Premium Earnings</h3>
                      <p className="text-gray-300">Earn $50-200+ per hour teaching what you love</p>
                    </div>
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Globe className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Global Reach</h3>
                      <p className="text-gray-300">Teach students from around the world online or in-person</p>
                    </div>
                    <div className="text-center group">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Grow Your Brand</h3>
                      <p className="text-gray-300">Build your reputation and expand your dance business</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => navigate("/connect/get-booked")}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-12 py-6 text-xl font-semibold rounded-2xl group shadow-2xl transition-all duration-300 hover:scale-105"
                      size="lg"
                    >
                      Become a Professional
                      <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Stats Section */}
        <div className="bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-sm py-20 border-t border-white/10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trusted by Thousands</h2>
              <p className="text-xl text-gray-300">Join our growing community of dance enthusiasts</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">1,000+</div>
                <h3 className="text-xl font-semibold text-white mb-2">Active Professionals</h3>
                <p className="text-gray-300">Verified dance instructors and experts worldwide</p>
              </div>
              <div className="group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">4.9★</div>
                <h3 className="text-xl font-semibold text-white mb-2">Average Rating</h3>
                <p className="text-gray-300">Based on thousands of verified reviews</p>
              </div>
              <div className="group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">50K+</div>
                <h3 className="text-xl font-semibold text-white mb-2">Successful Bookings</h3>
                <p className="text-gray-300">Dance lessons completed successfully</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="bg-gradient-to-br from-black/95 to-gray-900/95 py-24">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-4xl md:text-3xl font-bold mb-8 text-white">
              Ready to Transform Your
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Dance Journey?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-2xl mx-auto">
              Join thousands of dancers and professionals who trust our platform for exceptional dance experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
              <Button
                onClick={() => navigate("/subscription")}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-10 py-4 text-lg font-semibold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105"
                size="lg"
              >
                Upgrade to Premium
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/connect/book")}
                className="px-10 py-4 text-lg font-semibold border-2 border-white/20 text-white hover:bg-white/10 rounded-2xl transition-all duration-300 hover:scale-105"
                size="lg"
              >
                Start Booking Now
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Unlimited booking requests</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Priority support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Advanced features</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
