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
    if (files.length === 0) {
      setError("No files selected");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      console.log("=== File Upload Started ===");
      console.log(
        "Files to upload:",
        files.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        }))
      );
      console.log("Upload endpoint:", uploadEndpoint);

      const formData = new FormData();

      if (multiple) {
        files.forEach((file, index) => {
          console.log(`Adding file ${index + 1} to form data:`, {
            name: file.name,
            size: file.size,
            type: file.type,
          });
          formData.append("files", file);
        });
      } else {
        console.log("Adding single file to form data:", {
          name: files[0].name,
          size: files[0].size,
          type: files[0].type,
        });
        formData.append("file", files[0]);
      }

      // Get auth token
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("Upload failed: No auth token found");
        throw new Error("Authentication required. Please log in again.");
      }

      console.log("Making upload request...");
      const response = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Upload response status:", response.status);
      console.log(
        "Upload response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          console.error("Upload error response:", errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          const errorText = await response.text();
          console.error("Raw error response:", errorText);
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Upload response data:", data);

      if (multiple) {
        // Handle multiple file upload response
        if (!Array.isArray(data)) {
          console.error(
            "Expected array response for multiple files, got:",
            typeof data
          );
          throw new Error("Invalid response format for multiple files");
        }

        const urls = data.map((item, index) => {
          const url = item.url || item.image_url || item.file_url;
          if (!url) {
            console.error(`No URL found for file ${index + 1}:`, item);
            throw new Error(`No URL found for file ${index + 1}`);
          }
          return url;
        });

        console.log("Multiple file URLs:", urls);
        setPreviews(urls);

        const fileMetadataArray: FileMetadata[] = data.map((item, index) => ({
          size: item.size || files[index]?.size || 0,
          name: item.original_name || files[index]?.name || `file-${index + 1}`,
          type:
            item.mimetype || files[index]?.type || "application/octet-stream",
        }));

        onUploadComplete(urls, fileMetadataArray);

        // Dispatch event for multiple uploads
        const multiUploadEvent = new CustomEvent("file-upload-complete", {
          detail: {
            urls: urls,
            fileIds: data.map((item) => item.fileId || null),
            fileTypes: files.map((file) => file.type),
            fileNames: files.map((file) => file.name),
          },
        });
        document.dispatchEvent(multiUploadEvent);
      } else {
        // Handle single file upload response
        console.log("Processing single file upload response");

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
          size: data.size || data.uploadInfo?.size || files[0]?.size || 0,
          name:
            data.uploadInfo?.originalName ||
            data.original_name ||
            baseUrl.split("/").pop() ||
            "uploaded-file",
          type:
            data.uploadInfo?.mimetype ||
            data.mimetype ||
            files[0]?.type ||
            "application/octet-stream",
        };

        // Special handling for profile image uploads
        if (uploadEndpoint.includes("/profile")) {
          console.log("=== Profile Image Upload Processing ===");
          console.log("Profile image updated, refreshing user data");
          console.log("User data from response:", data.user);

          // Dispatch an event to notify other components about the profile update
          const profileUpdateEvent = new CustomEvent("profile-image-updated", {
            detail: {
              url: baseUrl,
              cacheBustedUrl: cacheBustedUrl,
              timestamp: timestamp,
              fileId: data.fileId || null,
              userData: data.user,
            },
          });
          console.log(
            "FileUpload - Dispatching profile-image-updated event:",
            profileUpdateEvent.detail
          );
          document.dispatchEvent(profileUpdateEvent);

          // Force refresh the Auth context by emitting another event
          const authRefreshEvent = new CustomEvent("auth-refresh-required");
          console.log("FileUpload - Dispatching auth-refresh-required event");
          document.dispatchEvent(authRefreshEvent);

          // Add a slight delay to ensure the server has processed everything
          setTimeout(() => {
            console.log("Calling onUploadComplete for profile image");
            onUploadComplete(baseUrl, fileMetadata);
          }, 200);
        } else {
          // For non-profile uploads
          console.log(
            "Sending URL to parent component:",
            baseUrl,
            "with metadata:",
            fileMetadata
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

      console.log("=== File Upload Completed Successfully ===");
    } catch (err) {
      console.error("=== File Upload Failed ===");
      console.error("Upload error details:", {
        message: (err as Error).message,
        stack: (err as Error).stack,
        name: (err as Error).name,
      });

      const errorMessage = (err as Error).message || "Failed to upload file";
      setError(errorMessage);

      // Show user-friendly error message
      if (errorMessage.includes("Authentication required")) {
        setError("Please log in again to upload files");
      } else if (errorMessage.includes("File too large")) {
        setError("File is too large. Please choose a smaller file.");
      } else if (errorMessage.includes("Invalid file type")) {
        setError("File type not supported. Please choose a different file.");
      } else if (errorMessage.includes("No file uploaded")) {
        setError("Please select a file to upload.");
      } else {
        setError(`Upload failed: ${errorMessage}`);
      }
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
