import { useState, useContext, useEffect } from "react";
import { useAuth, AuthContext } from "../hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Loader2, Check, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";

// Define form schemas for login only
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Add SubscriptionPlan type to match actual API response
interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  features: string[];
  priceMonthly: string; // API returns string, not number
  priceYearly: string;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  isPopular: boolean;
  isActive: boolean;
  isStandalone: boolean;
  planType: string;
  featureDetails: any;
  unlockedRoles: string[];
  tier: string;
  createdAt: string;
  updatedAt: string;
}

// Auth page with auth context
function AuthPageWithAuth() {
  // Safely access auth context with fallback
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const loginMutation = authContext?.loginMutation;
  const registerMutation = authContext?.registerMutation;

  // Get location and return URL parameters
  const [, setLocation] = useLocation();
  const [returnUrl, setReturnUrl] = useState<string>("/dashboard");
  const [connectMode, setConnectMode] = useState<string | null>(null);

  // Extract return URL from query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnToParam = searchParams.get("returnTo");
    const modeParam = searchParams.get("mode");

    if (returnToParam) {
      setReturnUrl(returnToParam);
    }

    if (modeParam) {
      setConnectMode(modeParam);
    }

    console.log("Auth returnTo:", returnToParam, "mode:", modeParam);
  }, []);

  const [activeTab, setActiveTab] = useState<string>("login");
  const [authError, setAuthError] = useState<any | null>(null);

  // Login form (keep react-hook-form for login)
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form - simple useState
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    subscription_plan: "free",
  });

  const [selectedPlan, setSelectedPlan] = useState<string>("free");

  // Form validation state for registration
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  // Handle form input changes
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  // Simple validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.username || form.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!form.password || form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!form.first_name) {
      errors.first_name = "First name is required";
    }

    if (!form.last_name) {
      errors.last_name = "Last name is required";
    }

    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Please enter a valid email";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Track mutation states to update the UI accordingly
  useEffect(() => {
    setAuthError(null);

    // Watchers for mutation errors
    const loginError = loginMutation?.error?.message;
    const registerError = registerMutation?.error?.message;

    // Display appropriate error based on the active tab
    if (activeTab === "login" && loginError) {
      setAuthError(loginError);
    } else if (activeTab === "register" && registerError) {
      setAuthError(registerError);
    }
  }, [loginMutation?.error, registerMutation?.error, activeTab]);

  // Clear errors when switching tabs
  useEffect(() => {
    setAuthError(null);
  }, [activeTab]);

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    // Clear any previous errors
    setAuthError(null);

    // Trim username and password to prevent spaces from causing authentication issues
    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
    };

    console.log("Login form submission:", trimmedData);

    // Use the mutation for login
    if (loginMutation) {
      loginMutation.mutate(trimmedData);
    } else {
      console.error("Login mutation is not available");
      setAuthError(
        "Authentication service is currently unavailable. Please try again later."
      );
    }
  };

  // Fetch subscription plans
  const {
    data: plans = [],
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const response = await apiClient.get(
        `https://api.livetestdomain.com/api/subscriptions/plans`,
        false
      );
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  const onRegisterSubmit = async (e: any) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Clear any previous errors and set loading
    setAuthError(null);
    setIsRegistering(true);

    try {
      // Step 1: Create user with exact payload structure that works
      const registrationPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        subscription_tier: form.subscription_plan.toUpperCase(),
      };

      console.log("Registration payload:", {
        ...registrationPayload,
        password: "***",
      });

      const registrationResponse = await apiRequest("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: registrationPayload,
        requireAuth: false,
      });

      console.log("User created successfully:", {
        user: registrationResponse.user,
        hasToken: !!registrationResponse.access_token,
      });

      // Step 2: Extract access token for subsequent calls
      const accessToken = registrationResponse.access_token;

      localStorage.setItem("token", accessToken);

      if (!accessToken) {
        throw new Error("No access token received from registration");
      }

      // Step 3: Check if we need to handle payment - DYNAMIC for any plan
      const selectedPlanData = plans.find((p) => p.slug === selectedPlan);

      if (!selectedPlanData) {
        throw new Error(`Selected plan not found: ${selectedPlan}`);
      }

      const planPrice = Number(selectedPlanData.priceMonthly);
      const isFreeplan = planPrice === 0 || selectedPlan === "free";

      console.log("Plan analysis:", {
        planSlug: selectedPlan,
        planName: selectedPlanData.name,
        tier: selectedPlanData.tier,
        priceMonthly: selectedPlanData.priceMonthly,
        parsedPrice: planPrice,
        isFreeplan: isFreeplan,
      });

      if (!isFreeplan) {
        console.log("Creating checkout session for plan:", selectedPlan);

        // Step 4: Create checkout session - works for ANY selected plan
        const selectedPlanData = plans.find((p) => p.slug === selectedPlan);

        if (!selectedPlanData) {
          throw new Error(`Selected plan not found: ${selectedPlan}`);
        }

        const checkoutRequest = {
          planSlug: selectedPlan.toUpperCase(), // e.g., "free", "nobility", "royal", "imperial"
          tier: selectedPlanData.tier, // e.g., "FREE", "NOBILITY", "ROYAL", "IMPERIAL"
          frequency: "MONTHLY" as const,
          email: form.email.trim(),
        };

        console.log("Dynamic checkout request for plan:", {
          selectedPlan,
          planName: selectedPlanData.name,
          tier: selectedPlanData.tier,
          price: selectedPlanData.priceMonthly,
        });

        console.log("Checkout request payload:", checkoutRequest);

        try {
          const checkoutUrl = await createCheckoutSessionWithToken(
            checkoutRequest,
            accessToken
          );
          console.log("Checkout URL received:", checkoutUrl);

          // Redirect to payment
          window.location.href = checkoutUrl;
        } catch (checkoutError: any) {
          console.error("Checkout failed:", checkoutError);
          // If checkout fails, show error but user is still created
          setAuthError(
            `Payment setup failed: ${checkoutError.message}. Account created successfully. You can upgrade later.`
          );
        }
      } else {
        console.log("Free plan selected, registration complete");
        // For free plan, redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setAuthError(
        err?.response?.data?.message || err?.message || "Registration failed"
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const createCheckoutSessionWithToken = async (
    request: {
      planSlug: string;
      tier?: string;
      frequency: "MONTHLY" | "YEARLY";
      email: string;
    },
    accessToken: string
  ) => {
    try {
      console.log("Making checkout request with token:", {
        endpoint: "/api/subscriptions/checkout",
        payload: request,
        hasToken: !!accessToken,
      });

      const response = await apiRequest("/api/subscriptions/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        data: request,
        requireAuth: false, // We're manually adding the auth header
      });

      console.log("Checkout response:", response);

      if (!response?.url) {
        throw new Error(
          response?.message ||
            "Failed to create checkout session - no URL returned"
        );
      }

      return response.url;
    } catch (error: any) {
      console.error("Detailed checkout error:", {
        error: error,
        response: error?.response,
        data: error?.response?.data,
        status: error?.response?.status,
      });

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Checkout service unavailable. Please try again later.";

      throw new Error(errorMessage);
    }
  };

  // Redirect if already authenticated
  if (user) {
    // If connecting, redirect back to connect page with mode parameter
    if (returnUrl.includes("/connect") && connectMode) {
      console.log(
        "User authenticated, redirecting to connect flow:",
        `${returnUrl}?mode=${connectMode}`
      );
      return <Redirect to={`${returnUrl}?mode=${connectMode}`} />;
    }

    // Prevent redirect if in registration workflow
    const isRegistrationFlow =
      returnUrl.includes("/registration-flow") ||
      returnUrl.includes("/register");

    // Only redirect if not in registration flow
    if (returnUrl && !isRegistrationFlow) {
      console.log("User authenticated, redirecting to:", returnUrl);
      return <Redirect to={returnUrl} />;
    }

    // If in registration flow, don't redirect - let the parent component handle the flow
    console.log("In registration flow, not redirecting");
    return null;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-dark text-white">
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row bg-black rounded-lg overflow-hidden shadow-xl">
            {/* Auth Forms */}
            <div className="lg:w-1/2 p-8">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
                      <p className="text-gray-400">
                        Sign in to access your courses and resources.
                      </p>
                    </div>

                    {authError && activeTab === "login" && (
                      <div
                        className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md relative mb-4"
                        role="alert"
                      >
                        <span className="block sm:inline">
                          {authError?.message}
                        </span>
                      </div>
                    )}

                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your username"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter your password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full"
                          disabled={loginMutation?.isPending}
                        >
                          {loginMutation?.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Login
                        </Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>

                <TabsContent value="register">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Create an Account
                      </h2>
                      <p className="text-gray-400">
                        Join DanceRealmX with a free membership plan. You can
                        upgrade anytime.
                      </p>
                    </div>

                    {authError && activeTab === "register" && (
                      <div
                        className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md relative mb-4"
                        role="alert"
                      >
                        <span className="block sm:inline">
                          {authError?.message}
                        </span>
                      </div>
                    )}

                    <form onSubmit={onRegisterSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            First Name
                          </label>
                          <Input
                            name="first_name"
                            placeholder="First name"
                            value={form.first_name}
                            onChange={handleChange}
                            className="mt-2"
                          />
                          {formErrors.first_name && (
                            <p className="text-sm font-medium text-destructive mt-1">
                              {formErrors.first_name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Last Name
                          </label>
                          <Input
                            name="last_name"
                            placeholder="Last name"
                            value={form.last_name}
                            onChange={handleChange}
                            className="mt-2"
                          />
                          {formErrors.last_name && (
                            <p className="text-sm font-medium text-destructive mt-1">
                              {formErrors.last_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Email
                        </label>
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email address"
                          value={form.email}
                          onChange={handleChange}
                          className="mt-2"
                        />
                        {formErrors.email && (
                          <p className="text-sm font-medium text-destructive mt-1">
                            {formErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Username
                        </label>
                        <Input
                          name="username"
                          placeholder="Choose a username"
                          value={form.username}
                          onChange={handleChange}
                          className="mt-2"
                        />
                        {formErrors.username && (
                          <p className="text-sm font-medium text-destructive mt-1">
                            {formErrors.username}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Password
                        </label>
                        <Input
                          name="password"
                          type="password"
                          placeholder="Create a password"
                          value={form.password}
                          onChange={handleChange}
                          className="mt-2"
                        />
                        {formErrors.password && (
                          <p className="text-sm font-medium text-destructive mt-1">
                            {formErrors.password}
                          </p>
                        )}
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-bold mb-2">
                          Choose a Plan
                        </h3>
                        {isLoadingPlans ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {plans.map((plan) => {
                              const isSelected = selectedPlan === plan.slug;
                              const isPopular = plan.isPopular;
                              return (
                                <Card
                                  key={plan.id}
                                  className={`relative flex flex-col justify-between cursor-pointer border-2 transition-all ${
                                    isSelected
                                      ? "border-blue-500 shadow-lg"
                                      : "border-gray-700"
                                  } ${isPopular ? "ring-2 ring-blue-400" : ""}`}
                                  onClick={() => {
                                    setSelectedPlan(plan.slug);
                                    setForm({
                                      ...form,
                                      subscription_plan: plan.slug,
                                    });
                                  }}
                                >
                                  {isPopular && (
                                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center">
                                      <Star className="h-3 w-3 mr-1" /> Most
                                      Popular
                                    </div>
                                  )}
                                  <CardHeader>
                                    <CardTitle className="text-xl">
                                      {plan.name}
                                    </CardTitle>
                                    <CardDescription>
                                      <span className="font-bold text-lg">
                                        ${Number(plan.priceMonthly).toFixed(2)}
                                      </span>{" "}
                                      per month
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    {plan.description && (
                                      <p className="text-sm text-gray-300 mb-2">
                                        {plan.description}
                                      </p>
                                    )}
                                    <ul className="space-y-1">
                                      {plan.features.map((feature, idx) => (
                                        <li
                                          key={idx}
                                          className="flex items-center"
                                        >
                                          <Check className="h-4 w-4 text-green-500 mr-2" />
                                          <span className="text-sm">
                                            {feature}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </CardContent>
                                  <CardFooter>
                                    <div
                                      className={`w-full text-center py-2 rounded ${isSelected ? "bg-blue-500 text-white" : "bg-gray-800 text-gray-300"}`}
                                    >
                                      {isSelected ? "Selected" : "Select Plan"}
                                    </div>
                                  </CardFooter>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full"
                        disabled={isRegistering}
                      >
                        {isRegistering ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Create Account
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Hero Section */}
            <div className="lg:w-1/2 bg-[#0A141E] p-8 flex flex-col justify-center h-screen max-h-screen sticky top-24">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold mb-4">DanceRealmX</h1>
                <h2 className="text-2xl font-semibold mb-6">
                  Where Every Step Counts
                </h2>
                <p className="mb-6 text-gray-300">
                  Join our vibrant community of dance enthusiasts, educators,
                  and professionals. Get access to premium courses, resources,
                  and certification programs.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center space-x-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#00d4ff]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Professional Dance Certification</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#00d4ff]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Exclusive Teaching Resources</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#00d4ff]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Connect with Industry Professionals</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main export component with auth wrapper
export default function AuthPage() {
  // Use the hook directly to ensure we get the latest auth state
  const { user, isLoading } = useAuth();

  // Get return URL from query parameters
  const [returnUrl, setReturnUrl] = useState<string>("/dashboard");
  const [connectMode, setConnectMode] = useState<string | null>(null);

  // Extract return URL from query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnToParam = searchParams.get("returnTo");
    const modeParam = searchParams.get("mode");

    if (returnToParam) {
      setReturnUrl(returnToParam);
    }

    if (modeParam) {
      setConnectMode(modeParam);
    }
  }, []);

  // If user is logged in, redirect to correct page
  if (user) {
    // If connecting, redirect back to connect page with mode parameter
    if (returnUrl.includes("/connect") && connectMode) {
      return <Redirect to={`${returnUrl}?mode=${connectMode}`} />;
    }

    // Prevent redirect if in registration workflow
    const isRegistrationFlow =
      returnUrl.includes("/registration-flow") ||
      returnUrl.includes("/register");

    // Only redirect if not in registration flow
    if (returnUrl && !isRegistrationFlow) {
      return <Redirect to={returnUrl} />;
    }

    return null;
  }

  // If auth is still loading, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-dark text-white">
        <main className="flex-grow py-16 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Verifying authentication...</h2>
          </div>
        </main>
      </div>
    );
  }

  // Otherwise, show the auth page
  return <AuthPageWithAuth />;
}
