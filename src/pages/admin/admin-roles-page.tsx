import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { USER_ROLES } from "@/constants/roles";
import { 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck,
  ShieldAlert,
  User,
  ShieldQuestion,
  Calendar,
  ShoppingBag,
  FileText,
  FileCog,
  GraduationCap
} from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const ROLE_DEFINITIONS = [
  {
    id: USER_ROLES.USER,
    name: "User",
    description: "Regular users can view and enroll in courses, purchase resources, and book lessons.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "book:lessons",
      "view:certificates",
    ],
    userCount: 0,
    icon: <ShieldQuestion className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.INSTRUCTOR,
    name: "Instructor",
    description: "Instructors can create courses, manage their own courses, and accept bookings.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "book:lessons",
      "view:certificates",
      "create:courses",
      "edit:own_courses",
      "create:lessons",
      "edit:own_lessons",
      "create:quizzes",
      "edit:own_quizzes",
      "view:own_students",
      "manage:own_bookings",
    ],
    userCount: 0,
    icon: <User className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.STUDENT,
    name: "Student",
    description: "Students can enroll in courses, access learning materials, and earn certificates.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "view:certificates",
    ],
    userCount: 0,
    icon: <GraduationCap className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.SELLER,
    name: "Seller",
    description: "Sellers can create and sell dance resources in the marketplace.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "create:resources",
      "edit:own_resources",
      "view:certificates",
    ],
    userCount: 0,
    icon: <ShoppingBag className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.BOOKING,
    name: "Booking",
    description: "Users with booking privileges can access the booking system.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "book:lessons",
      "manage:own_bookings",
      "view:certificates",
    ],
    userCount: 0,
    icon: <Calendar className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.BOOKING_PROVIDER,
    name: "Booking Provider",
    description: "Providers can offer bookable dance services to clients.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "manage:own_bookings",
      "view:certificates",
    ],
    userCount: 0,
    icon: <Calendar className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.BOOKING_CLIENT,
    name: "Booking Client",
    description: "Clients can book dance services from providers.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "book:lessons",
      "view:certificates",
    ],
    userCount: 0,
    icon: <User className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.CURRICULUM_OFFICER,
    name: "Curriculum Officer",
    description: "Curriculum officers can review and manage educational content.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "review:courses",
      "review:resources",
      "manage:resources",
      "view:certificates",
    ],
    userCount: 0,
    icon: <FileText className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.CURRICULUM_ADMIN,
    name: "Curriculum Admin",
    description: "Curriculum administrators have enhanced control over the curriculum system.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "review:courses",
      "edit:any_course",
      "review:resources",
      "manage:all_resources",
      "view:certificates",
      "issue:certificates",
    ],
    userCount: 0,
    icon: <FileCog className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.MODERATOR,
    name: "Moderator",
    description: "Moderators can review and approve content, manage resources, and handle user reports.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "book:lessons",
      "view:certificates",
      "review:courses",
      "review:resources",
      "manage:resources",
      "manage:reports",
      "view:users",
    ],
    userCount: 0,
    icon: <ShieldAlert className="h-4 w-4 mr-2" />
  },
  {
    id: USER_ROLES.ADMIN,
    name: "Admin",
    description: "Administrators have full access to the system and can manage all users, courses, and settings.",
    permissions: [
      "view:courses",
      "enroll:courses",
      "view:resources",
      "purchase:resources",
      "book:lessons",
      "view:certificates",
      "create:courses",
      "edit:any_course",
      "delete:any_course",
      "create:lessons",
      "edit:any_lesson",
      "delete:any_lesson",
      "create:quizzes",
      "edit:any_quiz",
      "delete:any_quiz",
      "view:all_students",
      "manage:all_bookings",
      "manage:all_resources",
      "manage:all_reports",
      "view:users",
      "edit:users",
      "delete:users",
      "manage:roles",
      "manage:system_settings",
      "manage:payments",
      "manage:subscriptions",
    ],
    userCount: 0,
    icon: <ShieldCheck className="h-4 w-4 mr-2" />
  },
];

