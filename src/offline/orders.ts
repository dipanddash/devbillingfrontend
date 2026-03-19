/**
 * Online-only offline-order stubs.
 */

import { generateUUID } from "./db";

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

const OFFLINE_DISABLED_ERROR = "Offline order save is disabled in online-only mode.";

export async function createOfflineOrder(_payload: OfflineOrderPayload): Promise<{
  id: string;
  order_id: string;
  total_amount: number;
}> {
  throw new Error(OFFLINE_DISABLED_ERROR);
}

export async function saveOfflineOrder(
  _payload: OfflineOrderPayload,
  _existingId?: string,
): Promise<{
  id: string;
  order_id: string;
  total_amount: number;
}> {
  throw new Error(OFFLINE_DISABLED_ERROR);
}

export async function getOfflineOrders(): Promise<unknown[]> {
  return [];
}

export async function getOfflineOrderById(_id: string): Promise<unknown | null> {
  return null;
}

export async function markOrderSynced(
  _localId: string,
  _serverId: string,
  _serverOrderNumber: string,
  _serverBillNumber?: string,
): Promise<void> {
  return;
}

export async function getPendingOrderCount(): Promise<number> {
  return 0;
}

export { generateUUID };
