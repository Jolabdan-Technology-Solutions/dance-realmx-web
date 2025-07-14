import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/use-auth";

interface DebugEvent {
  timestamp: string;
  type: string;
  details: any;
}

export function ProfileImageDebug() {
  const { user } = useAuth();
  const [events, setEvents] = useState<DebugEvent[]>([]);

  useEffect(() => {
    const addEvent = (type: string, details: any) => {
      const newEvent: DebugEvent = {
        timestamp: new Date().toISOString(),
        type,
        details,
      };
      setEvents((prev) => [...prev, newEvent]);
    };

    const onProfileImageUpdate = (event: CustomEvent) => {
      addEvent("profile-image-updated", event.detail);
    };

    const onAuthRefresh = () => {
      addEvent("auth-refresh-required", {});
    };

    const onFileUploadComplete = (event: CustomEvent) => {
      addEvent("file-upload-complete", event.detail);
    };

    document.addEventListener(
      "profile-image-updated",
      onProfileImageUpdate as EventListener
    );
    document.addEventListener("auth-refresh-required", onAuthRefresh);
    document.addEventListener(
      "file-upload-complete",
      onFileUploadComplete as EventListener
    );

    return () => {
      document.removeEventListener(
        "profile-image-updated",
        onProfileImageUpdate as EventListener
      );
      document.removeEventListener("auth-refresh-required", onAuthRefresh);
      document.removeEventListener(
        "file-upload-complete",
        onFileUploadComplete as EventListener
      );
    };
  }, []);

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Profile Image Debug</h3>
        <button
          onClick={clearEvents}
          className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>

      <div className="text-xs mb-2">
        <div>User ID: {user?.id}</div>
        <div>Profile Image: {user?.profile_image_url || "None"}</div>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1">
        {events.map((event, index) => (
          <div
            key={index}
            className="text-xs border-b border-gray-200 dark:border-gray-700 pb-1"
          >
            <div className="font-mono text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </div>
            <div className="font-semibold text-blue-600">{event.type}</div>
            <div className="text-gray-600 dark:text-gray-400">
              {JSON.stringify(event.details, null, 2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
