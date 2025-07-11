import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Edit, FileText, Plus, Trash2, Award, Check, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserRole } from "@/types/user";

// Define types for certificate templates
interface CertificateTemplate {
  id: number;
  name: string;
  description: string | null;
  htmlContent: string;
  createdById: number;
  createdAt: string;
  updatedAt: string | null;
  isDefault: boolean;
}

// Form schema for creating/editing templates
const templateFormSchema = z.object({
  name: z.string().min(3, { message: "Template name must be at least 3 characters" }),
  description: z.string().optional(),
  htmlContent: z.string().min(10, { message: "HTML content must be at least 10 characters" }),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

// Certificate Template Editor component
function CertificateTemplateEditor({ 
  template, 
  onSubmit, 
  onCancel 
}: { 
  template?: CertificateTemplate; 
  onSubmit: (values: TemplateFormValues) => void; 
  onCancel: () => void 
}) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      description: template?.description || "",
      htmlContent: template?.htmlContent || `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .certificate {
      width: 800px;
      height: 600px;
      margin: 0 auto;
      background-color: #fff;
      border: 10px solid #d4af37;
      padding: 30px;
      text-align: center;
      position: relative;
    }
    .header {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #d4af37;
    }
    .subheader {
      font-size: 24px;
      margin-bottom: 40px;
    }
    .content {
      margin: 40px 0;
      font-size: 18px;
      line-height: 1.5;
    }
    .name {
      font-size: 28px;
      font-weight: bold;
      margin: 20px 0;
      border-bottom: 2px solid #333;
      display: inline-block;
      padding: 0 10px 5px;
    }
    .date {
      font-size: 16px;
      margin-top: 40px;
    }
    .signature {
      margin-top: 40px;
      border-top: 1px solid #333;
      display: inline-block;
      padding-top: 10px;
      font-style: italic;
    }
    .seal {
      position: absolute;
      bottom: 30px;
      right: 30px;
      width: 100px;
      height: 100px;
      border: 2px solid #d4af37;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: #d4af37;
      transform: rotate(-15deg);
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">Certificate of Achievement</div>
    <div class="subheader">DanceRealmX</div>
    <div class="content">
      This is to certify that
      <div class="name">{{student_name}}</div>
      has successfully completed
      <div class="course">{{course_name}}</div>
      with distinction
    </div>
    <div class="date">{{completion_date}}</div>
    <div class="signature">{{instructor_name}}</div>
    <div class="seal">CERTIFIED</div>
  </div>
</body>
</html>
`
    }
  });

  const [previewHtml, setPreviewHtml] = useState<string>("");

  const generatePreview = () => {
    let html = form.getValues("htmlContent");
    // Replace template variables with sample data
    html = html.replace(/{{student_name}}/g, "Jane Doe");
    html = html.replace(/{{course_name}}/g, "Ballet Certification Program");
    html = html.replace(/{{completion_date}}/g, new Date().toLocaleDateString());
    html = html.replace(/{{instructor_name}}/g, "Instructor Name");
    setPreviewHtml(html);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter template name" {...field} />
                </FormControl>
                <FormDescription>
                  Give your certificate template a descriptive name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter template description" {...field} />
                </FormControl>
                <FormDescription>
                  Provide additional details about this certificate template
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="htmlContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HTML Content</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter HTML content" 
                    className="font-mono text-sm h-[300px]" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The HTML content of the certificate template. Use {{student_name}}, 
                  {{course_name}}, {{completion_date}}, and {{instructor_name}} as 
                  placeholders.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={generatePreview}
            >
              Preview
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              {template ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </Form>
      
      {previewHtml && (
        <div className="mt-6">
          <Label>Preview</Label>
          <div className="border rounded-md p-4 mt-2 bg-white overflow-auto">
            <iframe 
              srcDoc={previewHtml}
              style={{ width: '100%', height: '600px', border: 'none' }}
              title="Certificate Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Main Certificate Templates Page component
export default function CertificateTemplatesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Fetch all certificate templates
  const { 
    data: templates = [], 
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: ["/api/certificate-templates"],
    queryFn: async () => {
      const res = await fetch("/api/certificate-templates");
      return res.json();
    }
  });
  
  // Fetch default template
  const { 
    data: defaultTemplate,
    isLoading: defaultTemplateLoading
  } = useQuery({
    queryKey: ["/api/certificate-templates/default"],
    queryFn: async () => {
      const res = await fetch("/api/certificate-templates/default");
      if (res.status === 404) {
        return null;
      }
      return res.json();
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 404
      if (error.status === 404) return false;
      return failureCount < 3;
    }
  });

  // Create a new template
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormValues) => {
      const res = await apiRequest("/api/certificate-templates", {
        method: "POST",
        data,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificate-templates"] });
      toast({
        title: "Template created",
        description: "Certificate template has been created successfully",
      });
      setIsCreating(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update an existing template
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TemplateFormValues }) => {
      const res = await apiRequest(`/api/certificate-templates/${id}`, {
        method: "PUT",
        data,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificate-templates"] });
      toast({
        title: "Template updated",
        description: "Certificate template has been updated successfully",
      });
      setIsEditing(false);
      setSelectedTemplate(undefined);
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete a template
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/certificate-templates/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificate-templates"] });
      toast({
        title: "Template deleted",
        description: "Certificate template has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Set a template as default
  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest(`/api/certificate-templates/${id}/set-default`, {
        method: "PUT",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificate-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificate-templates/default"] });
      toast({
        title: "Default template set",
        description: "Certificate template has been set as the default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error setting default template",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateTemplate = (data: TemplateFormValues) => {
    createMutation.mutate(data);
  };

  const handleUpdateTemplate = (data: TemplateFormValues) => {
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, data });
    }
  };

  const handleDeleteTemplate = (template: CertificateTemplate) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(template.id);
    }
  };

  const handleSetDefault = (template: CertificateTemplate) => {
    setDefaultMutation.mutate(template.id);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplate(undefined);
  };

  // Filter templates based on user role and ownership
  const filterTemplates = (templates: CertificateTemplate[]) => {
    if (!user) return [];
    
    if (user.role.includes(UserRole.ADMIN)) {
      return templates;
    } else {
      return templates.filter(template => template.createdById === user.id);
    }
  };

  // Group templates by default status
  const defaultTemplates = templates.filter(t => t.isDefault);
  const nonDefaultTemplates = templates.filter(t => !t.isDefault);
  
  // Filter templates user can see based on role
  const myTemplates = nonDefaultTemplates.filter(t => t.createdById === user?.id);
  const otherTemplates = user?.role.includes(UserRole.ADMIN) 
    ? nonDefaultTemplates.filter(t => t.createdById !== user?.id)
    : [];

  if (templatesLoading || defaultTemplateLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (templatesError) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load certificate templates. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Certificate Templates</h1>
      
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>Create New Certificate Template</CardTitle>
            <CardDescription>
              Design a new certificate template for your courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CertificateTemplateEditor
              onSubmit={handleCreateTemplate}
              onCancel={handleEditCancel}
            />
          </CardContent>
        </Card>
      ) : isEditing && selectedTemplate ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Certificate Template</CardTitle>
            <CardDescription>
              Update the certificate template "{selectedTemplate.name}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CertificateTemplateEditor
              template={selectedTemplate}
              onSubmit={handleUpdateTemplate}
              onCancel={handleEditCancel}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Manage certificate templates for course completion
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
          
          <Tabs defaultValue="default" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="default">Default Template</TabsTrigger>
              <TabsTrigger value="my">My Templates</TabsTrigger>
              {user?.role.includes(UserRole.ADMIN) && (
                <TabsTrigger value="all">All Templates</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="default" className="space-y-4">
              {defaultTemplates.length > 0 ? (
                defaultTemplates.map(template => (
                  <Card key={template.id} className="border-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            {template.name}
                            <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              <Check className="h-3 w-3 mr-1" />
                              Default
                            </span>
                          </CardTitle>
                          <CardDescription>
                            {template.description || "No description provided"}
                          </CardDescription>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedTemplate(template);
                            setIsEditing(true);
                          }}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">
                        HTML Preview (First 100 characters)
                      </div>
                      <div className="bg-muted p-2 rounded-md overflow-hidden whitespace-nowrap text-ellipsis font-mono text-xs">
                        {template.htmlContent.substring(0, 100)}...
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created by: {template.createdById === user?.id ? 'You' : `User #${template.createdById}`}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Certificate Preview</DialogTitle>
                            <DialogDescription>
                              Preview of the {template.name} certificate template
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <iframe 
                              srcDoc={template.htmlContent
                                .replace(/{{student_name}}/g, "Jane Doe")
                                .replace(/{{course_name}}/g, "Ballet Certification Program")
                                .replace(/{{completion_date}}/g, new Date().toLocaleDateString())
                                .replace(/{{instructor_name}}/g, "Instructor Name")
                              }
                              style={{ width: '100%', height: '600px', border: 'none' }}
                              title="Certificate Preview"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Default Template</h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    Create a template and set it as default.
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my" className="space-y-4">
              {myTemplates.length > 0 ? (
                myTemplates.map(template => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{template.name}</CardTitle>
                          <CardDescription>
                            {template.description || "No description provided"}
                          </CardDescription>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedTemplate(template);
                            setIsEditing(true);
                          }}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-2">
                        HTML Preview (First 100 characters)
                      </div>
                      <div className="bg-muted p-2 rounded-md overflow-hidden whitespace-nowrap text-ellipsis font-mono text-xs">
                        {template.htmlContent.substring(0, 100)}...
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(template.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSetDefault(template)}
                          disabled={template.isDefault || setDefaultMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Set as Default
                        </Button>
                        <a 
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                          href={`/api/certificate-templates/${template.id}/download`}
                          target="_blank"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Certificate Preview</DialogTitle>
                              <DialogDescription>
                                Preview of the {template.name} certificate template
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <iframe 
                                srcDoc={template.htmlContent
                                  .replace(/{{student_name}}/g, "Jane Doe")
                                  .replace(/{{course_name}}/g, "Ballet Certification Program")
                                  .replace(/{{completion_date}}/g, new Date().toLocaleDateString())
                                  .replace(/{{instructor_name}}/g, "Instructor Name")
                                }
                                style={{ width: '100%', height: '600px', border: 'none' }}
                                title="Certificate Preview"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Templates Created</h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    You haven't created any certificate templates yet.
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {user?.role.includes(UserRole.ADMIN) && (
              <TabsContent value="all" className="space-y-4">
                {otherTemplates.length > 0 ? (
                  otherTemplates.map(template => (
                    <Card key={template.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{template.name}</CardTitle>
                            <CardDescription>
                              {template.description || "No description provided"}
                            </CardDescription>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedTemplate(template);
                              setIsEditing(true);
                            }}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-2">
                          HTML Preview (First 100 characters)
                        </div>
                        <div className="bg-muted p-2 rounded-md overflow-hidden whitespace-nowrap text-ellipsis font-mono text-xs">
                          {template.htmlContent.substring(0, 100)}...
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <div className="text-sm text-muted-foreground">
                          Created by: User #{template.createdById} | 
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSetDefault(template)}
                            disabled={template.isDefault || setDefaultMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Set as Default
                          </Button>
                          <a 
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                            href={`/api/certificate-templates/${template.id}/download`}
                            target="_blank"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Certificate Preview</DialogTitle>
                                <DialogDescription>
                                  Preview of the {template.name} certificate template
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <iframe 
                                  srcDoc={template.htmlContent
                                    .replace(/{{student_name}}/g, "Jane Doe")
                                    .replace(/{{course_name}}/g, "Ballet Certification Program")
                                    .replace(/{{completion_date}}/g, new Date().toLocaleDateString())
                                    .replace(/{{instructor_name}}/g, "Instructor Name")
                                  }
                                  style={{ width: '100%', height: '600px', border: 'none' }}
                                  title="Certificate Preview"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Other Templates</h3>
                    <p className="text-muted-foreground mt-2">
                      No templates have been created by other users yet.
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}