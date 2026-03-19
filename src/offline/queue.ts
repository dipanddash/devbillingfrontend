/**
 * Online-only sync queue stubs.
 */

export interface SyncQueueItem {
  id: number;
  entity_type: string;
  action: string;
  payload: unknown;
  status: "pending" | "syncing" | "synced" | "failed";
  error_message?: string | null;
}

export async function addToSyncQueue(
  _entityType: string,
  _action: string,
  _payload: unknown,
  _entityId?: string,
): Promise<void> {
  return;
}

export async function getPendingItems(_limit: number = 5): Promise<SyncQueueItem[]> { return []; }
export async function getPendingSyncCount(): Promise<number> { return 0; }
export async function markSyncing(_id: number): Promise<void> { return; }
export async function markSynced(_id: number, _responseData?: unknown): Promise<void> { return; }
export async function markFailed(_id: number, _errorMessage: string): Promise<void> { return; }
export async function markPermanentlyFailed(_id: number, _errorMessage: string): Promise<void> { return; }
export async function getFailedItems(): Promise<SyncQueueItem[]> { return []; }
export async function retryFailedItem(_id: number): Promise<void> { return; }
export async function cleanupSyncedItems(): Promise<void> { return; }

