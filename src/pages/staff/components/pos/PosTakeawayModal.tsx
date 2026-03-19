import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomerLookupRow {
  id: string;
  name: string;
  phone: string;
}

interface PosTakeawayModalProps {
  open: boolean;
  phone: string;
  customerName: string;
  lookupLoading: boolean;
  lookupDone: boolean;
  requiresName: boolean;
  customerMatches: CustomerLookupRow[];
  error: string;
  creatingTakeaway: boolean;
  onPhoneChange: (value: string) => void;
  onCustomerNameChange: (value: string) => void;
  onContinue: () => void;
  onCancel: () => void;
  onSelectCustomerMatch: (row: CustomerLookupRow) => void;
}

const PosTakeawayModal = ({
  open,
  phone,
  customerName,
  lookupLoading,
  lookupDone,
  requiresName,
  customerMatches,
  error,
  creatingTakeaway,
  onPhoneChange,
  onCustomerNameChange,
  onContinue,
  onCancel,
  onSelectCustomerMatch,
}: PosTakeawayModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-purple-200 bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-semibold text-purple-950">Take Away Order</h2>
        <p className="mb-5 text-sm text-purple-700">
          Enter phone number first. Existing customers are auto-detected.
        </p>

        <Input
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onContinue();
            }
          }}
          className="mb-2 h-11 rounded-xl border-purple-200 bg-white text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
        />
        {lookupLoading && (
          <p className="mb-2 text-[11px] text-purple-600">Checking existing customer...</p>
        )}
        {(lookupDone || requiresName) && (
          <Input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="mb-3 h-11 rounded-xl border-purple-200 bg-white text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
          />
        )}
        {!lookupLoading && customerMatches.length > 0 && (
          <div className="mb-4 max-h-32 space-y-1 overflow-auto rounded-xl border border-purple-100 bg-purple-50/60 p-2">
            {customerMatches.map((row) => (
              <button
                key={row.id || `${row.phone}-${row.name}`}
                type="button"
                onClick={() => onSelectCustomerMatch(row)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-purple-900 transition hover:bg-purple-100"
              >
                <span className="font-medium">{row.name || "Customer"}</span>
                <span className="text-purple-700/80">{row.phone}</span>
              </button>
            ))}
          </div>
        )}
        {error && (
          <p className="mb-4 text-sm font-medium text-violet-700">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onContinue}
            disabled={creatingTakeaway}
            className="bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] text-white hover:opacity-95 disabled:opacity-60"
          >
            {creatingTakeaway
              ? "Starting..."
              : lookupDone && customerName.trim()
              ? "Start Order"
              : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PosTakeawayModal;
