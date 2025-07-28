import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { api } from "@/lib/api";

export default function SubscriptionUpgradeSuccessPage() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (sessionId) {
      processUpgrade(sessionId);
    } else {
      setLoading(false);
    }
  }, []);

  const processUpgrade = async (sessionId: string) => {
    try {
      const response = await api.get(
        `/subscriptions/upgrade/success?session_id=${sessionId}`
      );
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error("Error processing upgrade:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Processing your upgrade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">
              Upgrade Successful!
            </h1>
            <p className="text-gray-300 text-lg">
              Your subscription has been upgraded successfully. Welcome to your
              new plan!
            </p>
          </div>

          {/* Subscription Details */}
          {subscription && (
            <Card className="bg-gray-800 border-gray-700 mb-8">
              <CardHeader>
                <CardTitle className="text-white">
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Plan</p>
                    <p className="text-white font-semibold">
                      {subscription.plan?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <p className="text-green-400 font-semibold">Active</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Start Date</p>
                    <p className="text-white">
                      {new Date(
                        subscription.current_period_start
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Next Billing</p>
                    <p className="text-white">
                      {new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">What's Next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 rounded-full p-1 mt-1">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Explore Premium Features
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Discover all the new features and content available with
                      your upgraded plan.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 rounded-full p-1 mt-1">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Access Premium Courses
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Browse and enroll in exclusive courses only available to
                      premium subscribers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 rounded-full p-1 mt-1">
                    <ArrowRight className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Priority Support
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Get faster response times and dedicated support for all
                      your questions.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/courses")}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              You'll receive a confirmation email shortly with your subscription
              details.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Need help? Contact our support team at{" "}
              <a
                href="mailto:support@dancerealm.com"
                className="text-blue-400 hover:underline"
              >
                support@dancerealm.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
