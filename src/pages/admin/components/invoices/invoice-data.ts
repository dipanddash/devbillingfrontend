import { mapInvoiceStatus, toIsoDate } from "./helpers";
import type {
  InvoiceDetail,
  InvoiceExportRow,
  InvoiceLineItem,
  InvoiceRow,
  InvoiceStatusFilter,
} from "./types";

interface InvoiceFilterInput {
  search: string;
  statusFilter: InvoiceStatusFilter;
  from: string;
  to: string;
}

interface InvoiceDateRange {
  from: string;
  to: string;
}

const toNumber = (value: unknown) => Number(value ?? 0) || 0;

const mapInvoiceLineItems = (record: Record<string, unknown>): InvoiceLineItem[] => {
  const itemsRaw = Array.isArray(record.line_items)
    ? record.line_items
    : Array.isArray(record.items)
      ? record.items
      : [];

  return itemsRaw.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      name: String(row.name ?? "Item"),
      quantity: toNumber(row.quantity),
      base_price: toNumber(row.base_price),
      gst_percent: toNumber(row.gst_percent),
      gst_amount: toNumber(row.gst_amount),
      line_total: toNumber(row.line_total),
      addons: Array.isArray(row.addons)
        ? row.addons.map((addonRow) => {
            const addon = addonRow && typeof addonRow === "object"
              ? (addonRow as Record<string, unknown>)
              : {};
            return {
              name: String(addon.name ?? "Addon"),
              quantity_per_item: toNumber(addon.quantity_per_item),
              quantity_total: toNumber(addon.quantity_total),
              unit_price: toNumber(addon.unit_price),
              line_total: toNumber(addon.line_total),
            };
          })
        : [],
    };
  });
};

export const mapOrderRecordToInvoiceRow = (row: Record<string, unknown>): InvoiceRow => {
  const orderPk = String(row.id ?? "");
  const date = toIsoDate(row.created_at ?? row.date);
  const dueDate = row.due_date
    ? toIsoDate(row.due_date)
    : toIsoDate(new Date(new Date(date).setDate(new Date(date).getDate() + 30)));
  const numericAmount = toNumber(row.total_amount ?? row.amount ?? row.grand_total);

  return {
    id: row.bill_number
      ? `INV-${String(row.bill_number)}`
      : row.order_id
        ? `INV-${String(row.order_id)}`
        : "INV-ORDER",
    customer: String(row.customer_name ?? row.table_name ?? "Walk-in"),
    date,
    due: dueDate,
    amount: `Rs.${numericAmount.toLocaleString()}`,
    status: mapInvoiceStatus(row.payment_status, row.status, dueDate),
    orderPk,
    numericAmount,
  };
};

export const mapOrderListToInvoiceRows = (rows: Array<Record<string, unknown>>) =>
  rows.map(mapOrderRecordToInvoiceRow);

export const buildFallbackInvoiceDetail = (invoice: InvoiceRow): InvoiceDetail => ({
  bill_number: invoice.id.replace("INV-", ""),
  date: invoice.date,
  order_type: "-",
  staff: "-",
  customer_name: invoice.customer,
  subtotal: invoice.numericAmount,
  total_gst: 0,
  grand_total: invoice.numericAmount,
  discount: 0,
  final_amount: invoice.numericAmount,
  payment_method: "-",
  payment_status: invoice.status.toUpperCase(),
  line_items: [],
});

export const parseInvoiceDetailResponse = (payload: unknown): InvoiceDetail | null => {
  const raw = Array.isArray(payload) ? payload[0] : payload;
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  return {
    bill_number: String(record.bill_number ?? "-"),
    date: String(record.date ?? ""),
    order_type: String(record.order_type ?? "-"),
    staff: String(record.staff ?? "-"),
    customer_name: String(record.customer_name ?? "-"),
    subtotal: toNumber(record.subtotal),
    total_gst: toNumber(record.total_gst),
    grand_total: toNumber(record.grand_total),
    discount: toNumber(record.discount),
    manual_discount: toNumber(
      record.manual_discount ??
        (record.discount_breakdown as Record<string, unknown> | undefined)?.manual_discount
    ),
    coupon_discount: toNumber(
      record.coupon_discount ??
        (record.discount_breakdown as Record<string, unknown> | undefined)?.coupon_discount
    ),
    coupon_details:
      record.coupon_details && typeof record.coupon_details === "object"
        ? (record.coupon_details as InvoiceDetail["coupon_details"])
        : null,
    discount_breakdown:
      record.discount_breakdown && typeof record.discount_breakdown === "object"
        ? (record.discount_breakdown as InvoiceDetail["discount_breakdown"])
        : undefined,
    final_amount: toNumber(record.final_amount),
    payment_method: String(record.payment_method ?? "-"),
    payment_status: String(record.payment_status ?? "-"),
    line_items: mapInvoiceLineItems(record),
  };
};

export const filterInvoices = (
  invoices: InvoiceRow[],
  { search, statusFilter, from, to }: InvoiceFilterInput
) => {
  const term = search.trim().toLowerCase();

  return invoices.filter((inv) => {
    const normalizedId = inv.id.replace(/^inv[-\s]?/i, "").toLowerCase();
    const matchSearch =
      !term ||
      inv.customer.toLowerCase().includes(term) ||
      inv.id.toLowerCase().includes(term) ||
      normalizedId.includes(term);

    const matchStatus = statusFilter === "all" || inv.status === statusFilter;

    const invoiceDate = new Date(inv.date);
    let matchDate = true;
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      matchDate = matchDate && invoiceDate >= fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      matchDate = matchDate && invoiceDate <= toDate;
    }

    return matchSearch && matchStatus && matchDate;
  });
};

const isWithinDateRange = (invoiceDateValue: string, { from, to }: InvoiceDateRange) => {
  if (!from && !to) return true;
  const invoiceDate = new Date(invoiceDateValue);
  if (Number.isNaN(invoiceDate.getTime())) return false;

  if (from) {
    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    if (invoiceDate < fromDate) return false;
  }
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    if (invoiceDate > toDate) return false;
  }
  return true;
};

export const buildInvoiceExportRows = (
  invoices: InvoiceRow[],
  range: InvoiceDateRange
): InvoiceExportRow[] =>
  invoices
    .filter((inv) => isWithinDateRange(inv.date, range))
    .map((inv) => ({
      Invoice: inv.id,
      Customer: inv.customer,
      Date: inv.date,
      DueDate: inv.due,
      Amount: inv.numericAmount,
      Status: inv.status,
    }));

export const buildInvoiceExportSuffix = (from: string, to: string) => {
  if (!from && !to) return new Date().toISOString().slice(0, 10);
  return `${from || "start"}-to-${to || "end"}`;
};

export const buildInvoiceTotals = (invoices: InvoiceRow[]) => ({
  totalRevenue: invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + inv.numericAmount, 0),
  pendingAmount: invoices
    .filter((inv) => inv.status === "pending")
    .reduce((acc, inv) => acc + inv.numericAmount, 0),
  overdueAmount: invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((acc, inv) => acc + inv.numericAmount, 0),
  totalInvoices: invoices.length,
});
