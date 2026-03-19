import StatusBadge from "@/components/StatusBadge";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PAGE_SIZE } from "./constants";
import type { InvoiceRow } from "./types";

interface InvoiceTableProps {
  invoices: InvoiceRow[];
  filteredCount: number;
  pageStart: number;
  currentPage: number;
  totalPages: number;
  loadingInvoicePk: string | null;
  loadingInvoiceId: string | null;
  cancelRequestingPk: string | null;
  onViewInvoice: (invoice: InvoiceRow) => void;
  onCancelInvoice: (invoice: InvoiceRow) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const InvoiceTable = ({
  invoices,
  filteredCount,
  pageStart,
  currentPage,
  totalPages,
  loadingInvoicePk,
  loadingInvoiceId,
  cancelRequestingPk,
  onViewInvoice,
  onCancelInvoice,
  onPrevPage,
  onNextPage,
}: InvoiceTableProps) => (
  <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_4px_16px_rgba(20,10,50,0.06)]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead>
          <tr className="bg-violet-50/70">
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
              Invoice
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
              Date
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
              Due Date
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-violet-100">
          {invoices.map((inv) => (
            <tr key={inv.id} className="transition-colors hover:bg-violet-50/45">
              <td className="px-6 py-3.5 text-sm font-semibold text-violet-700">{inv.id}</td>
              <td className="px-6 py-3.5 text-sm text-foreground">{inv.customer}</td>
              <td className="px-6 py-3.5 text-sm text-muted-foreground">{inv.date}</td>
              <td className="px-6 py-3.5 text-sm text-muted-foreground">{inv.due}</td>
              <td className="px-6 py-3.5 text-sm font-semibold text-foreground">{inv.amount}</td>
              <td className="px-6 py-3.5">
                <StatusBadge variant={inv.status} />
              </td>
              <td className="px-6 py-3.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewInvoice(inv)}
                    className="rounded-lg border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                    disabled={loadingInvoicePk === inv.orderPk && loadingInvoiceId === inv.id}
                  >
                    {loadingInvoicePk === inv.orderPk && loadingInvoiceId === inv.id
                      ? "Loading..."
                      : "View"}
                  </button>
                  {inv.status !== "cancelled" && (
                    <button
                      onClick={() => onCancelInvoice(inv)}
                      disabled={cancelRequestingPk === inv.orderPk}
                      className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                    >
                      {cancelRequestingPk === inv.orderPk
                        ? "Cancelling..."
                        : inv.status === "paid"
                        ? "Refund & Cancel"
                        : "Cancel"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="flex items-center justify-between border-t border-violet-100 px-6 py-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount ? pageStart + 1 : 0}-
        {Math.min(pageStart + PAGE_SIZE, filteredCount)} of {filteredCount} invoices
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          className="rounded-md border border-violet-200 p-1.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          className="rounded-md border border-violet-200 p-1.5 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </section>
);

export default InvoiceTable;
