"use client"

import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import BookingWizard from "@/components/connect/booking-wizard"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useLocation } from "wouter"

export default function GetBookedPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [, navigate] = useLocation()

  const handleWizardComplete = (data: any) => {
    console.log("Get booked wizard completed with data:", data)
    toast({
      title: "Professional Profile Updated",
      description: "Your professional profile has been updated successfully.",
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
          <h1 className="text-3xl md:text-4xl font-bold text-white">Become a Dance Professional</h1>
          <p className="text-lg text-gray-300 mt-2">
            Set up your professional profile and start getting booked for dance lessons
          </p>
        </div>
      </div>

      {/* Get Booked Wizard */}
      <BookingWizard mode="get-booked" onComplete={handleWizardComplete} user={user} />
    </div>
  )
}
