import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DANCE_STYLES, AGE_RANGES, DIFFICULTY_LEVELS } from "@/lib/constants";
import { convertToYouTubeEmbedUrl } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const EditResourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  detailedDescription: z.string().optional(),
  danceStyle: z.string().min(1, "Dance style is required"),
  difficultyLevel: z.string().min(1, "Difficulty level is required"),
  ageRange: z.string().min(1, "Age range is required"),
  price: z.string().min(1, "Price is required"),
  status: z.string().min(1, "Status is required"),
  tags: z.string().optional(),
  previewVideoUrl: z.string().optional(),
  fullVideoUrl: z.string().optional(),
});

type EditResourceFormValues = z.infer<typeof EditResourceSchema>;

export default function EditResourcePage() {
  const { id } = useParams();
  const resourceId = parseInt(id || "0");
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);

  const { data: resource, isLoading, error } = useQuery({ 
    queryKey: ['/api/resources', resourceId],
    queryFn: () => fetch(`/api/resources/${resourceId}`).then(res => {
      if (!res.ok) throw new Error('Resource not found');
      return res.json();
    })
  });

  const form = useForm<EditResourceFormValues>({
    resolver: zodResolver(EditResourceSchema),
    defaultValues: {
      title: "",
      description: "",
      detailedDescription: "",
      danceStyle: "",
      difficultyLevel: "",
      ageRange: "",
      price: "",
      status: "published",
      tags: "",
      previewVideoUrl: "",
      fullVideoUrl: "",
    },
  });

  useEffect(() => {
    if (resource) {
      // Format price to always have 2 decimal places for display
      let formattedPrice = resource.price || "";
      try {
        const priceNum = parseFloat(formattedPrice);
        if (!isNaN(priceNum)) {
          formattedPrice = priceNum.toFixed(2);
        }
      } catch (e) {
        console.error("Error formatting price:", e);
      }
      
      console.log("Setting form values:", {
        danceStyle: resource.danceStyle || "",
        difficultyLevel: resource.difficultyLevel || "",
        ageRange: resource.ageRange || "",
        price: formattedPrice
      });
      
      // Always ensure status has a value
      const statusValue = resource.status || "published";
      console.log("Setting status value:", statusValue);
      
      form.reset({
        title: resource.title || "",
        description: resource.description || "",
        detailedDescription: resource.detailedDescription || "",
        danceStyle: resource.danceStyle || "",
        difficultyLevel: resource.difficultyLevel || "",
        ageRange: resource.ageRange || "",
        price: formattedPrice,
        status: statusValue,
        tags: resource.tags?.join(",") || "",
        previewVideoUrl: resource.previewVideoUrl || "",
        fullVideoUrl: resource.fullVideoUrl || "",
      });
      
      // Force-set the status field separately to ensure it's registered correctly
      form.setValue("status", statusValue);
      
      if (resource.imageUrl) {
        setImagePreview(resource.imageUrl);
      }
    }
  }, [resource]);

  const updateMutation = useMutation({
    mutationFn: async (values: EditResourceFormValues) => {
      try {
        console.log("Preparing resource data for PATCH request...");
        
        // Prepare the updated resource data
        const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()) : [];
        
        // Make sure price is properly formatted for the API
        let formattedPrice = values.price;
        try {
          const priceNum = parseFloat(values.price);
          if (!isNaN(priceNum)) {
            formattedPrice = priceNum.toFixed(2);
          }
        } catch (e) {
          console.warn("Could not format price:", e);
        }
        
        // Convert price to a number to ensure it's treated as a numeric value by the server
        // This helps fix the issue where price changes from 0 to 500 weren't being saved correctly
        const priceValue = parseFloat(formattedPrice);
        const numericPrice = !isNaN(priceValue) ? priceValue : 0;
        
        const resourceData = {
          ...values,
          price: numericPrice,
          tags: tagsArray,
          // Add the uploaded file URLs if available
          ...(imagePreview && { imageUrl: imagePreview }),
          // Ensure video URLs are included
          previewVideoUrl: values.previewVideoUrl || "",
          fullVideoUrl: values.fullVideoUrl || "",
        };
        
        console.log("Making PATCH request to server with data:", resourceData);
        
        const response = await apiRequest("PATCH", `/api/resources/${resourceId}`, resourceData);
        
        if (!response.ok) {
          console.error("Server responded with error:", response.status, response.statusText);
          const errorText = await response.text();
          console.error("Error details:", errorText);
          throw new Error(`Server error: ${response.statusText}`);
        }
        
        console.log("Server response received successfully");
        return response.json();
      } catch (err) {
        console.error("Error during update mutation:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Update successful, received data:", data);
      
      // Invalidate both curriculum and resources queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources', resourceId] });
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum', resourceId] });
      
      toast({
        title: "Resource updated",
        description: "Your resource has been successfully updated.",
      });
      navigate(`/curriculum/${resourceId}`);
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to update resource: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async () => {
    if (!imageFile) return;
    
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('type', 'resource');
      formData.append('entityType', 'resource');
      formData.append('entityId', resourceId.toString());
      
      console.log("Uploading resource image...");
      const response = await fetch('/api/upload/resource', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Upload response:", data);
      
      // Update the resource immediately with the new image URL
      const updateResponse = await apiRequest("PATCH", `/api/resources/${resourceId}`, {
        imageUrl: data.url
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update resource with new image URL');
      }
      
      // Update the preview with timestamp to avoid caching
      setImagePreview(`${data.url}?v=${Date.now()}`);
      
      toast({
        title: "Image uploaded",
        description: "The image has been successfully uploaded and linked to the resource.",
      });
    } catch (err) {
      const error = err as Error;
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      setImageFile(null); // Reset file input
    }
  };

  const handleResourceFileUpload = async () => {
    if (!resourceFile) return;
    
    try {
      setUploadingResource(true);
      const formData = new FormData();
      formData.append('file', resourceFile);
      formData.append('type', 'resource');
      formData.append('entityType', 'resource');
      formData.append('entityId', resourceId.toString());
      
      console.log("Uploading resource file...");
      const response = await fetch('/api/upload/resource', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", response.status, errorText);
        throw new Error(`Failed to upload resource file: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Upload response:", data);
      
      // Update the resource with the new file URL
      const updateResponse = await apiRequest("PATCH", `/api/resources/${resourceId}`, {
        fileUrl: data.url,
        fileType: resourceFile.type,
        fileSize: resourceFile.size,
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update resource with new file');
      }
      
      toast({
        title: "Resource file uploaded",
        description: "The resource file has been successfully uploaded and linked to the resource.",
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/resources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum'] });
      queryClient.invalidateQueries({ queryKey: ['/api/resources', resourceId] });
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum', resourceId] });
      
    } catch (err) {
      const error = err as Error;
      console.error("Resource file upload error:", error);
      toast({
        title: "Error",
        description: `Failed to upload resource file: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setUploadingResource(false);
      setResourceFile(null); // Reset file input
    }
  };

  const onSubmit = (values: EditResourceFormValues) => {
    console.log("Form submission triggered with values:", values);
    
    // Make sure price is properly formatted
    let updatedValues = { ...values };
    
    // Format the price
    try {
      if (values.price) {
        const priceNum = parseFloat(values.price);
        if (!isNaN(priceNum)) {
          updatedValues.price = priceNum.toFixed(2);
        }
      }
    } catch (e) {
      console.error("Error formatting price during submission:", e);
    }
    
    // Convert YouTube URLs to embed format
    if (updatedValues.previewVideoUrl) {
      updatedValues.previewVideoUrl = convertToYouTubeEmbedUrl(updatedValues.previewVideoUrl);
    }
    
    if (updatedValues.fullVideoUrl) {
      updatedValues.fullVideoUrl = convertToYouTubeEmbedUrl(updatedValues.fullVideoUrl);
    }
    
    console.log("Submitting with updated values:", updatedValues);
    updateMutation.mutate(updatedValues);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load resource'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/curriculum')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Resource</CardTitle>
          <CardDescription>
            Update the details of your resource. Upload new images or files as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Raw form submission event triggered");
                console.log("Form values:", form.getValues());
                console.log("Form state:", form.formState);
                form.handleSubmit(onSubmit)(e);
              }} 
              className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter resource title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="danceStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dance Style</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        defaultValue=""
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dance style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DANCE_STYLES.map((style) => (
                            <SelectItem key={style} value={style}>{style}</SelectItem>
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
                        value={field.value || ""}
                        defaultValue=""
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DIFFICULTY_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ageRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Range</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        defaultValue=""
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select age range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AGE_RANGES.map((ageRange) => (
                            <SelectItem key={ageRange} value={ageRange}>{ageRange}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="19.99" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter a short description of your resource" 
                        {...field}
                        rows={3} 
                      />
                    </FormControl>
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
                        placeholder="Enter a detailed description of your resource" 
                        {...field}
                        rows={6} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tags separated by commas" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter tags separated by commas (e.g., ballet, beginner, technique)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "published"}
                      defaultValue="published"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-6 border-t pt-6 mt-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Instructional Video</h3>
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <FormField
                      control={form.control}
                      name="fullVideoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter YouTube video URL for this resource" 
                              {...field} 
                              onChange={(e) => {
                                field.onChange(e);
                                
                                // Auto-populate preview video URL to maintain database compatibility
                                // In the UI we'll only show the preview from this single video
                                if (e.target.value) {
                                  form.setValue('previewVideoUrl', e.target.value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a YouTube video URL. Unpurchased users will see a 15-second preview, while purchasers will see the full video.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Resource Image</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    {imagePreview && (
                      <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                        <img 
                          src={`${imagePreview}?v=${Date.now()}`} 
                          alt="Resource preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://ui-avatars.com/api/?name=Dance+Resource&background=00d4ff&color=000&size=256&bold=true';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-4">
                      {/* File Upload Option */}
                      <div>
                        <label className="text-sm font-medium">Upload Image File</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                            }
                          }}
                          className="mt-2"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleImageUpload}
                          disabled={!imageFile || uploadingImage}
                          className="w-full md:w-auto mt-2"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* URL Input Option */}
                      <div>
                        <label className="text-sm font-medium">Or Enter Image URL</label>
                        <Input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={imagePreview || ""}
                          onChange={(e) => {
                            setImagePreview(e.target.value);
                            // Update the resource immediately with the new URL
                            if (e.target.value) {
                              updateResourceMutation.mutate({
                                ...form.getValues(),
                                imageUrl: e.target.value
                              });
                            }
                          }}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          You can either upload a file above or paste an image URL here
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Resource File</h3>
                  <div className="space-y-2">
                    {resource?.fileUrl && (
                      <div className="text-sm bg-slate-50 p-2 rounded-md">
                        Current file: <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{resource.fileUrl.split('/').pop()}</a>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setResourceFile(file);
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleResourceFileUpload}
                      disabled={!resourceFile || uploadingResource}
                      className="w-full md:w-auto"
                    >
                      {uploadingResource ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Resource File
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                type="button" 
                className="w-full md:w-auto"
                disabled={updateMutation.isPending}
                onClick={() => {
                  console.log("Save button clicked directly");
                  // Get current values and ensure status has a default if it's empty
                  const values = form.getValues();
                  
                  // Set default status if empty
                  if (!values.status) {
                    values.status = "published";
                    form.setValue("status", "published");
                  }
                  
                  console.log("Current form values with default status:", values);
                  
                  // Manually trigger validation
                  form.trigger().then(isValid => {
                    console.log("Form validation result:", isValid);
                    if (isValid) {
                      onSubmit(values);
                    } else {
                      console.error("Form validation failed:", form.formState.errors);
                      
                      // Show toast with validation errors
                      toast({
                        title: "Validation Error",
                        description: "Please check the form for errors and try again.",
                        variant: "destructive",
                      });
                    }
                  });
                }}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(`/curriculum/${resourceId}`)}>Cancel</Button>
        </CardFooter>
      </Card>
    </div>
  );
}