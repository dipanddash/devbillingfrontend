import {
  getCachedAddons,
  getCachedCategories,
  getCachedCombos,
  getCachedCustomers,
  getCachedOrderDetail,
  getCachedOrders,
  getCachedProducts,
  getLastSnapshotTime,
} from "@/offline/cache";
import { getPendingSyncCount } from "@/offline/queue";

const OFFLINE_HEADERS = {
  "Content-Type": "application/json",
  "X-Offline-Mode": "true",
};

const jsonResponse = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), { status, headers: OFFLINE_HEADERS });

const getPath = (url: string): string => {
  try {
    return new URL(url, window.location.origin).pathname.toLowerCase();
  } catch {
    return String(url || "").toLowerCase();
  }
};

const getQuery = (url: string): URLSearchParams => {
  try {
    return new URL(url, window.location.origin).searchParams;
  } catch {
    return new URLSearchParams();
  }
};

const buildDashboardFromOrders = (orders: Array<Record<string, unknown>>) => {
  const totalSales = orders.reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  return {
    summary: [
      { metric: "Total Sales", value: totalSales, change_pct: 0 },
      { metric: "Total Orders", value: totalOrders, change_pct: 0 },
      { metric: "Average Order Value", value: avgOrder, change_pct: 0 },
      { metric: "Active Staff", value: 0, change_pct: 0 },
    ],
    source: "offline_cache",
  };
};

const buildDailySalesFromOrders = (
  orders: Array<Record<string, unknown>>,
  period: "weekly" | "monthly",
) => {
  const bucket = new Map<string, { revenue: number; orders: number }>();
  const days = period === "monthly" ? 30 : 7;
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = d.toISOString().slice(0, 10);
    bucket.set(label, { revenue: 0, orders: 0 });
  }

  orders.forEach((row) => {
    const createdAt = String(row.created_at ?? "").slice(0, 10);
    if (!bucket.has(createdAt)) return;
    const existing = bucket.get(createdAt)!;
    existing.revenue += Number(row.total_amount ?? 0);
    existing.orders += 1;
  });

  return Array.from(bucket.entries()).map(([date, value]) => ({
    date,
    revenue: value.revenue,
    orders: value.orders,
  }));
};

