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
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { USER_ROLES } from "@shared/schema";
import { RegistrationData, AccountFormData } from "@/types/registration";

interface StepAccountCreationProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
}

export function StepAccountCreation({ registrationData, updateRegistrationData }: StepAccountCreationProps) {
  // Create form schema based on the selected features and plan
  const accountSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    selectedRoles: z.array(z.string()).min(1, "Select at least one role"),
  });
  
  // Determine default roles based on selected features
  const determineDefaultRoles = (): string[] => {
    const roles = new Set<string>();
    
    // Map features to relevant roles
    registrationData.selectedFeatures.forEach(feature => {
      if (feature.startsWith('create_') || feature.includes('instructor') || feature.includes('class')) {
        roles.add(USER_ROLES.INSTRUCTOR);
      }
      
      if (feature.includes('enroll') || feature.includes('student') || feature.includes('track_progress')) {
        roles.add(USER_ROLES.STUDENT);
      }
      
      if (feature.includes('sell') || feature.includes('store') || feature.includes('resource')) {
        roles.add(USER_ROLES.SELLER);
      }
      
      if (feature.includes('curriculum')) {
        roles.add(USER_ROLES.CURRICULUM_OFFICER);
      }
    });
    
    // If no roles detected, default to student
    if (roles.size === 0) {
      roles.add(USER_ROLES.STUDENT);
    }
    
    return Array.from(roles);
  };
  
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      selectedRoles: determineDefaultRoles(),
    },
  });
  
  // When form values change, update the registration data
  const onSubmit = (data: AccountFormData) => {
    updateRegistrationData({
      accountData: data
    });
  };
  
  // Construct human-readable plan details
  const getPlanDescription = () => {
    if (!registrationData.recommendedPlan) return null;
    
    const plan = registrationData.recommendedPlan;
    const price = registrationData.paymentMethod === "monthly" ? plan.priceMonthly : plan.priceYearly;
    const period = registrationData.paymentMethod === "monthly" ? "month" : "year";
    
    return {
      name: plan.name,
      price: `$${price}/${period}`,
      description: plan.description,
      features: plan.features
    };
  };
  
  const planDetails = getPlanDescription();
  
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
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            onChange={() => form.handleSubmit(onSubmit)()}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Email address" {...field} />
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
                    <Input type="password" placeholder="Create a password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="selectedRoles"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>I am registering as:</FormLabel>
                    <FormDescription className="text-gray-400 text-sm">
                      Select all that apply. You can change this later.
                    </FormDescription>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(USER_ROLES)
                      // Don't show admin as an option
                      .filter(([key]) => key !== "ADMIN")
                      .map(([key, value]) => (
                        <FormField
                          key={key}
                          control={form.control}
                          name="selectedRoles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={key}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-700 p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(value)}
                                    onCheckedChange={(checked) => {
                                      const updatedRoles = checked
                                        ? [...field.value, value]
                                        : field.value.filter((role) => role !== value);
                                      
                                      field.onChange(updatedRoles);
                                      form.handleSubmit(onSubmit)();
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer font-normal">
                                  {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
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
        
        {/* Account Preview Card */}
        {form.watch('firstName') && form.watch('lastName') && (
          <Card className="bg-gray-900 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#00d4ff] text-black text-lg">
                    {form.watch('firstName').charAt(0)}{form.watch('lastName').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {form.watch('firstName')} {form.watch('lastName')}
                  </h3>
                  <p className="text-gray-400">@{form.watch('username')}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-400 w-20">Email:</span>
                  <span>{form.watch('email')}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-400 w-20">Roles:</span>
                  <div className="flex flex-wrap gap-2">
                    {form.watch('selectedRoles').map(role => (
                      <span 
                        key={role} 
                        className="bg-gray-800 px-2 py-1 rounded-md text-sm"
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ').toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Plan Summary */}
        {planDetails && (
          <Card className="bg-gray-900 mb-6">
            <CardContent className="pt-6">
              <div className="mb-3">
                <h3 className="text-lg font-semibold">Plan: {planDetails.name}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">{planDetails.description}</p>
                  <p className="text-lg font-bold">{planDetails.price}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-3 mt-3">
                <h4 className="font-medium mb-2">Included Features:</h4>
                <ul className="space-y-1">
                  {planDetails.features.map((feature, index) => (
                    <li key={index} className="text-sm text-gray-400">• {feature}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Payment Warning */}
        <Alert variant="outline" className="border-yellow-600 bg-yellow-950/50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-600">Payment Information</AlertTitle>
          <AlertDescription className="text-gray-400">
            On the next step, you'll need to complete payment to activate your account. You can customize your profile further after registration.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}