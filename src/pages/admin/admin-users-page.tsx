// import { useState } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { Link } from "wouter";
// import {
//   Users,
//   Filter,
//   Plus,
//   RefreshCw,
//   Edit,
//   Trash2,
//   Check,
//   X,
//   Shield,
//   Mail,
//   User,
//   Search,
//   Calendar,
//   ShoppingBag,
//   FileText,
//   FileCog,
//   GraduationCap
// } from "lucide-react";
// import { apiRequest, queryClient } from "@/lib/queryClient";
// import { useToast } from "@/hooks/use-toast";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCaption,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { USER_ROLES } from "@/constants/roles";

// interface User {
//   id: number;
//   username: string;
//   first_name: string | null;
//   last_name: string | null;
//   email: string | null;
//   profile_image_url: string | null;
//   role: string;
//   created_at: Date | null;
// }

// export default function AdminUsersPage() {
//   const { toast } = useToast();
//   const [searchQuery, setSearchQuery] = useState("");
//   const [roleFilter, setRoleFilter] = useState<string | null>(null);
//   const [statusFilter, setStatusFilter] = useState<string | null>(null);
//   const [subscriptionFilter, setSubscriptionFilter] = useState<string | null>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(10);
//   const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
//   const [userToDelete, setUserToDelete] = useState<number | null>(null);

//   // Fetch users
//   const { data: users = [], isLoading, refetch } = useQuery<User[]>({
//     queryKey: ["/api/admin/users"],
//     queryFn: async () => {
//       const res = await apiRequest("GET", "/api/admin/users");
//       return res.json();
//     },
//   });

//   // Delete user
//   const deleteUserMutation = useMutation({
//     mutationFn: async (userId: number) => {
//       await apiRequest("DELETE", `/api/admin/users/${userId}`);
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "User deleted successfully",
//       });
//       setIsConfirmDialogOpen(false);
//       setUserToDelete(null);
//       queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Error",
//         description: `Failed to delete user: ${error.message}`,
//         variant: "destructive",
//       });
//     },
//   });

//   // Toggle user role (instructor)
//   const toggleRoleMutation = useMutation({
//     mutationFn: async ({ userId, isInstructor }: { userId: number, isInstructor: boolean }) => {
//       const res = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, {
//         isInstructor
//       });
//       return res.json();
//     },
//     onSuccess: () => {
//       toast({
//         title: "Success",
//         description: "User role updated successfully",
//       });
//       queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Error",
//         description: `Failed to update user role: ${error.message}`,
//         variant: "destructive",
//       });
//     },
//   });

//   // Filter users based on search query and filters
//   const filteredUsers = users.filter(user => {
//     const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

//     const matchesSearch =
//       searchQuery === "" ||
//       user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));

//     const matchesRole = roleFilter === null || user.role === roleFilter;
//     const matchesStatus = statusFilter === null || user.status === statusFilter;
//     const matchesSubscription = subscriptionFilter === null || user.subscriptionPlan === subscriptionFilter;

//     return matchesSearch && matchesRole && matchesStatus && matchesSubscription;
//   });

//   // Pagination
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

//   // Handle delete click
//   const handleDeleteClick = (userId: number) => {
//     setUserToDelete(userId);
//     setIsConfirmDialogOpen(true);
//   };

//   const confirmDelete = () => {
//     if (userToDelete !== null) {
//       deleteUserMutation.mutate(userToDelete);
//     }
//   };

//   // Handle toggle instructor role
//   const handleToggleInstructor = (userId: number, currentIsInstructor: boolean | null) => {
//     toggleRoleMutation.mutate({
//       userId,
//       isInstructor: !(currentIsInstructor === true)
//     });
//   };

//   // Format date
//   const formatDate = (date: Date | null) => {
//     if (!date) return "—";
//     return new Date(date).toLocaleDateString();
//   };

