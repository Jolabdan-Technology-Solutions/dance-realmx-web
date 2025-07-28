import { useState, useEffect } from "react";
import {
  CreditCard, Edit, Trash, Plus, Check, X, DollarSign,
  Tag, FileText, Star, MoreHorizontal, Archive, RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertSubscriptionPlanSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { RequireSubscription } from "@/components/subscription/require-subscription";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Form schema for validation with Zod
const formSchema = insertSubscriptionPlanSchema.extend({
  // Ensure features are handled as a string array
  features: z.preprocess(
    // Handle both comma-separated strings and arrays
    (val) => {
      if (typeof val === 'string') {
        return val.split(',').map(item => item.trim()).filter(Boolean);
      }
      return val;
    },
    z.array(z.string())
  ),
  // Force convert prices to strings
  priceMonthly: z.preprocess(
    (val) => String(val),
    z.string().min(1, "Price is required")
  ),
  priceYearly: z.preprocess(
    (val) => String(val),
    z.string().min(1, "Price is required")
  ),
});

export default function AdminSubscriptionsPage() {
  return (
    <RequireSubscription 
      level={30} 
      feature="Subscription Plan Administration"
      description="Manage subscription plans, pricing, and plan features with ROYALTY level administrative access"
    >
      <AdminSubscriptionsPageContent />
    </RequireSubscription>
  );
}

function AdminSubscriptionsPageContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [deletingPlanName, setDeletingPlanName] = useState<string>("");

  // Fetch all subscription plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/admin/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/subscription-plans");
      return res.json();
    }
  });

  // Form for creating and editing subscription plans
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      features: [],
      priceMonthly: "0",
      priceYearly: "0",
      stripePriceIdMonthly: "",
      stripePriceIdYearly: "",
      isPopular: false,
      isActive: true
    }
  });

  // Reset form when editing or creating state changes
  useEffect(() => {
    if (editingPlanId !== null && plans) {
      const plan = plans.find((p) => p.id === editingPlanId);
      if (plan) {
        // Convert features to comma-separated string for the form
        form.reset({
          ...plan,
          priceMonthly: String(plan.priceMonthly),
          priceYearly: String(plan.priceYearly)
        });
      }
    } else if (!isCreating) {
      form.reset({
        name: "",
        slug: "",
        description: "",
        features: [],
        priceMonthly: "0",
        priceYearly: "0",
        stripePriceIdMonthly: "",
        stripePriceIdYearly: "",
        isPopular: false,
        isActive: true
      });
    }
  }, [editingPlanId, isCreating, plans, form]);

  // Create a new subscription plan
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/admin/subscription-plans", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan created",
        description: "The subscription plan has been created successfully.",
      });
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error creating plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update an existing subscription plan
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PUT", `/api/admin/subscription-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan updated",
        description: "The subscription plan has been updated successfully.",
      });
      setEditingPlanId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete a subscription plan
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/subscription-plans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "The subscription plan has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting plan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingPlanId !== null) {
      updateMutation.mutate({ id: editingPlanId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (id: number, name: string) => {
    setDeletingPlanId(id);
    setDeletingPlanName(name);
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion
  const handleConfirmDelete = () => {
    if (deletingPlanId !== null) {
      deleteMutation.mutate(deletingPlanId);
    }
  };

  // Generate a slug from the plan name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  // Update slug when name changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "name") {
        form.setValue("slug", generateSlug(value.name || ""), { shouldValidate: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-gray-400">Manage subscription plans and pricing</p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-white text-black hover:bg-gray-200"
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Plan
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-40 bg-gray-700" />
                <Skeleton className="h-4 w-full bg-gray-700 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-28 bg-gray-700 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full bg-gray-700" />
                  <Skeleton className="h-3 w-full bg-gray-700" />
                  <Skeleton className="h-3 w-3/4 bg-gray-700" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full bg-gray-700" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans && plans.map((plan) => (
            <Card key={plan.id} className={`overflow-hidden ${!plan.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="relative border-b border-gray-600 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">{plan.slug}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditingPlanId(plan.id)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(plan.id, plan.name)}>
                        <Trash className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {plan.isPopular && (
                  <Badge className="absolute top-3 right-12 bg-cyan-500 hover:bg-cyan-600">Popular</Badge>
                )}
                {!plan.isActive && (
                  <Badge variant="outline" className="absolute top-3 right-12">Inactive</Badge>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold">${parseFloat(plan.price).toFixed(2)}</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {plan.features && Object.entries(plan.features).map(([key, value], i) => (
                    <div key={i} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">{key}: {value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-600 pt-3">
                <Button variant="outline" onClick={() => setEditingPlanId(plan.id)} className="w-full">
                  Manage Plan
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Subscription Plan Dialog */}
      <Dialog open={isCreating || editingPlanId !== null} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingPlanId(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingPlanId !== null ? "Edit Subscription Plan" : "Create New Subscription Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlanId !== null
                ? "Make changes to the subscription plan below."
                : "Add a new subscription plan to your system."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Premium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="premium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full access to all premium features" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceMonthly"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Monthly Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" placeholder="19.99" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceYearly"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Yearly Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                          <Input className="pl-8" placeholder="199.99" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripePriceIdMonthly"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Stripe Monthly Price ID</FormLabel>
                      <FormControl>
                        <Input placeholder="price_1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stripePriceIdYearly"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1">
                      <FormLabel>Stripe Yearly Price ID</FormLabel>
                      <FormControl>
                        <Input placeholder="price_0987654321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Features (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Access to all courses, Unlimited downloads, Priority support"
                          {...field}
                          value={Array.isArray(field.value) ? field.value.join(", ") : field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPopular"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1 flex items-center justify-between space-x-2 rounded-md border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Popular Plan</FormLabel>
                        <FormDescription className="text-xs">
                          Highlight this plan as popular
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="col-span-2 md:col-span-1 flex items-center justify-between space-x-2 rounded-md border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">
                          Enable this plan for new subscriptions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlanId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <RefreshCw className="animate-spin mr-2 h-4 w-4" />
                  )}
                  {editingPlanId !== null ? "Update Plan" : "Create Plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Subscription Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingPlanName}"? This action cannot be undone,
              and may affect users who are currently subscribed to this plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <RefreshCw className="animate-spin mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}