/**
 * Offline order management — creates and stores orders locally
 * when the app is offline, and queues them for sync.
 */
import { getDb, persistDb, queryAll, queryOne, runQuery, generateUUID } from "./db";
import { addToSyncQueue } from "./queue";

export interface OfflineOrderItem {
  product?: string;
  combo?: string;
  name: string;
  base_price?: number;
  quantity: number;
  price: number;
  gst_percent: number;
  addons?: Array<{
    id: string;
    name: string;
    price: number;
    qty: number;
  }>;
}

export interface OfflineOrderPayload {
  order_type: string;
  customer_name: string;
  customer_phone?: string;
  items: OfflineOrderItem[];
  discount_amount?: number;
  payment_method?: string;
  payment_reference?: string;
  cash_received?: number;
  status?: string;
  payment_status?: string;
  server_order_id?: string;
}

/**
 * Create an order locally in SQLite and add to sync queue.
 * Returns the client-generated order UUID.
 */
export async function createOfflineOrder(payload: OfflineOrderPayload): Promise<{
  id: string;
  order_id: string;
  total_amount: number;
}> {
  await getDb();
  const orderId = generateUUID();
  return saveOfflineOrder(payload, orderId);
}

export async function saveOfflineOrder(
  payload: OfflineOrderPayload,
  existingId?: string,
): Promise<{
  id: string;
  order_id: string;
  total_amount: number;
}> {
  await getDb();
  const orderId = existingId || generateUUID();
  const orderStatus = String(payload.status || "COMPLETED").toUpperCase();
  const paymentStatus = String(payload.payment_status || "PAID").toUpperCase();
  const paymentMethod =
    paymentStatus === "PAID" ? String(payload.payment_method || "CASH").toUpperCase() : "";

  // Calculate total (match POS computation: subtotal + GST - discount).
  let total = 0;
  for (const item of payload.items) {
    const qty = Math.max(1, Number(item.quantity || 1));
    const subtotalUnit = Number(item.price || 0);
    const addonUnitTotal = Array.isArray(item.addons)
      ? item.addons.reduce((sum, addon) => sum + Number(addon.price || 0) * Math.max(1, Number(addon.qty || 1)), 0)
      : 0;
    const taxableBaseUnit =
      item.base_price != null
        ? Number(item.base_price || 0)
        : Math.max(0, subtotalUnit - addonUnitTotal);
    const gstPercent = Number(item.gst_percent || 0);
    const gstUnit = taxableBaseUnit * gstPercent / 100;
    total += (subtotalUnit + gstUnit) * qty;
  }

  const discount = Math.max(0, Math.round(payload.discount_amount || 0));
  const finalTotal = Math.max(Math.round(total - discount), 0);

  // Build sync payload (what the server expects)
  const syncItems = payload.items.map((item) => ({
    product: item.product || undefined,
    combo: item.combo || undefined,
    quantity: item.quantity,
    addons: (item.addons || []).map((a) => ({
      addon: a.id,
      quantity: a.qty,
    })),
  }));

  const syncPayload: Record<string, unknown> = {
    order_type: payload.order_type,
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone || "",
    items: syncItems,
    discount_amount: discount,
    status: orderStatus,
    payment_status: paymentStatus,
  };
  if (payload.server_order_id) {
    syncPayload.server_order_id = payload.server_order_id;
  }
  if (paymentStatus === "PAID" && paymentMethod) {
    syncPayload.payment = {
      method: paymentMethod,
      reference: payload.payment_reference || "",
    };
  }

  // Store or update the local order row.
  runQuery(
    `INSERT INTO offline_orders (
       id, order_type, customer_name, customer_phone, status, payment_status,
       payment_method, payment_reference, cash_received, total_amount,
       discount_amount, items_json, sync_status, server_id
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
     ON CONFLICT(id) DO UPDATE SET
       order_type = excluded.order_type,
       customer_name = excluded.customer_name,
       customer_phone = excluded.customer_phone,
       status = excluded.status,
       payment_status = excluded.payment_status,
       payment_method = excluded.payment_method,
       payment_reference = excluded.payment_reference,
       cash_received = excluded.cash_received,
       total_amount = excluded.total_amount,
       discount_amount = excluded.discount_amount,
       items_json = excluded.items_json,
       server_id = excluded.server_id,
       sync_status = 'pending',
       sync_error = NULL`,
    [
      orderId,
      payload.order_type,
      payload.customer_name,
      payload.customer_phone || "",
      orderStatus,
      paymentStatus,
      paymentMethod,
      payload.payment_reference || "",
      payload.cash_received || 0,
      finalTotal,
      discount,
      JSON.stringify(payload.items),
      payload.server_order_id || null,
    ],
  );

  // Keep a single pending queue row per offline order so edits update the same payload.
  const existingQueueRow = queryOne<{ id: number }>(
    `SELECT id
     FROM sync_queue
     WHERE entity_type = 'order'
       AND entity_id = ?
       AND status IN ('pending', 'retry', 'syncing')
     ORDER BY id DESC
     LIMIT 1`,
    [orderId],
  );
  if (existingQueueRow?.id) {
    runQuery(
      `UPDATE sync_queue
       SET payload = ?, status = 'pending', error_message = NULL
       WHERE id = ?`,
      [JSON.stringify(syncPayload), existingQueueRow.id],
    );
  } else {
    await addToSyncQueue("order", "create", syncPayload, orderId);
  }

  await persistDb();

  // Generate a local-friendly order ID
  const localOrderCount = queryOne<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM offline_orders",
  );
  const orderNumber = `OFL-${(localOrderCount?.cnt || 1).toString().padStart(4, "0")}`;

  return {
    id: orderId,
    order_id: orderNumber,
    total_amount: finalTotal,
  };
}

/** Get all offline orders (for display). */
export async function getOfflineOrders(): Promise<any[]> {
  await getDb();
  const rows = queryAll(
    "SELECT * FROM offline_orders ORDER BY created_at DESC",
  );
  return rows.map((r: any) => ({
    ...r,
    items: r.items_json ? JSON.parse(r.items_json) : [],
  }));
}

export async function getOfflineOrderById(id: string): Promise<any | null> {
  await getDb();
  const row = queryOne(
    "SELECT * FROM offline_orders WHERE id = ? LIMIT 1",
    [id],
  ) as Record<string, unknown> | null;
  if (!row) return null;
  return {
    ...row,
    items: row.items_json ? JSON.parse(String(row.items_json)) : [],
  };
}

/** Update offline order after successful sync. */
export async function markOrderSynced(
  localId: string,
  serverId: string,
  serverOrderNumber: string,
  serverBillNumber?: string,
): Promise<void> {
  await getDb();
  runQuery(
    `UPDATE offline_orders
     SET sync_status = 'synced',
         server_id = ?,
         server_order_number = ?,
         server_bill_number = ?,
         last_sync_attempt = datetime('now')
     WHERE id = ?`,
    [serverId, serverOrderNumber, serverBillNumber || null, localId],
  );
  await persistDb();
}

/** Get count of pending offline orders. */
export async function getPendingOrderCount(): Promise<number> {
  await getDb();
  const row = queryOne<{ cnt: number }>(
    "SELECT COUNT(*) as cnt FROM offline_orders WHERE sync_status = 'pending'",
  );
  return row?.cnt ?? 0;
}