//   // Get role badge for a single role
//   const getSingleRoleBadge = (role: string) => {
//     switch (role) {
//       case USER_ROLES.ADMIN:
//         return (
//           <Badge key={role} className="bg-red-600 hover:bg-red-700">
//             <Shield className="w-3 h-3 mr-1" />
//             Admin
//           </Badge>
//         );
//       case USER_ROLES.INSTRUCTOR:
//         return (
//           <Badge key={role} className="bg-blue-600 hover:bg-blue-700">
//             <User className="w-3 h-3 mr-1" />
//             Instructor
//           </Badge>
//         );
//       case USER_ROLES.MODERATOR:
//         return (
//           <Badge key={role} className="bg-yellow-600 hover:bg-yellow-700">
//             <Shield className="w-3 h-3 mr-1" />
//             Moderator
//           </Badge>
//         );
//       case USER_ROLES.SELLER:
//         return (
//           <Badge key={role} className="bg-green-600 hover:bg-green-700">
//             <ShoppingBag className="w-3 h-3 mr-1" />
//             Seller
//           </Badge>
//         );
//       case USER_ROLES.BOOKING:
//         return (
//           <Badge key={role} className="bg-indigo-600 hover:bg-indigo-700">
//             <Calendar className="w-3 h-3 mr-1" />
//             Booking
//           </Badge>
//         );
//       case USER_ROLES.BOOKING_PROVIDER:
//         return (
//           <Badge key={role} className="bg-indigo-600 hover:bg-indigo-700">
//             <Calendar className="w-3 h-3 mr-1" />
//             Booking Provider
//           </Badge>
//         );
//       case USER_ROLES.BOOKING_CLIENT:
//         return (
//           <Badge key={role} className="bg-sky-600 hover:bg-sky-700">
//             <User className="w-3 h-3 mr-1" />
//             Booking Client
//           </Badge>
//         );
//       case USER_ROLES.CURRICULUM_OFFICER:
//         return (
//           <Badge key={role} className="bg-purple-600 hover:bg-purple-700">
//             <FileText className="w-3 h-3 mr-1" />
//             Curriculum Officer
//           </Badge>
//         );
//       case USER_ROLES.CURRICULUM_ADMIN:
//         return (
//           <Badge key={role} className="bg-purple-800 hover:bg-purple-900">
//             <FileCog className="w-3 h-3 mr-1" />
//             Curriculum Admin
//           </Badge>
//         );
//       case USER_ROLES.STUDENT:
//         return (
//           <Badge key={role} className="bg-teal-600 hover:bg-teal-700">
//             <GraduationCap className="w-3 h-3 mr-1" />
//             Student
//           </Badge>
//         );
//       default:
//         return (
//           <Badge key={role} variant="outline">
//             <User className="w-3 h-3 mr-1" />
//             {role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}
//           </Badge>
//         );
//     }
//   };

//   // Get role badges for user (can have multiple roles)
//   const getRoleBadge = (user: User) => {
//     // If user has roles array, use that
//     if (user.roles && user.roles.length > 0) {
//       return (
//         <div className="flex flex-wrap gap-1">
//           {user.roles.map(role => getSingleRoleBadge(role))}
//         </div>
//       );
//     }

//     // Fallback to single role field if roles array is not available
//     if (user.role) {
//       return getSingleRoleBadge(user.role);
//     }

//     // Default if no roles are found
//     return (
//       <Badge variant="outline">
//         <User className="w-3 h-3 mr-1" />
//         User
//       </Badge>
//     );
//   };

//   // Get subscription badge
//   const getSubscriptionBadge = (plan: string | null, status: string | null) => {
//     if (!plan) return null;

//     let color;
//     switch (plan.toLowerCase()) {
//       case 'free':
//         color = 'bg-gray-600 hover:bg-gray-700';
//         break;
//       case 'educator':
//         color = 'bg-green-600 hover:bg-green-700';
//         break;
//       case 'premium':
//         color = 'bg-blue-600 hover:bg-blue-700';
//         break;
//       case 'royalty':
//         color = 'bg-purple-600 hover:bg-purple-700';
//         break;
//       default:
//         color = 'bg-gray-600 hover:bg-gray-700';
//     }

