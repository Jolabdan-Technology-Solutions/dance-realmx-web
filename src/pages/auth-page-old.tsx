import { useState } from "react";
import { useFirebaseAuth } from "../hooks/use-firebase-auth-new";
import { useLocation } from "wouter";
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
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

// Define form schemas
const loginSchema = z.object({
  usernameOrEmail: z.string().min(3, "Username or email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// SubscriptionPlan interface
interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  features: string[];
  priceMonthly: string;
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
  // Auth context
  const authContext = useContext(AuthContext);
  const user = authContext?.user || null;
  const loginMutation = authContext?.loginMutation;
  const registerMutation = authContext?.registerMutation;

  // Error handling
  const { parseError, getFieldError } = useErrorHandler();
  const [parsedError, setParsedError] = useState<any>(null);

  // Navigation state
  const [, setLocation] = useLocation();
  const [returnUrl, setReturnUrl] = useState<string>("/dashboard");
  const [connectMode, setConnectMode] = useState<string | null>(null);

  // Form state
  const [activeTab, setActiveTab] = useState<string>("login");
  const [authError, setAuthError] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("free");
  const [isRegistering, setIsRegistering] = useState(false);
  const [couponCode, setCouponCode] = useState<string>("");
  const [preSelectedPlan, setPreSelectedPlan] = useState<string>("");

  // Registration form state
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    subscription_plan: "free",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Extract URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnToParam = searchParams.get("returnTo") || searchParams.get("redirect");
    const modeParam = searchParams.get("mode");
    const couponParam = searchParams.get("coupon");
    const planParam = searchParams.get("plan");

    if (returnToParam) {
      setReturnUrl(returnToParam);
    }

    if (modeParam) {
      setConnectMode(modeParam);
    }

    // Handle coupon and plan parameters - set register tab as default
    if (couponParam || planParam) {
      setActiveTab("register");
      if (couponParam) {
        setCouponCode(couponParam);
      }
      if (planParam) {
        setPreSelectedPlan(planParam);
        setSelectedPlan(planParam);
        setForm(prev => ({ ...prev, subscription_plan: planParam }));
      }
    }
  }, []);

  // Handle auth errors
  useEffect(() => {
    const currentError = loginMutation?.error || registerMutation?.error;
    if (currentError !== authError) {
      setAuthError(currentError);
      if (currentError) {
        const parsed = parseError(currentError);
        setParsedError(parsed);
      } else {
        setParsedError(null);
      }
    }
  }, [loginMutation?.error, registerMutation?.error, authError, parseError]);

  // Clear errors when switching tabs
  useEffect(() => {
    setAuthError(null);
    setParsedError(null);
  }, [activeTab]);

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle registration form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  // Validate registration form
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

  // Login form submission
  const onLoginSubmit = (data: LoginFormValues) => {
    setAuthError(null);

    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
    };

    console.log("Login form submission:", trimmedData);

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
        `/api/subscriptions/plans`,
        false
      );
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create checkout session with token
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
        requireAuth: false,
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

  // Registration form submission
  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setAuthError(null);
    setIsRegistering(true);

    try {
      // Create user
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

      const accessToken = registrationResponse.access_token;
      localStorage.setItem("access_token", accessToken);

      if (!accessToken) {
        throw new Error("No access token received from registration");
      }

      // Handle payment if needed
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

        const checkoutRequest = {
          planSlug: selectedPlan.toUpperCase(),
          tier: selectedPlanData.tier,
          frequency: "MONTHLY" as const,
          email: form.email.trim(),
          couponCode: couponCode || undefined, // Include coupon if provided
        };

        console.log("Checkout request payload:", checkoutRequest);

        try {
          const checkoutUrl = await createCheckoutSessionWithToken(
            checkoutRequest,
            accessToken
          );
          console.log("Checkout URL received:", checkoutUrl);
          window.location.href = checkoutUrl;
        } catch (checkoutError: any) {
          console.error("Checkout failed:", checkoutError);
          setAuthError(
            `Payment setup failed: ${checkoutError.message}. Account created successfully. You can upgrade later.`
          );
        }
      } else {
        console.log("Free plan selected, registration complete");
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

  // Redirect if already authenticated
  if (user) {
    if (returnUrl.includes("/connect") && connectMode) {
      console.log(
        "User authenticated, redirecting to connect flow:",
        `${returnUrl}?mode=${connectMode}`
      );
      return <Redirect to={`${returnUrl}?mode=${connectMode}`} />;
    }

    const isRegistrationFlow =
      returnUrl.includes("/registration-flow") ||
      returnUrl.includes("/register");

    if (returnUrl && !isRegistrationFlow) {
      console.log("User authenticated, redirecting to:", returnUrl);
      return <Redirect to={returnUrl} />;
    }

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

                    {parsedError && activeTab === "login" && (
                      <ErrorDisplay
                        error={parsedError}
                        onRetry={() => {
                          setAuthError(null);
                          setParsedError(null);
                        }}
                        context="login"
                      />
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

                    {/* Coupon Display */}
                    {couponCode && (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4 text-green-400" />
                          <h3 className="font-semibold text-green-400">Coupon Applied!</h3>
                        </div>
                        <p className="text-green-300 text-sm mb-2">
                          Coupon Code: <span className="font-mono font-bold">{couponCode}</span>
                        </p>
                        <p className="text-green-300 text-sm">
                          🎉 Get 6 months FREE on the Nobility plan! Perfect for new users to try all premium features.
                        </p>
                        <p className="text-green-200 text-xs mt-1">
                          Complete your registration to activate this offer.
                        </p>
                      </div>
                    )}

                    {parsedError && activeTab === "register" && (
                      <ErrorDisplay
                        error={parsedError}
                        onRetry={() => {
                          setAuthError(null);
                          setParsedError(null);
                        }}
                        context="registration"
                      />
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
                          {(formErrors.first_name || getFieldError(parsedError, 'first_name')) && (
                            <p className="text-sm font-medium text-destructive mt-1">
                              {formErrors.first_name || getFieldError(parsedError, 'first_name')}
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
                          {(formErrors.last_name || getFieldError(parsedError, 'last_name')) && (
                            <p className="text-sm font-medium text-destructive mt-1">
                              {formErrors.last_name || getFieldError(parsedError, 'last_name')}
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
                        {(formErrors.email || getFieldError(parsedError, 'email')) && (
                          <p className="text-sm font-medium text-destructive mt-1">
                            {formErrors.email || getFieldError(parsedError, 'email')}
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
                        {(formErrors.username || getFieldError(parsedError, 'username')) && (
                          <p className="text-sm font-medium text-destructive mt-1">
                            {formErrors.username || getFieldError(parsedError, 'username')}
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
                        {(formErrors.password || getFieldError(parsedError, 'password')) && (
                          <p className="text-sm font-medium text-destructive mt-1">
                            {formErrors.password || getFieldError(parsedError, 'password')}
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
                              const isCouponPlan = couponCode && plan.slug === "nobility";
                              return (
                                <Card
                                  key={plan.id}
                                  className={`relative flex flex-col justify-between cursor-pointer border-2 transition-all ${
                                    isSelected
                                      ? "border-blue-500 shadow-lg"
                                      : "border-gray-700"
                                  } ${isPopular || isCouponPlan ? "ring-2 ring-blue-400" : ""}`}
                                  onClick={() => {
                                    setSelectedPlan(plan.slug);
                                    setForm({
                                      ...form,
                                      subscription_plan: plan.slug,
                                    });
                                  }}
                                >
                                  {isPopular && !isCouponPlan && (
                                    <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center">
                                      <Star className="h-3 w-3 mr-1" /> Most
                                      Popular
                                    </div>
                                  )}
                                  {isCouponPlan && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center">
                                      <Tag className="h-3 w-3 mr-1" /> 6 Months FREE!
                                    </div>
                                  )}
                                  <CardHeader>
                                    <CardTitle className="text-xl">
                                      {plan.name}
                                    </CardTitle>
                                    <CardDescription>
                                      {isCouponPlan ? (
                                        <>
                                          <div className="line-through text-gray-500">
                                            <span className="font-bold text-lg">
                                              ${Number(plan.priceMonthly).toFixed(2)}
                                            </span>{" "}
                                            per month
                                          </div>
                                          <div className="text-green-400 font-bold text-lg">
                                            FREE for 6 months!
                                          </div>
                                          <div className="text-gray-400 text-xs mt-1">
                                            Then ${Number(plan.priceMonthly).toFixed(2)}/month (cancel anytime)
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <span className="font-bold text-lg">
                                            ${Number(plan.priceMonthly).toFixed(2)}
                                          </span>{" "}
                                          per month
                                        </>
                                      )}
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
            <div className="lg:w-1/2">
              <HeroSlider />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Main export component with auth wrapper
export default function AuthPage() {
  const { user, isLoading } = useAuth();
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
    if (returnUrl.includes("/connect") && connectMode) {
      return <Redirect to={`${returnUrl}?mode=${connectMode}`} />;
    }

    const isRegistrationFlow =
      returnUrl.includes("/registration-flow") ||
      returnUrl.includes("/register");

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

  return <AuthPageWithAuth />;
}