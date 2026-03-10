/**
 * Sync queue management — stores pending offline operations
 * that need to be synced to the server when connectivity returns.
 */
import { getDb, persistDb, queryAll, queryOne, runQuery, generateUUID } from "./db";

export interface SyncQueueItem {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: string;
  status: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  last_attempt_at: string | null;
  error_message: string | null;
  response_data: string | null;
}

/**
 * Add an operation to the sync queue.
 * Returns the entity_id (client UUID) for tracking.
 */
export async function addToSyncQueue(
  entityType: string,
  action: string,
  data: Record<string, unknown>,
  entityId?: string,
): Promise<string> {
  await getDb();
  const id = entityId || generateUUID();

  runQuery(
    `INSERT INTO sync_queue (entity_type, entity_id, action, payload, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
    [entityType, id, action, JSON.stringify(data)],
  );
  await persistDb();
  return id;
}

/** Get pending items for sync, ordered by creation time. */
export async function getPendingItems(limit: number = 5): Promise<SyncQueueItem[]> {
  await getDb();
  return queryAll<SyncQueueItem>(
    `SELECT * FROM sync_queue
     WHERE status IN ('pending', 'retry')
       AND retry_count < max_retries
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit],
  );
}

/** Get count of pending sync items. */
export async function getPendingSyncCount(): Promise<number> {
  await getDb();
  const row = queryOne<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM sync_queue WHERE status IN ('pending', 'retry') AND retry_count < max_retries",
  );
  return row?.cnt ?? 0;
}

/** Mark an item as currently syncing. */
export async function markSyncing(id: number): Promise<void> {
  await getDb();
  runQuery(
    "UPDATE sync_queue SET status = 'syncing', last_attempt_at = datetime('now') WHERE id = ?",
    [id],
  );
  await persistDb();
}

/** Mark an item as successfully synced. */
export async function markSynced(id: number, responseData?: unknown): Promise<void> {
  await getDb();
  runQuery(
    "UPDATE sync_queue SET status = 'synced', response_data = ?, last_attempt_at = datetime('now') WHERE id = ?",
    [responseData ? JSON.stringify(responseData) : null, id],
  );
  await persistDb();
}

/** Mark an item as failed, increment retry count. */
export async function markFailed(id: number, errorMessage: string): Promise<void> {
  await getDb();
  runQuery(
    `UPDATE sync_queue
     SET status = 'retry',
         retry_count = retry_count + 1,
         error_message = ?,
         last_attempt_at = datetime('now')
     WHERE id = ?`,
    [errorMessage, id],
  );
  await persistDb();
}

/** Mark an item as permanently failed (max retries exceeded). */
export async function markPermanentlyFailed(id: number, errorMessage: string): Promise<void> {
  await getDb();
  runQuery(
    `UPDATE sync_queue
     SET status = 'failed',
         error_message = ?,
         last_attempt_at = datetime('now')
     WHERE id = ?`,
    [errorMessage, id],
  );
  await persistDb();
}

/** Get all failed items for review/retry. */
export async function getFailedItems(): Promise<SyncQueueItem[]> {
  await getDb();
  return queryAll<SyncQueueItem>(
    "SELECT * FROM sync_queue WHERE status = 'failed' ORDER BY created_at DESC",
  );
}

/** Reset a failed item back to pending for retry. */
export async function retryFailedItem(id: number): Promise<void> {
  await getDb();
  runQuery(
    "UPDATE sync_queue SET status = 'pending', retry_count = 0, error_message = NULL WHERE id = ?",
    [id],
  );
  await persistDb();
}

/** Clean up old synced items (keep last 7 days). */
export async function cleanupSyncedItems(): Promise<void> {
  await getDb();
  runQuery(
    "DELETE FROM sync_queue WHERE status = 'synced' AND created_at < datetime('now', '-7 days')",
  );
  await persistDb();
}
