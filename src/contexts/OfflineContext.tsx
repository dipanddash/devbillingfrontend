/**
 * React context that exposes offline system state to the entire app.
 * Provides: isOnline, pendingSyncCount, lastSyncedAt, and sync controls.
 */
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  initOffline,
  isOnline as checkIsOnline,
  onConnectivityChange,
  getPendingSyncCount,
  onSyncStatusChange,
  forceSyncNow,
  fetchAndCacheSnapshot,
} from "@/offline";

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
  const [online, setOnline] = useState(checkIsOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Initialize offline system
    initOffline().then(async () => {
      setIsReady(true);
      const count = await getPendingSyncCount();
      setPendingCount(count);
    });

    // Listen for connectivity changes
    const unsubscribe = onConnectivityChange((isOnline) => {
      setOnline(isOnline);
    });

    // Listen for sync status changes
    onSyncStatusChange((count) => {
      setPendingCount(count);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncNow = useCallback(async () => {
    await forceSyncNow();
    const count = await getPendingSyncCount();
    setPendingCount(count);
  }, []);

  const refreshCache = useCallback(async () => {
    await fetchAndCacheSnapshot();
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        isOnline: online,
        pendingSyncCount: pendingCount,
        isReady,
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
