import React from "react";
import { cn } from "@/lib/utils";
import { Music2, AlertOctagon, LayoutGrid, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResourcePlaceholderProps {
  title: string;
  danceStyle?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  textSize?: "sm" | "md" | "lg";
}

interface ResourceErrorCardProps {
  title?: string;
  message: string;
  className?: string;
  retryFn?: () => void;
}

interface ResourcePlaceholderGridProps {
  count?: number;
  className?: string;
}

/**
 * Generates a visually pleasing placeholder for resources when images fail to load
 * Uses resource metadata to create a branded, styled placeholder
 */
export function ResourcePlaceholder({
  title,
  danceStyle,
  className,
  size = "md",
  textSize = "md",
}: ResourcePlaceholderProps) {
  // Generate a deterministic color based on the title
  const colors = [
    "bg-pink-600",
    "bg-purple-600",
    "bg-blue-600",
    "bg-green-600",
    "bg-yellow-600",
    "bg-red-600",
    "bg-indigo-600",
    "bg-pink-700",
    "bg-purple-700",
    "bg-blue-700",
    "bg-green-700",
    "bg-orange-600",
  ];
  
  // Generate a simple hash of the title
  const hash = title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use the hash to select a color
  const colorIndex = hash % colors.length;
  const backgroundColor = colors[colorIndex];
  
  // Create resource initials for placeholder
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join("")
    .toUpperCase();
  
  // Define size-based classes
  const sizeClasses = {
    sm: "w-20 h-20 text-xs",
    md: "w-32 h-32 text-sm",
    lg: "w-40 h-40 text-base",
  };
  
  const textSizeClasses = {
    sm: "text-xxs",
    md: "text-xs",
    lg: "text-sm",
  };
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded overflow-hidden",
        backgroundColor,
        sizeClasses[size],
        className
      )}
    >
      <div className="flex flex-col items-center justify-center w-full h-full p-2">
        <div className="text-2xl font-bold text-white mb-1">{initials}</div>
        
        {danceStyle && (
          <div
            className={cn(
              "text-white text-opacity-80 flex items-center",
              textSizeClasses[textSize]
            )}
          >
            <Music2 className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[85%]">{danceStyle}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Displays an error message when resource loading fails
 */
export function ResourceErrorCard({
  title = "Error Loading Resources",
  message,
  className,
  retryFn
}: ResourceErrorCardProps) {
  return (
    <Alert 
      variant="destructive" 
      className={cn("my-4 border-destructive/50 bg-destructive/10", className)}
    >
      <AlertOctagon className="h-5 w-5" />
      <AlertTitle className="mb-2">{title}</AlertTitle>
      <AlertDescription>
        {message}
        {retryFn && (
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={retryFn}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Creates a grid of placeholder cards for loading states
 */
export function ResourcePlaceholderGrid({
  count = 6,
  className
}: ResourcePlaceholderGridProps) {
  // Create an array of the specified count
  const placeholders = Array.from({ length: count }, (_, i) => i);
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {placeholders.map((i) => (
        <Card key={`placeholder-${i}`} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="animate-pulse">
              <div className="bg-muted h-48 w-full flex items-center justify-center">
                <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-full mb-2"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-5/6"></div>
                <div className="flex justify-between items-center mt-4">
                  <div className="h-6 bg-primary/20 rounded w-20"></div>
                  <div className="h-8 bg-muted-foreground/20 rounded-full w-8"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}