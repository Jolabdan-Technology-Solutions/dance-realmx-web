import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CachedAvatar } from "@/components/ui/cached-avatar";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";

export default function ProfileImageDebug() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileImage(user.profile_image_url);
    }
  }, [user]);

  // Function to refresh user data
  const refreshUserData = () => {
    setRefreshCounter(prev => prev + 1);
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    toast({
      title: "Refreshed",
      description: "User data has been refreshed from server."
    });
  };

  // File input reference for direct upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Handle selecting a file for direct upload
  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle direct upload with a user-selected file
  const handleDirectUpload = async (event?: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadStatus("Preparing direct upload...");
      
      // Get the selected file from the input or use a test image as fallback
      let selectedFile: File | null = null;
      
      if (event?.target?.files && event.target.files.length > 0) {
        selectedFile = event.target.files[0];
        setUploadStatus(`Selected file: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`);
      } else if (!event) {
        // No event means we're calling this directly without a file input change
        setUploadStatus("No file selected. Please select a file first.");
        handleSelectFile();
        return;
      } else {
        setUploadStatus("No file selected.");
        return;
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', 'user');
      formData.append('type', 'profile-image');
      
      setUploadStatus(`Uploading ${selectedFile.name}...`);
      
      // Make direct fetch request to the upload endpoint
      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed:", errorText);
        setUploadStatus(`Upload failed: ${response.status} ${response.statusText}`);
        
        try {
          setUploadResponse(JSON.parse(errorText));
        } catch {
          setUploadResponse({ error: errorText });
        }
        return;
      }
      
      const data = await response.json();
      setUploadStatus("Upload successful!");
      setUploadResponse(data);
      
      // Use a new timestamp to force cache update
      const timestamp = Date.now();
      const cacheBustedUrl = data.url.includes('?') 
        ? `${data.url}&t=${timestamp}` 
        : `${data.url}?t=${timestamp}`;
      
      // Update the profile image with cache-busting
      setProfileImage(cacheBustedUrl);
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Upload Successful",
        description: `Image "${selectedFile.name}" uploaded successfully.`
      });
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error in upload:", error);
      setUploadStatus(`Error: ${(error as Error).message}`);
      setUploadResponse({ error: (error as Error).message });
    }
  };

  // Helper function to create a test image blob
  const createTestImage = (): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create a simple gradient background
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#ff9966');
        gradient.addColorStop(1, '#ff5e62');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);
        
        // Add some text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Profile Test', 100, 100);
        ctx.fillText(new Date().toLocaleTimeString(), 100, 130);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object from the blob
            const file = new File([blob], 'profile-test.png', { type: 'image/png' });
            resolve(file);
          } else {
            // If blob creation fails, create a small text file instead as fallback
            const textBlob = new Blob(['Test file content'], { type: 'text/plain' });
            const file = new File([textBlob], 'fallback.txt', { type: 'text/plain' });
            resolve(file);
          }
        }, 'image/png');
      } else {
        // If canvas is not supported, create a text file
        const textBlob = new Blob(['Canvas not supported'], { type: 'text/plain' });
        const file = new File([textBlob], 'fallback.txt', { type: 'text/plain' });
        resolve(file);
      }
    });
  };

  // If not authenticated, show login message
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Profile Image Debug</h1>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to use this tool.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Profile Image Debug Tool</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Current User Profile</CardTitle>
            <CardDescription>
              User ID: {user.id} | Username: {user.username}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32">
                <CachedAvatar
                  firstName={user.first_name}
                  lastName={user.last_name}
                  username={user.username}
                  profileImageUrl={user.profile_image_url}
                  className="w-32 h-32 border-2 border-primary"
                  fallbackClassName="text-3xl"
                  key={`user-avatar-${refreshCounter}`}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Profile Image URL: {user.profile_image_url || 'None'}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshUserData}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh User Data
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>FileUpload Component Test</CardTitle>
            <CardDescription>
              Tests the standard FileUpload component for profile images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUploadComplete={(url) => {
                setProfileImage(url);
                toast({
                  title: "Upload Complete",
                  description: "Profile image uploaded successfully via component."
                });
              }}
              uploadEndpoint="/api/profile/upload"
              acceptedTypes="image/*"
              defaultValue={profileImage || ''}
              label="Profile Image"
              buttonText="Select Image File"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Direct Upload Test</CardTitle>
            <CardDescription>
              Upload your own profile image directly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              {/* Hidden file input */}
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleDirectUpload}
              />
              
              {/* Visible button */}
              <div className="flex items-center justify-between">
                <Button 
                  onClick={handleSelectFile}
                  className="flex-1 mr-2"
                >
                  Select Image File
                </Button>
                
                <Button 
                  onClick={() => {
                    // Call without event parameter to trigger file selection if needed
                    handleDirectUpload();
                  }}
                  variant="outline"
                  type="button"
                >
                  Upload Selected Image
                </Button>
              </div>
              
              {uploadStatus && (
                <div className="p-2 bg-muted rounded-lg">
                  <p className="font-semibold">Status:</p>
                  <p className="text-sm">{uploadStatus}</p>
                </div>
              )}
              
              {uploadResponse && (
                <div className="p-2 bg-muted rounded-lg">
                  <p className="font-semibold">Response:</p>
                  <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(uploadResponse, null, 2)}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Preview Updated Profile</CardTitle>
            <CardDescription>
              Shows the currently uploaded image (if any)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {profileImage ? (
                <>
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary">
                    <img 
                      src={profileImage} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Error loading profile image preview:", profileImage);
                        e.currentTarget.src = "https://ui-avatars.com/api/?name=Image+Error&background=red&color=fff";
                      }}
                    />
                  </div>
                  <div className="text-sm break-all text-center">
                    <span className="font-semibold">URL:</span> {profileImage}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No profile image uploaded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}