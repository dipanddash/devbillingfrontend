/**
 * Online-only sync stubs.
 */

const listeners = new Set<(pendingCount: number) => void>();

export function onSyncStatusChange(callback: (pendingCount: number) => void) {
  listeners.add(callback);
  callback(0);
  return () => listeners.delete(callback);
}

export function startSyncWorker(): void {
  listeners.forEach((listener) => listener(0));
}

export function stopSyncWorker(): void {
  return;
}

export async function forceSyncNow(): Promise<void> {
  listeners.forEach((listener) => listener(0));
}

export async function fetchAndCacheSnapshot(): Promise<void> {
  return;
}

