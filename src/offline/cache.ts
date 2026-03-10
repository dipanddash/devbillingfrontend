/**
 * Data caching layer — saves server data to local SQLite for offline access.
 * Handles products, categories, addons, combos, customers, and tables.
 */
import { getDb, persistDb, queryAll, runQuery } from "./db";

// ── Cache writers (called after fetching from server) ──────

export async function cacheCategories(categories: any[]): Promise<void> {
  await getDb();
  runQuery("DELETE FROM categories");
  for (const c of categories) {
    runQuery(
      "INSERT OR REPLACE INTO categories (id, name, image, image_url) VALUES (?, ?, ?, ?)",
      [c.id, c.name, c.image || null, c.image_url || null],
    );
  }
  await persistDb();
}

export async function cacheProducts(products: any[]): Promise<void> {
  await getDb();
  runQuery("DELETE FROM products");
  for (const p of products) {
    runQuery(
      `INSERT OR REPLACE INTO products (id, name, price, category, category_name, gst_percent, image, image_url, is_active, is_available, availability_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.name, parseFloat(p.price), p.category, p.category_name,
        p.gst_percent || 0, p.image || null, p.image_url || null,
        p.is_active ? 1 : 0, p.is_available !== false ? 1 : 0,
        p.availability_reason || null,
      ],
    );
  }
  await persistDb();
}

export async function cacheAddons(addons: any[]): Promise<void> {
  await getDb();
  runQuery("DELETE FROM addons");
  for (const a of addons) {
    runQuery(
      "INSERT OR REPLACE INTO addons (id, name, price, image, image_url) VALUES (?, ?, ?, ?, ?)",
      [a.id, a.name, parseFloat(a.price), a.image || null, a.image_url || null],
    );
  }
  await persistDb();
}

export async function cacheCombos(combos: any[]): Promise<void> {
  await getDb();
  runQuery("DELETE FROM combos");
  for (const c of combos) {
    runQuery(
      `INSERT OR REPLACE INTO combos (id, name, price, gst_percent, image, image_url, is_active, is_available, availability_reason, items_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id, c.name, parseFloat(c.price), c.gst_percent || 0,
        c.image || null, c.image_url || null,
        c.is_active ? 1 : 0, c.is_available !== false ? 1 : 0,
        c.availability_reason || null,
        JSON.stringify(c.items || []),
      ],
    );
  }
  await persistDb();
}

export async function cacheCustomers(customers: any[]): Promise<void> {
  await getDb();
  // Only update synced customers, keep pending ones
  runQuery("DELETE FROM customers WHERE sync_status = 'synced'");
  for (const c of customers) {
    runQuery(
      `INSERT OR IGNORE INTO customers (id, name, phone, created_at, sync_status)
       VALUES (?, ?, ?, ?, 'synced')`,
      [c.id, c.name, c.phone, c.created_at || null],
    );
  }
  await persistDb();
}

export async function cacheTables(tables: any[]): Promise<void> {
  await getDb();
  runQuery("DELETE FROM tables_cache");
  for (const t of tables) {
    runQuery(
      "INSERT OR REPLACE INTO tables_cache (id, number, floor, capacity, status) VALUES (?, ?, ?, ?, ?)",
      [t.id, t.number, t.floor || null, t.capacity || 0, t.status || "AVAILABLE"],
    );
  }
  await persistDb();
}

/**
 * Cache all snapshot data at once (called after /api/sync/snapshot/).
 */
export async function cacheSnapshot(snapshot: any): Promise<void> {
  if (snapshot.categories) await cacheCategories(snapshot.categories);
  if (snapshot.products) await cacheProducts(snapshot.products);
  if (snapshot.addons) await cacheAddons(snapshot.addons);
  if (snapshot.combos) await cacheCombos(snapshot.combos);
  if (snapshot.customers) await cacheCustomers(snapshot.customers);
  if (snapshot.tables) await cacheTables(snapshot.tables);

  // Store last sync time
  await getDb();
  runQuery(
    "INSERT OR REPLACE INTO sync_meta (key, value, updated_at) VALUES ('last_snapshot', ?, datetime('now'))",
    [snapshot.server_time || new Date().toISOString()],
  );
  await persistDb();
}

// ── Cache readers (used when offline) ──────────────────────

export async function getCachedCategories(): Promise<any[]> {
  await getDb();
  return queryAll("SELECT * FROM categories ORDER BY name");
}

export async function getCachedProducts(): Promise<any[]> {
  await getDb();
  const rows = queryAll("SELECT * FROM products WHERE is_active = 1");
  return rows.map((r: any) => ({
    ...r,
    price: String(r.price),
    is_available: r.is_available === 1,
  }));
}

export async function getCachedAddons(): Promise<any[]> {
  await getDb();
  return queryAll("SELECT * FROM addons ORDER BY name");
}

export async function getCachedCombos(): Promise<any[]> {
  await getDb();
  const rows = queryAll("SELECT * FROM combos WHERE is_active = 1");
  return rows.map((r: any) => ({
    ...r,
    price: String(r.price),
    is_active: r.is_active === 1,
    is_available: r.is_available === 1,
    items: r.items_json ? JSON.parse(r.items_json) : [],
  }));
}

export async function getCachedCustomers(): Promise<any[]> {
  await getDb();
  return queryAll("SELECT * FROM customers ORDER BY name");
}

export async function getLastSnapshotTime(): Promise<string | null> {
  await getDb();
  const row = queryOne<{ value: string }>("SELECT value FROM sync_meta WHERE key = 'last_snapshot'");
  return row?.value ?? null;
}
