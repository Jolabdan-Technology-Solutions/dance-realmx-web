import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { UserRole } from '@/types/user';
import { UpgradeModal } from '@/components/modals/UpgradeModal';

interface FeatureGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredSubscription?: boolean;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  children,
  requiredRoles = [],
  requiredSubscription = false,
}) => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  const hasRequiredRole = React.useMemo(() => {
    if (!requiredRoles.length) return true;
    if (!user?.role_mappings) return false;
    return requiredRoles.some(role => 
      user.role_mappings.some(mapping => mapping.role === role)
    );
  }, [user?.role_mappings, requiredRoles]);

  const hasRequiredSubscription = React.useMemo(() => {
    if (!requiredSubscription) return true;
    return subscription?.status === 'ACTIVE';
  }, [subscription, requiredSubscription]);

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  if (!hasRequiredRole || !hasRequiredSubscription) {
    return (
      <>
        <div 
          onClick={handleUpgradeClick}
          className="cursor-pointer"
        >
          {children}
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          requiredRoles={requiredRoles}
          requiredSubscription={requiredSubscription}
        />
      </>
    );
  }

  return <>{children}</>;
}; 