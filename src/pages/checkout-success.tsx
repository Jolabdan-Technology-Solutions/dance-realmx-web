import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Download,
  Mail,
  ArrowRight,
  Home,
  ShoppingBag,
  Calendar,
  Clock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";

interface OrderDetails {
  id: number;
  total: number;
  status: string;
  created_at: string;
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    itemDetails?: {
      title: string;
      type: string;
    };
  }>;
}

export default function CheckoutSuccessPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState<string | null>(null);

  // Get order ID from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orderId");
    setOrderId(id);
  }, []);

  // Fetch order details
  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const response = await apiRequest(`/api/orders/${orderId}`, {
        method: "GET",
        requireAuth: true,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      return response.json();
    },
    enabled: !!orderId && !!user,
  });

  const handleContinueShopping = () => {
    navigate("/");
  };

  const handleViewOrders = () => {
    navigate("/dashboard/orders");
  };

  const handleViewCourses = () => {
    navigate("/courses");
  };

  const handleViewResources = () => {
    navigate("/resources");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Thank you for your purchase!
          </h1>
          <p className="text-gray-600">
            Your order has been confirmed and you'll receive a confirmation
            email shortly.
          </p>
        </div>

        {/* Order Details */}
        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Details</span>
                <Badge variant="outline">#{order.id}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Order Date:</span>
                    <p className="font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <p className="font-medium">{formatCurrency(order.total)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge variant="default" className="ml-2">
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <p className="font-medium">{order.items.length}</p>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="font-medium mb-3">Items Purchased</h4>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {item.itemDetails?.title || "Unknown Item"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.itemDetails?.type || "Item"} • Qty:{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Confirmation Email</h4>
                  <p className="text-sm text-gray-600">
                    You'll receive a confirmation email with your order details
                    and access instructions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Download className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Access Your Purchases</h4>
                  <p className="text-sm text-gray-600">
                    Your purchased courses and resources are now available in
                    your dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Start Learning</h4>
                  <p className="text-sm text-gray-600">
                    Begin your learning journey with your new courses and
                    resources.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={handleViewOrders}
            variant="outline"
            className="w-full"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            View All Orders
          </Button>

          <Button onClick={handleContinueShopping} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        {/* Quick Access */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            onClick={handleViewCourses}
            variant="ghost"
            className="w-full justify-start"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>

          <Button
            onClick={handleViewResources}
            variant="ghost"
            className="w-full justify-start"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Browse Resources
          </Button>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Contact our support team at{" "}
            <a
              href="mailto:support@dancerealm.com"
              className="text-blue-600 hover:underline"
            >
              support@dancerealm.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
