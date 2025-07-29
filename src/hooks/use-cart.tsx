import {
  createContext,
  useContext,
  ReactNode,
  useState,
} from "react";
import { useFirebaseAuth } from "../hooks/use-firebase-auth-new";
import { useGuestCart } from "../hooks/use-guest-cart";

export type CartItem = {
  id: number;
  title: string;
  price: string;
  type: string;
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
  const { user } = useFirebaseAuth();
  const guestCart = useGuestCart();
  const isAuthenticated = !!user;

  // For now, always use guest cart (stub implementation)
  // TODO: Implement Firebase-based cart for authenticated users
  const contextValue: CartContextType = {
    items: guestCart.items.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      type: item.itemType,
      quantity: item.quantity,
      imageUrl: item.imageUrl || undefined,
    })),
    addItem: (item) => {
      guestCart.addItem({
        id: item.id || Date.now(),
        title: item.title,
        price: item.price,
        itemType: 'resource',
        itemId: item.id || Date.now(),
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      });
    },
    removeItem: guestCart.removeItem,
    updateQuantity: guestCart.updateQuantity,
    clearCart: guestCart.clearCart,
    itemCount: guestCart.itemCount,
    total: guestCart.total,
    isLoading: false,
    refetchCart: () => {},
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}