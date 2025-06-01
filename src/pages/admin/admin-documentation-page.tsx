import { useEffect, useState } from "react";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, BookOpen, FileQuestion, School, ShoppingBag, Calendar } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import remarkGfm from "remark-gfm";

const AdminDocumentationPage = () => {
  const [activeTab, setActiveTab] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentation(activeTab);
  }, [activeTab]);

  const fetchDocumentation = async (type: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("GET", `/api/documentation/${type}`);
      if (!response.ok) {
        throw new Error(`Error fetching documentation: ${response.statusText}`);
      }
      const data = await response.text();
      setMarkdown(data);
    } catch (err) {
      console.error("Error fetching documentation:", err);
      setError("Failed to load documentation. Please try again later.");
      
      // Fallback content for development
      if (process.env.NODE_ENV === 'development') {
        setMarkdown(`# ${type.charAt(0).toUpperCase() + type.slice(1)} Guide\n\nThis is a placeholder for the ${type} documentation. The actual content will be loaded from the server.`);
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (type: string) => {
    try {
      const response = await apiRequest("GET", `/api/documentation/${type}/pdf`);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-guide.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError("Failed to download PDF. Please try again later.");
    }
  };

  const getTabIcon = (tab: string) => {
    switch(tab) {
      case "admin":
        return <BookOpen className="w-5 h-5 mr-2" />;
      case "user":
        return <FileQuestion className="w-5 h-5 mr-2" />;
      case "instructor":
        return <School className="w-5 h-5 mr-2" />;
      case "seller":
        return <ShoppingBag className="w-5 h-5 mr-2" />;
      case "connect":
        return <Calendar className="w-5 h-5 mr-2" />;
      default:
        return <BookOpen className="w-5 h-5 mr-2" />;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-[95%]">
      <h1 className="text-3xl font-bold mb-6 text-white">Documentation</h1>
      <Card className="bg-gray-800">
        <CardHeader>
          <CardTitle className="text-white">DanceRealmX Documentation and Guides</CardTitle>
          <CardDescription className="text-gray-300">
            Comprehensive guides and documentation for different aspects of the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            defaultValue="admin"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b border-gray-700 px-6">
              <TabsList className="mb-0 pb-0 mt-0 pt-0 bg-gray-700">
                <TabsTrigger value="admin" className="flex items-center text-white data-[state=active]:bg-gray-600">
                  {getTabIcon("admin")}
                  Admin Guide
                </TabsTrigger>
                <TabsTrigger value="user" className="flex items-center text-white data-[state=active]:bg-gray-600">
                  {getTabIcon("user")}
                  User Guide
                </TabsTrigger>
                <TabsTrigger value="instructor" className="flex items-center text-white data-[state=active]:bg-gray-600">
                  {getTabIcon("instructor")}
                  Instructor Guide
                </TabsTrigger>
                <TabsTrigger value="seller" className="flex items-center text-white data-[state=active]:bg-gray-600">
                  {getTabIcon("seller")}
                  Seller Guide
                </TabsTrigger>
                <TabsTrigger value="connect" className="flex items-center text-white data-[state=active]:bg-gray-600">
                  {getTabIcon("connect")}
                  Connect Guide
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 text-white">
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadPDF(activeTab)}
                  disabled={loading || !!error}
                  className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                >
                  Download PDF
                </Button>
              </div>
              <Separator className="my-4 bg-gray-700" />
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="bg-destructive/20 text-white border border-destructive p-4 rounded-md">
                  {error}
                </div>
              ) : (
                <div className="documentation-content prose dark:prose-invert max-w-none text-white">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdown}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDocumentationPage;