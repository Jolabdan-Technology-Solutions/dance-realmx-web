import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Loader2,
  Trash2,
  ShoppingCart,
  CreditCard,
  Plus,
  Minus,
  LogIn,
  UserIcon,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useGuestCart, GuestCartItem } from "@/hooks/use-guest-cart";
import { useState } from "react";

// Types
type CartItem = {
  id: number;
  title: string;
  price: string;
  itemType: "course" | "resource";
  itemId: number;
  quantity: number;
  imageUrl?: string;
  details?: any;
};

export default function CartPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const {
    items: guestCartItems,
    removeItem: removeGuestItem,
    updateQuantity: updateGuestQuantity,
    clearCart: clearGuestCart,
  } = useGuestCart();

  // Fetch authenticated cart items
  const { data: authCartItems = [], isLoading: isLoadingAuthCart } = useQuery<
    CartItem[]
  >({
    queryKey: ["/api/cart"],
    enabled: !!user, // Only run if user is authenticated
  });

  console.log(guestCartItems)

  // Determine which cart to use based on authentication status
  const isUsingGuestCart = !user;
  const cartItems = isUsingGuestCart ? guestCartItems : authCartItems;
  const isLoading = isUsingGuestCart ? false : isLoadingAuthCart;

  // Calculate total
  const cartTotal = cartItems.reduce((total, item) => {
    // For authenticated users, price is in item.details.price, for guest users it's in item.price
    const price = isUsingGuestCart ? item.price : item.details?.price || "0";
    return total + parseFloat(price) * item.quantity;
  }, 0);

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/cart/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not remove item from cart",
        variant: "destructive",
      });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      if (quantity < 1) {
        await removeItemMutation.mutateAsync(id);
        return;
      }
      await apiRequest(`/api/cart/${id}`, {
        method: "PATCH",
        body: { quantity },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not update quantity",
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/cart", { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not clear cart",
        variant: "destructive",
      });
    },
  });

  // Handle guest cart items
  const handleRemoveGuestItem = (id: number) => {
    removeGuestItem(id);
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
    });
  };

  const handleUpdateGuestQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeGuestItem(id);
      return;
    }
    updateGuestQuantity(id, quantity);
  };

  const handleClearCart = () => {
    if (isUsingGuestCart) {
      clearGuestCart();
      toast({
        title: "Cart cleared",
        description: "Your cart has been cleared",
      });
    } else {
      clearCartMutation.mutate();
    }
  };

  // Handle cart item modification
  const handleRemoveItem = (id: number) => {
    if (isUsingGuestCart) {
      handleRemoveGuestItem(id);
    } else {
      removeItemMutation.mutate(id);
    }
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    if (isUsingGuestCart) {
      handleUpdateGuestQuantity(id, quantity);
    } else {
      updateQuantityMutation.mutate({ id, quantity });
    }
  };

  const handleLoginClick = () => {
    navigate("/auth", { state: { redirect: "/cart" } });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container max-w-4xl py-12">
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-2" />
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="text-muted-foreground mb-4">
              Looks like you haven't added any items to your cart yet.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/curriculum")}>
                Browse Resources
              </Button>
              <Button onClick={() => navigate("/courses")} variant="outline">
                Browse Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-16 py-12">
      <h1 className="text-3xl font-bold mb-8">
        {isUsingGuestCart ? "Guest Shopping Cart" : "Shopping Cart"}
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {isUsingGuestCart && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4 text-sm flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span>
                  You're shopping as a guest.{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() =>
                      navigate("/auth", { state: { redirect: "/cart" } })
                    }
                  >
                    Log in
                  </Button>{" "}
                  to save your cart and access your purchases later.
                </span>
              </CardContent>
            </Card>
          )}

          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <h3 className="font-medium text-lg">
                      {isUsingGuestCart
                        ? item.title
                        : item.title || "Unnamed Item"}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {item.type}
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity - 1)
                        }
                        disabled={
                          !isUsingGuestCart && updateQuantityMutation.isPending
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="w-8 text-center">{item.quantity}</span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity + 1)
                        }
                        disabled={
                          !isUsingGuestCart && updateQuantityMutation.isPending
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-right space-y-3">
                    <div className="font-semibold">
                      {formatCurrency(
                        parseFloat(
                          isUsingGuestCart
                            ? item.price
                            : item.price || "0"
                        ) * item.quantity
                      )}
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={
                          !isUsingGuestCart && removeItemMutation.isPending
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleClearCart}
              disabled={!isUsingGuestCart && clearCartMutation.isPending}
            >
              Clear Cart
            </Button>
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                onClick={() => navigate("/simple-checkout")}
                disabled={cartItems.length === 0}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Checkout
              </Button>

              {isUsingGuestCart && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLoginClick}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in to checkout
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
