import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function SubscriptionUpgradeCancelPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Cancel Header */}
          <div className="text-center mb-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">
              Upgrade Cancelled
            </h1>
            <p className="text-gray-300 text-lg">
              Your subscription upgrade was cancelled. No charges were made.
            </p>
          </div>

          {/* Current Status */}
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">
                Your Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                Your current subscription remains active and unchanged. You can
                try upgrading again anytime.
              </p>
              <div className="bg-gray-700 p-4 rounded-lg">
                <p className="text-white font-semibold">Current Plan: Free</p>
                <p className="text-gray-400 text-sm">
                  You can upgrade to unlock premium features and content.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Why Upgrade */}
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">
                Why Consider Upgrading?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 rounded-full p-1 mt-1">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Premium Content Access
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Get access to exclusive courses, advanced tutorials, and
                      premium content.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 rounded-full p-1 mt-1">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Priority Support
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Receive faster response times and dedicated customer
                      support.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-500 rounded-full p-1 mt-1">
                    <RefreshCw className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">
                      Advanced Features
                    </h4>
                    <p className="text-gray-300 text-sm">
                      Unlock advanced analytics, progress tracking, and
                      personalized recommendations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/subscription/upgrade")}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Having trouble with the upgrade process?
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Contact our support team at{" "}
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
