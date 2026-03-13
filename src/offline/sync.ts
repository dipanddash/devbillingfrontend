/**
 * Background sync worker — processes the sync queue when online.
 *
 * Features:
 * - Processes queue in small batches (5 items)
 * - Exponential backoff on failures
 * - Non-blocking (runs on intervals, never freezes UI)
 * - Idempotent (server checks client_id to prevent duplicates)
 * - Caches fresh data from server on reconnect
 */
import { isOnline, onConnectivityChange } from "./network";
import { getPendingItems, getPendingSyncCount, markSyncing, markSynced, markFailed, markPermanentlyFailed, cleanupSyncedItems, type SyncQueueItem } from "./queue";
import { markOrderSynced } from "./orders";
import { cacheSnapshot } from "./cache";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const SYNC_INTERVAL = 30_000;  // 30 seconds between sync attempts
const BATCH_SIZE = 5;          // items per sync batch
const BASE_BACKOFF = 5_000;    // 5 seconds base backoff
const MAX_BACKOFF = 300_000;   // 5 minutes max backoff

let _syncTimer: ReturnType<typeof setInterval> | null = null;
let _isSyncing = false;
let _onSyncStatusChange: ((pending: number) => void) | null = null;

/** Register a callback for sync status changes. */
export function onSyncStatusChange(callback: (pendingCount: number) => void) {
  _onSyncStatusChange = callback;
}

/** Calculate exponential backoff delay. */
function getBackoffDelay(retryCount: number): number {
  return Math.min(BASE_BACKOFF * Math.pow(2, retryCount), MAX_BACKOFF);
}

/** Check if an item is ready for retry based on backoff. */
function isReadyForRetry(item: SyncQueueItem): boolean {
  if (item.status === "pending") return true;
  if (!item.last_attempt_at) return true;

  const lastAttempt = new Date(item.last_attempt_at).getTime();
  const backoff = getBackoffDelay(item.retry_count);
  return Date.now() - lastAttempt >= backoff;
}

/** Send a batch of operations to the server sync endpoint. */
async function pushToServer(items: SyncQueueItem[]): Promise<void> {
  const token = localStorage.getItem("access");
  if (!token) return;

  const operations = items.map((item) => ({
    client_id: item.entity_id,
    entity_type: item.entity_type,
    action: item.action,
    data: JSON.parse(item.payload),
  }));

  const res = await fetch(`${API_BASE}/api/sync/push/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ operations }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Sync push failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const results: any[] = data.results || [];

  // Process results for each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = results[i];

    if (!result) {
      await markFailed(item.id, "No result from server");
      continue;
    }

    if (result.status === "synced" || result.status === "already_synced") {
      await markSynced(item.id, result.response_data);

      // Update local order record if it's an order
      if (item.entity_type === "order" && result.response_data) {
        await markOrderSynced(
          item.entity_id,
          result.server_id || result.response_data?.id || "",
          result.response_data?.order_id || "",
          result.response_data?.bill_number,
        );
      }
    } else if (result.status === "error") {
      if (item.retry_count + 1 >= item.max_retries) {
        await markPermanentlyFailed(item.id, result.message || "Server error");
      } else {
        await markFailed(item.id, result.message || "Server error");
      }
    }
  }
}

/** Refresh the local cache by fetching a snapshot from the server. */
async function refreshCache(): Promise<void> {
  const token = localStorage.getItem("access");
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/sync/snapshot/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const snapshot = await res.json();
      await cacheSnapshot(snapshot);
    }
  } catch (err) {
    console.warn("[Sync] Cache refresh failed:", err);
  }
}

async function triggerServerOfflineSync(): Promise<void> {
  const token = localStorage.getItem("access");
  if (!token || !isOnline()) return;

  const res = await fetch(`${API_BASE}/api/sync/trigger/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ batch_size: 50, max_batches: 10 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Server sync trigger failed: ${res.status} ${text}`);
  }
}

/** Run one sync cycle: process pending queue items in batches. */
async function runSyncCycle(): Promise<void> {
  if (_isSyncing || !isOnline()) return;
  _isSyncing = true;

  try {
    const pending = await getPendingItems(BATCH_SIZE);
    const ready = pending.filter(isReadyForRetry);
    let touchedSyncState = false;

    if (ready.length > 0) {
      // Mark items as syncing
      for (const item of ready) {
        await markSyncing(item.id);
      }

      // Push browser-side queued items first.
      await pushToServer(ready);
      touchedSyncState = true;
    }

    // Also trigger server-side SQLite -> Neon sync so backend-offline writes
    // created through the normal API surface are promoted automatically.
    await triggerServerOfflineSync();

    // Notify listeners
    if (_onSyncStatusChange) {
      const count = await getPendingSyncCount();
      _onSyncStatusChange(count);
    }

    if (touchedSyncState) {
      // Cleanup old synced items periodically.
      await cleanupSyncedItems();
    }

    await refreshCache();
  } catch (err) {
    console.error("[Sync] Cycle error:", err);
  } finally {
    _isSyncing = false;
  }
}

/** Start the background sync worker. */
export function startSyncWorker(): void {
  if (_syncTimer) return;

  // Run immediately on start
  void runSyncCycle();

  // Then run on interval
  _syncTimer = setInterval(runSyncCycle, SYNC_INTERVAL);

  // Listen for connectivity changes
  onConnectivityChange(async (online) => {
    if (online) {
      // Just came back online — run a full sync cycle for both
      // frontend queued data and backend sqlite queued data.
      await runSyncCycle();
    }
  });
}

/** Stop the background sync worker. */
export function stopSyncWorker(): void {
  if (_syncTimer) {
    clearInterval(_syncTimer);
    _syncTimer = null;
  }
}

/** Force an immediate sync attempt. */
export async function forceSyncNow(): Promise<void> {
  await runSyncCycle();
  await triggerServerOfflineSync();
  await refreshCache();
}

/** Fetch and cache a fresh snapshot from the server. */
export async function fetchAndCacheSnapshot(): Promise<void> {
  await refreshCache();
}
