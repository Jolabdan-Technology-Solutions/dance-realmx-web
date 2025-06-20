"use client"

import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import BookingWizard from "@/components/connect/booking-wizard"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLocation } from "wouter"

export default function BookProfessionalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [, navigate] = useLocation()

  const handleWizardComplete = (data: any) => {
    console.log("Booking wizard completed with data:", data)
    toast({
      title: "Booking Request Sent",
      description: "Your booking request has been submitted successfully.",
    })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" onClick={() => navigate("/connect")} className="text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Connect
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Book Dance Professionals</h1>
          <p className="text-lg text-gray-300 mt-2">
            Find and book experienced dance instructors for personalized lessons
          </p>
        </div>
      </div>

      {/* Booking Wizard */}
      <BookingWizard mode="book" onComplete={handleWizardComplete} user={user} />
    </div>
  )
}
