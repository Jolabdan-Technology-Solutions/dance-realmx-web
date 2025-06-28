// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
//   FormDescription,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Card, CardContent } from "@/components/ui/card";
// import { AlertTriangle, Loader2 } from "lucide-react";
// import { UserRole } from "@/types/user";
// import { RegistrationData, AccountFormData } from "@/types/registration";
// import { useToast } from "@/hooks/use-toast";

// interface StepAccountCreationProps {
//   registrationData: RegistrationData;
//   updateRegistrationData: (data: Partial<RegistrationData>) => void;
//   onAccountCreated: (accountData: AccountFormData) => void;
// }

// export function StepAccountCreation({
//   registrationData,
//   updateRegistrationData,
//   onAccountCreated,
// }: StepAccountCreationProps) {
//   const { toast } = useToast();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Create form schema
//   const accountSchema = z.object({
//     username: z.string().min(3, "Username must be at least 3 characters"),
//     password: z.string().min(6, "Password must be at least 6 characters"),
//     first_name: z.string().min(1, "First name is required"),
//     last_name: z.string().min(1, "Last name is required"),
//     email: z.string().email("Please enter a valid email"),
//     selected_roles: z.array(z.string()).min(1, "Select at least one role"),
//     subscription_tier: z.string().optional(),
//   });

//   // Determine default roles based on selected features
//   const determineDefaultRoles = (): string[] => {
//     const roles = new Set<string>();

//     // Map features to relevant roles
//     registrationData.selectedFeatures.forEach((feature) => {
//       if (
//         feature.startsWith("create_") ||
//         feature.includes("instructor") ||
//         feature.includes("class")
//       ) {
//         roles.add(UserRole.INSTRUCTOR_ADMIN);
//       }

//       if (
//         feature.includes("enroll") ||
//         feature.includes("student") ||
//         feature.includes("track_progress")
//       ) {
//         roles.add(UserRole.STUDENT);
//       }

//       if (
//         feature.includes("sell") ||
//         feature.includes("store") ||
//         feature.includes("resource")
//       ) {
//         roles.add(UserRole.CURRICULUM_ADMIN);
//       }

//       if (feature.includes("curriculum")) {
//         roles.add(UserRole.CURRICULUM_ADMIN);
//       }
//     });

//     // If no roles detected, default to student
//     if (roles.size === 0) {
//       roles.add(UserRole.STUDENT);
//     }

//     return Array.from(roles);
//   };

//   const form = useForm<AccountFormData>({
//     resolver: zodResolver(accountSchema),
//     defaultValues: {
//       username: "",
//       password: "",
//       first_name: "",
//       last_name: "",
//       email: "",
//       selected_roles: determineDefaultRoles(),
//     },
//   });

//   // Handle form submission
//   const onSubmit = async (data: AccountFormData) => {
//     setIsLoading(true);
//     setError(null);

//     try {
//       // Create registration payload
//       const payload = {
//         username: data.username,
//         password: data.password,
//         email: data.email,
//         first_name: data.first_name,
//         last_name: data.last_name,
//         frequency: registrationData?.paymentMethod?.toUpperCase() || null,
//         role: data.selected_roles.map((role) => {
//           // Map the roles to match the backend enum values
//           switch (role) {
//             case "INSTRUCTOR":
//               return "INSTRUCTOR_ADMIN";
//             case "SELLER":
//               return "CURRICULUM_SELLER";
//             case "CURRICULUM_OFFICER":
//               return "CURRICULUM_ADMIN";
//             default:
//               return role;
//           }
//         }),
//         subscription_tier: registrationData.recommendedPlan?.tier || null,
//       };

//       console.log("Submitting registration payload:", payload);

//       const response = await fetch(
//         "https://api.livetestdomain.com/api/register",
//         {
//           method: "POST",
//           // headers: { "Content-Type": "application/json" },
//           headers: {
//             "Content-Type": "application/json",
//             // "Authorization": `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || "Registration failed");
//       }

