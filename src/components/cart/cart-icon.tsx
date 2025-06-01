import { CartDropdown } from "./cart-dropdown";
import { GuestCartDropdown } from "./guest-cart-dropdown";
import { useAuth } from "@/hooks/use-auth";
import { useGuestCart } from "@/hooks/use-guest-cart";

export default function CartIcon() {
  const { user } = useAuth();
  const guestCart = useGuestCart();
  
  // Check if there are any items in the guest cart
  const hasGuestCartItems = guestCart.items.length > 0;
  
  // Return the appropriate cart dropdown based on authentication status
  if (user) {
    return <CartDropdown />;
  } else {
    // Always show the guest cart dropdown, it will show empty state if needed
    return <GuestCartDropdown />;
  }
}