//     return (
//       <Badge className={color}>
//         {plan}
//         {status && status.toLowerCase() !== 'active' && (
//           <span className="ml-1 text-xs">
//             ({status})
//           </span>
//         )}
//       </Badge>
//     );
//   };

//   // Get status badge
//   const getStatusBadge = (status: string | null) => {
//     if (!status) return null;

//     switch (status.toLowerCase()) {
//       case 'active':
//         return (
//           <Badge className="bg-green-600 hover:bg-green-700">
//             <Check className="w-3 h-3 mr-1" />
//             Active
//           </Badge>
//         );
//       case 'inactive':
//         return (
//           <Badge variant="outline" className="text-gray-400">
//             <X className="w-3 h-3 mr-1" />
//             Inactive
//           </Badge>
//         );
//       case 'suspended':
//         return (
//           <Badge className="bg-red-600 hover:bg-red-700">
//             <X className="w-3 h-3 mr-1" />
//             Suspended
//           </Badge>
//         );
//       default:
//         return (
//           <Badge variant="outline">
//             {status}
//           </Badge>
//         );
//     }
//   };

//   // Get user display name
//   const getUserDisplayName = (user: User) => {
//     if (user.first_name && user.last_name) {
//       return `${user.first_name} ${user.last_name}`;
//     }
//     return user.username;
//   };

//   // Get avatar initials
//   const getAvatarInitials = (user: User) => {
//     if (user.first_name && user.last_name) {
//       return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
//     }
//     return user.username.substring(0, 2).toUpperCase();
//   };

//   return (
//     <>
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
//             <p className="text-gray-400">Manage all users in the system</p>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Button
//               variant="outline"
//               onClick={() => refetch()}
//             >
//               <RefreshCw className="w-4 h-4 mr-2" />
//               Refresh
//             </Button>
//             <Link href="/admin/users/create">
//               <Button className="bg-green-600 hover:bg-green-700">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Create User
//               </Button>
//             </Link>
//           </div>
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle>Users</CardTitle>
//             <CardDescription>View and manage all users</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
//               <div className="relative w-full md:w-64">
//                 <Input
//                   placeholder="Search users..."
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                   className="pl-10"
//                 />
//                 <div className="absolute left-3 top-3 text-gray-400">
//                   <Search className="h-4 w-4" />
//                 </div>
//               </div>

