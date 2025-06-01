import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { CreditCard, DollarSign, Download, Loader2, Search, Upload, Check, X, ChevronDown, ExternalLink, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface Seller {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  role: string;
  isApprovedSeller: boolean;
  stripeConnectAccountId: string | null;
  stripeConnectOnboardingComplete: boolean;
  resourceCount: number;
  salesCount: number;
  totalRevenue: number;
  payoutHistory: {
    totalPaid: number;
    lastPayout: string | null;
  };
}

export default function AdminSellersPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [showCreateSellerDialog, setShowCreateSellerDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newSellerData, setNewSellerData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  // Fetch all sellers
  const { data: sellers = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/sellers"],
    queryFn: async () => {
      const response = await fetch("/api/admin/sellers");
      if (!response.ok) {
        throw new Error("Failed to fetch sellers");
      }
      return response.json();
    }
  });

  // Filter sellers based on search query and active tab
  const filteredSellers = sellers.filter((seller: Seller) => {
    const matchesSearch = 
      searchQuery === "" || 
      `${seller.firstName || ""} ${seller.lastName || ""}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (seller.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "approved") return matchesSearch && seller.isApprovedSeller;
    if (activeTab === "pending") return matchesSearch && !seller.isApprovedSeller;
    if (activeTab === "withStripe") return matchesSearch && !!seller.stripeConnectAccountId;
    return matchesSearch;
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      return apiRequest("POST", `/api/admin/sellers/${sellerId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      toast({
        title: "Seller approved",
        description: "The seller has been approved successfully.",
      });
      setShowApproveDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve seller. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      return apiRequest("POST", `/api/admin/sellers/${sellerId}/reject`, { reason: rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      toast({
        title: "Seller rejected",
        description: "The seller has been rejected.",
      });
      setRejectionReason("");
      setShowRejectDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject seller. Please try again.",
        variant: "destructive",
      });
    }
  });

  const payoutMutation = useMutation({
    mutationFn: async (sellerId: number) => {
      return apiRequest("POST", `/api/admin/payout/${sellerId}`, { amount: parseFloat(payoutAmount) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      toast({
        title: "Payout initiated",
        description: "The payout has been initiated successfully.",
      });
      setPayoutAmount("");
      setShowPayoutDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initiate payout. Please try again.",
        variant: "destructive",
      });
    }
  });

  const createSellerMutation = useMutation({
    mutationFn: async (data: typeof newSellerData) => {
      return apiRequest("POST", `/api/admin/create-seller`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      toast({
        title: "Seller created",
        description: "The seller has been created successfully.",
      });
      setNewSellerData({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: ""
      });
      setShowCreateSellerDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create seller. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSellerApproval = (seller: Seller, isApproved: boolean) => {
    setSelectedSeller(seller);
    if (isApproved) {
      setShowApproveDialog(true);
    } else {
      setShowRejectDialog(true);
    }
  };

  const handlePayout = (seller: Seller) => {
    setSelectedSeller(seller);
    setShowPayoutDialog(true);
  };

  const handleCreateSeller = () => {
    createSellerMutation.mutate(newSellerData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-destructive">Error loading sellers</h1>
        <p>{(error as Error).message}</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Management</h1>
          <p className="text-muted-foreground">Manage sellers, approve applications, and process payouts</p>
        </div>
        <Button onClick={() => setShowCreateSellerDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create Seller
        </Button>
      </div>

      <div className="flex items-center mb-6 gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sellers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Sellers</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="withStripe">With Stripe Connect</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seller Cards */}
        {filteredSellers.map((seller: Seller) => (
          <Card key={seller.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CachedAvatar username={seller.username} profileImageUrl={seller.profileImageUrl} />
                  <div>
                    <CardTitle className="text-lg">{seller.firstName} {seller.lastName}</CardTitle>
                    <CardDescription className="text-sm">@{seller.username}</CardDescription>
                  </div>
                </div>
                <Badge variant={seller.isApprovedSeller ? "default" : "outline"}>
                  {seller.isApprovedSeller ? "Approved" : "Pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-sm text-muted-foreground">{seller.email}</div>
              <div className="text-sm mt-2 line-clamp-2">{seller.bio || "No bio provided"}</div>
              
              <div className="grid grid-cols-2 gap-4 my-4">
                <div className="bg-muted rounded-md p-2 text-center">
                  <div className="text-2xl font-semibold">{seller.resourceCount}</div>
                  <div className="text-xs text-muted-foreground">Resources</div>
                </div>
                <div className="bg-muted rounded-md p-2 text-center">
                  <div className="text-2xl font-semibold">{seller.salesCount}</div>
                  <div className="text-xs text-muted-foreground">Sales</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div>
                  <div className="text-sm font-medium">Revenue</div>
                  <div className="text-xl font-bold">{formatCurrency(seller.totalRevenue)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Paid</div>
                  <div className="text-xl font-bold">{formatCurrency(seller.payoutHistory.totalPaid)}</div>
                </div>
              </div>
              
              {seller.stripeConnectAccountId && (
                <div className="mt-3">
                  <Badge variant="outline" className={`${seller.stripeConnectOnboardingComplete ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}`}>
                    {seller.stripeConnectOnboardingComplete ? (
                      <><Check className="h-3 w-3 mr-1" /> Stripe Connected</>
                    ) : (
                      <>Stripe Setup Incomplete</>
                    )}
                  </Badge>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 border-t pt-4">
              {!seller.isApprovedSeller ? (
                <>
                  <Button variant="default" size="sm" onClick={() => handleSellerApproval(seller, true)} 
                    className="flex-1">
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleSellerApproval(seller, false)}
                    className="flex-1">
                    <X className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1"
                    disabled={!seller.stripeConnectOnboardingComplete}
                    onClick={() => handlePayout(seller)}>
                    <DollarSign className="h-4 w-4 mr-1" /> Payout
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleSellerApproval(seller, false)}>
                        <X className="h-4 w-4 mr-2" /> Revoke Approval
                      </DropdownMenuItem>
                      {seller.stripeConnectAccountId && (
                        <DropdownMenuItem>
                          <ExternalLink className="h-4 w-4 mr-2" /> Stripe Dashboard
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </CardFooter>
          </Card>
        ))}

        {filteredSellers.length === 0 && (
          <div className="col-span-3 py-8 text-center">
            <p className="text-muted-foreground">No sellers found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Seller</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve {selectedSeller?.firstName} {selectedSeller?.lastName} (@{selectedSeller?.username}) as a seller?
              They will be able to upload and sell curriculum resources on the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedSeller && approveMutation.mutate(selectedSeller.id)}>
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve Seller
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Seller Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedSeller?.firstName} {selectedSeller?.lastName}'s seller application.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedSeller && rejectMutation.mutate(selectedSeller.id)}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
            <DialogDescription>
              Create a payout for {selectedSeller?.firstName} {selectedSeller?.lastName}.
              Current balance: {selectedSeller ? formatCurrency(selectedSeller.totalRevenue - selectedSeller.payoutHistory.totalPaid) : "$0.00"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payout-amount">Payout Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="payout-amount"
                  placeholder="0.00"
                  type="number"
                  className="pl-9"
                  min="0.01"
                  step="0.01"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
            <Button 
              variant="default" 
              onClick={() => selectedSeller && payoutMutation.mutate(selectedSeller.id)}
              disabled={!payoutAmount || parseFloat(payoutAmount) <= 0 || payoutMutation.isPending}
            >
              {payoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Seller Dialog */}
      <Dialog open={showCreateSellerDialog} onOpenChange={setShowCreateSellerDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Seller</DialogTitle>
            <DialogDescription>
              Create a new seller account. This seller will be automatically approved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={newSellerData.firstName}
                  onChange={(e) => setNewSellerData({...newSellerData, firstName: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={newSellerData.lastName}
                  onChange={(e) => setNewSellerData({...newSellerData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                value={newSellerData.username}
                onChange={(e) => setNewSellerData({...newSellerData, username: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@example.com"
                value={newSellerData.email}
                onChange={(e) => setNewSellerData({...newSellerData, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newSellerData.password}
                onChange={(e) => setNewSellerData({...newSellerData, password: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSellerDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateSeller}
              disabled={!newSellerData.username || !newSellerData.password || createSellerMutation.isPending}
            >
              {createSellerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Seller
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}