import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  XCircle,
  ArrowLeft,
  ShoppingCart,
  Home,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CancelPaymentPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useState(new URLSearchParams(window.location.search));

  // Extract information from URL parameters
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");
  const reason = searchParams.get("reason");
  const plan = searchParams.get("plan");
  const resourceId = searchParams.get("resource_id");
  const courseId = searchParams.get("course_id");

  // Determine what type of payment was cancelled
  const getPaymentType = () => {
    if (plan) return "subscription";
    if (resourceId) return "resource";
    if (courseId) return "course";
    return "general";
  };

  const paymentType = getPaymentType();

  // Get appropriate messages based on payment type
  const getMessages = () => {
    switch (paymentType) {
      case "subscription":
        return {
          title: "Subscription Cancelled",
          description: "Your subscription payment was cancelled.",
          details:
            "No charges were made to your account. You can try subscribing again whenever you're ready.",
        };
      case "resource":
        return {
          title: "Resource Purchase Cancelled",
          description: "Your resource purchase was cancelled.",
          details:
            "No charges were made to your account. You can try purchasing this resource again.",
        };
      case "course":
        return {
          title: "Course Enrollment Cancelled",
          description: "Your course enrollment was cancelled.",
          details:
            "No charges were made to your account. You can try enrolling again.",
        };
      default:
        return {
          title: "Payment Cancelled",
          description: "Your payment was cancelled.",
          details:
            "No charges were made to your account. You can try again whenever you're ready.",
        };
    }
  };

  const messages = getMessages();

  // Handle retry payment
  const handleRetryPayment = () => {
    switch (paymentType) {
      case "subscription":
        navigate(`/subscription?plan=${plan}`);
        break;
      case "resource":
        navigate(`/curriculum/${resourceId}`);
        break;
      case "course":
        navigate(`/courses/${courseId}`);
        break;
      default:
        navigate("/curriculum");
    }
  };

  // Handle return to cart
  const handleReturnToCart = () => {
    navigate("/cart");
  };

  // Handle return home
  const handleReturnHome = () => {
    navigate("/");
  };

  // Handle return to curriculum
  const handleReturnToCurriculum = () => {
    navigate("/curriculum");
  };

  // Show toast notification on mount
  useEffect(() => {
    toast({
      title: "Payment Cancelled",
      description:
        "Your payment was cancelled successfully. No charges were made.",
      variant: "default",
    });
  }, [toast]);

  return (
    <div className=" bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-red-100 p-3">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">
            {messages.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {messages.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Cancellation Details */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {messages.details}
            </AlertDescription>
          </Alert>

          {/* Additional Information */}
          {(orderId || sessionId || reason) && (
            <div className="text-sm text-gray-500 space-y-1">
              {orderId && <p>Order ID: {orderId}</p>}
              {sessionId && <p>Session ID: {sessionId}</p>}
              {reason && <p>Reason: {reason}</p>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Retry Payment Button */}
            <Button
              onClick={handleRetryPayment}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            {/* Return to Cart Button */}
            {paymentType !== "subscription" && (
              <Button
                onClick={handleReturnToCart}
                variant="outline"
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Return to Cart
              </Button>
            )}

            {/* Return to Curriculum Button */}
            {paymentType === "resource" && (
              <Button
                onClick={handleReturnToCurriculum}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Browse More Resources
              </Button>
            )}

            {/* Return Home Button */}
            <Button
              onClick={handleReturnHome}
              variant="ghost"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </div>

          {/* Help Section */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@dancerealmx.com"
                className="text-blue-600 hover:underline"
              >
                support@dancerealmx.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
