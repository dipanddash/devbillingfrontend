import type { InvoiceRow, InvoiceStatusFilter, ReceiptHeader } from "./types";

export const PAGE_SIZE = 20;

export const RECEIPT_HEADER: ReceiptHeader = {
  legalName: "Kensei Food & Beverages Private Limited",
  branchName: "DIP & DASH PERUNGUDI CHENNAI",
  address:
    "No. 144, Survey No-56/1A, Corporation Road, Seevaram Village, Perungudi, Chennai, Tamil Nadu - 600096",
  phone: "04424960610",
  cin: "U56301TZ2025PTC035161",
  gstin: "33AACCA8432H1ZZ",
  fssai: "22426550000259",
};

export const FALLBACK_INVOICES: InvoiceRow[] = [
  {
    id: "INV-001",
    customer: "John Smith",
    date: "2026-02-15",
    due: "2026-03-15",
    amount: "Rs.1,250.00",
    status: "paid",
    orderPk: "",
    numericAmount: 1250,
  },
  {
    id: "INV-002",
    customer: "Emily Davis",
    date: "2026-02-14",
    due: "2026-03-14",
    amount: "Rs.840.00",
    status: "pending",
    orderPk: "",
    numericAmount: 840,
  },
  {
    id: "INV-003",
    customer: "Mike Wilson",
    date: "2026-02-13",
    due: "2026-02-28",
    amount: "Rs.2,100.00",
    status: "overdue",
    orderPk: "",
    numericAmount: 2100,
  },
  {
    id: "INV-004",
    customer: "Lisa Chen",
    date: "2026-02-12",
    due: "2026-03-12",
    amount: "Rs.560.00",
    status: "paid",
    orderPk: "",
    numericAmount: 560,
  },
  {
    id: "INV-005",
    customer: "Robert Brown",
    date: "2026-02-11",
    due: "2026-03-11",
    amount: "Rs.1,890.00",
    status: "cancelled",
    orderPk: "",
    numericAmount: 1890,
  },
  {
    id: "INV-006",
    customer: "Sarah Johnson",
    date: "2026-02-10",
    due: "2026-03-10",
    amount: "Rs.420.00",
    status: "pending",
    orderPk: "",
    numericAmount: 420,
  },
  {
    id: "INV-007",
    customer: "David Lee",
    date: "2026-02-09",
    due: "2026-03-09",
    amount: "Rs.3,200.00",
    status: "paid",
    orderPk: "",
    numericAmount: 3200,
  },
  {
    id: "INV-008",
    customer: "Anna Park",
    date: "2026-02-08",
    due: "2026-03-08",
    amount: "Rs.780.00",
    status: "pending",
    orderPk: "",
    numericAmount: 780,
  },
];

export const STATUS_FILTER_OPTIONS: InvoiceStatusFilter[] = [
  "all",
  "paid",
  "pending",
  "overdue",
  "cancelled",
];

export const PAYMENT_COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd"];
