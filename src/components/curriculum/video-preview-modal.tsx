import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { convertToYouTubeEmbedUrl } from "@/lib/utils";
import { X } from "lucide-react";

interface VideoPreviewModalProps {
  videoUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  previewDuration?: number; // Duration in seconds (default: 15)
}

export function VideoPreviewModal({ 
  videoUrl, 
  isOpen, 
  onClose,
  previewDuration = 15
}: VideoPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  useEffect(() => {
    if (!videoUrl) return;
    
    // Convert to embed URL and add start/end parameters for preview
    let embedUrl = convertToYouTubeEmbedUrl(videoUrl);
    
    // Add parameters for preview duration if it's a YouTube URL
    if (embedUrl.includes('youtube.com/embed/')) {
      // Add start time (0 seconds) and end time (previewDuration seconds)
      const separator = embedUrl.includes('?') ? '&' : '?';
      embedUrl += `${separator}start=0&end=${previewDuration}&autoplay=1`;
    }
    
    setPreviewUrl(embedUrl);
  }, [videoUrl, previewDuration]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 pt-4 pb-2 flex flex-row justify-between items-center">
          <DialogTitle>Video Preview</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="aspect-video w-full">
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          )}
        </div>
        
        <div className="p-4 text-center text-sm text-muted-foreground">
          This is a {previewDuration}-second preview. Purchase to access the full instructional video.
        </div>
      </DialogContent>
    </Dialog>
  );
}