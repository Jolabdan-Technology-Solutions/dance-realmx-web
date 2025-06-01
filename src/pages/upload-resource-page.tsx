import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  DANCE_STYLES, 
  AGE_RANGES, 
  DIFFICULTY_LEVELS, 
  RESOURCE_TYPES,
  RESOURCE_TYPE_DISPLAY_NAMES
} from "@/lib/constants";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, Upload, File, FileText, CheckCircle, 
  Loader2, DollarSign, X, ImageIcon, Tag, Info 
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/ui/file-upload";

// Form schema for resource upload
const resourceUploadSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  detailedDescription: z.string().optional(),
  danceStyle: z.string().optional(),
  difficultyLevel: z.string().optional(),
  ageRange: z.string().optional(),
  price: z.string().refine((val) => !isNaN(Number(val)), "Price must be a number"),
  fileType: z.string().min(1, "File type is required"),
  resourceType: z.string().min(1, "Resource type is required"),
  tags: z.string().optional(),
  categoryId: z.string().optional(),
  isFree: z.boolean().default(false),
  termsAccepted: z.boolean().refine((val) => val === true, "You must accept the terms"),
  // Video specific fields
  previewVideoUrl: z.string().optional(),
  fullVideoUrl: z.string().optional(),
  // Document fields
  resourceFilePath: z.string().optional(),
});

type ResourceUploadForm = z.infer<typeof resourceUploadSchema>;