export default function AdminRolesPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  
  // Fetch user counts per role
  const { data: userCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/roles/counts"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/users");
        const users = await res.json();
        
        // Count users by role, supporting multiple roles per user
        const counts = users.reduce((acc: Record<string, number>, user: any) => {
          // If user has roles array, count each role
          if (Array.isArray(user.roles) && user.roles.length > 0) {
            for (const role of user.roles) {
              acc[role] = (acc[role] || 0) + 1;
            }
          } 
          // Fallback to single role field if roles array is empty/missing
          else if (user.role) {
            acc[user.role] = (acc[user.role] || 0) + 1;
          }
          // Default to user role if no role info
          else {
            acc[USER_ROLES.USER] = (acc[USER_ROLES.USER] || 0) + 1;
          }
          return acc;
        }, {});
        
        return counts;
      } catch (error) {
        console.error("Failed to fetch user counts:", error);
        return {};
      }
    },
  });
  
  // Extract all available permissions from role definitions
  useEffect(() => {
    const allPermissions = Array.from(
      new Set(ROLE_DEFINITIONS.flatMap(role => role.permissions))
    ).sort();
    setAvailablePermissions(allPermissions);
  }, []);
  
  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      // This would be an API call in a real implementation
      // Since we're using in-memory storage, we'll update the ROLE_DEFINITIONS array directly
      
      // Validate role ID: lowercase, no spaces, alphanumeric with underscores only
      const roleIdRegex = /^[a-z0-9_]+$/;
      if (!roleIdRegex.test(newRoleId)) {
        throw new Error("Role ID must contain only lowercase letters, numbers, and underscores");
      }
      
      // Check if role ID already exists
      if (ROLE_DEFINITIONS.some(role => role.id === newRoleId)) {
        throw new Error("A role with this ID already exists");
      }
      
      // Add the new role to USER_ROLES
      const camelCaseId = newRoleId.toUpperCase();
      
      // Create new role
      const newRole = {
        id: newRoleId,
        name: newRoleName,
        description: newRoleDescription,
        permissions: newRolePermissions,
        userCount: 0,
        icon: <ShieldQuestion className="h-4 w-4 mr-2" />
      };
      
      // In a real implementation, this would be an API call
      // For demo, we'll add it to ROLE_DEFINITIONS
      ROLE_DEFINITIONS.push(newRole);
      
      return newRole;
    },
    onSuccess: () => {
      toast({
        title: "Role created",
        description: `The role "${newRoleName}" has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      setNewRoleName("");
      setNewRoleId("");
      setNewRoleDescription("");
      setNewRolePermissions([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roles/counts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle create role form submission
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    createRoleMutation.mutate();
  };
  
  // Toggle permission selection
  const togglePermission = (permission: string) => {
    setNewRolePermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };
  
  // Combine role definitions with user counts
  const roles = ROLE_DEFINITIONS.map(role => ({
    ...role,
    userCount: userCounts[role.id] || 0
  }));
  
  // Handle permissions display
  const formatPermission = (permission: string) => {
    const [action, resource] = permission.split(":");
    return (
      <Badge key={permission} variant="outline" className="mr-1 mb-1">
        <span className="capitalize">{action}</span>
        <span className="mx-1">:</span>
        <span className="capitalize">{resource.replace(/_/g, " ")}</span>
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-gray-400">Manage user roles and associated permissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Create a new role with custom permissions. Roles define what users can do in the system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRole}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="roleName" className="text-right">
                      Role Name
                    </Label>
                    <Input
                      id="roleName"
                      placeholder="e.g. Curriculum Officer"
                      className="col-span-3"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="roleId" className="text-right">
                      Role ID
                    </Label>
                    <Input
                      id="roleId"
                      placeholder="e.g. curriculum_officer"
                      className="col-span-3"
                      value={newRoleId}
                      onChange={(e) => setNewRoleId(e.target.value)}
                      required
                    />
                    <div className="col-span-4 col-start-2">
                      <p className="text-xs text-gray-500">
                        Use lowercase letters, numbers, and underscores only. This is used as a technical identifier.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="roleDescription" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="roleDescription"
                      placeholder="e.g. Manages curriculum resources and approvals"
                      className="col-span-3"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <Label className="text-right pt-2">
                      Permissions
                    </Label>
                    <div className="col-span-3 border rounded-md p-4 max-h-[300px] overflow-y-auto">
                      <div className="space-y-4">
                        {availablePermissions.map((permission) => {
                          const isSelected = newRolePermissions.includes(permission);
                          return (
                            <div key={permission} className="flex items-start space-x-2">
                              <input
                                type="checkbox"
                                id={`permission-${permission}`}
                                checked={isSelected}
                                onChange={() => togglePermission(permission)}
                                className="mt-1"
                              />
                              <div>
                                <Label
                                  htmlFor={`permission-${permission}`}
                                  className="font-medium cursor-pointer"
                                >
                                  {formatPermission(permission)}
                                </Label>
                                <p className="text-xs text-gray-500 mt-1">
                                  {getPermissionDescription(permission)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newRoleName || !newRoleId || !newRoleDescription || newRolePermissions.length === 0 || createRoleMutation.isPending}
                  >
                    {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/admin/roles/counts"] });
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Roles</CardTitle>
          <CardDescription>
            User roles define what users can do within the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableCaption>System roles and their permissions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-1/3">Permissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {role.icon}
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>{role.userCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap">
                        {role.permissions.slice(0, 5).map(formatPermission)}
                        {role.permissions.length > 5 && (
                          <Badge variant="outline">+{role.permissions.length - 5} more</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Note: Role permissions are enforced at both the frontend and backend levels.
          </p>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Permissions Reference</CardTitle>
          <CardDescription>
            Detailed explanation of each permission in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Group permissions by resource */}
            {(() => {
              // Extract all unique resources
              const allPermissions = ROLE_DEFINITIONS.flatMap(role => role.permissions);
              // Get unique permissions
              const uniquePermissions = Array.from(new Set(allPermissions));
              // Extract unique resources
              const resources = Array.from(new Set(uniquePermissions.map(p => p.split(":")[1])));
              
              return resources.sort().map(resource => {
                // Get all permissions for this resource (ensuring uniqueness)
                const resourcePermissions = Array.from(
                  new Set(
                    uniquePermissions
                      .filter(p => p.split(":")[1] === resource)
                  )
                ).sort();
                
                return (
                  <div key={resource} className="border-b pb-4 last:border-0">
                    <h3 className="text-lg font-semibold mb-2 capitalize">{resource.replace(/_/g, " ")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {resourcePermissions.map((permission, index) => {
                        const [action, _] = permission.split(":");
                        // Create a unique key using both permission and index
                        return (
                          <div key={`${permission}-${index}`} className="p-2 bg-gray-800 rounded">
                            <span className="font-medium capitalize">{action}</span>
                            <p className="text-xs text-gray-400 mt-1">
                              {getPermissionDescription(permission)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    "view:courses": "Can view course listings and details",
    "enroll:courses": "Can enroll in courses",
    "create:courses": "Can create new courses",
    "edit:own_courses": "Can edit courses they've created",
    "edit:any_course": "Can edit any course in the system",
    "delete:any_course": "Can delete any course in the system",
    "review:courses": "Can review and approve courses",
    
    "view:resources": "Can view resource listings and details",
    "purchase:resources": "Can purchase resources",
    "create:resources": "Can create new resources",
    "edit:own_resources": "Can edit resources they've uploaded",
    "edit:any_resource": "Can edit any resource in the system",
    "delete:any_resource": "Can delete any resource in the system",
    "manage:resources": "Can manage and moderate resources",
    "manage:all_resources": "Can manage all resources including approval",
    
    "view:certificates": "Can view their earned certificates",
    "issue:certificates": "Can issue certificates to students",
    "revoke:certificates": "Can revoke issued certificates",
    
    "book:lessons": "Can book lessons with instructors",
    "manage:own_bookings": "Can manage bookings for their own lessons",
    "manage:all_bookings": "Can manage all bookings in the system",
    
    "create:lessons": "Can create lessons within courses",
    "edit:own_lessons": "Can edit lessons they've created",
    "edit:any_lesson": "Can edit any lesson in the system",
    "delete:any_lesson": "Can delete any lesson in the system",
    
    "create:quizzes": "Can create quizzes within courses",
    "edit:own_quizzes": "Can edit quizzes they've created",
    "edit:any_quiz": "Can edit any quiz in the system",
    "delete:any_quiz": "Can delete any quiz in the system",
    
    "view:own_students": "Can view students enrolled in their courses",
    "view:all_students": "Can view all students in the system",
    
    "view:users": "Can view user profiles and information",
    "edit:users": "Can edit user profiles and roles",
    "delete:users": "Can delete user accounts",
    
    "manage:roles": "Can manage roles and permissions",
    "manage:system_settings": "Can manage system-wide settings",
    "manage:payments": "Can manage payment processing and refunds",
    "manage:subscriptions": "Can manage subscription plans and user subscriptions",
    "manage:reports": "Can manage and respond to user reports",
    "manage:all_reports": "Can manage all reports in the system",
  };
  
  return descriptions[permission] || "No description available";
}