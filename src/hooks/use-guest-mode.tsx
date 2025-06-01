import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface GuestModeContextType {
  guestMode: boolean;
  isGuestMode: boolean; // Alias for consistency
  isGuestModeEnabled: boolean; // Another alias for backward compatibility
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export function GuestModeProvider({ children }: { children: ReactNode }) {
  const [guestMode, setGuestMode] = useState(true); // Default to guest mode enabled

  // Load guest mode state from localStorage on initial render
  useEffect(() => {
    const storedGuestMode = localStorage.getItem('guestModeEnabled');
    if (storedGuestMode === 'false') {
      setGuestMode(false);
    }
  }, []);

  const enableGuestMode = () => {
    setGuestMode(true);
    localStorage.setItem('guestModeEnabled', 'true');
  };

  const disableGuestMode = () => {
    setGuestMode(false);
    localStorage.setItem('guestModeEnabled', 'false');
  };

  return (
    <GuestModeContext.Provider value={{ 
      guestMode, 
      isGuestMode: guestMode, // Alias for property name consistency
      isGuestModeEnabled: guestMode, // Another alias for backward compatibility
      enableGuestMode, 
      disableGuestMode 
    }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
}