import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useAuth } from "../hooks/use-auth";
import { useGuestCart } from "../hooks/use-guest-cart";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/queryClient";

export type CartItem = {
  id: number;
  title: string;
  price: string;
  itemType: "course" | "resource";
  itemId: number;
  quantity: number;
  imageUrl?: string;
  details?: any;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id"> & { id?: number }) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
  isLoading: boolean;
  refetchCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const guestCart = useGuestCart();
  const { toast } = useToast();
  const isAuthenticated = !!user;
  const [localCartState, setLocalCartState] = useState<CartItem[]>([]);

  // Fetch authenticated user's cart using React Query
  const {
    data: authenticatedItems = [],
    isLoading: isLoadingCart,
    refetch: refetchCart,
  } = useQuery({
    queryKey: ["/api/cart"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      try {
        const response = await apiRequest("/api/cart", {
          method: "GET",
          requireAuth: true,
        });
        if (!response) {
          console.error("Failed to fetch cart:", response.statusText);
          return [];
        }
        const data = await response.items;
        return data;
      } catch (error) {
        console.error("Error fetching cart:", error);
        return [];
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 60000, // Poll every 60 seconds instead
    staleTime: 30000, // Consider data stale after 30 seconds
  });
  // Mutations for authenticated cart actions
  const addItemMutation = useMutation({
    mutationFn: async (payload: { type: string; itemId: number }) => {
      const response = await apiRequest("/api/cart", {
        method: "POST",
        data: payload,
        requireAuth: true,
      });
      if (!response.ok) throw new Error("Failed to add item to cart");

      if (response) {
        toast({
          title: "Added to cart",
          description: `${payload.type} has been added to your cart.`,
        });
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/cart/${id}`, {
        method: "DELETE",
        requireAuth: true,
      });
      if (!response.ok) throw new Error("Failed to remove item from cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await apiRequest(`/api/cart/${id}`, {
        method: "PATCH",
        data: { quantity },
        requireAuth: true,
      });
      if (!response.ok) throw new Error("Failed to update item quantity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/cart", {
        method: "DELETE",
        requireAuth: true,
      });
      if (!response.ok) throw new Error("Failed to clear cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  // Merge guest cart into authenticated cart when user logs in
  useEffect(() => {
    if (isAuthenticated && guestCart.items.length > 0) {
      // Merge guest cart items into authenticated cart
      const mergeGuestCart = async () => {
        try {
          for (const item of guestCart.items) {
            await addItemMutation.mutateAsync({
              type: "RESOURCE",
              itemId: item.itemId,
            });
          }
          // Clear guest cart after successful merge
          guestCart.clearCart();
          toast({
            title: "Cart Updated",
            description:
              "Your guest cart items have been added to your account",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to merge your guest cart with your account",
            variant: "destructive",
          });
        }
      };
      mergeGuestCart();
    }
  }, [isAuthenticated, guestCart.items]);

  // Determine which cart to use based on authentication status
  let items = isAuthenticated ? authenticatedItems : guestCart.items;
  if (!Array.isArray(items)) {
    items = [];
  }
  const isLoading = isAuthenticated ? isLoadingCart : false;

  // Calculate total and item count
  interface PriceDetails {
    price?: string;
    [key: string]: any;
  }

  interface ItemWithDetails extends CartItem {
    details?: PriceDetails;
  }

  const total = items.reduce((sum: number, item: any): number => {
    // Try item.itemDetails.price, then item.resource.price, then item.price
    const price =
      Number(item.itemDetails?.price ?? item.resource?.price ?? item.price) ||
      0;
    const quantity = item.quantity || 1;
    return sum + price * quantity;
  }, 0);

  const itemCount: number = items.reduce(
    (count: number, item: CartItem): number => count + item.quantity,
    0
  );

  // Cart actions that work with either guest or authenticated cart
  const addItem = (item: Omit<CartItem, "id"> & { id?: number }) => {
    if (isAuthenticated) {
      addItemMutation.mutate({
        type: "RESOURCE",
        itemId: item.itemId,
      });
      toast({
        title: "Item Added",
        description: `${item.title} has been added to your cart`,
      });
    } else {
      guestCart.addItem({
        id: item.id || Date.now(),
        title: item.title,
        price: item.price,
        itemType: item.itemType,
        itemId: item.itemId,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      });
    }
  };

  const removeItem = (id: number) => {
    if (isAuthenticated) {
      try {
        // Immediately update local state for responsiveness
        setLocalCartState((prev) => prev.filter((item) => item.id !== id));

        // Update the query data optimistically
        const previousItems = queryClient.getQueryData(["/api/cart"]) || [];
        queryClient.setQueryData(["/api/cart"], (old: any[]) => {
          return (old || []).filter((item) => item.id !== id);
        });

        // Then perform the actual API request
        removeItemMutation.mutate(id, {
          onError: () => {
            // If the mutation fails, revert to previous items
            queryClient.setQueryData(["/api/cart"], previousItems);
            toast({
              title: "Error",
              description: "Failed to remove item from cart",
              variant: "destructive",
            });
          },
          onSuccess: () => {
            // Force immediate refetch to get latest data
            refetchCart();

            toast({
              title: "Item Removed",
              description: "Item has been removed from your cart",
            });
          },
        });
      } catch (error) {
        console.error("Error removing item:", error);
        toast({
          title: "Error",
          description: "Failed to remove item from cart",
          variant: "destructive",
        });
      }
    } else {
      guestCart.removeItem(id);
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart",
      });
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    if (isAuthenticated) {
      updateQuantityMutation.mutate(
        { id, quantity },
        {
          // Optimistic update - immediately update UI without waiting for server
          onMutate: async (updateData) => {
            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: ["/api/cart"] });

            // Snapshot the previous cart items
            const previousItems = queryClient.getQueryData(["/api/cart"]) || [];

            // Optimistically update to the new cart items
            queryClient.setQueryData(["/api/cart"], (old: any[]) => {
              return (old || []).map((item) =>
                item.id === updateData.id
                  ? { ...item, quantity: updateData.quantity }
                  : item
              );
            });

            // Return a context with the previous cart items
            return { previousItems };
          },
          // If the mutation fails, roll back to the previous cart items
          onError: (err, updateData, context) => {
            if (context) {
              queryClient.setQueryData(["/api/cart"], context.previousItems);
            }
            toast({
              title: "Error",
              description: "Failed to update item quantity",
              variant: "destructive",
            });
          },
          // Always refetch after mutation to get accurate data
          onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
          },
        }
      );
    } else {
      guestCart.updateQuantity(id, quantity);
    }
  };

  const clearCart = () => {
    if (isAuthenticated) {
      clearCartMutation.mutate(undefined, {
        // Optimistic update - immediately update UI without waiting for server
        onMutate: async () => {
          // Cancel any outgoing refetches to avoid overwriting optimistic update
          await queryClient.cancelQueries({ queryKey: ["/api/cart"] });

          // Snapshot the previous cart items
          const previousItems = queryClient.getQueryData(["/api/cart"]) || [];

          // Optimistically clear cart
          queryClient.setQueryData(["/api/cart"], []);

          // Return a context with the previous cart items
          return { previousItems };
        },
        // If the mutation fails, roll back to the previous cart items
        onError: (err, _, context) => {
          if (context) {
            queryClient.setQueryData(["/api/cart"], context.previousItems);
          }
          toast({
            title: "Error",
            description: "Failed to clear cart",
            variant: "destructive",
          });
        },
        // Always refetch after mutation to get accurate data
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        },
      });

      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart",
      });
    } else {
      guestCart.clearCart();
    }
  };

  // Add refetchCart to the context value
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        isLoading,
        refetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  // Force re-render with state update when the cart changes
  const [, forceUpdate] = useState({});

  // Use effect to force component re-render when cart items change
  useEffect(() => {
    const updateInterval = setInterval(() => forceUpdate({}), 100);
    return () => clearInterval(updateInterval);
  }, []);

  return context;
}
