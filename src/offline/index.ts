/**
 * Offline-first module — barrel export and initialization.
 */
export { getDb, generateUUID } from "./db";
export { isOnline, onConnectivityChange, startConnectivityMonitor, stopConnectivityMonitor } from "./network";
export { cacheAuthCredentials, offlineLogin, hasCachedCredentials } from "./auth";
export {
  cacheSnapshot, cacheCategories, cacheProducts, cacheAddons, cacheCombos, cacheCustomers,
  getCachedCategories, getCachedProducts, getCachedAddons, getCachedCombos, getCachedCustomers,
  getLastSnapshotTime,
} from "./cache";
export { addToSyncQueue, getPendingSyncCount, getFailedItems, retryFailedItem } from "./queue";
export { createOfflineOrder, getOfflineOrders, getPendingOrderCount } from "./orders";
export { startSyncWorker, stopSyncWorker, forceSyncNow, fetchAndCacheSnapshot, onSyncStatusChange } from "./sync";

import { getDb } from "./db";
import { startConnectivityMonitor } from "./network";
import { startSyncWorker } from "./sync";

/**
 * Initialize the offline system. Call once at app startup.
 * This initializes SQLite, starts connectivity monitoring, and starts the sync worker.
 */
export async function initOffline(): Promise<void> {
  try {
    await getDb();
    startConnectivityMonitor();
    startSyncWorker();
    console.log("[Offline] System initialized successfully");
  } catch (err) {
    console.error("[Offline] Initialization failed:", err);
  }
}
