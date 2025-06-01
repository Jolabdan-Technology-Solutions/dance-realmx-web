import { Link } from "wouter";
import { useState, useContext } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X, LogOut, User, ChevronDown } from "lucide-react";
import { AuthContext } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Try to access auth context directly without throwing errors
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
  const logoutMutation = authContext?.logoutMutation;
  
  // Admin users have access to all roles
  const isInstructor = user?.role === "instructor" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const isSeller = user?.role === "seller" || user?.role === "admin";
  const isCurriculumOfficer = user?.role === "curriculum_officer" || user?.role === "admin";

  const handleLogout = () => {
    if (logoutMutation) {
      logoutMutation.mutate();
    }
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "?";
    
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    } else if (user.first_name) {
      return user.first_name[0].toUpperCase();
    } else {
      return user.username[0].toUpperCase();
    }
  };

  return (
    <nav className="bg-black text-white py-2">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center">
            <img
              src="/assets/images/logo02.png"
              alt="Dance Realm Logo"
              className="w-40 h-30 mr-2"
            />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Navigation Links - Desktop */}
          <div className={`hidden lg:flex items-center space-x-8`}>
            <ul className="flex items-center space-x-8 text-xl">
              <li>
                <Link href="/" className="text-white hover:text-gray-300">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/courses" className="text-white hover:text-gray-300">
                  Certification
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-white hover:text-gray-300">
                  Curriculum
                </Link>
              </li>
              <li>
                <Link href="/connect" className="text-white hover:text-gray-300">
                  Connect
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white hover:text-gray-300">
                  About
                </Link>
              </li>
            </ul>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* User Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border-2 border-white/20">
                          {user.profile_image_url ? (
                            <AvatarImage 
                              src={`${user.profile_image_url || ""}?t=${Date.now()}`} 
                              alt={user.username}
                              onError={(e) => {
                                console.error("Error loading user avatar image:", user.profile_image_url);
                                // Clear src on error to show fallback
                                e.currentTarget.src = "";
                              }}
                            />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitials()}</AvatarFallback>
                          )}
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.first_name || user.username}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      <Link href="/dashboard">
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </DropdownMenuItem>
                      </Link>
                      
                      {isInstructor && (
                        <Link href="/instructor/dashboard">
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Instructor Panel</span>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      
                      {isSeller && (
                        <Link href="/upload-resource">
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Seller Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      
                      {isCurriculumOfficer && (
                        <Link href="/admin/resources">
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Curriculum Officer Panel</span>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      
                      {isAdmin && (
                        <Link href="/admin">
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Cart Icon */}
                  <div className="relative cursor-pointer">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <Button variant="outline" className="text-white border-white">
                      Sign In
                    </Button>
                  </Link>
                  {/* Cart Icon */}
                  <div className="relative cursor-pointer">
                    <ShoppingCart className="h-6 w-6 text-white" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu - Expandable */}
        <div
          className={`lg:hidden pt-4 ${isMenuOpen ? "block" : "hidden"}`}
        >
          <ul className="flex flex-col space-y-4 pb-4">
            <li>
              <Link href="/" className="text-white text-lg">
                Home
              </Link>
            </li>
            <li>
              <Link href="/courses" className="text-white text-lg">
                Certification
              </Link>
            </li>
            <li>
              <Link href="/resources" className="text-white text-lg">
                Curriculum
              </Link>
            </li>
            <li>
              <Link href="/connect" className="text-white text-lg">
                Connect
              </Link>
            </li>
            
            {/* Add Role-Specific Links to Mobile Menu */}
            {isInstructor && (
              <li>
                <Link href="/instructor/dashboard" className="text-white text-lg">
                  Instructor Panel
                </Link>
              </li>
            )}
            
            {isSeller && (
              <li>
                <Link href="/upload-resource" className="text-white text-lg">
                  Seller Dashboard
                </Link>
              </li>
            )}
            
            {isCurriculumOfficer && (
              <li>
                <Link href="/admin/resources" className="text-white text-lg">
                  Curriculum Officer Panel
                </Link>
              </li>
            )}
            
            {isAdmin && (
              <li>
                <Link href="/admin/dashboard" className="text-white text-lg">
                  Admin Dashboard
                </Link>
              </li>
            )}
          </ul>

          {/* Mobile User Actions */}
          <div className="pt-4 pb-2 flex flex-col space-y-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full text-white border-white">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleLogout}
                  disabled={logoutMutation?.isPending}
                >
                  {logoutMutation?.isPending ? "Logging out..." : "Sign Out"}
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline" className="w-full text-white border-white">
                    Sign In
                  </Button>
                </Link>
                {/* Using regular anchor tag for mobile menu too */}
                <a href="/register">
                  <Button className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90">
                    Join Us
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}