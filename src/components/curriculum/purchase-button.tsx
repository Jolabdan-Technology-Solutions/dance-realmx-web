import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingCart, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGuestCart, GuestCartItem } from "@/hooks/use-guest-cart";

interface PurchaseButtonProps {
  resourceId: number;
  price: string;
  title: string;
  inStock?: boolean;
  isOwned?: boolean;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showBuyNow?: boolean;
}

const PurchaseButton = ({
  resourceId,
  price,
  title,
  inStock = true,
  isOwned = false,
  variant = "default",
  size = "default",
  className = "",
  showBuyNow = true,
}: PurchaseButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const guestCart = useGuestCart();

  // Direct checkout with Stripe
  const handleBuyNow = async () => {
    try {
      setCheckingOut(true);
      
      // If user is not logged in, redirect to auth page
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to complete your purchase",
        });
        window.location.href = `/auth?redirect=/curriculum/${resourceId}`;
        return;
      }
      
      // Create success and cancel URLs
      const successUrl = `${window.location.origin}/curriculum/success?session_id={CHECKOUT_SESSION_ID}&resourceId=${resourceId}`;
      const cancelUrl = `${window.location.origin}/curriculum/${resourceId}`;
      
      // Call resource checkout endpoint
      const response = await fetch("/api/create-resource-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: Number(resourceId),
          successUrl,
          cancelUrl
        }),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create checkout session");
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
      
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Error creating checkout session",
        variant: "destructive"
      });
      setCheckingOut(false);
    }
  };

  // Simple add to cart function that works for both guest and authenticated users
  const handleAddToCart = async () => {
    try {
      setLoading(true);
      
      console.log("========= ADDING TO CART =========");
      console.log("Resource:", { id: resourceId, title, price });
      console.log("User:", user ? `${user.id} (${user.username})` : "Guest");
      
      if (!user) {
        // GUEST USER - Add to localStorage guest cart
        const item: GuestCartItem = {
          id: Date.now(),
          itemType: "resource",
          itemId: resourceId,
          title,
          price,
          quantity: 1,
          imageUrl: "/images/thumbnails/resource-default.jpg"
        };
        
        await guestCart.addItem(item);
        console.log("Added to guest cart:", item);
        
        // Success notification
        toast({
          title: "Added to Guest Cart",
          description: `${title} has been added to your cart`,
        });
        
        // Immediately redirect to cart
        window.location.href = "/cart";
        return;
      }
      
      // AUTHENTICATED USER - Add to database cart through API
      // Basic cart data with only required fields
      const cartData = {
        itemType: "resource",
        itemId: Number(resourceId),
        quantity: 1
      };
      
      // Simple API call with minimal options
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartData),
        credentials: "include"
      });
      
      console.log("API Response:", response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to add to cart: ${response.status} ${response.statusText}`);
      }
      
      // Success notification
      toast({
        title: "Added to Cart",
        description: `${title} has been added to your cart`
      });
      
      // Immediately redirect to cart page
      window.location.href = "/cart";
      
    } catch (error) {
      console.error("Cart error:", error);
      toast({
        title: "Cart Error",
        description: error instanceof Error ? error.message : "Unknown error adding to cart",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Already purchased state
  if (isOwned) {
    return (
      <Button variant="outline" disabled className={className}>
        Already Purchased
      </Button>
    );
  }

  // Out of stock state
  if (!inStock) {
    return (
      <Button variant="outline" disabled className={className}>
        Out of Stock
      </Button>
    );
  }

  // Show Buy Now and Add to Cart buttons side by side
  if (showBuyNow) {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        <Button
          variant={variant}
          size={size}
          onClick={handleAddToCart}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          Add to Cart
        </Button>
        
        <Button
          variant="secondary"
          size={size}
          onClick={handleBuyNow}
          disabled={checkingOut}
        >
          {checkingOut ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <CreditCard className="h-4 w-4 mr-2" />
          )}
          Buy Now
        </Button>
      </div>
    );
  }

  // Just show Add to Cart button
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCart}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      Add to Cart ${parseFloat(price).toFixed(2)}
    </Button>
  );
};

export default PurchaseButton;