export async function buildOfflineFallbackResponse(
  url: string,
  init?: RequestInit,
): Promise<Response | null> {
  const method = String(init?.method ?? "GET").toUpperCase();
  const path = getPath(url);
  const query = getQuery(url);

  if (!path.includes("/api/")) {
    return null;
  }

  if (path.endsWith("/api/health/") || path.endsWith("/api/sync/health/")) {
    return jsonResponse({
      status: "offline",
      mode: "OFFLINE",
      offline_mode: true,
      sync_available: false,
      timestamp: new Date().toISOString(),
    });
  }

  if (path.endsWith("/api/sync/status/")) {
    const pending = await getPendingSyncCount();
    const lastSnapshot = await getLastSnapshotTime();
    return jsonResponse({
      offline_mode: true,
      pending_sync: pending,
      failed_sync: 0,
      last_snapshot: lastSnapshot,
      timestamp: new Date().toISOString(),
    });
  }

  if (path.endsWith("/api/sync/trigger/") || path.endsWith("/api/sync/push/")) {
    return jsonResponse({ status: "queued_offline", results: [] }, 202);
  }

  if (path.endsWith("/api/sync/snapshot/")) {
    const [categories, products, addons, combos, customers, lastSnapshot] = await Promise.all([
      getCachedCategories(),
      getCachedProducts(),
      getCachedAddons(),
      getCachedCombos(),
      getCachedCustomers(),
      getLastSnapshotTime(),
    ]);
    return jsonResponse({
      categories,
      products,
      addons,
      combos,
      customers,
      tables: [],
      source_db: "offline_cache",
      server_time: lastSnapshot ?? new Date().toISOString(),
    });
  }

  if (method === "GET" && path.includes("/api/products/products")) {
    return jsonResponse(await getCachedProducts());
  }
  if (method === "GET" && path.includes("/api/products/combos")) {
    return jsonResponse(await getCachedCombos());
  }
  if (method === "GET" && path.includes("/api/products/categories")) {
    return jsonResponse(await getCachedCategories());
  }
  if (method === "GET" && path.includes("/api/accounts/customers")) {
    return jsonResponse(await getCachedCustomers());
  }
  if (method === "GET" && path.includes("/api/orders/customer-lookup")) {
    const phone = (query.get("phone") || "").replace(/\D/g, "");
    const customers = await getCachedCustomers();
    if (!phone) return jsonResponse([]);
    const normalized = phone.slice(-10);
    const matches = customers
      .filter((row) => String(row?.phone ?? "").replace(/\D/g, "").includes(normalized))
      .slice(0, 8)
      .map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
      }));
    return jsonResponse(matches);
  }
  if (method === "GET" && path.includes("/api/accounts/staff")) {
    return jsonResponse([]);
  }

  if (method === "GET" && path.includes("/api/accounts/me/permissions")) {
    const rawUser = localStorage.getItem("user");
    const role = (() => {
      try {
        return String(JSON.parse(rawUser || "{}")?.role ?? "").toUpperCase();
      } catch {
        return "";
      }
    })();
    return jsonResponse({
      role,
      capabilities: [],
      modules: [],
      source: "offline_cache",
    });
  }

  if (method === "GET" && path.includes("/api/accounts/me/")) {
    const rawUser = localStorage.getItem("user");
    try {
      return jsonResponse(JSON.parse(rawUser || "{}"));
    } catch {
      return jsonResponse({});
    }
  }

  if (method === "GET" && path.includes("/api/orders/recent")) {
    return jsonResponse(await getCachedOrders());
  }

  if (method === "GET" && path.includes("/api/orders/today")) {
    const today = new Date().toISOString().slice(0, 10);
    const orders = await getCachedOrders();
    return jsonResponse(
      orders.filter((row) => String(row?.created_at ?? "").slice(0, 10) === today),
    );
  }

  if (method === "GET" && path.includes("/api/orders/")) {
    const parts = path.split("/");
    const orderId = parts[parts.length - 2] || parts[parts.length - 1];
    if (orderId && orderId !== "orders") {
      const cached = await getCachedOrderDetail(orderId);
      if (cached) return jsonResponse(cached);
    }
  }

  if (method === "GET" && path.includes("/api/reports/dashboard")) {
    const orders = await getCachedOrders();
    return jsonResponse(buildDashboardFromOrders(orders));
  }

  if (method === "GET" && path.includes("/api/reports/sales/daily")) {
    const period = query.get("period") === "monthly" ? "monthly" : "weekly";
    const orders = await getCachedOrders();
    return jsonResponse(buildDailySalesFromOrders(orders, period));
  }

  if (method === "GET" && path.includes("/api/reports/payments/method")) {
    return jsonResponse([]);
  }

  if (method === "GET" && (path.includes("/api/reports/sales/product") || path.includes("/api/reports/sales/peak-time"))) {
    return jsonResponse([]);
  }

  if (method === "GET" && path.includes("/api/inventory/ingredients")) {
    return jsonResponse([]);
  }
  if (method === "GET" && path.includes("/api/inventory/vendors")) {
    return jsonResponse([]);
  }
  if (method === "GET" && path.includes("/api/inventory/stock-audit")) {
    return jsonResponse({ rows: [] });
  }
  if (method === "GET" && path.includes("/api/inventory/opening-stock/status")) {
    return jsonResponse({ initialized: false, initialized_on: null, source: "offline_cache" });
  }

  if (method === "GET") {
    return jsonResponse({ detail: "Offline cache unavailable", code: "OFFLINE_CACHE_MISS" }, 503);
  }

  return jsonResponse(
    {
      detail: "Action is temporarily unavailable while offline. Pending data will sync when connection returns.",
      code: "OFFLINE_WRITE_BLOCKED",
    },
    503,
  );
}