export default function UploadResourcePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [resourceTags, setResourceTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [uploadStep, setUploadStep] = useState<"file" | "details" | "preview">("file");

  // Fetch resource categories
  const { data: categories = [] } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/resource-categories"],
  });

  // Resource upload form
  const form = useForm<ResourceUploadForm>({
    resolver: zodResolver(resourceUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      detailedDescription: "",
      danceStyle: "",
      difficultyLevel: "",
      ageRange: "",
      price: "0",
      fileType: "",
      resourceType: "",
      tags: "",
      categoryId: "",
      isFree: true,
      termsAccepted: false,
      previewVideoUrl: "",
      fullVideoUrl: "",
      resourceFilePath: "",
    },
  });

  // Upload resource mutation
  const uploadResourceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulating progress for better UX
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      try {
        // STEP 1: First upload the file to get a URL
        const fileFormData = new FormData();
        fileFormData.append("file", formData.get("file") as File);
        fileFormData.append("entityType", "resource");
        
        console.log("Uploading file first...");
        const fileUploadRes = await apiRequest("POST", "/api/upload/resource", fileFormData, { isFormData: true });
        const fileData = await fileUploadRes.json();
        
        if (!fileData.url) {
          throw new Error("File upload failed");
        }
        
        console.log("File uploaded successfully, got URL:", fileData.url);
        
        // STEP 2: Now create the resource with the file URL
        const resourceData = new FormData();
        resourceData.append("title", formData.get("title") as string);
        resourceData.append("description", formData.get("description") as string);
        resourceData.append("detailedDescription", formData.get("detailedDescription") as string || "");
        resourceData.append("danceStyle", formData.get("danceStyle") as string || "");
        resourceData.append("difficultyLevel", formData.get("difficultyLevel") as string || "");
        resourceData.append("ageRange", formData.get("ageRange") as string || "");
        resourceData.append("price", formData.get("price") as string);
        resourceData.append("fileType", formData.get("fileType") as string);
        resourceData.append("resourceType", formData.get("resourceType") as string);
        resourceData.append("tags", formData.get("tags") as string);
        
        // For all resource types, add video URLs if available (they're now supported for all types)
        resourceData.append("previewVideoUrl", formData.get("previewVideoUrl") as string || "");
        resourceData.append("fullVideoUrl", formData.get("fullVideoUrl") as string || "");
        
        // Add the file URL for all non-video resources, video resources can rely just on URLs
        if (formData.get("resourceType") !== "video" || fileData.url) {
          resourceData.append("fileUrl", fileData.url);
        }
        
        if (formData.get("categoryId")) {
          resourceData.append("categoryId", formData.get("categoryId") as string);
        }
        
        console.log("Creating resource with data:", Object.fromEntries(resourceData));
        const res = await apiRequest("POST", "/api/resources", resourceData, { isFormData: true });
        
        clearInterval(interval);
        setUploadProgress(100);
        return await res.json();
      } catch (error) {
        console.error("Upload error:", error);
        clearInterval(interval);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Upload Successful",
        description: "Your resource has been uploaded successfully.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/my-resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/resources/seller"] });
      
      // Redirect to my resources page
      navigate("/my-resources");
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        form.setValue("fileType", "image");
      } else if (file.type.startsWith('audio/')) {
        form.setValue("fileType", "audio");
      } else if (file.type.startsWith('video/')) {
        form.setValue("fileType", "video");
      } else if (file.type === 'application/pdf') {
        form.setValue("fileType", "pdf");
      } else {
        form.setValue("fileType", "other");
      }
      
      // Auto-populate title from filename
      const filename = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      if (!form.getValues("title")) {
        form.setValue("title", filename.replace(/_/g, " "));
      }
    }
  };

  // Handle pricing change
  const handlePricingChange = (isFree: boolean) => {
    form.setValue("isFree", isFree);
    if (isFree) {
      form.setValue("price", "0");
    }
  };

  // Handle tag input
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (tagInput.trim() && !resourceTags.includes(tagInput.trim())) {
      setResourceTags([...resourceTags, tagInput.trim()]);
      setTagInput("");
      form.setValue("tags", [...resourceTags, tagInput.trim()].join(","));
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tag: string) => {
    const updatedTags = resourceTags.filter(t => t !== tag);
    setResourceTags(updatedTags);
    form.setValue("tags", updatedTags.join(","));
  };

  // Handle enter key on tag input
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Handle form submission
  const onSubmit = async (data: ResourceUploadForm) => {
    if (!selectedFile && data.resourceType !== "video") {
      toast({
        title: "File Required",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    // If resource type is video but no file is selected, at least one video URL is required
    if (data.resourceType === "video" && !selectedFile && !data.previewVideoUrl && !data.fullVideoUrl) {
      toast({
        title: "Video URL Required",
        description: "Please provide at least one video URL when creating a video resource.",
        variant: "destructive",
      });
      return;
    }
    
    // For all resource types, preview/full URLs are optional but encouraged
    // No validation needed as they're optional

    // Create FormData for file upload
    const formData = new FormData();
    
    // Only append file if this is not a video upload
    if (selectedFile) {
      formData.append("file", selectedFile);
    }
    
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("detailedDescription", data.detailedDescription || "");
    formData.append("danceStyle", data.danceStyle || "");
    formData.append("difficultyLevel", data.difficultyLevel || "");
    formData.append("ageRange", data.ageRange || "");
    formData.append("price", data.isFree ? "0" : data.price);
    formData.append("fileType", data.fileType);
    formData.append("resourceType", data.resourceType);
    formData.append("tags", resourceTags.join(","));

    // Add preview/full URLs for all resource types
    // These are optional for non-video resource types
    formData.append("previewVideoUrl", data.previewVideoUrl || "");
    formData.append("fullVideoUrl", data.fullVideoUrl || "");
    
    if (data.categoryId) {
      formData.append("categoryId", data.categoryId);
    }

    uploadResourceMutation.mutate(formData);
  };

  // Get file size display
  const getFileSizeDisplay = (size: number): string => {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-12 w-12 text-red-500" />;
      case "audio":
        return <File className="h-12 w-12 text-purple-500" />;
      case "video":
        return <File className="h-12 w-12 text-blue-500" />;
      case "image":
        return <ImageIcon className="h-12 w-12 text-green-500" />;
      default:
        return <File className="h-12 w-12 text-gray-500" />;
    }
  };

  // Handle next step button
  const handleNextStep = () => {
    if (uploadStep === "file") {
      if (!selectedFile) {
        toast({
          title: "File Required",
          description: "Please select a file to upload.",
          variant: "destructive",
        });
        return;
      }
      setUploadStep("details");
    } else if (uploadStep === "details") {
      form.trigger().then(result => {
        if (result) {
          setUploadStep("preview");
        }
      });
    }
  };

  // Handle back button
  const handleBack = () => {
    if (uploadStep === "details") {
      setUploadStep("file");
    } else if (uploadStep === "preview") {
      setUploadStep("details");
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="mb-8">Please sign in to upload resources.</p>
        <Link href="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header with back navigation */}
      <div className="mb-8">
        <Link href="/resources">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Upload Resource</h1>

      {/* Upload steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${uploadStep === "file" || uploadStep === "details" || uploadStep === "preview" ? 'bg-[#00d4ff] text-white' : 'bg-gray-200'}`}>
              <Upload className="h-5 w-5" />
            </div>
            <div className={`h-1 w-16 ${uploadStep === "details" || uploadStep === "preview" ? 'bg-[#00d4ff]' : 'bg-gray-200'}`}></div>
          </div>
          <div className="flex items-center">
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${uploadStep === "details" || uploadStep === "preview" ? 'bg-[#00d4ff] text-white' : 'bg-gray-200'}`}>
              <FileText className="h-5 w-5" />
            </div>
            <div className={`h-1 w-16 ${uploadStep === "preview" ? 'bg-[#00d4ff]' : 'bg-gray-200'}`}></div>
          </div>
          <div className="flex items-center">
            <div className={`rounded-full h-10 w-10 flex items-center justify-center ${uploadStep === "preview" ? 'bg-[#00d4ff] text-white' : 'bg-gray-200'}`}>
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-2">
          <div className="text-center w-32">
            <p className={`text-sm ${uploadStep === "file" ? 'font-semibold' : ''}`}>Select File</p>
          </div>
          <div className="text-center w-32">
            <p className={`text-sm ${uploadStep === "details" ? 'font-semibold' : ''}`}>Resource Details</p>
          </div>
          <div className="text-center w-32">
            <p className={`text-sm ${uploadStep === "preview" ? 'font-semibold' : ''}`}>Preview & Submit</p>
          </div>
        </div>
      </div>

      {/* File Selection Step */}
      {uploadStep === "file" && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Select File to Upload</CardTitle>
              <CardDescription>
                Choose a file from your device to share with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <FileUpload
                    onUploadComplete={(url, metadata) => {
                      console.log("Upload complete with url:", url);
                      console.log("Upload complete with metadata:", metadata);
                      
                      // Handle single file or first file from multiple uploads
                      const urlToUse = Array.isArray(url) ? url[0] : url;
                      
                      // Handle metadata for single or multiple files
                      const metadataToUse = Array.isArray(metadata) ? metadata[0] : metadata;
                      
                      // Extract the file type from metadata or URL
                      let fileType = 'application';
                      if (metadataToUse?.type) {
                        fileType = metadataToUse.type.includes('pdf') ? 'pdf' 
                          : metadataToUse.type.includes('audio') ? 'audio'
                          : metadataToUse.type.includes('video') ? 'video'
                          : metadataToUse.type.includes('image') ? 'image'
                          : 'application';
                      } else {
                        // Fallback to URL parsing if no metadata
                        fileType = urlToUse.includes('.pdf') ? 'pdf' 
                          : urlToUse.includes('.mp3') ? 'audio'
                          : urlToUse.includes('.mp4') ? 'video'
                          : (urlToUse.includes('.jpg') || urlToUse.includes('.jpeg') || urlToUse.includes('.png')) ? 'image'
                          : 'application';
                      }
                      
                      // Set the file type in the form
                      form.setValue('fileType', fileType);
                      
                      // For single file uploads, create a file object using metadata if available
                      setSelectedFile({
                        name: metadataToUse?.name || (typeof urlToUse === 'string' ? urlToUse.split('/').pop() : 'uploaded-file') || 'uploaded-file',
                        size: metadataToUse?.size || 0,
                        type: metadataToUse?.type || fileType,
                      } as File);
                      
                      // If it's an image, set the preview URL
                      if (fileType === 'image') {
                        setPreviewUrl(urlToUse);
                      }
                      
                      // If there are multiple URLs, handle the additional files as needed
                      if (Array.isArray(url) && url.length > 1) {
                        console.log("Multiple files uploaded:", url.length);
                        // You can add specific handling for multiple files here
                        // For now, we're using just the first file
                      }
                    }}
                    uploadEndpoint="/api/upload/resource"
                    acceptedTypes="application/pdf,image/*,audio/*,video/*,.doc,.docx"
                    label="Resource File"
                    buttonText="Browse Files"
                    maxSizeMB={20}
                  />
                  <p className="text-gray-500 text-sm mt-4">
                    Supported file types: PDF, DOC, DOCX, MP3, MP4, JPG, PNG
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Maximum file size: 20 MB
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center">
                    {previewUrl ? (
                      <div className="h-16 w-16 mr-4 rounded-md overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="File preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mr-4">
                        {getFileIcon(form.getValues("fileType"))}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{selectedFile.name}</h3>
                      <p className="text-gray-500 text-sm">
                        {getFileSizeDisplay(selectedFile.size)}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-gray-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleNextStep}
                disabled={!selectedFile}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                Next
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Resource Details Step */}
      {uploadStep === "details" && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Resource Details</CardTitle>
              <CardDescription>
                Provide information about your resource to help others find and use it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="resourceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resource Type *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // If the type is "video", show video fields
                            form.setValue("fileType", value === "video" ? "video" : form.getValues("fileType"));
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select resource type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RESOURCE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {RESOURCE_TYPE_DISPLAY_NAMES[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview/Full URL fields shown for all resource types */}
                  <div className="border-2 border-primary p-4 rounded-md mb-6 mt-6 bg-secondary/10">
                    <h3 className="text-xl font-bold mb-2 text-primary flex items-center gap-2">
                      <span className="text-2xl">🎬</span> Enhanced Video Preview Options <span className="text-2xl">✨</span>
                    </h3>
                    <p className="text-sm mb-4 p-2 bg-muted/20 rounded-md">
                      <strong className="text-primary">Important:</strong> You can add video URLs for <strong>ANY</strong> resource type!
                      <br/>
                      This powerful feature allows users to see video previews or full videos alongside other resource files (PDFs, images, etc).
                      <br/>
                      <span className="text-primary">The preview video is visible to everyone, while the full video is only for users who purchase.</span>
                    </p>
                  
                    <FormField
                      control={form.control}
                      name="fullVideoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Full Video URL <span className="text-primary text-xs">🎥</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.youtube.com/watch?v=..." 
                              className="border-primary focus:ring-2 focus:ring-primary"
                              {...field} 
                              onChange={(e) => {
                                // Update fullVideoUrl
                                field.onChange(e);
                                
                                // Auto-populate previewVideoUrl with the same value
                                if (e.target.value && !form.getValues("previewVideoUrl")) {
                                  form.setValue('previewVideoUrl', e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Full resource video URL (only visible to users who purchase)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="previewVideoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Preview Video URL <span className="text-primary text-xs">🎬</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.youtube.com/watch?v=..." 
                              className="border-primary focus:ring-2 focus:ring-primary"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Preview video URL (visible to all users, including guests)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-sm text-muted-foreground italic">
                      Note: The preview video URL is auto-populated from the full video URL. 
                      This allows users to preview the content before purchasing.
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a title for your resource" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe your resource (max 200 characters)"
                            maxLength={200}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This will appear in search results and resource lists
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="detailedDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide a detailed description of your resource"
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Explain what users will learn or how they can use this resource
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="danceStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dance Style</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a dance style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DANCE_STYLES.map((style) => (
                                <SelectItem key={style} value={style}>
                                  {style}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficultyLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DIFFICULTY_LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ageRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age Range</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {AGE_RANGES.map((range) => (
                                <SelectItem key={range} value={range}>
                                  {range}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories && categories.length > 0 ? (
                                categories.map((category) => (
                                  <SelectItem
                                    key={category.id || 0}
                                    value={(category.id !== undefined && category.id !== null) ? category.id.toString() : "default"}
                                  >
                                    {category.name || "Untitled Category"}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="default">No categories available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <FormLabel htmlFor="tags">Tags</FormLabel>
                      <div className="flex mb-2">
                        <Input
                          id="tags"
                          placeholder="Add tags..."
                          value={tagInput}
                          onChange={handleTagInputChange}
                          onKeyDown={handleTagKeyDown}
                          className="mr-2"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddTag}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {resourceTags.map((tag) => (
                          <Badge key={tag} className="px-2 py-1">
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 ml-1 p-0"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Pricing</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => handlePricingChange(value === "free")}
                            defaultValue={field.value ? "free" : "paid"}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="free" id="free" />
                              <Label htmlFor="free">Free Resource</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="paid" id="paid" />
                              <Label htmlFor="paid">Paid Resource</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!form.getValues("isFree") && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($) *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                              <Input className="pl-10" type="number" step="0.01" min="0.99" {...field} />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Set a price between $0.99 and $99.99
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Terms and Conditions *</FormLabel>
                          <FormDescription>
                            I confirm that this resource is my original work or I have the right to distribute it.
                            I agree to the DanceRealmX <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleNextStep}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                Preview
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Preview & Submit Step */}
      {uploadStep === "preview" && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Preview & Submit</CardTitle>
              <CardDescription>
                Review your resource details before uploading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    {previewUrl ? (
                      <div className="border rounded-md overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Resource preview"
                          className="w-full h-auto"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center bg-gray-100 rounded-md p-8">
                        {getFileIcon(form.getValues("fileType"))}
                      </div>
                    )}
                    <div className="mt-2 text-center">
                      <p className="text-sm text-gray-500">{selectedFile?.name}</p>
                      <p className="text-xs text-gray-400">{getFileSizeDisplay(selectedFile?.size || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold mb-2">{form.getValues("title")}</h3>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="px-2 py-0.5">
                        {form.getValues("fileType") || "Document"}
                      </Badge>
                      
                      {form.getValues("isFree") ? (
                        <Badge className="bg-green-100 text-green-800">Free</Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800">
                          ${Number(form.getValues("price")).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                        <p>{form.getValues("description")}</p>
                      </div>
                      
                      {form.getValues("detailedDescription") && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Detailed Description</h4>
                          <p>{form.getValues("detailedDescription")}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {form.getValues("danceStyle") && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Dance Style</h4>
                            <p>{form.getValues("danceStyle")}</p>
                          </div>
                        )}
                        
                        {form.getValues("difficultyLevel") && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Difficulty Level</h4>
                            <p>{form.getValues("difficultyLevel")}</p>
                          </div>
                        )}
                        
                        {form.getValues("ageRange") && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Age Range</h4>
                            <p>{form.getValues("ageRange")}</p>
                          </div>
                        )}
                      </div>
                      
                      {resourceTags.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Tags</h4>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {resourceTags.map((tag) => (
                              <Badge key={tag} variant="outline" className="px-2 py-0.5">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {form.getValues("categoryId") && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Category</h4>
                          <p>
                            {categories && categories.length > 0 
                              ? (categories.find(c => (c.id !== undefined && c.id !== null) ? c.id.toString() === form.getValues("categoryId") : false)?.name || "Uncategorized") 
                              : "Uncategorized"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">
                      Your resource will be reviewed by our team before being published.
                      This typically takes 1-2 business days.
                    </p>
                  </div>
                </div>
                
                {/* Upload progress bar (when uploading) */}
                {uploadResourceMutation.isPending && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Uploading resource...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-[#00d4ff] h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{uploadProgress}%</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={uploadResourceMutation.isPending}>
                Back
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={uploadResourceMutation.isPending}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90"
              >
                {uploadResourceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resource
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}