import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { useAuth } from "./use-auth";
import { useLocation } from "wouter";

export type CheckoutStatus = "idle" | "processing" | "success" | "error";

export type CheckoutError = {
  message: string;
  code?: string;
  details?: any;
};

export type OrderItem = {
  id: number;
  course_id?: number;
  resource_id?: number;
  quantity: number;
  price: number;
  itemDetails?: {
    title: string;
    type: string;
    price: number;
  };
};

export type Order = {
  id: number;
  user_id: number;
  total: number;
  status: "PENDING" | "PAYMENT_PENDING" | "COMPLETED" | "FAILED";
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

export type CheckoutResult = {
  order: Order;
  clientSecret: string | null;
};

export function useCheckout() {
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [error, setError] = useState<CheckoutError | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Checkout cart mutation
  const checkoutMutation = useMutation({
    mutationFn: async (): Promise<CheckoutResult> => {
      if (!user) {
        throw new Error("You must be logged in to checkout");
      }

      const response = await apiRequest("/api/cart/checkout", {
        method: "POST",
        requireAuth: true,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Checkout failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setStatus("success");
      setError(null);

      // Invalidate cart queries to refresh the cart state
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });

      toast({
        title: "Order Created",
        description: `Order #${data.order.id} has been created successfully`,
      });
    },
    onError: (err: Error) => {
      setStatus("error");
      setError({
        message: err.message,
        code: "CHECKOUT_FAILED",
      });

      toast({
        title: "Checkout Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({
      clientSecret,
      paymentMethod,
    }: {
      clientSecret: string;
      paymentMethod: any;
    }) => {
      // This would typically be handled by Stripe Elements
      // For now, we'll simulate the payment process
      const response = await apiRequest("/api/payments/confirm", {
        method: "POST",
        data: {
          clientSecret,
          paymentMethod,
        },
        requireAuth: true,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Payment failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully",
      });

      // Navigate to success page
      navigate(`/checkout/success?orderId=${data.orderId}`);
    },
    onError: (err: Error) => {
      setError({
        message: err.message,
        code: "PAYMENT_FAILED",
      });

      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Start checkout process
  const startCheckout = async () => {
    setStatus("processing");
    setError(null);

    try {
      const result = await checkoutMutation.mutateAsync();
      return result;
    } catch (err) {
      // Error is handled by mutation
      return null;
    }
  };

  // Process payment
  const processPayment = async (clientSecret: string, paymentMethod: any) => {
    setStatus("processing");
    setError(null);

    try {
      await processPaymentMutation.mutateAsync({ clientSecret, paymentMethod });
    } catch (err) {
      // Error is handled by mutation
    }
  };

  // Reset checkout state
  const resetCheckout = () => {
    setStatus("idle");
    setError(null);
  };

  return {
    // State
    status,
    error,
    isLoading: status === "processing",

    // Actions
    startCheckout,
    processPayment,
    resetCheckout,

    // Mutations
    checkoutMutation,
    processPaymentMutation,
  };
}
