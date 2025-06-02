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
import { AuthWrapper } from "../lib/auth-wrapper";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { UserRoles } from "../../../shared/schema";

// Define form schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  selectedRoles: z.array(z.string()).min(1, "Select at least one role"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

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
  const [authError, setAuthError] = useState<string | null>(null);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      selectedRoles: [],
    },
  });

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

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Clear any previous errors
    setAuthError(null);

    if (registerMutation) {
      // Trim all fields to prevent whitespace issues
      const trimmedData = {
        username: data.username.trim(),
        password: data.password.trim(),
        email: data.email.trim(),
        role: "STUDENT", // Default role, adjust as needed
      };

      console.log("Register form submission:", {
        ...trimmedData,
        password: "***",
      });
      registerMutation.mutate(trimmedData);
    } else {
      console.error("Registration mutation is not available");
      setAuthError(
        "Registration service is currently unavailable. Please try again later."
      );
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

    // Otherwise redirect to the return URL or dashboard as fallback
    console.log("User authenticated, redirecting to:", returnUrl);
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
                        <span className="block sm:inline">{authError}</span>
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

                    <div className="my-6 flex items-center">
                      <Separator className="flex-grow" />
                      <span className="mx-4 text-sm text-gray-400">OR</span>
                      <Separator className="flex-grow" />
                    </div>

                    <a
                      href={`/api/auth/google?returnTo=${encodeURIComponent(returnUrl)}${connectMode ? `&mode=${connectMode}` : ""}`}
                      className="w-full"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gray-700 hover:bg-gray-800 rounded-full flex items-center justify-center"
                      >
                        <FcGoogle className="mr-2 h-5 w-5" />
                        Sign in with Google
                      </Button>
                    </a>
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
                        <span className="block sm:inline">{authError}</span>
                      </div>
                    )}

                    <Form {...registerForm}>
                      <form
                        onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
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
                            name="lastName"
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
                                {Object.entries(UserRoles).map(
                                  ([key, value]) => (
                                    <FormField
                                      key={key}
                                      control={registerForm.control}
                                      name="selectedRoles"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={key}
                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-700 p-3"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(
                                                  value
                                                )}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([
                                                        ...field.value,
                                                        value,
                                                      ])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (val) => val !== value
                                                        )
                                                      );
                                                }}
                                              />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                              <FormLabel className="text-sm font-medium">
                                                {/* Convert role name to title case for display */}
                                                {value
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
                                        );
                                      }}
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
                          {registerMutation?.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Create Account
                        </Button>
                      </form>
                    </Form>

                    <div className="my-6 flex items-center">
                      <Separator className="flex-grow" />
                      <span className="mx-4 text-sm text-gray-400">OR</span>
                      <Separator className="flex-grow" />
                    </div>

                    <a
                      href={`/api/auth/google?returnTo=${encodeURIComponent(returnUrl)}${connectMode ? `&mode=${connectMode}` : ""}`}
                      className="w-full"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gray-700 hover:bg-gray-800 rounded-full flex items-center justify-center"
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

    console.log("AuthPage main - returnTo:", returnToParam, "mode:", modeParam);
  }, []);

  console.log("AuthPage render - Current auth state:", { user, isLoading });

  // If user is logged in, redirect to correct page
  if (user) {
    console.log("User is authenticated, redirecting to:", returnUrl);

    // If connecting, redirect back to connect page with mode parameter
    if (returnUrl.includes("/connect") && connectMode) {
      console.log(
        "AuthPage main - redirecting to connect flow:",
        `${returnUrl}?mode=${connectMode}`
      );
      return <Redirect to={`${returnUrl}?mode=${connectMode}`} />;
    }

    // Otherwise redirect to the return URL or dashboard as fallback
    return <Redirect to={returnUrl} />;
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
