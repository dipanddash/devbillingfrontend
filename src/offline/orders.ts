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
  payment_method: string;
  payment_reference?: string;
  cash_received?: number;
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

  // Calculate total
  let total = 0;
  for (const item of payload.items) {
    total += item.price * item.quantity;
    if (item.addons) {
      for (const addon of item.addons) {
        total += addon.price * addon.qty * item.quantity;
      }
    }
  }

  const discount = payload.discount_amount || 0;
  const finalTotal = Math.max(total - discount, 0);

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

  const syncPayload = {
    order_type: payload.order_type,
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone || "",
    items: syncItems,
    discount_amount: discount,
    payment: {
      method: payload.payment_method,
      reference: payload.payment_reference || "",
    },
  };

  // Store in local orders table
  runQuery(
    `INSERT INTO offline_orders (id, order_type, customer_name, customer_phone, payment_method, payment_reference, cash_received, total_amount, discount_amount, items_json, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      orderId,
      payload.order_type,
      payload.customer_name,
      payload.customer_phone || "",
      payload.payment_method,
      payload.payment_reference || "",
      payload.cash_received || 0,
      finalTotal,
      discount,
      JSON.stringify(payload.items),
    ],
  );

  // Add to sync queue
  await addToSyncQueue("order", "create", syncPayload, orderId);

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
