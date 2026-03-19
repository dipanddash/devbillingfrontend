import { AlertTriangle } from "lucide-react";

import type { InvoiceRow } from "./types";

interface CancelInvoiceModalProps {
  invoice: InvoiceRow;
  cancelErrorText: string;
  cancelRequestingPk: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelInvoiceModal = ({
  invoice,
  cancelErrorText,
  cancelRequestingPk,
  onClose,
  onConfirm,
}: CancelInvoiceModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-5 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-rose-100 p-2 text-rose-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">Cancel Order</h3>
          <p className="mt-1 text-sm text-slate-600">
            {invoice.status === "paid"
              ? "This will refund stock and cancel the paid order."
              : "This action will cancel the selected order."}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
        <p>
          <span className="font-medium text-slate-700">Invoice:</span> {invoice.id}
        </p>
        <p>
          <span className="font-medium text-slate-700">Customer:</span> {invoice.customer}
        </p>
        <p>
          <span className="font-medium text-slate-700">Amount:</span> {invoice.amount}
        </p>
      </div>

      {cancelErrorText && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {cancelErrorText}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={Boolean(cancelRequestingPk)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
        >
          Keep Order
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={Boolean(cancelRequestingPk)}
          data-enter-action="true"
          className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {cancelRequestingPk
            ? "Cancelling..."
            : invoice.status === "paid"
            ? "Refund & Cancel"
            : "Cancel Order"}
        </button>
      </div>
    </div>
  </div>
);

export default CancelInvoiceModal;
