import { useEffect, useState } from "react";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { UpgradeModal } from "./upgrade-modal";

interface FeatureGuardProps {
  featureKey: string;
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGuard({ 
  featureKey, 
  featureName, 
  children, 
  fallback 
}: FeatureGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const { 
    isUpgradeModalOpen, 
    openUpgradeModal, 
    closeUpgradeModal, 
    checkFeatureAccess 
  } = useUpgradeModal();

  useEffect(() => {
    const checkAccess = async () => {
      const access = await checkFeatureAccess(featureKey);
      setHasAccess(access);
    };
    checkAccess();
  }, [featureKey, checkFeatureAccess]);

  if (hasAccess === null) {
    return null; // or a loading state
  }

  if (!hasAccess) {
    return (
      <>
        {fallback ? (
          <div onClick={() => openUpgradeModal(featureName)}>
            {fallback}
          </div>
        ) : (
          <div 
            className="p-4 rounded-lg border border-gray-800 bg-black/50 cursor-pointer hover:bg-black/70 transition-colors"
            onClick={() => openUpgradeModal(featureName)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">{featureName}</h3>
                <p className="text-gray-400 text-sm">
                  Upgrade your plan to access this feature
                </p>
              </div>
              <div className="text-[#00d4ff]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
          </div>
        )}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={closeUpgradeModal}
          featureName={featureName}
        />
      </>
    );
  }

  return <>{children}</>;
} 