import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";

interface FileMetadata {
  size?: number;
  name?: string;
  type?: string;
  file?: File; // Add the actual File object for components that need direct access
}

interface FileUploadProps {
  onUploadComplete: (
    fileUrl: string | string[],
    metadata?: FileMetadata | FileMetadata[]
  ) => void;
  defaultValue?: string;
  maxSizeMB?: number;
  acceptedTypes?: string;
  uploadEndpoint?: string;
  label?: string;
  buttonText?: string;
  multiple?: boolean;
  maxFiles?: number;
}

export function FileUpload({
  onUploadComplete,
  defaultValue = "",
  maxSizeMB = 20,
  acceptedTypes = "image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv,application/zip,application/x-rar-compressed",
  uploadEndpoint = API_ENDPOINTS.UPLOAD.BASE,
  label = "Upload file",
  buttonText = "Choose file",
  multiple = false,
  maxFiles = 5,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(
    defaultValue ? [defaultValue] : []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // For multiple files, check if we've exceeded the maximum
    if (multiple && selectedFiles.length > maxFiles) {
      setError(`Maximum of ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes (convert MB to bytes)
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > maxSizeMB * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setError(
        `${oversizedFiles.length > 1 ? "Some files exceed" : "File exceeds"} the maximum size of ${maxSizeMB}MB`
      );
      return;
    }

    // For single file upload, just use the first file
    if (!multiple) {
      const singleFile = selectedFiles[0];
      setFiles([singleFile]);
      setError(null);

      // Create preview for images
      if (singleFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviews([reader.result as string]);
        };
        reader.readAsDataURL(singleFile);
      } else {
        // For non-image files, just show the filename
        setPreviews([`File selected: ${singleFile.name}`]);
      }
      return;
    }

    // For multiple files, process all of them
    setFiles(selectedFiles);
    setError(null);

    // Create previews for all files
    const newPreviews: string[] = [];
    let completedPreviews = 0;

    selectedFiles.forEach((file, index) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          // Ensure we maintain the correct order
          newPreviews[index] = reader.result as string;
          completedPreviews++;

          // Once all previews are generated, update state
          if (completedPreviews === selectedFiles.length) {
            // Filter out any undefined values (should never happen, but just in case)
            setPreviews(newPreviews.filter((p) => p !== undefined));
          }
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just show the filename
        newPreviews[index] = `File selected: ${file.name}`;
        completedPreviews++;

        if (completedPreviews === selectedFiles.length) {
          // Filter out any undefined values
          setPreviews(newPreviews.filter((p) => p !== undefined));
        }
      }
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    console.log("Starting file upload to endpoint:", uploadEndpoint);

    try {
      const formData = new FormData();

      // Handle single vs multiple file uploads
      if (!multiple) {
        // Single file upload (use the first file)
        const file = files[0];
        formData.append("file", file); // IMPORTANT: This field name must be 'file'

        // Add type information for server-side validation
        formData.append("entity_type", "user");

        // Add metadata based on upload endpoint
        if (uploadEndpoint.includes("/profile")) {
          formData.append("type", "profile-image");
        } else {
          // For resource uploads, include resource type
          formData.append("type", "resource");
        }

        // Log details about the upload
        console.log("Uploading file:", {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          endpoint: uploadEndpoint,
          lastModified: new Date(file.lastModified).toISOString(),
        });

        // For profile images, we need additional handling
        if (uploadEndpoint.includes("/profile")) {
          console.log(
            "This is a profile image upload - ensuring proper content type"
          );

          // Make sure we're only uploading images for profile
          if (!file.type.startsWith("image/")) {
            throw new Error(
              "Profile images must be image files (JPG, PNG, etc.)"
            );
          }
        }
      } else {
        // Multiple file upload
        files.forEach((file, index) => {
          // For multiple files, we'll use a different field name pattern
          formData.append(`file${index}`, file);
        });

        // Add flags to indicate this is a multi-file upload
        formData.append("multiple_files", "true");
        formData.append("file_count", files.length.toString());

        // Add metadata for the upload
        formData.append("entity_type", "resource");
        formData.append("type", "resource");

        // Log details about the multi-upload
        console.log("Uploading multiple files:", {
          count: files.length,
          totalSize: `${(files.reduce((total, f) => total + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
          endpoint: uploadEndpoint,
        });
      }

      console.log(`Making upload request to ${uploadEndpoint}...`);
      // Log the formData contents for debugging
      console.log("FormData entries being sent:");

      // Array.from is compatible with older browsers
      try {
        const entries = Array.from(formData.entries());
        entries.forEach((pair) => {
          const key = pair[0];
          const value = pair[1];
          if (value instanceof File) {
            console.log(`- ${key}: File[${value.name}, ${value.size} bytes]`);
          } else {
            console.log(`- ${key}: ${value}`);
          }
        });
      } catch (err) {
        console.log("Could not iterate formData entries:", err);
      }

      // Make a native fetch request for more control over the upload process
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header; browser will set with boundary for multipart/form-data
        credentials: "same-origin", // Include session cookies
      });

      if (!response.ok) {
        console.error(
          "Upload failed with status:",
          response.status,
          response.statusText
        );

        // Try to get more detailed error information
        try {
          const errorText = await response.text();
          console.error("Error response text:", errorText);

          let errorData;
          try {
            errorData = JSON.parse(errorText);
            console.error("Error response data:", errorData);
          } catch (parseError) {
            console.error("Error response is not JSON:", errorText);
            errorData = { error: errorText };
          }

          throw new Error(
            errorData.message ||
              errorData.error ||
              `Upload failed: ${response.statusText}`
          );
        } catch (parseError) {
          throw new Error(
            `Upload failed with status ${response.status}: ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      console.log("Upload successful, received response:", data);

      // Handle the response differently for multiple files vs. single file
      if (multiple && data.urls) {
        // Handle multiple file upload response
        console.log(
          "Multiple file upload successful, received URLs:",
          data.urls
        );

        // Ensure all URLs are absolute and add cache busting
        const timestamp = Date.now();
        const processedUrls: string[] = [];
        const filesMetadata: FileMetadata[] = [];

        // Process each URL in the response
        data.urls.forEach((url: string, index: number) => {
          // Ensure the URL is absolute
          let baseUrl = url.split("?")[0]; // Remove any query parameters

          // If it's a relative URL, convert to absolute
          if (
            baseUrl.startsWith("/") &&
            !baseUrl.startsWith("//") &&
            typeof window !== "undefined"
          ) {
            baseUrl = `${window.location.origin}${baseUrl}`;
          }

          // Add a cache-busting parameter
          const cacheBustedUrl = `${baseUrl}?t=${timestamp}`;
          processedUrls.push(baseUrl); // We'll use the non-cache-busted URL for the callback

          // Create metadata for this file
          filesMetadata.push({
            size: data.sizes?.[index] || 0,
            name:
              data.original_names?.[index] ||
              baseUrl.split("/").pop() ||
              `file-${index}`,
            type:
              data.mimetypes?.[index] ||
              files[index]?.type ||
              "application/octet-stream",
          });
        });

        // Update the previews with the processed URLs
        setPreviews(processedUrls);

        // Call the parent component's callback with all URLs and metadata
        onUploadComplete(processedUrls, filesMetadata);

        // Emit a generic event for multiple file upload completion
        const multiUploadEvent = new CustomEvent("files-upload-complete", {
          detail: {
            urls: processedUrls,
            timestamp: timestamp,
            count: processedUrls.length,
          },
        });
        document.dispatchEvent(multiUploadEvent);
      } else {
        // Handle single file upload response
        // Get the URL from the response (could be returned with various property names)
        const responseUrl =
          data.url || data.image_url || data.file_url || data.profile_image_url;
        if (!responseUrl) {
          console.error("No URL found in response:", data);
          throw new Error("No URL found in upload response");
        }

        console.log("Response URL from server:", responseUrl);

        // Ensure the URL is absolute
        let baseUrl = responseUrl.split("?")[0]; // Remove any query parameters

        // If it's a relative URL, convert to absolute
        if (
          baseUrl.startsWith("/") &&
          !baseUrl.startsWith("//") &&
          typeof window !== "undefined"
        ) {
          baseUrl = `${window.location.origin}${baseUrl}`;
          console.log("Converted relative URL to absolute:", baseUrl);
        }

        // Add a cache-busting parameter for images
        const timestamp = Date.now();
        const cacheBustedUrl = `${baseUrl}?t=${timestamp}`;

        console.log("Using URL with cache-busting:", cacheBustedUrl);

        // Set preview to the cache-busted URL
        setPreviews([cacheBustedUrl]);

        // Create file metadata
        const fileMetadata: FileMetadata = {
          size: data.size || 0,
          name:
            data.original_name || baseUrl.split("/").pop() || "uploaded-file",
          type: data.mimetype || files[0]?.type || "application/octet-stream",
        };

        // Special handling for profile image uploads
        if (uploadEndpoint.includes("/profile")) {
          console.log("Profile image updated, refreshing user data");

          // Dispatch an event to notify other components about the profile update
          const profileUpdateEvent = new CustomEvent("profile-image-updated", {
            detail: {
              url: baseUrl,
              cacheBustedUrl: cacheBustedUrl,
              timestamp: timestamp,
              fileId: data.fileId || null,
            },
          });
          document.dispatchEvent(profileUpdateEvent);

          // Force refresh the Auth context by emitting another event
          const authRefreshEvent = new CustomEvent("auth-refresh-required");
          document.dispatchEvent(authRefreshEvent);

          // Add a slight delay to ensure the server has processed everything
          setTimeout(() => {
            onUploadComplete(baseUrl, fileMetadata);
          }, 200);
        } else {
          // For non-profile uploads
          console.log(
            "Sending URL to parent component:",
            baseUrl,
            "with size:",
            data.size
          );
          onUploadComplete(baseUrl, fileMetadata);
        }

        // Also mark the upload as complete by emitting a generic event
        const singleUploadEvent = new CustomEvent("file-upload-complete", {
          detail: {
            url: baseUrl,
            cacheBustedUrl: cacheBustedUrl,
            fileId: data.fileId || null,
            timestamp: timestamp,
            fileType: files[0]?.type,
            fileName: files[0]?.name,
          },
        });
        document.dispatchEvent(singleUploadEvent);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to upload file";
      setError(errorMessage);
      console.error("Upload error:", errorMessage, err);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setPreviews([]);
    onUploadComplete("", undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
          multiple={multiple}
        />

        {previews.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={clearFiles}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isUploading && (
        <div className="flex items-center justify-center mt-2">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Uploading...</span>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      {/* Image preview section */}
      {previews.length > 0 && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {previews.map((preview, index) => {
            // Check if this is an image preview
            const isImagePreview =
              preview.startsWith("data:image/") ||
              (preview.startsWith("http") &&
                (files[index]?.type?.startsWith("image/") || false));

            if (isImagePreview) {
              return (
                <div
                  key={index}
                  className="relative aspect-video rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800"
                >
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-full w-full object-cover"
                    onLoad={() =>
                      console.log(
                        `Preview image ${index + 1} loaded successfully`
                      )
                    }
                    onError={(e) => {
                      console.error(
                        `Error loading preview image ${index + 1}:`,
                        preview
                      );
                      e.currentTarget.src =
                        "https://placehold.co/400x400/e2e8f0/a3afc3?text=Image+Error";
                    }}
                  />
                  {multiple && (
                    <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {index + 1}
                    </div>
                  )}
                </div>
              );
            } else if (preview.startsWith("File selected:")) {
              // For non-image files, show the filename
              return (
                <div
                  key={index}
                  className="flex items-center p-2 border rounded-md dark:border-gray-700"
                >
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm truncate">
                    {preview.replace("File selected: ", "")}
                  </span>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
