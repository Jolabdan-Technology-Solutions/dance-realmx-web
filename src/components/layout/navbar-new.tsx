import { useState, useContext } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartIcon from "@/components/cart/cart-icon";
import { AuthWrapper } from "@/lib/auth-wrapper";
import { useAuth, AuthContext } from "@/hooks/use-auth";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// User session menu component - uses the useAuth hook directly
function UserSessionMenu() {
  // Use the hook directly instead of context for better reliability
  const { user, logoutMutation } = useAuth();
  
  console.log("UserSessionMenu - Current user state:", user);
  
  const handleLogout = () => {
    console.log("Logout button clicked from dropdown");
    logoutMutation.mutate();
  };
  
  // For debugging - Always show the user menu with logout option
  const displayName = user ? (user.first_name || user.username) : "Guest";
  
  return (
    <div className="flex items-center space-x-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-1 text-white">
            {/* Use the CachedAvatar component for better avatar handling */}
            <div className="mr-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profile_image_url} alt={user?.username} />
                <AvatarFallback>
                  {user?.first_name?.charAt(0) || user?.last_name?.charAt(0) || user?.username?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            <span>Hi, {displayName}!</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {user ? (
            <>
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="w-full cursor-pointer">My Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/my-courses" className="w-full cursor-pointer">My Courses</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/my-purchases" className="w-full cursor-pointer">My Purchases</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer">My Profile</Link>
              </DropdownMenuItem>
              
              {(user.role === 'seller' || user.role === 'curriculum_officer') && (
                <DropdownMenuItem asChild>
                  <Link href="/seller/payments" className="w-full cursor-pointer font-semibold text-[#00d4ff]">Seller Payments</Link>
                </DropdownMenuItem>
              )}

              {/* Curriculum officer admin link removed - already available in mobile menu */}
              {user.role === 'admin' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="w-full cursor-pointer font-semibold text-primary">Admin Panel</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={handleLogout}>
                Sign Out
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link href="/auth" className="w-full cursor-pointer">Sign In</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/auth" className="w-full cursor-pointer">Create Account</Link>
              </DropdownMenuItem>
              {/* For debugging purposes */}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs text-gray-500">
                Not logged in
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <CartIcon />
    </div>
  );
}

// Mobile menu user controls - uses useAuth hook directly
function MobileUserMenu() {
  // Use the hook directly instead of context for better reliability
  const { user, logoutMutation } = useAuth();
  
  console.log("MobileUserMenu - Current user state:", user);
  
  const handleLogout = () => {
    console.log("Logout button clicked");
    logoutMutation.mutate();
  };
  
  // Always render both options for debugging purposes
  return (
    <>
      {/* Use the CachedAvatar component for better avatar handling in mobile menu */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-full border-2 border-white overflow-hidden">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.profile_image_url} alt={user?.username} />
            <AvatarFallback>
              {user?.first_name?.charAt(0) || user?.last_name?.charAt(0) || user?.username?.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <Link href="/dashboard">
        <Button variant="outline" className="w-full rounded-full border-white text-white hover:bg-white hover:text-black">
          My Dashboard
        </Button>
      </Link>
      <Link href="/my-purchases">
        <Button variant="outline" className="w-full rounded-full border-white text-white hover:bg-white hover:text-black mb-2">
          My Purchases
        </Button>
      </Link>

      {(user?.role === 'seller' || user?.role === 'curriculum_officer') && (
        <Link href="/seller/payments">
          <Button variant="outline" className="w-full rounded-full border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-black mb-2">
            Seller Payments
          </Button>
        </Link>
      )}

      {user?.role === 'curriculum_officer' && (
        <Link href="/admin/curriculum">
          <Button variant="outline" className="w-full rounded-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
            Curriculum Admin
          </Button>
        </Link>
      )}
      {user?.role === 'admin' && (
        <Link href="/admin">
          <Button variant="outline" className="w-full rounded-full border-primary text-primary hover:bg-primary hover:text-white">
            Admin Panel
          </Button>
        </Link>
      )}
      <Button 
        className="w-full rounded-full bg-red-600 text-white hover:bg-red-700"
        onClick={handleLogout}
      >
        Sign Out
      </Button>
      {/* Render this only for debugging - will show if we have a user or not */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        {user ? `Logged in as: ${user.username}` : 'Not logged in'}
      </div>
    </>
  );
}

// Guest menu component - doesn't require auth context
function GuestMenu() {
  return (
    <div className="flex space-x-2">
      <Link href="/auth">
        <Button variant="outline" className="rounded-full border-white text-white hover:bg-white hover:text-black">
          Sign In
        </Button>
      </Link>
      <Link href="/register">
        <Button className="rounded-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-bold">
          Get Started
        </Button>
      </Link>
    </div>
  );
}

// Mobile guest menu component - doesn't require auth context
function MobileGuestMenu() {
  return (
    <>
      <Link href="/auth">
        <Button variant="outline" className="w-full rounded-full border-white text-white hover:bg-white hover:text-black">
          Sign In
        </Button>
      </Link>
      <Link href="/register">
        <Button className="w-full rounded-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 font-bold">
          Get Started
        </Button>
      </Link>
    </>
  );
}

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-black">
      <nav className="container mx-auto px-4 py-3 flex flex-wrap justify-between">
          {/* Logo Section */}
          <Link href="/" className="flex items-center py-2">
            <img
              src="/assets/images/Dance realm logo.png"
              alt="Dance Realm Logo"
              className="w-40 h-auto mr-2"
            />
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex flex-grow items-center justify-center">
            <ul className="flex space-x-4 xl:space-x-8 text-xl">
              <li>
                <Link href="/" className={location === "/" ? "text-[#00d4ff]" : "hover:text-[#00d4ff] transition"}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/courses" className={location === "/courses" ? "text-[#00d4ff]" : "hover:text-[#00d4ff] transition"}>
                  Certification
                </Link>
              </li>
              <li>
                <Link href="/curriculum" className={location.startsWith("/curriculum") || location.startsWith("/resources") ? "text-[#00d4ff]" : "hover:text-[#00d4ff] transition"}>
                  Curriculum
                </Link>
              </li>
              <li>
                <Link href="/connect" className={location === "/connect" ? "text-[#00d4ff]" : "hover:text-[#00d4ff] transition"}>
                  Connect
                </Link>
              </li>
              <li>
                <Link href="/subscription" className={location === "/subscription" ? "text-[#00d4ff]" : "hover:text-[#00d4ff] transition"}>
                  Membership
                </Link>
              </li>
            </ul>
          </div>

          {/* Session Container - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <AuthWrapper fallback={<GuestMenu />}>
              <UserSessionMenu />
            </AuthWrapper>
          </div>

        {/* Mobile Navigation Menu */}
        <div className={`w-full lg:hidden pt-2 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
          <ul className="flex flex-col space-y-4 pb-4">
            <li>
              <Link href="/" className={location === "/" ? "block text-[#00d4ff]" : "block"}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/courses" className={location === "/courses" ? "block text-[#00d4ff]" : "block"}>
                Certification
              </Link>
            </li>
            <li>
              <Link href="/curriculum" className={location.startsWith("/curriculum") || location.startsWith("/resources") ? "block text-[#00d4ff]" : "block"}>
                Curriculum
              </Link>
            </li>
            <li>
              <Link href="/connect" className={location === "/connect" ? "block text-[#00d4ff]" : "block"}>
                Connect
              </Link>
            </li>
            <li>
              <Link href="/subscription" className={location === "/subscription" ? "block text-[#00d4ff]" : "block"}>
                Membership
              </Link>
            </li>
            
            {/* Mobile Session Buttons */}
            <li className="pt-2">
              <div className="flex flex-col space-y-2">
                <AuthWrapper fallback={<MobileGuestMenu />}>
                  <MobileUserMenu />
                </AuthWrapper>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}