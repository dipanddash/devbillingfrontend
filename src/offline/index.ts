/**
 * Online-only barrel exports (offline features disabled).
 */

export { getDb, generateUUID, resetLocalBusinessData } from "./db";
export { isOnline, onConnectivityChange, startConnectivityMonitor, stopConnectivityMonitor } from "./network";
export { cacheAuthCredentials, offlineLogin, hasCachedCredentials } from "./auth";
export {
  cacheSnapshot,
  cacheCategories,
  cacheProducts,
  cacheAddons,
  cacheCombos,
  cacheCustomers,
  cacheOrders,
  getCachedOrders,
  cacheOrderDetail,
  getCachedOrderDetail,
  getCachedCategories,
  getCachedProducts,
  getCachedAddons,
  getCachedCombos,
  getCachedCustomers,
  getLastSnapshotTime,
} from "./cache";
export { addToSyncQueue, getPendingSyncCount, getFailedItems, retryFailedItem } from "./queue";
export { createOfflineOrder, getOfflineOrders, getPendingOrderCount } from "./orders";
export { startSyncWorker, stopSyncWorker, forceSyncNow, fetchAndCacheSnapshot, onSyncStatusChange } from "./sync";

export async function initOffline(): Promise<void> {
  return;
}

