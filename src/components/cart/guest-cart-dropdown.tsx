import { useState } from "react";
import { useGuestCart } from "@/hooks/use-guest-cart";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function GuestCartDropdown() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, updateQuantity, itemCount, total } = useGuestCart();
  const [, navigate] = useLocation();
  
  const goToCheckout = () => {
    navigate("/cart");
    setOpen(false);
  };
  
  const handleChangeQuantity = (id: number, change: number, currentQuantity: number) => {
    updateQuantity(id, currentQuantity + change);
  };
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full"
              variant="destructive"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Guest Shopping Cart</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {items.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Your cart is empty
          </div>
        ) : (
          <DropdownMenuGroup className="max-h-64 overflow-y-auto">
            {items.map((item) => (
              <DropdownMenuItem key={item.id} className="flex flex-col items-start p-3">
                <div className="w-full flex justify-between">
                  <div className="font-medium truncate max-w-[180px]">{item.title}</div>
                  <div className="text-right ml-2 font-semibold">${parseFloat(item.price).toFixed(2)}</div>
                </div>
                
                <div className="w-full flex justify-between items-center mt-2">
                  <div className="flex items-center space-x-1">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-7 w-7"
                      onClick={() => handleChangeQuantity(item.id, -1, item.quantity)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="min-w-[25px] text-center">{item.quantity}</span>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="h-7 w-7"
                      onClick={() => handleChangeQuantity(item.id, 1, item.quantity)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        
        {items.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3">
              <div className="flex justify-between mb-3">
                <span className="font-medium">Total:</span>
                <span className="font-bold">${total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
                onClick={goToCheckout}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}