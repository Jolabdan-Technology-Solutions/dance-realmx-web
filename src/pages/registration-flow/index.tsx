import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { StepFeatureSelection } from "./step-feature-selection";
import { StepPlanRecommendation } from "./step-plan-recommendation";
// import { StepAccountCreation } from "./step-account-creation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Step, RegistrationData, AccountFormData } from "@/types/registration";
import AuthPage from "../auth-page";

const STORAGE_KEY = 'dancerealmx_registration_data';

export default function RegistrationFlow() {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  
  // Get step from URL query params
  const getStepFromURL = (): Step | 'login' => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    const validSteps: (Step | 'login')[] = ['features', 'planRecommendation', 'accountCreation', 'login'];
    return validSteps.includes(stepParam as Step | 'login') ? (stepParam as Step | 'login') : 'features';
  };

  const [step, setStepState] = useState<Step | 'login'>(getStepFromURL());
  
  // Load data from localStorage
  const loadStoredData = (): RegistrationData => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored registration data:', error);
    }
    
    return {
      selectedFeatures: [],
      recommendedPlan: null,
      accountData: null,
      paymentCompleted: false,
    };
  };

  const [registrationData, setRegistrationDataState] = useState<RegistrationData>(loadStoredData());
  
  // Custom setStep function that updates both state and URL
  const setStep = (newStep: Step | 'login') => {
    setStepState(newStep);
    const params = new URLSearchParams(window.location.search);
    params.set('step', newStep);
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newURL);
  };


  // Custom setRegistrationData function that updates both state and localStorage
  const setRegistrationData = (data: RegistrationData | ((prev: RegistrationData) => RegistrationData)) => {
    const newData = typeof data === 'function' ? data(registrationData) : data;
    setRegistrationDataState(newData);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving registration data to localStorage:', error);
    }
  };

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newStep = getStepFromURL(); // <-- Fix: call getStepFromURL here
      setStepState(newStep);
    };
  
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync step with URL on component mount and location changes
  useEffect(() => {
    const urlStep = getStepFromURL();
    if (urlStep !== step) {
      setStepState(urlStep);
    }
  }, [location]);

  // After successful login, redirect to dashboard and clear stored data
  useEffect(() => {
    if (step === "login" && user && !isLoading) {
      console.log("Login successful, redirecting to dashboard");
      // Clear registration data after successful login
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing registration data:', error);
      }
      navigate("/dashboard");
    }
  }, [step, user, isLoading, navigate]);
  
  console.log(registrationData.selectedFeatures.length === 0)
  console.log(!registrationData.recommendedPlan)

  // Handle successful account creation
  const handleAccountCreated = (accountData: AccountFormData) => {
    console.log("Account created, advancing to login step");
    setRegistrationData(prev => ({ ...prev, accountData }));
    setStep("login");
  };
  
  const steps: { [key in Step | 'login']: { title: string, description: string } } = {
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
    login: {
      title: "Sign In",
      description: "Sign in to continue to your dashboard.",
    }
  };
  
  const stepProgress = {
    features: 25,
    planRecommendation: 50,
    accountCreation: 75,
    login: 100
  };
  
  const nextStep = () => {
    if (step === "features") setStep("planRecommendation");
    else if (step === "planRecommendation") setStep("accountCreation");
    else if (step === "accountCreation") {
      
      setStep("login");
    }
  };
  
  const prevStep = () => {
    if (step === "planRecommendation") setStep("features");
    else if (step === "accountCreation") setStep("planRecommendation");
  };
  
  // Wrapper to update registration data
  const updateRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({
      ...prev,
      ...data,
      selectedFeatures: data.selectedFeatures ?? prev.selectedFeatures ?? [],
      accountData: data.accountData ?? prev.accountData ?? {
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: '',
        selectedRoles: [],
      },
    }));
  };

  // Handle direct URL access - validate step based on completed data
  useEffect(() => {
    const validateStepAccess = () => {
      // Allow access to features step always
      if (step === 'features') return;
      
      // For plan recommendation, need selected features
      if (step === 'planRecommendation' && registrationData.selectedFeatures.length === 0) {
        setStep('features');
        return;
      }
      
      // For account creation, need recommended plan
      if (step === 'accountCreation' && !registrationData.recommendedPlan) {
        if (registrationData.selectedFeatures.length > 0) {
          setStep('planRecommendation');
        } else {
          setStep('features');
        }
        return;
      }
      
      // For login, need account data (or allow if coming from account creation)
      if (step === 'login' && !registrationData.accountData) {
        if (registrationData.recommendedPlan) {
          setStep('accountCreation');
        } else if (registrationData.selectedFeatures.length > 0) {
          setStep('planRecommendation');
        } else {
          setStep('features');
        }
        return;
      }
    };

    validateStepAccess();
  }, [step, registrationData]);
  
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
              onAccountCreated={handleAccountCreated}
            />
          )}

          {step === "login" && (
            <div>
              <AuthPage />
            </div>
          )}
          
          
<div className="flex justify-between mt-8">
  {step !== "features" && step !== "login" && (
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

  {/* Only show Next button for steps except accountCreation and login */}
  {step !== "login" && step !== "accountCreation" && (
    <Button
      onClick={nextStep}
      className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 ml-auto flex items-center gap-2"
      disabled={
        (step === "features" && registrationData.selectedFeatures.length === 0) ||
        (step === "planRecommendation" && !registrationData.recommendedPlan)
      }
    >
      Next <ArrowRight className="h-4 w-4" />
    </Button>
  )}
</div>
        </div>
      </div>
    </div>
  );
}