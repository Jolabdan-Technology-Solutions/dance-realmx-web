import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { SubscriptionCanceled } from "./subscription-failed-page";

export default function SubscriptionSuccessPage() {
  const [match, params] = useRoute("/subscription/success");
  const [isUpdating, setIsUpdating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loginMutation, isLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Extract query parameters
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const planSlug = searchParams.get("plan");

  const canceled = searchParams.get("canceled");

  useEffect(() => {
    async function updateSubscription() {
      try {
        if (!sessionId) {
          setError("Missing session information");
          setIsUpdating(false);
          return;
        }

        if (user) {
          // Update the existing user's subscription
          const response = await apiRequest(
            `/api/subscriptions/${sessionId}/status`,
            {
              method: "PUT",
              data: {
                status: "ACTIVE",
              },
              requireAuth: true,
            }
          );

          if (response.status !== "ACTIVE") {
            throw new Error("Failed to update subscription");
          }

          toast({
            title: "Subscription Activated",
            description: "Your subscription has been successfully activated!",
          });
        } else {
          // For guests, just show success without updating anything
          // They'll be prompted to register/login via the button below
          toast({
            title: "Payment Successful",
            description:
              "Please create an account to activate your subscription",
          });
        }
      } catch (err) {
        console.error("Error updating subscription:", err);
        setError(
          "There was a problem activating your subscription. Please contact support."
        );
      } finally {
        setIsUpdating(false);
      }
    }

    updateSubscription();
  }, [sessionId, planSlug, user, toast]);

  // Redirect to registration with plan parameter if the user isn't logged in
  const handleRegistration = () => {
    if (planSlug) {
      navigate(`/auth?mode=register&tier=${planSlug}`);
    } else {
      navigate("/auth?mode=register");
    }
  };

  if (canceled) {
    return (
      <SubscriptionCanceled
        onRetry={() => {
          // Reset state and allow user to try again
          window.location.href = "/subscription";
        }}
        onGoBack={() => {
          window.location.href = "/subscription";
        }}
      />
    );
  }

  // Render a success message with appropriate actions
  return (
    <div className="flex items-center justify-center min-h-[70vh] bg-gray-900">
      <Card className="w-full max-w-md border-green-500 bg-gray-800 text-white">
        <CardHeader className="flex flex-col items-center">
          {isUpdating ? (
            <div className="mb-4 rounded-full bg-blue-500/20 p-3">
              <Loader2 className="h-10 w-10 animate-spin text-[#00d4ff]" />
            </div>
          ) : !error ? (
            <div className="mb-4 rounded-full bg-green-500/20 p-3">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          ) : (
            <div className="mb-4 rounded-full bg-red-500/20 p-3">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          )}

          <CardTitle className="text-2xl text-center flex items-center justify-center">
            {isUpdating
              ? "Processing Subscription..."
              : error
                ? "Subscription Failed!"
                : "Subscription Confirmed!"}
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            {isUpdating
              ? "Processing your subscription..."
              : user
                ? "Your subscription has been activated"
                : "Your payment was successful"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isUpdating ? (
            <div className="flex justify-center my-6">
              <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <p className="text-red-400">{error}</p>
              <Button
                onClick={() => navigate("/subscription")}
                variant="outline"
                className="w-full"
              >
                Return to Subscription Page
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading && (
                <div className="flex justify-center my-6">
                  <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
                </div>
              )}

              {!isLoading &&
                (user ? (
                  <>
                    <p className="text-center">
                      Thank you for your subscription! You now have access to
                      {planSlug && (
                        <span className="font-semibold"> {planSlug} </span>
                      )}{" "}
                      features.
                    </p>
                    <Button
                      onClick={() => navigate("/dashboard")}
                      className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                    >
                      Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-center">
                      To complete your subscription, please create an account or
                      log in.
                    </p>
                    <Button
                      onClick={handleRegistration}
                      className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                    >
                      Create Account
                    </Button>
                    <Button
                      onClick={() => navigate("/auth?mode=login")}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      Log In
                    </Button>
                  </>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
