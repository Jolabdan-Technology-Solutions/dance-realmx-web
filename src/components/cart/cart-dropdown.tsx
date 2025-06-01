import { Button } from "../../components/ui/button";
import { ShoppingCart, Trash2, Minus, Plus, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { useState } from "react";
import { useLocation } from "wouter";
import { formatCurrency } from "../../lib/utils";
import { useCart } from "../../hooks/use-cart";

export function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();

  // Use ONLY the centralized cart hook - no separate queries
  const {
    items: cartItems,
    removeItem,
    updateQuantity,
    clearCart,
    total: cartTotal,
    itemCount,
    isLoading,
    refetchCart, // Use the refetch from the cart hook
  } = useCart();

  // Handle dropdown open/close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Only refetch when opening if needed
      // The cart hook already handles this with optimistic updates
      refetchCart();
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    setIsOpen(false);
    navigate("/simple-checkout");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 px-1.5 h-5 min-w-5"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Your Cart</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : cartItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex space-x-3">
                  <div className="flex-1">
                    <h4 className="font-medium leading-tight">{item.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      {item.itemType === "course" ? "Course" : "Resource"}
                    </div>
                    <div className="flex items-center mt-1 space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.id);
                          } else {
                            updateQuantity(item.id, item.quantity - 1);
                          }
                          // No manual refresh needed - optimistic updates handle this
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          updateQuantity(item.id, item.quantity + 1);
                          // No manual refresh needed - optimistic updates handle this
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="font-medium">
                      {formatCurrency(
                        parseFloat(item.details?.price || item.price) *
                          item.quantity
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => {
                        removeItem(item.id);
                        // No manual refresh needed - optimistic updates handle this
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-semibold text-lg mb-4">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  clearCart();
                  // No manual refresh needed - optimistic updates handle this
                }}
              >
                Clear Cart
              </Button>
              <Button onClick={handleCheckout}>Checkout</Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
