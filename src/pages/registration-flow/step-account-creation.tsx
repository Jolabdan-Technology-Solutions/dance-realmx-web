import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { RegistrationData, AccountFormData } from "@/types/registration";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StepAccountCreationProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  onAccountCreated: (accountData: AccountFormData) => void;
}

export function StepAccountCreation({
  registrationData,
  updateRegistrationData,
  onAccountCreated,
}: StepAccountCreationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: "",
      password: "",
      first_name: "",
      last_name: "",
      email: "",
    },
  });

  const onSubmit = async (data: AccountFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Register user
      const registrationPayload = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim(),
        username: data.username.trim(),
        password: data.password.trim(),
        subscription_tier:
          registrationData.recommendedPlan?.tier?.toUpperCase() || "FREE",
      };
      const registrationResponse = await apiRequest("/api/register", {
        method: "POST",
        data: registrationPayload,
        requireAuth: false,
        headers: { "Content-Type": "application/json" },
      });
      const accessToken = registrationResponse.access_token;
      if (!accessToken)
        throw new Error("No access token received from registration");
      // 2. Payment logic
      const plan = registrationData.recommendedPlan;
      if (!plan) {
        setError("No plan selected.");
        setIsLoading(false);
        return;
      }
      const planPrice = Number(plan.priceMonthly || 0);
      const isFreeplan = planPrice === 0 || plan.slug === "free";
      if (!isFreeplan) {
        const checkoutRequest = {
          planSlug: plan.slug.toUpperCase(),
          tier: plan.tier,
          frequency: "MONTHLY",
          email: data.email.trim(),
        };
        // Create checkout session
        const checkoutResponse = await apiRequest(
          "/api/subscriptions/checkout",
          {
            method: "POST",
            data: checkoutRequest,
            requireAuth: false,
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!checkoutResponse?.url)
          throw new Error(checkoutResponse?.message || "No checkout URL");
        window.location.href = checkoutResponse.url;
      } else {
        // Free plan: registration complete
        updateRegistrationData({ accountData: data });
        onAccountCreated(data);
        toast({
          title: "Account Created",
          description: "Your account has been successfully created!",
        });
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Registration failed"
      );
      toast({
        title: "Registration Failed",
        description:
          err?.response?.data?.message || err?.message || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const plan = registrationData.recommendedPlan;
  const planDetails = plan
    ? {
        name: plan.name,
        price: `$${plan.priceMonthly}/month`,
        description: plan.description,
        features: plan.features,
      }
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">Create Your Account</h2>
          <p className="text-gray-400">
            Set up your profile to get started with DanceRealmX.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Choose a username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
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
            <div className="pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Registration Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </form>
        </Form>
      </div>
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3">Account Summary</h2>
          <p className="text-gray-400">
            Review your selected plan and features before continuing.
          </p>
        </div>
        {form.watch("first_name") && form.watch("last_name") && (
          <Card className="bg-gray-900 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#00d4ff] text-black text-lg">
                    {form.watch("first_name")?.charAt(0) || ""}
                    {form.watch("last_name")?.charAt(0) || ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {form.watch("first_name") || ""}{" "}
                    {form.watch("last_name") || ""}
                  </h3>
                  <p className="text-gray-400">
                    @{form.watch("username") || ""}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-400 w-20">Email:</span>
                  <span>{form.watch("email")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {planDetails && (
          <Card className="bg-gray-900 mb-6">
            <CardContent className="pt-6">
              <div className="mb-3">
                <h3 className="text-lg font-semibold">
                  Plan: {planDetails.name}
                </h3>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">{planDetails.description}</p>
                  <p className="text-lg font-bold">{planDetails.price}</p>
                </div>
              </div>
              <div className="border-t border-gray-700 pt-3 mt-3">
                <h4 className="font-medium mb-2">Included Features:</h4>
                <ul className="space-y-1">
                  {planDetails.features.map(
                    (feature: string, index: number) => (
                      <li key={index} className="text-sm text-gray-400">
                        • {feature}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
        <Alert variant="default" className="border-yellow-600 bg-yellow-950/50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">
            Payment Information
          </AlertTitle>
          <AlertDescription className="text-gray-400">
            On the next step, you'll need to complete payment to activate your
            account. You can customize your profile further after registration.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
