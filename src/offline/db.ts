/**
 * Online-only stub DB helpers.
 * Kept to preserve existing imports while removing offline SQLite usage.
 */

export async function getDb(): Promise<null> {
  return null;
}

export async function persistDb(): Promise<void> {
  return;
}

export function runQuery(_query: string, _params: unknown[] = []): void {
  return;
}

export function queryAll<T = Record<string, unknown>>(_query: string, _params: unknown[] = []): T[] {
  return [];
}

export function queryOne<T = Record<string, unknown>>(_query: string, _params: unknown[] = []): T | null {
  return null;
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function resetLocalBusinessData(): Promise<void> {
  return;
}

