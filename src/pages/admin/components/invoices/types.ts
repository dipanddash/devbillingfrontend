export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";
export type InvoiceStatusFilter = "all" | InvoiceStatus;

export interface InvoiceRow {
  id: string;
  customer: string;
  date: string;
  due: string;
  amount: string;
  status: InvoiceStatus;
  orderPk: string;
  numericAmount: number;
}

export interface InvoiceAddon {
  name: string;
  quantity_per_item?: number;
  quantity_total?: number;
  unit_price?: number | string;
  line_total?: number | string;
}

export interface InvoiceLineItem {
  name: string;
  quantity: number;
  base_price: number;
  gst_percent: number;
  gst_amount: number;
  line_total: number;
  addons?: InvoiceAddon[];
}

export interface InvoiceDetail {
  bill_number: string;
  date: string;
  order_type: string;
  staff: string;
  customer_name: string;
  subtotal: number;
  total_gst: number;
  grand_total: number;
  discount: number;
  manual_discount?: number;
  coupon_discount?: number;
  coupon_details?: {
    code?: string;
    discount_type?: string;
    value?: number | string;
    discount_amount?: number | string;
  } | null;
  discount_breakdown?: {
    manual_discount?: number | string;
    coupon_discount?: number | string;
    total_discount?: number | string;
  };
  final_amount: number;
  payment_method: string;
  payment_status: string;
  line_items: InvoiceLineItem[];
}

export interface SparkDatum {
  name?: string;
  value: number;
}

export interface PaymentDatum {
  name: string;
  value: number;
}

export interface ReceiptHeader {
  legalName: string;
  branchName: string;
  address: string;
  phone: string;
  cin: string;
  gstin: string;
  fssai: string;
}

export interface InvoiceExportRow {
  Invoice: string;
  Customer: string;
  Date: string;
  DueDate: string;
  Amount: number;
  Status: InvoiceStatus;
}
