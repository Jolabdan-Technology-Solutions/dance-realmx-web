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
import { Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { UserRole } from "@/constants/roles";

// Form schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  selectedRoles: z.array(z.string()).min(1, "Select at least one role"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Custom hook for URL parameters
const useUrlParams = () => {
  const [returnUrl, setReturnUrl] = useState("/dashboard");
  const [connectMode, setConnectMode] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnToParam = searchParams.get("returnTo");
    const modeParam = searchParams.get("mode");

    if (returnToParam) setReturnUrl(returnToParam);
    if (modeParam) setConnectMode(modeParam);
  }, []);

  return { returnUrl, connectMode };
};

// Custom hook for auth redirect logic
const useAuthRedirect = (
  user: any,
  returnUrl: string,
  connectMode: string | null
) => {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) return;

    // Check subscription status
    if (user.subscription_tier !== "FREE" && !user.is_active) {
      const subscriptionUrl = `/subscription?tier=${user.subscription_tier}`;
      navigate(subscriptionUrl);
      return;
    }

    // Handle connect mode
    if (returnUrl.includes("/connect") && connectMode) {
      navigate(`${returnUrl}?mode=${connectMode}`);
      return;
    }

    // Check if in registration flow
    const isRegistrationFlow =
      returnUrl.includes("/registration-flow") ||
      returnUrl.includes("/register");

    if (!isRegistrationFlow && returnUrl !== "/dashboard") {
      navigate(returnUrl);
      return;
    }

    // Default redirect
    navigate("/dashboard");
  }, [user, returnUrl, connectMode, navigate]);
};

// Main auth form component
function AuthForm() {
  const authContext = useContext(AuthContext);
  const { user, loginMutation, registerMutation } = authContext || {};
  const { returnUrl, connectMode } = useUrlParams();

  const [activeTab, setActiveTab] = useState("login");
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle redirects
  useAuthRedirect(user, returnUrl, connectMode);

  // Forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: "",
      selectedRoles: [],
    },
  });

  // Handle mutation errors
  useEffect(() => {
    setAuthError(null);

    const error =
      activeTab === "login"
        ? loginMutation?.error?.message
        : registerMutation?.error?.message;

    if (error) setAuthError(error);
  }, [loginMutation?.error, registerMutation?.error, activeTab]);

  // Clear errors when switching tabs
  useEffect(() => {
    setAuthError(null);
  }, [activeTab]);

  // Form handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    setAuthError(null);

    if (!loginMutation) {
      setAuthError("Authentication service is currently unavailable.");
      return;
    }

    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
    };

    loginMutation.mutate(trimmedData);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    setAuthError(null);

    if (!registerMutation) {
      setAuthError("Registration service is currently unavailable.");
      return;
    }

    const trimmedData = {
      username: data.username.trim(),
      password: data.password.trim(),
      email: data.email.trim(),
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      role: "STUDENT",
      profile_image_url: "",
      auth_provider: "local",
    };

    registerMutation.mutate(trimmedData);
  };

  // Google auth URL
  const googleAuthUrl = `/api/auth/google?returnTo=${encodeURIComponent(returnUrl)}${
    connectMode ? `&mode=${connectMode}` : ""
  }`;

  // If user is authenticated, handle redirect
  if (user) {
    const isRegistrationFlow =
      returnUrl.includes("/registration-flow") ||
      returnUrl.includes("/register");

    if (isRegistrationFlow) return null;

    if (returnUrl.includes("/connect") && connectMode) {
      return <Redirect to={`${returnUrl}?mode=${connectMode}`} />;
    }

    return <Redirect to={returnUrl} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-dark text-white">
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

                {/* Error Display */}
                {authError && (
                  <div className="bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-4">
                    {authError}
                  </div>
                )}

                {/* Login Tab */}
                <TabsContent value="login">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
                      <p className="text-gray-400">
                        Sign in to access your courses and resources.
                      </p>
                    </div>

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
                          {loginMutation?.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Login
                        </Button>
                      </form>
                    </Form>

                    <div className="flex items-center my-6">
                      <Separator className="flex-grow" />
                      <span className="mx-4 text-sm text-gray-400">OR</span>
                      <Separator className="flex-grow" />
                    </div>

                    <a href={googleAuthUrl} className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gray-700 hover:bg-gray-800 rounded-full"
                      >
                        <FcGoogle className="mr-2 h-5 w-5" />
                        Sign in with Google
                      </Button>
                    </a>
                  </div>
                </TabsContent>

                {/* Register Tab */}
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

                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="first_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="First name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={registerForm.control}
                            name="last_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Last name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="Email address"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Choose a username"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Create a password"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="selectedRoles"
                          render={() => (
                            <FormItem>
                              <div className="mb-2">
                                <FormLabel>I am registering as:</FormLabel>
                                <FormDescription className="text-gray-400 text-sm">
                                  Select all that apply. You can change this
                                  later.
                                </FormDescription>
                              </div>
                              <div className="space-y-2">
                                {Object.entries(UserRole).map(
                                  ([key, value]) => (
                                    <FormField
                                      key={key}
                                      control={registerForm.control}
                                      name="selectedRoles"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-700 p-3">
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(
                                                value as string
                                              )}
                                              onCheckedChange={(checked) => {
                                                const currentValue =
                                                  field.value || [];
                                                const newValue = checked
                                                  ? [...currentValue, value]
                                                  : currentValue.filter(
                                                      (val) => val !== value
                                                    );
                                                field.onChange(newValue);
                                              }}
                                            />
                                          </FormControl>
                                          <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-medium">
                                              {(value as string)
                                                .split("_")
                                                .map(
                                                  (word) =>
                                                    word
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                    word.slice(1)
                                                )
                                                .join(" ")}
                                            </FormLabel>
                                          </div>
                                        </FormItem>
                                      )}
                                    />
                                  )
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full"
                          disabled={registerMutation?.isPending}
                        >
                          {registerMutation?.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Create Account
                        </Button>
                      </form>
                    </Form>

                    <div className="flex items-center my-6">
                      <Separator className="flex-grow" />
                      <span className="mx-4 text-sm text-gray-400">OR</span>
                      <Separator className="flex-grow" />
                    </div>

                    <a href={googleAuthUrl} className="w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gray-700 hover:bg-gray-800 rounded-full"
                      >
                        <FcGoogle className="mr-2 h-5 w-5" />
                        Sign up with Google (Free Plan)
                      </Button>
                    </a>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Hero Section */}
            <div className="lg:w-1/2 bg-[#0A141E] p-8 flex flex-col justify-center">
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
                  {[
                    "Professional Dance Certification",
                    "Exclusive Teaching Resources",
                    "Connect with Industry Professionals",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <svg
                        className="h-5 w-5 text-[#00d4ff]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Loading component
function LoadingScreen() {
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

// Main component
export default function AuthPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return <AuthForm />;
}
