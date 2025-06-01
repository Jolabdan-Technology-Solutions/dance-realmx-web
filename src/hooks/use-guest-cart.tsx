import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { Button } from "@/components/ui/button";

export type GuestCartItem = {
  id: number;
  title: string;
  price: string;
  itemType: 'resource';
  itemId: number;
  quantity: number;
  imageUrl?: string | null;
};

type GuestCartContextType = {
  items: GuestCartItem[];
  addItem: (item: GuestCartItem) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
};

const GuestCartContext = createContext<GuestCartContextType | null>(null);

const GUEST_CART_STORAGE_KEY = 'drx_guest_cart';

export function GuestCartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<GuestCartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log("Loaded guest cart from localStorage:", parsedCart);
        setItems(parsedCart);
      } else {
        console.log("No guest cart found in localStorage");
      }
    } catch (error) {
      console.error("Error loading guest cart from localStorage:", error);
      // Reset the cart if there's an error
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    try {
      console.log("Saving guest cart to localStorage:", items);
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving guest cart to localStorage:", error);
      toast({
        title: "Storage Error",
        description: "Failed to save your cart. Please make sure cookies are enabled.",
        variant: "destructive",
      });
    }
  }, [items, toast]);

  // Transfer guest cart to user cart when logged in
  useEffect(() => {
    const transferCartItems = async () => {
      if (user && items.length > 0) {
        console.log("Transferring guest cart to user cart:", items);
        
        try {
          // Add each item from the guest cart to the user's cart
          for (const item of items) {
            await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemType: item.itemType,
                itemId: item.itemId,
                title: item.title,
                price: item.price,
                quantity: item.quantity
              }),
              credentials: "include",
            });
          }
          
          toast({
            title: "Cart Transferred",
            description: "Your guest cart items have been added to your account cart",
          });
          
          // Clear the guest cart after successful transfer
          setItems([]);
        } catch (error) {
          console.error("Error transferring guest cart:", error);
          toast({
            title: "Transfer Error",
            description: "Failed to transfer your cart items. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    
    transferCartItems();
  }, [user, toast]);

  const addItem = (newItem: GuestCartItem) => {
    // Make sure the item has an image URL if possible
    if (!newItem.imageUrl && newItem.itemType === 'resource') {
      // Default thumbnail pattern
      newItem.imageUrl = `/images/thumbnails/resource-${newItem.itemId}.jpg`;
    }
    
    setItems(prevItems => {
      // Check if item already exists
      const existingItemIndex = prevItems.findIndex(
        item => item.itemId === newItem.itemId && item.itemType === newItem.itemType
      );

      if (existingItemIndex >= 0) {
        // Update quantity if item already exists
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + (newItem.quantity || 1)
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, newItem];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${newItem.title} has been added to your cart`,
      action: (
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/cart"} className="mt-2">
          View Cart
        </Button>
      ),
    });
    
    // Return a promise that resolves once the state is updated
    return new Promise<void>(resolve => {
      // Use a short timeout to ensure the state update has been applied
      setTimeout(() => {
        resolve();
      }, 300);
    });
  };

  const removeItem = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart",
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  };

  // Calculate total
  const total = items.reduce((sum, item) => 
    sum + parseFloat(item.price) * item.quantity, 0
  );

  // Calculate item count
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <GuestCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total
      }}
    >
      {children}
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const context = useContext(GuestCartContext);
  if (!context) {
    throw new Error("useGuestCart must be used within a GuestCartProvider");
  }
  return context;
}