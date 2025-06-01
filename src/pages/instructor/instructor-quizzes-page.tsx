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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MoreVertical, Plus, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Quiz {
  id: number;
  title: string;
  courseId: number;
  courseName: string;
  moduleId: number;
  moduleName: string;
  questionCount: number;
  status: string;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

export default function InstructorQuizzesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: quizzes, isLoading } = useQuery<Quiz[]>({
    queryKey: ['/api/instructor/quizzes'],
    retry: false,
  });

  const filteredQuizzes = quizzes?.filter(quiz => {
    const matchesSearch = searchTerm === "" || 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "published") return matchesSearch && quiz.status === "published";
    if (activeTab === "draft") return matchesSearch && quiz.status === "draft";
    return matchesSearch;
  });

  const duplicateQuiz = async (quizId: number) => {
    try {
      await apiRequest('POST', '/api/instructor/quizzes/duplicate', { quizId });
      toast({
        title: "Quiz duplicated",
        description: "The quiz has been duplicated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error duplicating quiz",
        description: "Failed to duplicate the quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-600">Published</Badge>;
      case "draft":
        return <Badge variant="outline" className="border-gray-600 text-gray-400">Draft</Badge>;
      case "archived":
        return <Badge className="bg-gray-600">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Quizzes</h1>
          <p className="text-gray-400">Manage your course quizzes and assessments</p>
        </div>
        <Button className="flex gap-2">
          <Plus size={16} />
          Create Quiz
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Quiz Management</CardTitle>
          <CardDescription className="text-gray-400">
            Create, edit, and monitor quizzes for your courses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search quizzes..."
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
                  <TabsTrigger value="all">All Quizzes</TabsTrigger>
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="draft">Drafts</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !filteredQuizzes?.length ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm ? (
                <p>No quizzes match your search criteria</p>
              ) : (
                <p>No quizzes created yet</p>
              )}
            </div>
          ) : (
            <div className="border rounded-md border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-gray-800/50 border-gray-800">
                    <TableHead className="text-gray-400 w-[300px]">Quiz Title</TableHead>
                    <TableHead className="text-gray-400">Course</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Questions</TableHead>
                    <TableHead className="text-gray-400">Passing Score</TableHead>
                    <TableHead className="text-gray-400">Last Updated</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes?.map((quiz) => (
                    <TableRow key={quiz.id} className="hover:bg-gray-800/50 border-gray-800">
                      <TableCell className="font-medium text-white">
                        {quiz.title}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {quiz.courseName}
                      </TableCell>
                      <TableCell>{getStatusBadge(quiz.status)}</TableCell>
                      <TableCell className="text-gray-300">{quiz.questionCount}</TableCell>
                      <TableCell className="text-gray-300">{quiz.passingScore}%</TableCell>
                      <TableCell className="text-gray-400">
                        {formatDate(quiz.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-white">
                            <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer hover:bg-gray-800"
                              onClick={() => duplicateQuiz(quiz.id)}
                            >
                              Duplicate
                            </DropdownMenuItem>
                            {quiz.status === "draft" ? (
                              <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                                Publish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                                Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 text-red-500">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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