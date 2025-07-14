import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  Calendar,
  Tag,
  FileText,
  Loader2,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PurchasedResource {
  id: number;
  resourceId: number;
  resourceTitle: string;
  resourceDescription?: string;
  orderId: string;
  orderDate: string;
  totalAmount: number;
  downloadUrl: string;
  fileType?: string | null;
  thumbnailUrl?: string;
}

export default function MyPurchasesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const {
    data: purchases,
    isLoading,
    error,
    refetch,
  } = useQuery<PurchasedResource[]>({
    queryKey: ["/api/cart/orders"],
    enabled: !!user,
    retry: 2,
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/cart/orders", {
          method: "GET",
          requireAuth: true,
        });
        console.log("Purchases response:", response);
        return response;
      } catch (err: any) {
        throw new Error(err?.message || "Failed to fetch purchases");
      }
    },
  });

  // Add debug effect to check what we're getting from the API
  useEffect(() => {
    if (purchases) {
      console.log("Loaded purchases:", purchases);
    }
  }, [purchases]);

  // Filter purchases based on search term
  const filteredPurchases = purchases?.filter((purchase) => {
    return (
      purchase.resourceTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (purchase.resourceDescription || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (purchase.fileType || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-12">
        <PageHeader
          title="My Purchases"
          description="Your purchased curriculum resources"
        />
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold">Loading your purchases...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-5xl py-12">
        <PageHeader
          title="My Purchases"
          description="Your purchased curriculum resources"
        />
        <div className="rounded-lg border p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Purchases
          </h2>
          <p className="text-muted-foreground mb-6">
            We encountered an issue loading your purchases. Please try again.
          </p>
          <Button onClick={() => refetch()} className="mr-2">
            Retry
          </Button>
          <Button variant="outline" onClick={() => setLocation("/curriculum")}>
            Browse Curriculum
          </Button>
        </div>
      </div>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <div className="container max-w-5xl py-12">
        <PageHeader
          title="My Purchases"
          description="Your purchased curriculum resources"
        />
        <div className="rounded-lg border p-8 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Purchases Yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven't purchased any curriculum resources yet.
          </p>
          <Button onClick={() => setLocation("/curriculum")}>
            Browse Curriculum
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12">
      <PageHeader
        title="My Purchases"
        description="Your purchased curriculum resources are available for download here"
      />

      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search your purchases..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {filteredPurchases?.map((purchase) => (
          <div
            key={purchase.id}
            className="rounded-lg border overflow-hidden bg-card"
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div className="aspect-video md:aspect-square relative overflow-hidden">
                <img
                  src={purchase.thumbnailUrl}
                  alt={purchase.resourceTitle}
                  className="absolute inset-0 w-full h-full object-cover transition-transform hover:scale-105 duration-300 ease-out"
                />
              </div>

              <div className="p-4 md:col-span-2">
                <h3 className="text-xl font-semibold mb-2">
                  {purchase.resourceTitle}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {purchase.resourceDescription}
                </p>

                <div className="grid grid-cols-2 gap-y-2 mb-6 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Purchased:{" "}
                      {new Date(purchase.orderDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>Price: {formatCurrency(purchase.totalAmount)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>File Type: {purchase.fileType || "PDF"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Order #{purchase.orderId.substring(0, 8)}
                    </span>
                  </div>
                </div>

                <a
                  href={purchase.downloadUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    // Log download attempt
                    console.log("Downloading resource:", purchase.resourceId);
                    // Show toast for download start
                    toast({
                      title: "Download starting",
                      description:
                        "Your resource download should begin shortly. If it doesn't open automatically, check your browser settings.",
                    });
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download Resource
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPurchases && filteredPurchases.length === 0 && (
        <div className="rounded-lg border p-8 text-center mt-6">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Matching Purchases</h2>
          <p className="text-muted-foreground mb-6">
            No purchases match your search criteria. Try different keywords.
          </p>
          <Button variant="outline" onClick={() => setSearchTerm("")}>
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
}
