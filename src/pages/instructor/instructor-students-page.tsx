import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mail, Search, UserPlus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string | null;
  enrollmentStatus: string;
  progress: number;
  lastActive?: string;
}

export default function InstructorStudentsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['/api/instructor/students'],
    retry: false,
  });

  const filteredStudents = students?.filter(student => {
    const matchesSearch = searchTerm === "" || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && student.enrollmentStatus === "active";
    if (activeTab === "inactive") return matchesSearch && student.enrollmentStatus !== "active";
    return matchesSearch;
  });

  const sendInviteEmail = async (studentId: string) => {
    try {
      await apiRequest('/api/instructor/students/invite', { method: 'POST', data: { studentId } });
      toast({
        title: "Invitation sent",
        description: "The student has been sent an email invitation.",
      });
    } catch (error) {
      toast({
        title: "Error sending invitation",
        description: "Failed to send the invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>;
      case "completed":
        return <Badge className="bg-blue-600">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Students</h1>
          <p className="text-gray-400">Manage your course students</p>
        </div>
        <Button className="flex gap-2">
          <UserPlus size={16} />
          Add Student
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Student Management</CardTitle>
          <CardDescription className="text-gray-400">
            View and manage all students enrolled in your courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search students..."
                className="pl-8 bg-gray-800 border-gray-700 text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  className="absolute right-2 top-2.5"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
            <div>
              <Tabs defaultValue="all" className="w-[400px]" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 bg-gray-800">
                  <TabsTrigger value="all">All Students</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !filteredStudents?.length ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? (
                <p>No students match your search criteria</p>
              ) : (
                <p>No students enrolled yet</p>
              )}
            </div>
          ) : (
            <div className="border rounded-md border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-800/50 border-gray-800">
                    <TableHead className="text-gray-400 w-[300px]">Name</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Progress</TableHead>
                    <TableHead className="text-gray-400">Last Active</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents?.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-800/50 border-gray-800">
                      <TableCell className="font-medium flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {student.profileImageUrl ? (
                            <AvatarImage src={student.profileImageUrl} alt={`${student.firstName} ${student.lastName}`} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(`${student.firstName} ${student.lastName}`)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="text-white font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-gray-400 text-sm">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.enrollmentStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-sm whitespace-nowrap">
                            {student.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {student.lastActive ? student.lastActive : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sendInviteEmail(student.id)}
                            title="Send email invitation"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">View</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}