//       // Update registration data and proceed to next step
//       updateRegistrationData({ accountData: data });
//       onAccountCreated(data);

//       toast({
//         title: "Account Created",
//         description: "Your account has been successfully created!",
//       });

//       localStorage.removeItem("registrationData");
//       localStorage.removeItem("dancerealmx_registration_data");
//     } catch (error: any) {
//       console.error("Registration error:", error);
//       setError(error.message || "Failed to create account. Please try again.");
//       toast({
//         title: "Registration Failed",
//         description:
//           error.message || "Failed to create account. Please try again.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Construct human-readable plan details
//   const getPlanDescription = () => {
//     if (!registrationData.recommendedPlan) return null;

//     const plan = registrationData.recommendedPlan;
//     const price = plan.priceMonthly;
//     const period = "month";

//     return {
//       name: plan.name,
//       price: `$${price}/${period}`,
//       description: plan.description,
//       features: plan.features,
//     };
//   };

//   const planDetails = getPlanDescription();

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//       <div>
//         <div className="mb-6">
//           <h2 className="text-2xl font-bold mb-3">Create Your Account</h2>
//           <p className="text-gray-400">
//             Set up your profile to get started with DanceRealmX.
//           </p>
//         </div>

//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//             <div className="grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="first_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>First Name</FormLabel>
//                     <FormControl>
//                       <Input placeholder="First name" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="last_name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Last Name</FormLabel>
//                     <FormControl>
//                       <Input placeholder="Last name" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>

//             <FormField
//               control={form.control}
//               name="email"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Email</FormLabel>
//                   <FormControl>
//                     <Input
//                       type="email"
//                       placeholder="Email address"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="username"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Username</FormLabel>
//                   <FormControl>
//                     <Input placeholder="Choose a username" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="password"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Password</FormLabel>
//                   <FormControl>
//                     <Input
//                       type="password"
//                       placeholder="Create a password"
//                       {...field}
//                     />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />


//             {/* Submit button inside the form */}
//             <div className="pt-4">
//               <Button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full bg-[#00d4ff] hover:bg-[#00d4ff]/90 text-black font-semibold"
//               >
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     Creating Account...
//                   </>
//                 ) : (
//                   "Create Account"
//                 )}
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </div>

//       <div>
//         <div className="mb-6">
//           <h2 className="text-2xl font-bold mb-3">Account Summary</h2>
//           <p className="text-gray-400">
//             Review your selected plan and features before continuing.
//           </p>
//         </div>

//         {/* Account Preview Card */}
//         {form.watch("first_name") && form.watch("last_name") && (
//           <Card className="bg-gray-900 mb-6">
//             <CardContent className="pt-6">
//               <div className="flex items-center space-x-4 mb-4">
//                 <Avatar className="h-16 w-16">
//                   <AvatarFallback className="bg-[#00d4ff] text-black text-lg">
//                     {form.watch("first_name")?.charAt(0) || ""}
//                     {form.watch("last_name")?.charAt(0) || ""}
//                   </AvatarFallback>
//                 </Avatar>
//                 <div>
//                   <h3 className="text-xl font-semibold">
//                     {form.watch("first_name") || ""}{" "}
//                     {form.watch("last_name") || ""}
//                   </h3>
//                   <p className="text-gray-400">
//                     @{form.watch("username") || ""}
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <div className="flex items-center">
//                   <span className="text-gray-400 w-20">Email:</span>
//                   <span>{form.watch("email")}</span>
//                 </div>
//                 <div className="flex items-start">
//                   <span className="text-gray-400 w-20">Roles:</span>
//                   <div className="flex flex-wrap gap-2">
//                     {form.watch("selected_roles").map((role) => (
//                       <span
//                         key={role}
//                         className="bg-gray-800 px-2 py-1 rounded-md text-sm"
//                       >
//                         {role.charAt(0).toUpperCase() +
//                           role.slice(1).replace("_", " ").toLowerCase()}
//                       </span>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Plan Summary */}
//         {planDetails && (
//           <Card className="bg-gray-900 mb-6">
//             <CardContent className="pt-6">
//               <div className="mb-3">
//                 <h3 className="text-lg font-semibold">
//                   Plan: {planDetails.name}
//                 </h3>
//                 <div className="flex justify-between items-center">
//                   <p className="text-gray-400">{planDetails.description}</p>
//                   <p className="text-lg font-bold">{planDetails.price}</p>
//                 </div>
//               </div>

