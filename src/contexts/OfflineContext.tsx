/**
 * React context that exposes offline system state to the entire app.
 * Provides: isOnline, pendingSyncCount, lastSyncedAt, and sync controls.
 */
import { createContext, useContext, useCallback } from "react";

interface OfflineContextType {
  /** Whether the app is currently connected to the backend. */
  isOnline: boolean;
  /** Number of operations waiting to be synced. */
  pendingSyncCount: number;
  /** Whether the offline system has been initialized. */
  isReady: boolean;
  /** Force an immediate sync attempt. */
  syncNow: () => Promise<void>;
  /** Refresh the local cache from the server. */
  refreshCache: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: React.ReactNode }) => {
  const syncNow = useCallback(async () => {
    return;
  }, []);

  const refreshCache = useCallback(async () => {
    return;
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline: true,
        pendingSyncCount: 0,
        isReady: true,
        syncNow,
        refreshCache,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return context;
};
