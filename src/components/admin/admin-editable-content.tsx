import { ReactNode, useState } from "react";
import { Edit, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/user";

interface EditableContentProps {
  children: ReactNode;
  type: "text" | "longText" | "image" | "url" | "html";
  id: string | number;
  field: string;
  endpoint: string;
  initialValue: string;
  className?: string;
  imageWidth?: string;
  imageHeight?: string;
  queryKey?: string | string[];
}

export function AdminEditableContent({
  children,
  type,
  id,
  field,
  endpoint,
  initialValue,
  className = "",
  imageWidth,
  imageHeight,
  queryKey,
}: EditableContentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(initialValue);

  // Only show edit UI for admin users
  const isAdmin = user && user.role.includes(UserRole.ADMIN);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await apiRequest(`${endpoint}/${id}`, {
        method: "PATCH",
        data,
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate relevant query to refresh data
      if (queryKey) {
        if (typeof queryKey === "string") {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        } else {
          queryClient.invalidateQueries({ queryKey });
        }
      }
      
      toast({
        title: "Content updated",
        description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated successfully.`,
      });
      
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "There was a problem updating the content.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const data = { [field]: value };
    mutation.mutate(data);
  };

  // If not admin, just render the children without edit functionality
  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className={`relative group ${className}`}>
      {children}
      
      {/* Edit overlay - only visible on hover */}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="secondary" 
          className="p-2" 
          onClick={() => setIsOpen(true)}
        >
          <Edit className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </div>

      {/* Edit modal dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="content-edit">Edit {field}</Label>
            
            {/* Different input types depending on content type */}
            {type === "text" && (
              <Input
                id="content-edit"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-2"
              />
            )}
            
            {type === "longText" && (
              <Textarea
                id="content-edit"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-2 min-h-[100px]"
              />
            )}
            
            {type === "html" && (
              <Textarea
                id="content-edit"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-2 min-h-[150px] font-mono text-sm"
              />
            )}
            
            {type === "image" && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="image-upload">Upload New Image</Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="mt-1"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Create a FormData object to send the file
                        const formData = new FormData();
                        formData.append('image', file);
                        
                        toast({
                          title: "Uploading image...",
                          description: "Please wait while we upload your image.",
                        });
                        
                        try {
                          // Upload the file first
                          const res = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          });
                          
                          if (!res.ok) {
                            const errorData = await res.json();
                            throw new Error(errorData.message || 'Failed to upload image');
                          }
                          
                          const data = await res.json();
                          setValue(data.imageUrl);
                          
                          toast({
                            title: "Upload successful",
                            description: "Image has been uploaded successfully.",
                          });
                        } catch (error: any) {
                          console.error('Error uploading image:', error);
                          toast({
                            title: "Upload failed",
                            description: error?.message || "There was a problem uploading your image.",
                            variant: "destructive",
                          });
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Supported formats: JPG, PNG, GIF. Max size: 5MB
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="image-url">Or Enter Image URL</Label>
                    <Input
                      id="image-url"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Image URL"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="border p-2 rounded-md">
                  <p className="text-sm font-medium mb-2">Image Preview:</p>
                  <div className="h-40 flex items-center justify-center bg-gray-800">
                    <img 
                      src={value} 
                      alt="Preview" 
                      className="max-h-40 max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/images/image-placeholder.jpg";
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}