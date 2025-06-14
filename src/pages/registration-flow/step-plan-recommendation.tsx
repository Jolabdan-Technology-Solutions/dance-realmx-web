import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SubscriptionPlanOption, RegistrationData } from "@/types/registration";
import { api } from "@/lib/api";

interface StepPlanRecommendationProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
}

export function StepPlanRecommendation({
  registrationData,
  updateRegistrationData,
}: StepPlanRecommendationProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [hasChangedSelection, setHasChangedSelection] = useState(false);

  // Fetch available subscription plans
  const {
    data: plans,
    isLoading,
    error,
  } = useQuery<SubscriptionPlanOption[]>({
    queryKey: ["/api/subscriptions/plans"],
    queryFn: async () => {
      const response = await api.get("/api/subscriptions/plans");
      return response.data;
    },
  });

  // Calculate plan recommendations based on selected features
  useEffect(() => {
    if (
      !plans ||
      plans.length === 0 ||
      registrationData.selectedFeatures.length === 0
    )
      return;

    // Define feature-to-plan mappings based on the actual membership plan pricing
    const featureToMinimumPlanMap: Record<string, string> = {
      // Instructor features
      create_courses: "silver",
      issue_certificates: "gold",
      manage_students: "silver",
      create_quizzes: "silver",
      upload_videos: "silver",
      schedule_classes: "silver",

      // Student features - all basic features should be "free"
      enroll_courses: "free",
      earn_certificates: "free",
      track_progress: "free",
      book_sessions: "free",

      // Seller features
      sell_resources: "silver",
      resource_analytics: "silver",
      store_dashboard: "silver",
      resource_management: "gold",

      // Connect features
      connect_profile: "silver",
      connect_availability: "silver",
      connect_bookings: "silver",
      connect_messaging: "gold",
    };

    // Calculate the total feature categories selected
    const featureCategories = {
      student: 0,
      instructor: 0,
      seller: 0,
      connect: 0,
    };

    // Count selected features by category
    registrationData.selectedFeatures.forEach((featureId) => {
      // Student features
      if (
        [
          "enroll_courses",
          "earn_certificates",
          "track_progress",
          "book_sessions",
        ].includes(featureId)
      ) {
        featureCategories.student++;
      }
      // Instructor features
      if (
        [
          "create_courses",
          "issue_certificates",
          "manage_students",
          "create_quizzes",
          "upload_videos",
          "schedule_classes",
        ].includes(featureId)
      ) {
        featureCategories.instructor++;
      }
      // Seller features
      if (
        [
          "sell_resources",
          "resource_analytics",
          "store_dashboard",
          "resource_management",
        ].includes(featureId)
      ) {
        featureCategories.seller++;
      }
      // Connect features
      if (
        [
          "connect_profile",
          "connect_availability",
          "connect_bookings",
          "connect_messaging",
        ].includes(featureId)
      ) {
        featureCategories.connect++;
      }
    });

    // Calculate highest required plan level based on selected features
    let requiredPlanLevel = "free";

    // If any premium features are selected, recommend gold plan
    if (
      registrationData.selectedFeatures.some((feature) =>
        [
          "issue_certificates",
          "resource_management",
          "connect_messaging",
        ].includes(feature)
      )
    ) {
      requiredPlanLevel = "gold";
    }
    // If any silver features are selected, recommend silver plan
    else if (
      registrationData.selectedFeatures.some((feature) =>
        [
          "create_courses",
          "manage_students",
          "create_quizzes",
          "upload_videos",
          "schedule_classes",
          "sell_resources",
          "resource_analytics",
          "store_dashboard",
          "connect_profile",
          "connect_availability",
          "connect_bookings",
        ].includes(feature)
      )
    ) {
      requiredPlanLevel = "silver";
    }

    // Calculate how many features are matched by each plan
    const recommendedPlans = plans.map((plan) => {
      const featureCount = registrationData.selectedFeatures.reduce(
        (count, featureId) => {
          const minimumPlanForFeature =
            featureToMinimumPlanMap[featureId] || "free";

          // Calculate if this plan includes the feature
          const planCoversFeature =
            plan.slug === minimumPlanForFeature ||
            (plan.slug === "silver" && minimumPlanForFeature === "free") ||
            (plan.slug === "gold" &&
              ["free", "silver"].includes(minimumPlanForFeature)) ||
            (plan.slug === "platinum" &&
              ["free", "silver", "gold"].includes(minimumPlanForFeature));

          return planCoversFeature ? count + 1 : count;
        },
        0
      );

      // Check if this plan is the required minimum plan or higher
      const isRecommended =
        plan.slug === requiredPlanLevel ||
        (plan.slug === "silver" && requiredPlanLevel === "free") ||
        (plan.slug === "gold" &&
          ["free", "silver"].includes(requiredPlanLevel)) ||
        (plan.slug === "platinum" &&
          ["free", "silver", "gold"].includes(requiredPlanLevel));

      return {
        ...plan,
        isRecommended,
        matchedFeatures: featureCount,
      };
    });

    // If we haven't selected a plan yet or the user hasn't changed the selection,
    // auto-select the recommended plan
    if (!hasChangedSelection || !registrationData.recommendedPlan) {
      // Find the best recommended plan
      const bestPlan = recommendedPlans.find((plan) => plan.isRecommended);
      if (bestPlan) {
        updateRegistrationData({
          recommendedPlan: bestPlan,
          paymentMethod: billingCycle,
        });
      }
    }
  }, [
    plans,
    registrationData.selectedFeatures,
    updateRegistrationData,
    billingCycle,
    hasChangedSelection,
    registrationData.recommendedPlan,
  ]);

  const handlePlanSelection = (plan: SubscriptionPlanOption) => {
    setHasChangedSelection(true);
    updateRegistrationData({
      recommendedPlan: plan,
      paymentMethod: billingCycle,
    });
  };

  const handleBillingCycleChange = (cycle: "monthly" | "yearly") => {
    setBillingCycle(cycle);
    updateRegistrationData({
      paymentMethod: cycle,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error loading subscription plans</AlertTitle>
        <AlertDescription>
          There was a problem loading the available subscription plans. Please
          try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-3">
          Recommended Membership Plans
        </h2>
        <p className="text-gray-400">
          Based on the features you selected, we've recommended the best plan
          for you. You can also choose a different plan if you prefer.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-900 rounded-lg p-2 inline-flex">
          <Toggle
            variant="outline"
            pressed={billingCycle === "monthly"}
            onPressedChange={() => handleBillingCycleChange("monthly")}
            className={`rounded-r-none ${billingCycle === "monthly" ? "bg-[#00d4ff] text-black" : ""}`}
          >
            Monthly
          </Toggle>
          <Toggle
            variant="outline"
            pressed={billingCycle === "yearly"}
            onPressedChange={() => handleBillingCycleChange("yearly")}
            className={`rounded-l-none ${billingCycle === "yearly" ? "bg-[#00d4ff] text-black" : ""}`}
          >
            Yearly (Save 15%)
          </Toggle>
        </div>
      </div>

      <RadioGroup
        value={registrationData.recommendedPlan?.id.toString()}
        onValueChange={(value) => {
          const selectedPlan = plans?.find((p) => p.id.toString() === value);
          if (selectedPlan) {
            handlePlanSelection(selectedPlan);
          }
        }}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans?.map((plan) => (
            <div key={plan.id} className="relative">
              <RadioGroupItem
                value={plan.id.toString()}
                id={`plan-${plan.id}`}
                className="sr-only"
              />
              <Label htmlFor={`plan-${plan.id}`} className="cursor-pointer">
                <Card
                  className={`h-full border-2 transition-all hover:border-[#00d4ff] ${
                    registrationData.recommendedPlan?.id === plan.id
                      ? "border-[#00d4ff] bg-[#00d4ff]/10"
                      : "border-gray-800"
                  }`}
                >
                  {plan.isRecommended && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 right-4 bg-[#00d4ff] text-black"
                    >
                      Recommended
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="flex items-baseline">
                      <span className="text-2xl font-bold mr-1">
                        $
                        {billingCycle === "monthly"
                          ? plan.priceMonthly
                          : plan.priceYearly}
                      </span>
                      <span className="text-sm text-gray-400">
                        {billingCycle === "monthly" ? "/month" : "/year"}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-400 mb-4">
                      {plan.description}
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <Check className="h-4 w-4 text-[#00d4ff] mr-2 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.matchedFeatures !== undefined && (
                      <div className="mt-4 text-sm">
                        <span className="text-[#00d4ff] font-medium">
                          {plan.matchedFeatures} of{" "}
                          {registrationData.selectedFeatures.length}
                        </span>{" "}
                        selected features covered
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={
                        registrationData.recommendedPlan?.id === plan.id
                          ? "default"
                          : "outline"
                      }
                      className={`w-full ${
                        registrationData.recommendedPlan?.id === plan.id
                          ? "bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                          : ""
                      }`}
                      onClick={() => handlePlanSelection(plan)}
                    >
                      {registrationData.recommendedPlan?.id === plan.id
                        ? "Selected"
                        : "Select Plan"}
                    </Button>
                  </CardFooter>
                </Card>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
