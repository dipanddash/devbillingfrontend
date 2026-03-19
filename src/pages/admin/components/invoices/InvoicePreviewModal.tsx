import { Instagram } from "lucide-react";

import type { InvoiceDetail, ReceiptHeader } from "./types";

interface InvoicePreviewModalProps {
  selectedInvoice: InvoiceDetail;
  receiptHeader: ReceiptHeader;
  onDownloadPdf: () => void;
  onDownloadExcel: () => void;
  onClose: () => void;
}

const InvoicePreviewModal = ({
  selectedInvoice,
  receiptHeader,
  onDownloadPdf,
  onDownloadExcel,
  onClose,
}: InvoicePreviewModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Bill Preview</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadPdf}
            className="rounded-md border border-violet-200 px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-50"
          >
            Download PDF
          </button>
          <button
            onClick={onDownloadExcel}
            className="rounded-md border border-violet-200 px-3 py-1.5 text-xs text-violet-700 hover:bg-violet-50"
          >
            Download Excel
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-accent"
          >
            Close
          </button>
        </div>
      </div>

      <div className="bg-white p-4 text-slate-900">
        <div className="mx-auto w-full max-w-md rounded-md border border-dashed border-slate-300 p-3 font-mono text-[10px] leading-tight">
          <div className="border-b border-dashed border-slate-300 pb-3 text-center">
            <img
              src="/dip%20and%20dash.png"
              alt="Dip & Dash Logo"
              className="mx-auto mb-2 h-10 w-auto object-contain"
            />
            <h3 className="text-sm font-bold tracking-wide">{receiptHeader.legalName}</h3>
            <p className="mt-1 font-semibold">{receiptHeader.branchName}</p>
            <div className="my-1 border-t border-dashed border-slate-400" />
            <p className="mt-1">{receiptHeader.address}</p>
            <p>Phone: {receiptHeader.phone}</p>
            <div className="my-1 border-t border-dashed border-slate-400" />
            <p>CIN: {receiptHeader.cin}</p>
            <p>GSTIN: {receiptHeader.gstin}</p>
            <p>FSSAI: {receiptHeader.fssai}</p>
            <div className="my-1 border-t border-dashed border-slate-400" />
            <div className="mt-2">
              <p className="font-bold tracking-wide">TAX INVOICE</p>
              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-left">
                <p>
                  <span className="font-semibold">Bill No:</span>{" "}
                  {selectedInvoice.bill_number}
                </p>
                <p>
                  <span className="font-semibold">Bill Dt:</span> {selectedInvoice.date}
                </p>
                <p>
                  <span className="font-semibold">Customer:</span>{" "}
                  {selectedInvoice.customer_name || "-"}
                </p>
                <p>
                  <span className="font-semibold">Cashier:</span>{" "}
                  {selectedInvoice.staff || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 py-3">
            <p className="mb-2 font-semibold">Items List</p>
            <div className="mb-2 grid grid-cols-12 gap-2 font-semibold">
              <p className="col-span-5">Item</p>
              <p className="col-span-2 text-right">Qty</p>
              <p className="col-span-2 text-right">Price</p>
              <p className="col-span-3 text-right">Total</p>
            </div>
            <div className="space-y-1.5">
              {selectedInvoice.line_items.length > 0 ? (
                selectedInvoice.line_items.map((lineItem, idx) => (
                  <div key={`${lineItem.name}-${idx}`} className="space-y-0.5">
                    <div className="grid grid-cols-12 gap-2">
                      <p className="col-span-5 truncate">{lineItem.name}</p>
                      <p className="col-span-2 text-right">{lineItem.quantity}</p>
                      <p className="col-span-2 text-right">
                        {lineItem.base_price.toFixed(0)}
                      </p>
                      <p className="col-span-3 text-right">
                        {lineItem.line_total.toFixed(0)}
                      </p>
                    </div>
                    {(lineItem.addons || []).map((addon, addonIdx) => (
                      <div
                        key={`${lineItem.name}-${idx}-addon-${addonIdx}`}
                        className="grid grid-cols-12 gap-2 text-[9px] text-slate-600"
                      >
                        <p className="col-span-8 pl-2">
                          + {addon.name} x
                          {Number(
                            addon.quantity_per_item ?? addon.quantity_total ?? 0
                          )}{" "}
                          / item @ Rs {Number(addon.unit_price || 0).toFixed(2)}
                        </p>
                        <p className="col-span-4 text-right">
                          Rs {Number(addon.line_total || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500">
                  No items available in invoice payload.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs.{selectedInvoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Total GST</span>
              <span>Rs.{selectedInvoice.total_gst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Manual Discount</span>
              <span>
                Rs.
                {Number(
                  selectedInvoice.manual_discount ??
                    selectedInvoice.discount_breakdown?.manual_discount ??
                    0
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                Coupon Discount
                {selectedInvoice.coupon_details?.code
                  ? ` (${selectedInvoice.coupon_details.code} - ${String(selectedInvoice.coupon_details.discount_type || "")})`
                  : ""}
              </span>
              <span>
                Rs.
                {Number(
                  selectedInvoice.coupon_discount ??
                    selectedInvoice.discount_breakdown?.coupon_discount ??
                    0
                ).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Discount</span>
              <span>Rs.{selectedInvoice.discount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 text-sm font-bold">
              <span>Final Amount</span>
              <span>Rs.{selectedInvoice.final_amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4 space-y-1 text-center text-[11px] text-slate-500">
            <p>Thank you. Visit again.</p>
            <p className="font-medium text-slate-600">Follow us on Instagram</p>
            <div className="flex justify-center">
              <Instagram className="h-4 w-4 text-slate-600" />
            </div>
            <p className="text-slate-600">@dip_dash_</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default InvoicePreviewModal;