//               <Select
//                 value={roleFilter || "all_roles"}
//                 onValueChange={(value) => setRoleFilter(value === "all_roles" ? null : value)}
//               >
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Filter by role" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all_roles">All Roles</SelectItem>
//                   <SelectItem value={USER_ROLES.ADMIN}>Admin</SelectItem>
//                   <SelectItem value={USER_ROLES.INSTRUCTOR}>Instructor</SelectItem>
//                   <SelectItem value={USER_ROLES.MODERATOR}>Moderator</SelectItem>
//                   <SelectItem value={USER_ROLES.USER}>User</SelectItem>
//                   <SelectItem value={USER_ROLES.SELLER}>Seller</SelectItem>
//                   <SelectItem value={USER_ROLES.BOOKING}>Booking</SelectItem>
//                   <SelectItem value={USER_ROLES.BOOKING_PROVIDER}>Booking Provider</SelectItem>
//                   <SelectItem value={USER_ROLES.BOOKING_CLIENT}>Booking Client</SelectItem>
//                   <SelectItem value={USER_ROLES.CURRICULUM_OFFICER}>Curriculum Officer</SelectItem>
//                   <SelectItem value={USER_ROLES.CURRICULUM_ADMIN}>Curriculum Admin</SelectItem>
//                   <SelectItem value={USER_ROLES.STUDENT}>Student</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Select
//                 value={statusFilter || "all_statuses"}
//                 onValueChange={(value) => setStatusFilter(value === "all_statuses" ? null : value)}
//               >
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Filter by status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all_statuses">All Statuses</SelectItem>
//                   <SelectItem value="active">Active</SelectItem>
//                   <SelectItem value="inactive">Inactive</SelectItem>
//                   <SelectItem value="suspended">Suspended</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Select
//                 value={subscriptionFilter || "all_subscriptions"}
//                 onValueChange={(value) => setSubscriptionFilter(value === "all_subscriptions" ? null : value)}
//               >
//                 <SelectTrigger className="w-full md:w-48">
//                   <SelectValue placeholder="Filter by subscription" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all_subscriptions">All Subscriptions</SelectItem>
//                   <SelectItem value="free">Free</SelectItem>
//                   <SelectItem value="educator">Educator</SelectItem>
//                   <SelectItem value="premium">Premium</SelectItem>
//                   <SelectItem value="royalty">Royalty</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {isLoading ? (
//               <div className="py-24 flex items-center justify-center">
//                 <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
//               </div>
//             ) : (
//               <>
//                 <div className="rounded-md border">
//                   <Table>
//                     <TableCaption>A list of all users</TableCaption>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>User</TableHead>
//                         <TableHead>Email</TableHead>
//                         <TableHead>Role</TableHead>
//                         <TableHead>Status</TableHead>
//                         <TableHead>Subscription</TableHead>
//                         <TableHead>Created</TableHead>
//                         <TableHead className="text-right">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {currentUsers.length === 0 ? (
//                         <TableRow>
//                           <TableCell colSpan={7} className="text-center py-10">
//                             No users found matching your criteria
//                           </TableCell>
//                         </TableRow>
//                       ) : (
//                         currentUsers.map((user) => (
//                           <TableRow key={user.id}>
//                             <TableCell>
//                               <div className="flex items-center space-x-3">
//                                 <Avatar>
//                                   <AvatarImage src={user.profile_image_url || undefined} alt={getUserDisplayName(user)} />
//                                   <AvatarFallback>{getAvatarInitials(user)}</AvatarFallback>
//                                 </Avatar>
//                                 <div>
//                                   <div className="font-medium">{getUserDisplayName(user)}</div>
//                                   <div className="text-sm text-gray-500">@{user.username}</div>
//                                 </div>
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               {user.email ? (
//                                 <div className="flex items-center space-x-1">
//                                   <Mail className="w-3 h-3" />
//                                   <span>{user.email}</span>
//                                 </div>
//                               ) : (
//                                 "—"
//                               )}
//                             </TableCell>
//                             <TableCell>{getRoleBadge(user)}</TableCell>
//                             <TableCell>{getStatusBadge(user.status)}</TableCell>
//                             <TableCell>{getSubscriptionBadge(user.subscriptionPlan, user.subscriptionStatus)}</TableCell>
//                             <TableCell>{formatDate(user.created_at)}</TableCell>
//                             <TableCell className="text-right">
//                               <div className="flex justify-end space-x-2">
//                                 <Button
//                                   variant="outline"
//                                   size="icon"
//                                   onClick={() => handleToggleInstructor(user.id, user.isInstructor)}
//                                   title={user.isInstructor ? "Remove instructor role" : "Add instructor role"}
//                                   disabled={toggleRoleMutation.isPending}
//                                 >
//                                   <User className="h-4 w-4" />
//                                 </Button>
//                                 <Link href={`/admin/users/${user.id}`}>
//                                   <Button variant="outline" size="icon" title="Edit user">
//                                     <Edit className="h-4 w-4" />
//                                   </Button>
//                                 </Link>
//                                 <Button
//                                   variant="destructive"
//                                   size="icon"
//                                   onClick={() => handleDeleteClick(user.id)}
//                                   disabled={deleteUserMutation.isPending || user.role === USER_ROLES.ADMIN}
//                                   title="Delete user"
//                                 >
//                                   <Trash2 className="h-4 w-4" />
//                                 </Button>
//                               </div>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       )}
//                     </TableBody>
//                   </Table>
//                 </div>

//                 {totalPages > 1 && (
//                   <Pagination className="mt-4">
//                     <PaginationContent>
//                       <PaginationItem>
//                         <PaginationPrevious
//                           onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
//                           className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
//                         />
//                       </PaginationItem>
//                       <PaginationItem>
//                         <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
//                       </PaginationItem>
//                       <PaginationItem>
//                         <PaginationNext
//                           onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
//                           className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
//                         />
//                       </PaginationItem>
//                     </PaginationContent>
//                   </Pagination>
//                 )}
//               </>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Confirmation Dialog */}
//       <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Confirm User Deletion</DialogTitle>
//             <DialogDescription>
//               Are you sure you want to delete this user? This action cannot be undone, and all associated data will also be deleted, including course enrollments, certificates, and payment history.
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button
//               variant="outline"
//               onClick={() => setIsConfirmDialogOpen(false)}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="destructive"
//               onClick={confirmDelete}
//               disabled={deleteUserMutation.isPending}
//             >
//               {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Users,
  Filter,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Check,
  X,
  Shield,
  Mail,
  User,
  Search,
  Calendar,
  ShoppingBag,
  FileText,
  FileCog,
  GraduationCap,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Updated interface to match your API response
interface User {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  profile_image_url: string | null;
  role: string[]; // Array of roles from API
  created_at: string; // ISO string from API
  updated_at: string;
  subscription_tier: string | null; // Changed from subscriptionPlan
}

// Role constants matching your API
const USER_ROLES = {
  ADMIN: "ADMIN",
  INSTRUCTOR: "INSTRUCTOR",
  INSTRUCTOR_ADMIN: "INSTRUCTOR_ADMIN",
  STUDENT: "STUDENT",
  MODERATOR: "MODERATOR",
  USER: "USER",
  SELLER: "SELLER",
  BOOKING: "BOOKING",
  BOOKING_PROVIDER: "BOOKING_PROVIDER",
  BOOKING_CLIENT: "BOOKING_CLIENT",
  CURRICULUM_OFFICER: "CURRICULUM_OFFICER",
  CURRICULUM_ADMIN: "CURRICULUM_ADMIN",
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [subscriptionFilter, setSubscriptionFilter] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // Fetch users - Updated to use correct endpoint
  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // Temporary direct fetch - replace with fixed apiRequest later
      const res = await fetch("https://api.livetestdomain.com/api/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authentication if required:
          // 'Authorization': 'Bearer your-token-here',
          // 'X-API-Key': 'your-api-key',
          // Or whatever auth your API uses
        },
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP error! status: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      console.log("Received data:", data);
      return data;
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest(`/api/users/${userId}`, {
        method: "DELETE",
        requireAuth: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsConfirmDialogOpen(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle user role (instructor)
  const toggleRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      roles,
    }: {
      userId: number;
      roles: string[];
    }) => {
      const res = await apiRequest(`/api/users/${userId}`, {
        method: "PATCH",
        data: {
          role: roles, // Send as role array
        },
        requireAuth: true,
      });
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update user role: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter users based on search query and filters
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

    const matchesSearch =
      searchQuery === "" ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === null || user.role.includes(roleFilter);
    const matchesSubscription =
      subscriptionFilter === null ||
      user.subscription_tier === subscriptionFilter;

    return matchesSearch && matchesRole && matchesSubscription;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle delete click
  const handleDeleteClick = (userId: number) => {
    setUserToDelete(userId);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete !== null) {
      deleteUserMutation.mutate(userToDelete);
    }
  };

  // Handle toggle instructor role
  const handleToggleInstructor = (userId: number, currentRoles: string[]) => {
    const hasInstructor = currentRoles.includes(USER_ROLES.INSTRUCTOR);
    let newRoles;

    if (hasInstructor) {
      // Remove instructor role
      newRoles = currentRoles.filter((role) => role !== USER_ROLES.INSTRUCTOR);
    } else {
      // Add instructor role
      newRoles = [...currentRoles, USER_ROLES.INSTRUCTOR];
    }

    toggleRoleMutation.mutate({
      userId,
      roles: newRoles,
    });
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString();
  };

  // Get role badge for a single role
  const getSingleRoleBadge = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return (
          <Badge key={role} className="bg-red-600 hover:bg-red-700">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      case USER_ROLES.INSTRUCTOR:
        return (
          <Badge key={role} className="bg-blue-600 hover:bg-blue-700">
            <User className="w-3 h-3 mr-1" />
            Instructor
          </Badge>
        );
      case USER_ROLES.INSTRUCTOR_ADMIN:
        return (
          <Badge key={role} className="bg-blue-800 hover:bg-blue-900">
            <User className="w-3 h-3 mr-1" />
            Instructor Admin
          </Badge>
        );
      case USER_ROLES.MODERATOR:
        return (
          <Badge key={role} className="bg-yellow-600 hover:bg-yellow-700">
            <Shield className="w-3 h-3 mr-1" />
            Moderator
          </Badge>
        );
      case USER_ROLES.SELLER:
        return (
          <Badge key={role} className="bg-green-600 hover:bg-green-700">
            <ShoppingBag className="w-3 h-3 mr-1" />
            Seller
          </Badge>
        );
      case USER_ROLES.BOOKING:
        return (
          <Badge key={role} className="bg-indigo-600 hover:bg-indigo-700">
            <Calendar className="w-3 h-3 mr-1" />
            Booking
          </Badge>
        );
      case USER_ROLES.BOOKING_PROVIDER:
        return (
          <Badge key={role} className="bg-indigo-600 hover:bg-indigo-700">
            <Calendar className="w-3 h-3 mr-1" />
            Booking Provider
          </Badge>
        );
      case USER_ROLES.BOOKING_CLIENT:
        return (
          <Badge key={role} className="bg-sky-600 hover:bg-sky-700">
            <User className="w-3 h-3 mr-1" />
            Booking Client
          </Badge>
        );
      case USER_ROLES.CURRICULUM_OFFICER:
        return (
          <Badge key={role} className="bg-purple-600 hover:bg-purple-700">
            <FileText className="w-3 h-3 mr-1" />
            Curriculum Officer
          </Badge>
        );
      case USER_ROLES.CURRICULUM_ADMIN:
        return (
          <Badge key={role} className="bg-purple-800 hover:bg-purple-900">
            <FileCog className="w-3 h-3 mr-1" />
            Curriculum Admin
          </Badge>
        );
      case USER_ROLES.STUDENT:
        return (
          <Badge key={role} className="bg-teal-600 hover:bg-teal-700">
            <GraduationCap className="w-3 h-3 mr-1" />
            Student
          </Badge>
        );
      default:
        return (
          <Badge key={role} variant="outline">
            <User className="w-3 h-3 mr-1" />
            {role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ")}
          </Badge>
        );
    }
  };

  // Get role badges for user (updated to use role array from API)
  const getRoleBadge = (user: User) => {
    if (user.role && user.role.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {user.role.map((role) => getSingleRoleBadge(role))}
        </div>
      );
    }

    // Default if no roles are found
    return (
      <Badge variant="outline">
        <User className="w-3 h-3 mr-1" />
        User
      </Badge>
    );
  };

  // Get subscription badge (updated to use subscription_tier)
  const getSubscriptionBadge = (tier: string | null) => {
    if (!tier)
      return (
        <Badge variant="outline" className="text-gray-400">
          No Subscription
        </Badge>
      );

    let color;
    switch (tier.toLowerCase()) {
      case "nobility":
        color = "bg-purple-600 hover:bg-purple-700";
        break;
      case "free":
        color = "bg-gray-600 hover:bg-gray-700";
        break;
      case "educator":
        color = "bg-green-600 hover:bg-green-700";
        break;
      case "premium":
        color = "bg-blue-600 hover:bg-blue-700";
        break;
      default:
        color = "bg-gray-600 hover:bg-gray-700";
    }

    return <Badge className={color}>{tier}</Badge>;
  };

  // Get user display name
  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  // Get avatar initials
  const getAvatarInitials = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>
            <p className="text-gray-400">Manage all users in the system</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/admin/users/create">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>View and manage all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 mb-6">
              <div className="relative w-full md:w-64">
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
              </div>

              <Select
                value={roleFilter || "all_roles"}
                onValueChange={(value) =>
                  setRoleFilter(value === "all_roles" ? null : value)
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_roles">All Roles</SelectItem>
                  <SelectItem value={USER_ROLES.ADMIN}>Admin</SelectItem>
                  <SelectItem value={USER_ROLES.INSTRUCTOR}>
                    Instructor
                  </SelectItem>
                  <SelectItem value={USER_ROLES.INSTRUCTOR_ADMIN}>
                    Instructor Admin
                  </SelectItem>
                  <SelectItem value={USER_ROLES.STUDENT}>Student</SelectItem>
                  <SelectItem value={USER_ROLES.MODERATOR}>
                    Moderator
                  </SelectItem>
                  <SelectItem value={USER_ROLES.USER}>User</SelectItem>
                  <SelectItem value={USER_ROLES.SELLER}>Seller</SelectItem>
                  <SelectItem value={USER_ROLES.BOOKING}>Booking</SelectItem>
                  <SelectItem value={USER_ROLES.BOOKING_PROVIDER}>
                    Booking Provider
                  </SelectItem>
                  <SelectItem value={USER_ROLES.BOOKING_CLIENT}>
                    Booking Client
                  </SelectItem>
                  <SelectItem value={USER_ROLES.CURRICULUM_OFFICER}>
                    Curriculum Officer
                  </SelectItem>
                  <SelectItem value={USER_ROLES.CURRICULUM_ADMIN}>
                    Curriculum Admin
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={subscriptionFilter || "all_subscriptions"}
                onValueChange={(value) =>
                  setSubscriptionFilter(
                    value === "all_subscriptions" ? null : value
                  )
                }
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by subscription" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_subscriptions">
                    All Subscriptions
                  </SelectItem>
                  <SelectItem value="NOBILITY">Nobility</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="educator">Educator</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="py-24 flex items-center justify-center">
                <div
                  className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                  aria-label="Loading"
                />
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableCaption>A list of all users</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            No users found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage
                                    src={user.profile_image_url || undefined}
                                    alt={getUserDisplayName(user)}
                                  />
                                  <AvatarFallback>
                                    {getAvatarInitials(user)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {getUserDisplayName(user)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.email ? (
                                <div className="flex items-center space-x-1">
                                  <Mail className="w-3 h-3" />
                                  <span>{user.email}</span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>{getRoleBadge(user)}</TableCell>
                            <TableCell>
                              {getSubscriptionBadge(user.subscription_tier)}
                            </TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleToggleInstructor(user.id, user.role)
                                  }
                                  title={
                                    user.role.includes(USER_ROLES.INSTRUCTOR)
                                      ? "Remove instructor role"
                                      : "Add instructor role"
                                  }
                                  disabled={toggleRoleMutation.isPending}
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                                <Link href={`/admin/users/${user.id}`}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title="Edit user"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDeleteClick(user.id)}
                                  disabled={
                                    deleteUserMutation.isPending ||
                                    user.role.includes(USER_ROLES.ADMIN)
                                  }
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm User Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone, and all associated data will also be deleted, including
              course enrollments, certificates, and payment history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