//               <div className="border-t border-gray-700 pt-3 mt-3">
//                 <h4 className="font-medium mb-2">Included Features:</h4>
//                 <ul className="space-y-1">
//                   {planDetails.features.map((feature, index) => (
//                     <li key={index} className="text-sm text-gray-400">
//                       • {feature}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Payment Warning */}
//         <Alert variant="default" className="border-yellow-600 bg-yellow-950/50">
//           <AlertTriangle className="h-4 w-4 text-yellow-600" />
//           <AlertTitle className="text-yellow-600">
//             Payment Information
//           </AlertTitle>
//           <AlertDescription className="text-gray-400">
//             On the next step, you'll need to complete payment to activate your
//             account. You can customize your profile further after registration.
//           </AlertDescription>
//         </Alert>
//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import axios from 'axios';

const plans = [
  { name: 'Free', slug: 'free', price: 0 },
  { name: 'Royalty', slug: 'royalty', price: 20 },
  { name: 'Imperial', slug: 'imperial', price: 50 },
];

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    planSlug: 'free',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('register'); // or 'payment' or 'success'
  const [jwt, setJwt] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePlanChange = slug => {
    setForm({ ...form, planSlug: slug });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Register user
      const res = await axios.post('/auth/register', form);
      setJwt(res.data.access_token);
      
      // 2. If free plan, done!
      const selectedPlan = plans.find(p => p.slug === form.planSlug);
      if (!selectedPlan || selectedPlan.price === 0) {
        setStep('success');
        return;
      }
      
      // 3. If paid plan, initiate payment
      const paymentRes = await axios.post(
        '/payments/checkout',
        { planSlug: form.planSlug },
        { headers: { Authorization: `Bearer ${res.data.access_token}` } }
      );
      setPaymentUrl(paymentRes.data.paymentUrl);
      setStep('payment');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Payment redirect handler (for Stripe, etc.)
  const handlePayment = () => {
    window.location.href = paymentUrl;
  };

  if (step === 'success') {
    return <div>Registration complete! Welcome to Dance RealmX.</div>;
  }

  if (step === 'payment') {
    return (
      <div>
        <h2>Almost done!</h2>
        <p>Click below to complete your payment.</p>
        <button onClick={handlePayment}>Pay Now</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <input 
        name="username" 
        placeholder="Username" 
        value={form.username} 
        onChange={handleChange} 
        required 
      />
      <input 
        name="first_name" 
        placeholder="First Name" 
        value={form.first_name} 
        onChange={handleChange} 
        required 
      />
      <input 
        name="last_name" 
        placeholder="Last Name" 
        value={form.last_name} 
        onChange={handleChange} 
        required 
      />
      <input 
        name="email" 
        type="email" 
        placeholder="Email" 
        value={form.email} 
        onChange={handleChange} 
        required 
      />
      <input 
        name="password" 
        type="password" 
        placeholder="Password" 
        value={form.password} 
        onChange={handleChange} 
        required 
        minLength={8} 
      />
      
      <h3>Select a Plan</h3>
      {plans.map(plan => (
        <label key={plan.slug} style={{ display: 'block', margin: '8px 0' }}>
          <input
            type="radio"
            name="planSlug"
            value={plan.slug}
            checked={form.planSlug === plan.slug}
            onChange={() => handlePlanChange(plan.slug)}
          />
          {plan.name}{plan.price > 0 ? ` - $${plan.price}/mo` : ' (Free)'}
        </label>
      ))}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}