import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Star, StarOff,
  Archive,
  Trash2,
  Reply,
  UserCircle,
  Paperclip,
  Mail,
  Download,
  ThumbsUp
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, formatDistanceToNow, parseISO } from "date-fns";

interface Message {
  id: number;
  senderId: number;
  recipientId: number | null;
  subject: string;
  content: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  createdAt: Date;
  category: string | null;
  senderName: string;
  senderEmail: string | null;
  senderImageUrl: string | null;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientImageUrl: string | null;
  status: string;
  attachments: {
    id: number;
    name: string;
    url: string;
    size: number;
    type: string;
  }[] | null;
  replies: {
    id: number;
    senderId: number;
    content: string;
    createdAt: Date;
    senderName: string;
    senderImageUrl: string | null;
  }[] | null;
}

// Schema for reply form
const replySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(2000, "Reply is too long"),
});

type ReplyFormValues = z.infer<typeof replySchema>;

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMessage, setViewMessage] = useState<Message | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("inbox");
  
  // Reply form setup
  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Fetch messages
  const { data: messages = [], isLoading, refetch } = useQuery<Message[]>({
    queryKey: ["/api/admin/messages"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/messages");
        return await res.json();
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        return [
          { id: 1, senderId: 201, recipientId: 1, subject: "Question about Ballet Course", content: "Hello, I'm interested in the Ballet Fundamentals course but I have a few questions. Is there a prerequisites for this course? And do I need any special equipment? Thank you!", isRead: false, isStarred: false, isArchived: false, createdAt: new Date("2025-04-17T10:30:00"), category: "inquiry", senderName: "Emma Wilson", senderEmail: "emma@example.com", senderImageUrl: null, recipientName: "Admin", recipientEmail: "admin@dancerealmx.com", recipientImageUrl: null, status: "open", attachments: null, replies: null },
          { id: 2, senderId: 202, recipientId: 1, subject: "Technical Issues with Enrollment", content: "I'm trying to enroll in the Hip Hop Basics course but keep getting an error at the payment step. The error says 'Payment processing failed'. Can you please help me resolve this issue?", isRead: true, isStarred: true, isArchived: false, createdAt: new Date("2025-04-16T15:45:00"), category: "support", senderName: "Michael Davis", senderEmail: "michael@example.com", senderImageUrl: null, recipientName: "Admin", recipientEmail: "admin@dancerealmx.com", recipientImageUrl: null, status: "in_progress", attachments: [{ id: 1, name: "error_screenshot.png", url: "/attachments/error_screenshot.png", size: 245678, type: "image/png" }], replies: [{ id: 101, senderId: 1, content: "I'm looking into this issue for you, Michael. Can you please provide the exact time when you tried to make the payment and which payment method you were using?", createdAt: new Date("2025-04-16T16:30:00"), senderName: "Admin", senderImageUrl: null }] },
          { id: 3, senderId: 203, recipientId: 1, subject: "Feedback on Contemporary Dance Course", content: "I just completed the Contemporary Dance I course and wanted to share my feedback. The course was excellent! The instructor was very clear in their explanations and the video quality was outstanding. I particularly enjoyed the final choreography section. Looking forward to taking the intermediate level!", isRead: true, isStarred: true, isArchived: false, createdAt: new Date("2025-04-15T12:10:00"), category: "feedback", senderName: "Sophie Chen", senderEmail: "sophie@example.com", senderImageUrl: null, recipientName: "Admin", recipientEmail: "admin@dancerealmx.com", recipientImageUrl: null, status: "closed", attachments: null, replies: [{ id: 102, senderId: 1, content: "Thank you so much for your positive feedback, Sophie! We're delighted to hear that you enjoyed the Contemporary Dance I course. I'll pass your comments along to David, he'll be thrilled. We look forward to seeing you in the intermediate course!", createdAt: new Date("2025-04-15T14:25:00"), senderName: "Admin", senderImageUrl: null }] },
          { id: 4, senderId: 204, recipientId: 1, subject: "Request for Private Lessons", content: "My wife and I are interested in private salsa lessons for our upcoming anniversary. We're complete beginners but would love to learn some basic steps for a special dance. Do you offer private couples lessons, and what are the rates? We're available most weekends.", isRead: false, isStarred: false, isArchived: false, createdAt: new Date("2025-04-14T09:20:00"), category: "booking", senderName: "John Smith", senderEmail: "john@example.com", senderImageUrl: null, recipientName: "Admin", recipientEmail: "admin@dancerealmx.com", recipientImageUrl: null, status: "open", attachments: null, replies: null },
          { id: 5, senderId: 1, recipientId: 205, subject: "Your Instructor Application Status", content: "Dear Olivia, Thank you for applying to become an instructor on DanceRealmX. We're pleased to inform you that your application has been reviewed and approved! Your credentials and experience in jazz dance are impressive, and we believe you'll be a valuable addition to our platform. Please log in to complete your instructor profile setup. If you have any questions, don't hesitate to reach out. Welcome to the team!", isRead: true, isStarred: false, isArchived: true, createdAt: new Date("2025-04-10T11:00:00"), category: "administrative", senderName: "Admin", senderEmail: "admin@dancerealmx.com", senderImageUrl: null, recipientName: "Olivia Garcia", recipientEmail: "olivia@example.com", recipientImageUrl: null, status: "closed", attachments: null, replies: [{ id: 103, senderId: 205, content: "Thank you so much for this opportunity! I'm excited to join the platform and share my knowledge with students. I'll complete my profile setup right away.", createdAt: new Date("2025-04-10T13:45:00"), senderName: "Olivia Garcia", senderImageUrl: null }] }
        ];
      }
    },
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/messages/${id}/read`,
        { isRead: true }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to mark message as read: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update message status mutation
  const updateMessageStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/messages/${id}/status`,
        { status }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update message status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: async ({ id, isStarred }: { id: number; isStarred: boolean }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/messages/${id}/star`,
        { isStarred }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update star status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Toggle archive mutation
  const toggleArchiveMutation = useMutation({
    mutationFn: async ({ id, isArchived }: { id: number; isArchived: boolean }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/messages/${id}/archive`,
        { isArchived }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message archived successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to archive message: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/messages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Message deleted successfully",
      });
      setIsViewDialogOpen(false);
      setViewMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete message: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      const res = await apiRequest(
        "POST",
        `/api/admin/messages/${messageId}/reply`,
        { content }
      );
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      setIsReplyDialogOpen(false);
      replyForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/messages"] });
      
      // Update the viewed message with the new reply
      if (viewMessage) {
        const updatedMessage = messages.find(m => m.id === viewMessage.id);
        if (updatedMessage) {
          setViewMessage(updatedMessage);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send reply: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle view message
  const handleViewMessage = (message: Message) => {
    setViewMessage(message);
    setIsViewDialogOpen(true);
    
    // If message is unread, mark it as read
    if (!message.isRead) {
      markAsReadMutation.mutate(message.id);
    }
  };
  
  // Handle reply to message
  const handleReplyToMessage = () => {
    if (viewMessage) {
      setIsReplyDialogOpen(true);
    }
  };
  
  // Handle submit reply
  const onSubmitReply = (values: ReplyFormValues) => {
    if (viewMessage) {
      sendReplyMutation.mutate({
        messageId: viewMessage.id,
        content: values.content
      });
    }
  };
  
  // Handle toggle star
  const handleToggleStar = (message: Message) => {
    toggleStarMutation.mutate({
      id: message.id,
      isStarred: !message.isStarred
    });
  };
  
  // Handle toggle archive
  const handleToggleArchive = (message: Message) => {
    toggleArchiveMutation.mutate({
      id: message.id,
      isArchived: !message.isArchived
    });
  };
  
  // Handle update status
  const handleUpdateStatus = (messageId: number, status: string) => {
    updateMessageStatusMutation.mutate({ id: messageId, status });
  };
  
  // Handle delete message
  const handleDeleteMessage = (messageId: number) => {
    if (confirm("Are you sure you want to delete this message? This action cannot be undone.")) {
      deleteMessageMutation.mutate(messageId);
    }
  };
  
  // Filter messages based on current tab
  const getFilteredMessages = () => {
    let filtered = [...messages];
    
    // Apply tab filter
    switch (currentTab) {
      case "inbox":
        filtered = filtered.filter(m => !m.isArchived && (m.recipientId === 1 || m.recipientId === null));
        break;
      case "starred":
        filtered = filtered.filter(m => m.isStarred);
        break;
      case "sent":
        filtered = filtered.filter(m => m.senderId === 1);
        break;
      case "archived":
        filtered = filtered.filter(m => m.isArchived);
        break;
      default:
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.subject.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query) ||
        m.senderName.toLowerCase().includes(query) ||
        (m.recipientName && m.recipientName.toLowerCase().includes(query)) ||
        (m.senderEmail && m.senderEmail.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(m => m.status === statusFilter);
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }
    
    return filtered;
  };
  
  // Get filtered and sorted messages
  const filteredMessages = getFilteredMessages();
  
  // Sort messages by date (newest first)
  const sortedMessages = [...filteredMessages].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMessages = sortedMessages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedMessages.length / itemsPerPage);
  
  // Format date
  const formatMessageDate = (date: Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    
    // If the message is from today, show time instead of date
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, "h:mm a");
    }
    
    // If the message is from this year, don't show the year
    if (messageDate.getFullYear() === now.getFullYear()) {
      return format(messageDate, "MMM d");
    }
    
    // Otherwise show the full date
    return format(messageDate, "MMM d, yyyy");
  };
  
  // Format detailed date
  const formatDetailedDate = (date: Date) => {
    return format(new Date(date), "MMMM d, yyyy 'at' h:mm a");
  };
  
  // Format time ago
  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };
  
  // Get category badge
  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;
    
    switch (category.toLowerCase()) {
      case "inquiry":
        return (
          <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-500">
            Inquiry
          </Badge>
        );
      case "support":
        return (
          <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-500">
            Support
          </Badge>
        );
      case "feedback":
        return (
          <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500">
            Feedback
          </Badge>
        );
      case "booking":
        return (
          <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-500">
            Booking
          </Badge>
        );
      case "administrative":
        return (
          <Badge variant="outline" className="bg-gray-900/30 text-gray-400 border-gray-500">
            Administrative
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {category}
          </Badge>
        );
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return (
          <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-500">
            Open
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };
  
  // Get avatar fallback
  const getAvatarFallback = (name: string | null) => {
    if (!name) return "??";
    const nameParts = name.split(' ');
    if (nameParts.length === 1) return name.substring(0, 2).toUpperCase();
    return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-gray-400">Manage customer inquiries and support messages</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Send className="w-4 h-4 mr-2" />
              Compose
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-3">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="inbox" className="flex-1">Inbox</TabsTrigger>
                <TabsTrigger value="starred" className="flex-1">Starred</TabsTrigger>
                <TabsTrigger value="sent" className="flex-1">Sent</TabsTrigger>
                <TabsTrigger value="archived" className="flex-1">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="text-sm font-medium text-gray-400 mb-1">Status</div>
                  <div className="flex flex-col space-y-1">
                    <Button 
                      variant={statusFilter === null ? "secondary" : "ghost"} 
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setStatusFilter(null)}
                    >
                      All Messages
                    </Button>
                    <Button 
                      variant={statusFilter === "open" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setStatusFilter("open")}
                    >
                      Open
                      <Badge className="ml-auto">{messages.filter(m => m.status === "open").length}</Badge>
                    </Button>
                    <Button 
                      variant={statusFilter === "in_progress" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setStatusFilter("in_progress")}
                    >
                      In Progress
                      <Badge className="ml-auto">{messages.filter(m => m.status === "in_progress").length}</Badge>
                    </Button>
                    <Button 
                      variant={statusFilter === "closed" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setStatusFilter("closed")}
                    >
                      Closed
                      <Badge className="ml-auto">{messages.filter(m => m.status === "closed").length}</Badge>
                    </Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="text-sm font-medium text-gray-400 mb-1">Categories</div>
                  <div className="flex flex-col space-y-1">
                    <Button 
                      variant={categoryFilter === null ? "secondary" : "ghost"} 
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setCategoryFilter(null)}
                    >
                      All Categories
                    </Button>
                    <Button 
                      variant={categoryFilter === "inquiry" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setCategoryFilter("inquiry")}
                    >
                      Inquiries
                      <Badge className="ml-auto">{messages.filter(m => m.category === "inquiry").length}</Badge>
                    </Button>
                    <Button 
                      variant={categoryFilter === "support" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setCategoryFilter("support")}
                    >
                      Support
                      <Badge className="ml-auto">{messages.filter(m => m.category === "support").length}</Badge>
                    </Button>
                    <Button 
                      variant={categoryFilter === "feedback" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setCategoryFilter("feedback")}
                    >
                      Feedback
                      <Badge className="ml-auto">{messages.filter(m => m.category === "feedback").length}</Badge>
                    </Button>
                    <Button 
                      variant={categoryFilter === "booking" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setCategoryFilter("booking")}
                    >
                      Booking
                      <Badge className="ml-auto">{messages.filter(m => m.category === "booking").length}</Badge>
                    </Button>
                    <Button 
                      variant={categoryFilter === "administrative" ? "secondary" : "ghost"}
                      size="sm" 
                      className="justify-start px-2"
                      onClick={() => setCategoryFilter("administrative")}
                    >
                      Administrative
                      <Badge className="ml-auto">{messages.filter(m => m.category === "administrative").length}</Badge>
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-gray-700 p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <MessageSquare className="h-4 w-4" />
                  <span>
                    Total Messages: <strong>{messages.length}</strong>
                  </span>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-9">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>
                    {currentTab === "inbox" && "Inbox"}
                    {currentTab === "starred" && "Starred Messages"}
                    {currentTab === "sent" && "Sent Messages"}
                    {currentTab === "archived" && "Archived Messages"}
                  </CardTitle>
                  <CardDescription>
                    {currentTab === "inbox" && "View and manage incoming messages"}
                    {currentTab === "starred" && "Important messages you've starred"}
                    {currentTab === "sent" && "Messages you've sent to users"}
                    {currentTab === "archived" && "Messages you've archived"}
                  </CardDescription>
                </div>
                <div className="relative">
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-60 pl-10"
                  />
                  <div className="absolute left-3 top-3 text-gray-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-24 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
                  </div>
                ) : currentMessages.length === 0 ? (
                  <div className="text-center py-16 bg-gray-800/50 rounded-lg">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No messages found</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      There are no messages matching the current filters.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>From / To</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentMessages.map((message) => (
                          <TableRow 
                            key={message.id} 
                            className={!message.isRead && currentTab === "inbox" ? "bg-gray-800/40" : undefined}
                          >
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggleStar(message)}
                              >
                                {message.isStarred ? (
                                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                                ) : (
                                  <Star className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage 
                                    src={
                                      currentTab === "sent" 
                                        ? message.recipientImageUrl || undefined
                                        : message.senderImageUrl || undefined
                                    } 
                                    alt={
                                      currentTab === "sent"
                                        ? message.recipientName || ""
                                        : message.senderName
                                    } 
                                  />
                                  <AvatarFallback>
                                    {currentTab === "sent"
                                      ? getAvatarFallback(message.recipientName)
                                      : getAvatarFallback(message.senderName)
                                    }
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">
                                    {currentTab === "sent" 
                                      ? message.recipientName || "Multiple Recipients"
                                      : message.senderName
                                    }
                                  </div>
                                  <div className="text-xs text-gray-400 truncate max-w-[150px]">
                                    {currentTab === "sent"
                                      ? message.recipientEmail || ""
                                      : message.senderEmail
                                    }
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div 
                                className={`truncate max-w-[200px] ${!message.isRead && currentTab === "inbox" ? "font-medium" : ""}`}
                                onClick={() => handleViewMessage(message)}
                                style={{ cursor: "pointer" }}
                              >
                                {message.subject}
                              </div>
                              <div className="text-xs text-gray-400 truncate max-w-[200px]">
                                {message.content.substring(0, 50)}...
                              </div>
                            </TableCell>
                            <TableCell>
                              {getCategoryBadge(message.category)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(message.status)}
                              {message.replies && message.replies.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {message.replies.length} {message.replies.length === 1 ? "reply" : "replies"}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">{formatMessageDate(message.createdAt)}</div>
                              <div className="text-xs text-gray-400">{formatTimeAgo(message.createdAt)}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewMessage(message)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Message
                                  </DropdownMenuItem>
                                  
                                  {currentTab === "inbox" && message.status !== "closed" && (
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(message.id, "closed")}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Mark as Resolved
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {message.status === "open" && (
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(message.id, "in_progress")}>
                                      <Clock className="h-4 w-4 mr-2" />
                                      Mark In Progress
                                    </DropdownMenuItem>
                                  )}
                                  
                                  <DropdownMenuItem onClick={() => handleToggleStar(message)}>
                                    {message.isStarred ? (
                                      <>
                                        <Star className="h-4 w-4 text-amber-400 fill-amber-400 mr-2" />
                                        Unstar
                                      </>
                                    ) : (
                                      <>
                                        <Star className="h-4 w-4 mr-2" />
                                        Star
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem onClick={() => handleToggleArchive(message)}>
                                    {message.isArchived ? (
                                      <>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Unarchive
                                      </>
                                    ) : (
                                      <>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
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
                
                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="px-4">{`Page ${currentPage} of ${totalPages}`}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          {viewMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{viewMessage.subject}</DialogTitle>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center space-x-2">
                    {getCategoryBadge(viewMessage.category)}
                    {getStatusBadge(viewMessage.status)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDetailedDate(viewMessage.createdAt)}
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Sender/Recipient Info */}
                <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={
                        viewMessage.senderId === 1
                          ? viewMessage.recipientImageUrl || undefined
                          : viewMessage.senderImageUrl || undefined
                      } 
                      alt={
                        viewMessage.senderId === 1
                          ? viewMessage.recipientName || ""
                          : viewMessage.senderName
                      } 
                    />
                    <AvatarFallback>
                      {viewMessage.senderId === 1
                        ? getAvatarFallback(viewMessage.recipientName)
                        : getAvatarFallback(viewMessage.senderName)
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {viewMessage.senderId === 1
                          ? `To: ${viewMessage.recipientName || "Multiple Recipients"}`
                          : `From: ${viewMessage.senderName}`
                        }
                      </span>
                      {viewMessage.senderId === 1 ? (
                        <Badge variant="outline" className="text-blue-400">Sent</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-400">Received</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {viewMessage.senderId === 1
                        ? viewMessage.recipientEmail || ""
                        : viewMessage.senderEmail
                      }
                    </div>
                  </div>
                </div>
                
                {/* Message Content */}
                <div className="p-4 border border-gray-700 rounded-lg">
                  <div className="prose prose-invert max-w-none">
                    {viewMessage.content.split("\n").map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  
                  {/* Attachments */}
                  {viewMessage.attachments && viewMessage.attachments.length > 0 && (
                    <div className="mt-6 border-t border-gray-700 pt-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Attachments</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {viewMessage.attachments.map((attachment) => (
                          <div 
                            key={attachment.id}
                            className="flex items-center p-2 border border-gray-700 rounded"
                          >
                            <Paperclip className="h-4 w-4 mr-2 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium text-sm">{attachment.name}</div>
                              <div className="text-xs text-gray-400">{formatFileSize(attachment.size)}</div>
                            </div>
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              download
                              className="ml-2"
                            >
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Replies */}
                {viewMessage.replies && viewMessage.replies.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400">Conversation History</h3>
                    {viewMessage.replies.map((reply) => (
                      <div 
                        key={reply.id}
                        className={`p-4 rounded-lg border ${reply.senderId === 1 ? "border-blue-700 bg-blue-900/20 ml-6" : "border-gray-700 bg-gray-800 mr-6"}`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={reply.senderImageUrl || undefined} alt={reply.senderName} />
                            <AvatarFallback>{getAvatarFallback(reply.senderName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{reply.senderName}</div>
                            <div className="text-xs text-gray-400">{formatTimeAgo(reply.createdAt)}</div>
                          </div>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                          {reply.content.split("\n").map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                  onClick={handleReplyToMessage}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                
                {viewMessage.status !== "closed" && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      handleUpdateStatus(viewMessage.id, "closed");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
                
                {viewMessage.status === "open" && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      handleUpdateStatus(viewMessage.id, "in_progress");
                      setIsViewDialogOpen(false);
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Mark In Progress
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reply to: {viewMessage?.subject}</DialogTitle>
            <DialogDescription>
              Replying to {viewMessage?.senderName} ({viewMessage?.senderEmail})
            </DialogDescription>
          </DialogHeader>
          
          <Form {...replyForm}>
            <form onSubmit={replyForm.handleSubmit(onSubmitReply)} className="space-y-6">
              <FormField
                control={replyForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Reply</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your reply here..." 
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReplyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sendReplyMutation.isPending}
                >
                  {sendReplyMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}