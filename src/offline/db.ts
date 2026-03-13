/**
 * SQLite database management for offline-first architecture.
 * Uses sql.js (SQLite compiled to WASM) with persistence to IndexedDB.
 */
import initSqlJs, { type Database } from "sql.js";

const IDB_NAME = "billing_offline_db";
const IDB_STORE = "sqlitedb";
const IDB_KEY = "main";

let db: Database | null = null;
let dbReady: Promise<Database> | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// ── IndexedDB persistence helpers ──────────────────────────

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadFromIDB(): Promise<Uint8Array | null> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readonly");
    const get = tx.objectStore(IDB_STORE).get(IDB_KEY);
    get.onsuccess = () => resolve(get.result ?? null);
    get.onerror = () => reject(get.error);
  });
}

async function saveToIDB(data: Uint8Array): Promise<void> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(data, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Schema ─────────────────────────────────────────────────

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT,
    image_url TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT,
    category_name TEXT,
    gst_percent REAL DEFAULT 0,
    image TEXT,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    is_available INTEGER DEFAULT 1,
    availability_reason TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS addons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image TEXT,
    image_url TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS combos (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    gst_percent REAL DEFAULT 0,
    image TEXT,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    is_available INTEGER DEFAULT 1,
    availability_reason TEXT,
    items_json TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    created_at TEXT,
    sync_status TEXT DEFAULT 'synced',
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tables_cache (
    id TEXT PRIMARY KEY,
    number TEXT,
    floor TEXT,
    capacity INTEGER,
    status TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS offline_orders (
    id TEXT PRIMARY KEY,
    order_type TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    status TEXT DEFAULT 'COMPLETED',
    payment_status TEXT DEFAULT 'PAID',
    payment_method TEXT,
    payment_reference TEXT,
    cash_received REAL,
    total_amount REAL,
    discount_amount REAL DEFAULT 0,
    items_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    sync_status TEXT DEFAULT 'pending',
    server_id TEXT,
    server_order_number TEXT,
    server_bill_number TEXT,
    last_sync_attempt TEXT,
    sync_error TEXT,
    retry_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders_cache (
    id TEXT PRIMARY KEY,
    order_ref TEXT,
    table_name TEXT,
    customer_name TEXT,
    items_count INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    order_status TEXT,
    payment_status TEXT,
    bill_number TEXT,
    created_at TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_details_cache (
    id TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now')),
    last_attempt_at TEXT,
    error_message TEXT,
    response_data TEXT
  );

  CREATE TABLE IF NOT EXISTS auth_cache (
    username TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    user_data TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    role TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`;

// ── Database initialization ────────────────────────────────

export async function getDb(): Promise<Database> {
  if (db) return db;
  if (dbReady) return dbReady;

  dbReady = (async () => {
    const SQL = await initSqlJs({
      locateFile: () => "/sql-wasm.wasm",
    });

    const savedData = await loadFromIDB();
    db = savedData ? new SQL.Database(savedData) : new SQL.Database();

    // Create schema (IF NOT EXISTS makes this safe to run always)
    db.run(SCHEMA);
    await persistDb();

    return db;
  })();

  return dbReady;
}

/** Debounced save to IndexedDB — called after write operations. */
export async function persistDb(): Promise<void> {
  if (!db) return;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (!db) return;
    try {
      const data = db.export();
      await saveToIDB(new Uint8Array(data));
    } catch (err) {
      console.error("[OfflineDB] Failed to persist:", err);
    }
  }, 100); // 100ms debounce
}

// ── Generic query helpers ──────────────────────────────────

export function runQuery(sql: string, params?: unknown[]): void {
  if (!db) throw new Error("Database not initialized");
  db.run(sql, params as any);
}

export function queryAll<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[] {
  if (!db) return [];
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params as any);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | null {
  const results = queryAll<T>(sql, params);
  return results[0] ?? null;
}

/** Generate a UUID v4 for offline records. */
export function generateUUID(): string {
  return crypto.randomUUID();
}

export async function resetLocalBusinessData(preserveAuthUsername?: string): Promise<void> {
  await getDb();
  if (!db) throw new Error("Database not initialized");

  const tablesToClear = [
    "categories",
    "products",
    "addons",
    "combos",
    "customers",
    "tables_cache",
    "offline_orders",
    "orders_cache",
    "order_details_cache",
    "sync_queue",
    "sync_meta",
  ];

  for (const table of tablesToClear) {
    db.run(`DELETE FROM ${table}`);
  }

  const normalizedUsername = preserveAuthUsername?.trim();
  if (normalizedUsername) {
    db.run("DELETE FROM auth_cache WHERE username != ?", [normalizedUsername]);
  } else {
    db.run("DELETE FROM auth_cache");
  }

  await persistDb();
}
