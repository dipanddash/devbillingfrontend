import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PaymentMethod = "CASH" | "CARD" | "UPI";

interface PosPaymentModalProps {
  open: boolean;
  paymentMethod: PaymentMethod;
  cashGiven: string;
  paymentReference: string;
  paymentError: string;
  cashBalance: number;
  total: number;
  paying: boolean;
  markingPending: boolean;
  onMethodChange: (method: PaymentMethod) => void;
  onCashGivenChange: (value: string) => void;
  onPaymentReferenceChange: (value: string) => void;
  onClose: () => void;
  onConfirmPayment: () => void;
  onMarkPending: () => void;
}

const PosPaymentModal = ({
  open,
  paymentMethod,
  cashGiven,
  paymentReference,
  paymentError,
  cashBalance,
  total,
  paying,
  markingPending,
  onMethodChange,
  onCashGivenChange,
  onPaymentReferenceChange,
  onClose,
  onConfirmPayment,
  onMarkPending,
}: PosPaymentModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!paying) onConfirmPayment();
        }}
        className="w-full max-w-md rounded-2xl border border-purple-200 bg-white p-6 shadow-2xl"
      >
        <h2 className="mb-1 text-xl font-semibold text-purple-950">Complete Payment</h2>
        <p className="mb-4 text-sm text-purple-700">Pay now to send this takeaway order to kitchen, or mark it pending for later payment.</p>

        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-purple-700">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
            className="h-11 w-full rounded-xl border border-purple-200 bg-white px-3 text-sm text-purple-900 outline-none focus:border-purple-400"
          >
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        {paymentMethod === "CASH" && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-purple-700">Cash Given</label>
            <Input
              type="number"
              min={0}
              step="1"
              value={cashGiven}
              onChange={(e) => onCashGivenChange(e.target.value)}
              placeholder="Enter cash amount"
              className="h-11 rounded-xl border-purple-200 bg-white text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
            />
            <p className={`mt-1 text-xs ${cashBalance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              Balance: Rs {Number.isFinite(cashBalance) ? cashBalance.toFixed(0) : "0"}
            </p>
          </div>
        )}

        {paymentMethod === "CARD" && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-purple-700">Card Number / Ref</label>
            <Input
              value={paymentReference}
              onChange={(e) => onPaymentReferenceChange(e.target.value)}
              placeholder="Enter card number/reference"
              className="h-11 rounded-xl border-purple-200 bg-white text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
            />
          </div>
        )}

        {paymentMethod === "UPI" && (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-purple-700">UPI ID</label>
            <Input
              value={paymentReference}
              onChange={(e) => onPaymentReferenceChange(e.target.value)}
              placeholder="Enter UPI ID"
              className="h-11 rounded-xl border-purple-200 bg-white text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
            />
          </div>
        )}

        {paymentError && <p className="mb-3 text-sm font-medium text-violet-700">{paymentError}</p>}

        <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-2 text-sm text-purple-800">
          Payable Amount: <b>Rs {total.toFixed(0)}</b>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={paying || markingPending}
            className="h-11 w-full border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-60"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onMarkPending}
            disabled={paying || markingPending}
            className="h-11 w-full border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
          >
            {markingPending ? "Saving..." : "Pending"}
          </Button>
          <Button
            type="submit"
            disabled={paying || markingPending}
            className="h-11 w-full bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] text-white hover:opacity-95 disabled:opacity-60"
          >
            {paying ? "Processing..." : "Pay"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PosPaymentModal;
