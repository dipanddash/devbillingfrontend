import { Instagram } from "lucide-react";

interface InvoiceLineItemAddon {
  name: string;
  quantity_per_item?: number;
  quantity_total?: number;
  unit_price?: number;
  line_total?: number;
}

interface InvoiceLineItem {
  name: string;
  quantity: number;
  base_price: number;
  line_total: number;
  addons?: InvoiceLineItemAddon[];
}

interface InvoiceData {
  bill_number: string;
  date: string;
  customer_name: string;
  staff?: string;
  subtotal: number | string;
  total_gst: number | string;
  discount: number | string;
  coupon_details?: {
    code?: string;
    discount_type?: string;
  } | null;
  final_amount: number | string;
}

interface PosInvoicePreviewModalProps {
  open: boolean;
  invoiceLoading: boolean;
  invoiceData: InvoiceData | null;
  invoiceLineItems: InvoiceLineItem[];
  invoiceManualDiscount: number;
  invoiceCouponDiscount: number;
  invoiceFreeItemLabel: string;
  onClose: () => void;
}

const PosInvoicePreviewModal = ({
  open,
  invoiceLoading,
  invoiceData,
  invoiceLineItems,
  invoiceManualDiscount,
  invoiceCouponDiscount,
  invoiceFreeItemLabel,
  onClose,
}: PosInvoicePreviewModalProps) => {
  if (!open) return null;

  return (
    <div className="pos-invoice-overlay fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="pos-thermal-root w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-purple-200 bg-white shadow-2xl">
        <div className="pos-no-print flex items-center justify-between border-b border-purple-100 px-4 py-3">
          <p className="text-sm font-semibold text-purple-900">Bill Preview</p>
          <button
            onClick={onClose}
            className="rounded-md border border-purple-200 px-3 py-1.5 text-xs text-purple-700 hover:bg-purple-50"
          >
            Close
          </button>
        </div>

        <div className="p-4 text-slate-900">
          {invoiceLoading && !invoiceData ? (
            <p className="text-sm text-purple-700">Loading invoice...</p>
          ) : (
            <div className="mx-auto w-full max-w-md rounded-md border border-dashed border-slate-300 p-3 font-mono text-[10px] leading-tight">
              <div className="border-b border-dashed border-slate-300 pb-3 text-center">
                <img src="/dip%20and%20dash.png" alt="Dip & Dash Logo" className="mx-auto mb-2 h-10 w-auto object-contain" />
                <p className="text-sm font-bold tracking-wide">Kensei Food & Beverages Private Limited</p>
                <p className="mt-1 font-semibold">DIP & DASH PERUNGUDI CHENNAI</p>
                <div className="my-1 border-t border-dashed border-slate-400" />
                <p className="font-bold tracking-wide">TAX INVOICE</p>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-left">
                  <p><span className="font-semibold">Bill No:</span> {invoiceData?.bill_number || "-"}</p>
                  <p><span className="font-semibold">Bill Dt:</span> {invoiceData?.date ? new Date(invoiceData.date).toLocaleString() : "-"}</p>
                  <p><span className="font-semibold">Customer:</span> {invoiceData?.customer_name || "-"}</p>
                  <p><span className="font-semibold">Cashier:</span> {invoiceData?.staff || "-"}</p>
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
                  {invoiceLineItems.length > 0 ? (
                    invoiceLineItems.map((lineItem, idx) => (
                      <div key={`${lineItem.name}-${idx}`} className="space-y-0.5">
                        <div className="grid grid-cols-12 gap-2">
                          <p className="col-span-5 truncate">{lineItem.name}</p>
                          <p className="col-span-2 text-right">{lineItem.quantity}</p>
                          <p className="col-span-2 text-right">{Number(lineItem.base_price || 0).toFixed(0)}</p>
                          <p className="col-span-3 text-right">{Number(lineItem.line_total || 0).toFixed(0)}</p>
                        </div>
                        {(lineItem.addons ?? []).map((addon, addonIdx) => (
                          <div key={`${lineItem.name}-${idx}-addon-${addonIdx}`} className="grid grid-cols-12 gap-2 text-[9px] text-slate-600">
                            <p className="col-span-8 pl-2">
                              + {addon.name} x{Number(addon.quantity_per_item ?? addon.quantity_total ?? 0)} / item @ Rs {Number(addon.unit_price || 0).toFixed(0)}
                            </p>
                            <p className="col-span-4 text-right">Rs {Number(addon.line_total || 0).toFixed(0)}</p>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500">No items available in invoice payload.</p>
                  )}
                  {invoiceFreeItemLabel && (
                    <div className="grid grid-cols-12 gap-2 border-t border-dashed border-slate-300 pt-1 text-emerald-700">
                      <p className="col-span-5 truncate">FREE ITEM: {invoiceFreeItemLabel}</p>
                      <p className="col-span-2 text-right">1</p>
                      <p className="col-span-2 text-right">0</p>
                      <p className="col-span-3 text-right">0</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rs.{Math.round(Number(invoiceData?.subtotal || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total GST</span>
                  <span>Rs.{Math.round(Number(invoiceData?.total_gst || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>Rs.{Math.round(invoiceManualDiscount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Coupon Discount
                    {invoiceData?.coupon_details?.code
                      ? ` (${invoiceData.coupon_details.code} - ${String(invoiceData.coupon_details.discount_type || "")})`
                      : ""}
                  </span>
                  <span>Rs.{Math.round(invoiceCouponDiscount).toLocaleString()}</span>
                </div>
                {invoiceFreeItemLabel && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Free Item</span>
                    <span>{invoiceFreeItemLabel}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total Discount</span>
                  <span>Rs.{Number(invoiceData?.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-300 pt-2 text-sm font-bold">
                  <span>Final Amount</span>
                  <span>Rs.{Number(invoiceData?.final_amount || 0).toLocaleString()}</span>
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
          )}

          {invoiceData && (
            <div className="pos-no-print mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
              >
                Print
              </button>
              <button
                onClick={onClose}
                className="rounded-md border border-purple-200 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosInvoicePreviewModal;
