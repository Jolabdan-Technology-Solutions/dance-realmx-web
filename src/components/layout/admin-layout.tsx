import { ReactNode, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Tag,
  Calendar,
  CreditCard,
  MessageSquare,
  Settings,
  Menu,
  X,
  ChevronRight,
  ClipboardCheck,
  LogOut,
  Home,
  Award,
  ShieldCheck,
  Palette,
  Package,
  Ticket,
  Layers,
  BarChart3,
  Store,
  DollarSign,
  BookMarked,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentLocation] = useLocation();
  const { toast } = useToast();
  const { logoutMutation, user } = useAuth();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const isAdmin = user?.role_mappings?.some(mapping => 
    mapping.role === 'ADMIN' || 
    mapping.role === 'CURRICULUM_ADMIN' || 
    mapping.role === 'INSTRUCTOR_ADMIN' || 
    mapping.role === 'COURSE_CREATOR_ADMIN'
  ) || false;

  const isCurriculumOfficer = user?.role_mappings?.some(mapping => 
    mapping.role === 'CURRICULUM_ADMIN'
  ) || false;

  const isSeller = user?.role_mappings?.some(mapping => 
    mapping.role === 'SELLER'
  ) || false;

  const isInstructor = user?.role_mappings?.some(mapping => 
    mapping.role === 'INSTRUCTOR'
  ) || false;

  const isCourseCreator = user?.role_mappings?.some(mapping => 
    mapping.role === 'COURSE_CREATOR'
  ) || false;

  const isCertificationManager = user?.role_mappings?.some(mapping => 
    mapping.role === 'CERTIFICATION_MANAGER'
  ) || false;

  const isDirectoryMember = user?.role_mappings?.some(mapping => 
    mapping.role === 'DIRECTORY_MEMBER'
  ) || false;

  const isBookingProfessional = user?.role_mappings?.some(mapping => 
    mapping.role === 'BOOKING_PROFESSIONAL'
  ) || false;

  const isBookingUser = user?.role_mappings?.some(mapping => 
    mapping.role === 'BOOKING_USER'
  ) || false;
  
  // Define navigation items for different roles
  const adminNavItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Roles & Permissions",
      href: "/admin/roles",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      title: "Course Management",
      href: "/admin/courses",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Course Creator Dashboard",
      href: "/admin/course-creator",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Course Categories",
      href: "/admin/course-categories",
      icon: <Tag className="h-5 w-5" />,
    },
    {
      title: "Certificates",
      href: "/admin/certificates",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Resources",
      href: "/admin/resources",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Curriculum Store",
      href: "/admin/curriculum",
      icon: <Store className="h-5 w-5" />,
    },
    {
      title: "Curriculum Officer Dashboard",
      href: "/admin/curriculum-officer",
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      title: "Resource Categories",
      href: "/admin/resource-categories",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Instructors",
      href: "/admin/instructors",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Dance Styles",
      href: "/admin/dance-styles",
      icon: <Palette className="h-5 w-5" />,
    },
    {
      title: "Subscription Plans",
      href: "/admin/subscription-plans",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Coupons",
      href: "/admin/coupons",
      icon: <Ticket className="h-5 w-5" />,
    },
    {
      title: "Messages",
      href: "/admin/messages",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Documentation",
      href: "/admin/documentation",
      icon: <BookMarked className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  const curriculumOfficerNavItems = [
    {
      title: "Dashboard",
      href: "/admin/curriculum-officer",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Resources",
      href: "/admin/resources",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Resource Categories",
      href: "/admin/resource-categories",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Curriculum Store",
      href: "/admin/curriculum",
      icon: <Store className="h-5 w-5" />,
    },
    {
      title: "Seller Management",
      href: "/admin/sellers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  const sellerNavItems = [
    {
      title: "Dashboard",
      href: "/seller",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "My Resources",
      href: "/seller/resources",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Add Resource",
      href: "/seller/resources/add",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Curriculum Store",
      href: "/curriculum",
      icon: <Store className="h-5 w-5 text-blue-400" />,
    },
    {
      title: "Sales Analytics",
      href: "/seller/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Payments",
      href: "/seller/payments",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Store Settings",
      href: "/seller/settings",
      icon: <Store className="h-5 w-5" />,
    },
  ];
  
  const instructorNavItems = [
    {
      title: "Dashboard",
      href: "/instructor",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "My Courses",
      href: "/instructor/courses",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      title: "Create Course",
      href: "/instructor/courses/create",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Students",
      href: "/instructor/students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Certificates",
      href: "/instructor/certificates",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Availability",
      href: "/instructor/availability",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Bookings",
      href: "/instructor/bookings",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Messages",
      href: "/instructor/messages",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/instructor/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  // Choose navigation items based on user role
  const navItems = useMemo(() => {
    if (!user) return [];
    
    switch (user.role) {
      case "admin":
        return adminNavItems;
      case "curriculum_officer":
        return curriculumOfficerNavItems;
      case "seller":
        return sellerNavItems;
      case "instructor":
        return instructorNavItems;
      default:
        return [];
    }
  }, [user]);

  // Desktop Implementation
  const DesktopSidebar = () => (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-gray-800 transition-all duration-300 ease-in-out z-50",
        isSidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-gray-700 px-4">
        {isSidebarOpen ? (
          <Link 
            href="/admin/dashboard" 
            className="flex items-center gap-2 font-semibold"
          >
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span>DanceRealmX Admin</span>
          </Link>
        ) : (
          <div className="w-6"></div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={currentLocation === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full",
                  isSidebarOpen ? "justify-start" : "justify-center px-2"
                )}
              >
                {item.icon}
                {isSidebarOpen && <span className="ml-2">{item.title}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-gray-700 p-2">
        <div className="grid gap-1">
          <Link href="/">
            <Button
              variant="ghost"
              className={cn(
                "w-full",
                isSidebarOpen ? "justify-start" : "justify-center px-2"
              )}
            >
              <Home className="h-5 w-5" />
              {isSidebarOpen && <span className="ml-2">Return to Website</span>}
            </Button>
          </Link>
          <Button
            variant="ghost"
            className={cn(
              "w-full",
              isSidebarOpen ? "justify-start" : "justify-center px-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );

  // Mobile Implementation 
  const MobileSidebar = () => (
    isSidebarOpen && (
      <>
        <aside
          className="fixed inset-y-0 left-0 z-[60] flex flex-col bg-gray-800 w-64 lg:hidden"
        >
          <div className="flex h-16 items-center justify-between border-b border-gray-700 px-4">
            <Link 
              href="/admin/dashboard" 
              className="flex items-center gap-2 font-semibold"
            >
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span>DanceRealmX Admin</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1 overflow-auto py-2">
            <nav className="grid gap-1 px-2">
              {navItems.map((item) => (
                <Link key={`mobile-${item.href}`} href={item.href}>
                  <Button
                    variant={currentLocation === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    {item.icon}
                    <span className="ml-2">
                      {item.title}
                    </span>
                  </Button>
                </Link>
              ))}
            </nav>
          </ScrollArea>
          <div className="border-t border-gray-700 p-2">
            <div className="grid gap-1">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Home className="h-5 w-5" />
                  <span className="ml-2">
                    Return to Website
                  </span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">
                  Sign Out
                </span>
              </Button>
            </div>
          </div>
        </aside>
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden" 
          onClick={toggleSidebar}
        />
      </>
    )
  );

  // Mobile Header 
  const MobileHeader = () => (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-700 bg-gray-800 px-4 lg:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <span className="font-semibold">Admin Panel</span>
      </div>
    </header>
  );

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <DesktopSidebar />
      <MobileSidebar />
      
      <div className="flex flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-auto p-4 lg:p-6 text-white bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}