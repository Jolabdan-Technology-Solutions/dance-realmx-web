import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { StepFeatureSelection } from "./step-feature-selection";
import { StepPlanRecommendation } from "./step-plan-recommendation";
import { StepAccountCreation } from "./step-account-creation";
import { StepPayment } from "./step-payment";
import { StepConfirmation } from "./step-confirmation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Step, RegistrationData } from "@/types/registration";

export default function RegistrationFlow() {
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<Step>("features");
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    selectedFeatures: [],
    recommendedPlan: null,
    accountData: null,
    paymentCompleted: false,
  });
  
  const [, navigate] = useLocation();
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);
  
  const steps: { [key in Step]: { title: string, description: string } } = {
    features: {
      title: "Select Features",
      description: "Tell us what you need from DanceRealmX",
    },
    planRecommendation: {
      title: "Recommended Plans",
      description: "Plans that match your feature requirements",
    },
    accountCreation: {
      title: "Create Account",
      description: "Set up your DanceRealmX profile",
    },
    payment: {
      title: "Subscription Payment",
      description: "Complete your subscription payment",
    },
    confirmation: {
      title: "Registration Complete",
      description: "Welcome to DanceRealmX!",
    }
  };
  
  const stepProgress = {
    features: 20,
    planRecommendation: 40,
    accountCreation: 60,
    payment: 80,
    confirmation: 100
  };
  
  const nextStep = () => {
    if (step === "features") setStep("planRecommendation");
    else if (step === "planRecommendation") setStep("accountCreation");
    else if (step === "accountCreation") setStep("payment");
    else if (step === "payment") setStep("confirmation");
  };
  
  const prevStep = () => {
    if (step === "planRecommendation") setStep("features");
    else if (step === "accountCreation") setStep("planRecommendation");
    else if (step === "payment") setStep("accountCreation");
    else if (step === "confirmation") setStep("payment");
  };
  
  const updateRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
  };
  
  // Prevent accessing the page if already loading auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <Loader2 className="h-8 w-8 animate-spin text-[#00d4ff]" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="container max-w-[95%] mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{steps[step].title}</h1>
          <p className="text-gray-400">{steps[step].description}</p>
          <Progress value={stepProgress[step]} className="h-2 mt-4" />
        </div>
        
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className={step === "features" ? "text-[#00d4ff]" : ""}>
                <BreadcrumbLink onClick={() => step !== "features" && setStep("features")}>Features</BreadcrumbLink>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator />
              
              <BreadcrumbItem className={step === "planRecommendation" ? "text-[#00d4ff]" : ""}>
                <BreadcrumbLink 
                  onClick={() => registrationData.selectedFeatures.length > 0 && setStep("planRecommendation")}
                  className={registrationData.selectedFeatures.length === 0 ? "pointer-events-none opacity-50" : ""}
                >
                  Plans
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator />
              
              <BreadcrumbItem className={step === "accountCreation" ? "text-[#00d4ff]" : ""}>
                <BreadcrumbLink 
                  onClick={() => registrationData.recommendedPlan && setStep("accountCreation")} 
                  className={!registrationData.recommendedPlan ? "pointer-events-none opacity-50" : ""}
                >
                  Account
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator />
              
              <BreadcrumbItem className={step === "payment" ? "text-[#00d4ff]" : ""}>
                <BreadcrumbLink 
                  onClick={() => registrationData.accountData && setStep("payment")}
                  className={!registrationData.accountData ? "pointer-events-none opacity-50" : ""}
                >
                  Payment
                </BreadcrumbLink>
              </BreadcrumbItem>
              
              <BreadcrumbSeparator />
              
              <BreadcrumbItem className={step === "confirmation" ? "text-[#00d4ff]" : ""}>
                <BreadcrumbLink 
                  onClick={() => registrationData.paymentCompleted && setStep("confirmation")}
                  className={!registrationData.paymentCompleted ? "pointer-events-none opacity-50" : ""}
                >
                  Confirmation
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        <div className="bg-black rounded-lg p-8 shadow-xl">
          {step === "features" && (
            <StepFeatureSelection 
              registrationData={registrationData} 
              updateRegistrationData={updateRegistrationData} 
            />
          )}
          
          {step === "planRecommendation" && (
            <StepPlanRecommendation 
              registrationData={registrationData} 
              updateRegistrationData={updateRegistrationData} 
            />
          )}
          
          {step === "accountCreation" && (
            <StepAccountCreation 
              registrationData={registrationData} 
              updateRegistrationData={updateRegistrationData} 
            />
          )}
          
          {step === "payment" && (
            <StepPayment 
              registrationData={registrationData} 
              updateRegistrationData={updateRegistrationData} 
            />
          )}
          
          {step === "confirmation" && (
            <StepConfirmation 
              registrationData={registrationData} 
            />
          )}
          
          <div className="flex justify-between mt-8">
            {step !== "features" && step !== "confirmation" && (
              <Button 
                variant="outline" 
                onClick={prevStep} 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            
            {step === "features" && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/")} 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Return to Home
              </Button>
            )}
            
            {step !== "confirmation" && (
              <Button 
                onClick={nextStep} 
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 ml-auto flex items-center gap-2"
                disabled={
                  (step === "features" && registrationData.selectedFeatures.length === 0) ||
                  (step === "planRecommendation" && !registrationData.recommendedPlan) ||
                  (step === "accountCreation" && !registrationData.accountData) ||
                  (step === "payment" && !registrationData.paymentCompleted)
                }
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            
            {step === "confirmation" && (
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 ml-auto flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}