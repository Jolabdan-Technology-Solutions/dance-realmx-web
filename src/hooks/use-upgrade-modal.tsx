import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UseUpgradeModalReturn {
  isUpgradeModalOpen: boolean;
  openUpgradeModal: (featureName?: string) => void;
  closeUpgradeModal: () => void;
  currentFeatureName: string | undefined;
  checkFeatureAccess: (featureKey: string) => Promise<boolean>;
}

export function useUpgradeModal(): UseUpgradeModalReturn {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [currentFeatureName, setCurrentFeatureName] = useState<string>();

  // Fetch user's features
  const { data: userFeatures } = useQuery<string[]>({
    queryKey: ["user-features"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users/features");
      return response.json();
    },
  });

  const openUpgradeModal = useCallback((featureName?: string) => {
    setCurrentFeatureName(featureName);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
    setCurrentFeatureName(undefined);
  }, []);

  const checkFeatureAccess = useCallback(async (featureKey: string): Promise<boolean> => {
    try {
      const response = await apiRequest("GET", `/api/features/check/${featureKey}`);
      const data = await response.json();
      return data.hasAccess;
    } catch (error) {
      console.error("Error checking feature access:", error);
      return false;
    }
  }, []);

  return {
    isUpgradeModalOpen,
    openUpgradeModal,
    closeUpgradeModal,
    currentFeatureName,
    checkFeatureAccess,
  };
} 