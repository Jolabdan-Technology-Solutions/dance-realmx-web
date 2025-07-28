import React from "react";
import { useLocation } from "wouter";
import SubscriptionUpgrade from "@/components/subscription/subscription-upgrade";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SubscriptionUpgradePage() {
  const [, navigate] = useLocation();

  const handleUpgradeComplete = () => {
    // Redirect to dashboard or subscription management page
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">
            Upgrade Your Subscription
          </h1>
          <p className="text-gray-300 text-lg">
            Choose a plan that fits your needs and unlock more features
          </p>
        </div>

        {/* Upgrade Component */}
        <SubscriptionUpgrade
          onUpgradeComplete={handleUpgradeComplete}
          showCurrentPlan={true}
        />

        {/* Additional Information */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-3">
              Why Upgrade?
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Access to premium courses</li>
              <li>• Priority customer support</li>
              <li>• Advanced analytics</li>
              <li>• Exclusive content</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-3">
              Flexible Billing
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Monthly or yearly plans</li>
              <li>• Cancel anytime</li>
              <li>• Prorated upgrades</li>
              <li>• Secure payments</li>
            </ul>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-white mb-3">
              Need Help?
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Contact support</li>
              <li>• FAQ section</li>
              <li>• Live chat available</li>
              <li>• Email assistance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
