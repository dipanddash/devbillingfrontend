import type { InvoiceStatus } from "./types";

export const getLogoDataUrl = async (): Promise<string | null> => {
  try {
    const response = await fetch("/dip%20and%20dash.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const mapInvoiceStatus = (
  paymentRaw: unknown,
  orderRaw: unknown,
  dueDate: string
): InvoiceStatus => {
  const payment = String(paymentRaw ?? "").toLowerCase();
  const order = String(orderRaw ?? "").toLowerCase();
  const paymentNormalized = payment.replace(/[\s_-]+/g, "");
  const dueTime = new Date(dueDate).setHours(23, 59, 59, 999);
  const isOverdueByDate = dueTime < Date.now();

  if (payment.includes("cancel") || order.includes("cancel")) return "cancelled";
  if (payment.includes("overdue") || order.includes("overdue")) return "overdue";

  if (
    order.includes("pending") ||
    order.includes("new") ||
    order.includes("placed") ||
    order.includes("prepar") ||
    order.includes("ready")
  ) {
    return "pending";
  }

  if (
    paymentNormalized === "paid" ||
    paymentNormalized === "paymentdone" ||
    paymentNormalized === "success" ||
    paymentNormalized === "completed"
  ) {
    return "paid";
  }

  if (
    paymentNormalized === "pending" ||
    paymentNormalized === "unpaid" ||
    paymentNormalized === "notpaid" ||
    paymentNormalized === "failed" ||
    !paymentNormalized
  ) {
    return isOverdueByDate ? "overdue" : "pending";
  }

  return isOverdueByDate ? "overdue" : "pending";
};

export const toIsoDate = (input: unknown) => {
  if (!input) return new Date().toISOString().slice(0, 10);
  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};
