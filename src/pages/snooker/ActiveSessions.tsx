import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, CircleDot, Gamepad2, Plus, X, Search,
  IndianRupee, ShoppingBag, CreditCard, XCircle,
} from "lucide-react";
import RefreshButton from "@/components/RefreshButton";

const API = import.meta.env.VITE_API_BASE;

const auth = (json = false) => {
  const t = localStorage.getItem("access");
  const h: Record<string, string> = t ? { Authorization: `Bearer ${t}` } : {};
  if (json) h["Content-Type"] = "application/json";
  return h;
};

interface SessionItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Payment {
  method: string;
  amount: number;
  reference_id?: string;
}

interface GameSession {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_type: "SNOOKER" | "CONSOLE";
  status: string;
  board_numbers: number[];
  console_name: string;
  console_type: string;
  price_per_board_per_hour: string;
  price_per_person_per_hour: string;
  num_players: number;
  check_in: string;
  running_duration_minutes: number;
  running_service_amount: number;
  food_total: number;
  running_total: number;
  discount_amount: string;
  final_amount: string;
  staff_username: string;
  items: SessionItem[];
  notes: string;
}

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const ActiveSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Food add modal
  const [foodModal, setFoodModal] = useState<string | null>(null);
  const [foodName, setFoodName] = useState("");
  const [foodQty, setFoodQty] = useState("1");
  const [foodPrice, setFoodPrice] = useState("");
  const [foodSaving, setFoodSaving] = useState(false);

  // Checkout modal
  const [checkoutSession, setCheckoutSession] = useState<GameSession | null>(null);
  const [discount, setDiscount] = useState("0");
  const [manualAmount, setManualAmount] = useState("");
  const [editReason, setEditReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [refId, setRefId] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  // Cancel confirm
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API}/api/gaming/sessions/?status=ACTIVE`, { headers: auth() });
      if (res.ok) setSessions(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /* ── Add Food ── */
  const openFoodModal = (sid: string) => {
    setFoodModal(sid);
    setFoodName("");
    setFoodQty("1");
    setFoodPrice("");
  };

  const addFood = async () => {
    if (!foodModal || !foodName.trim() || !foodPrice) return;
    setFoodSaving(true);
    try {
      const res = await fetch(`${API}/api/gaming/session-items/`, {
        method: "POST",
        headers: auth(true),
        body: JSON.stringify({
          session: foodModal,
          item_name: foodName.trim(),
          quantity: Number(foodQty),
          unit_price: Number(foodPrice),
          total_price: Number(foodQty) * Number(foodPrice),
        }),
      });
      if (res.ok) {
        setFoodModal(null);
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFoodSaving(false);
    }
  };

  /* ── Remove food item ── */
  const removeFood = async (itemId: string) => {
    try {
      await fetch(`${API}/api/gaming/session-items/${itemId}/`, {
        method: "DELETE",
        headers: auth(),
      });
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  /* ── Checkout ── */
  const openCheckout = (s: GameSession) => {
    setCheckoutSession(s);
    setDiscount(String(s.discount_amount || 0));
    setManualAmount("");
    setEditReason("");
    setPaymentMethod("CASH");
    setRefId("");
  };

  const handleCheckout = async () => {
    if (!checkoutSession) return;
    setCheckingOut(true);
    try {
      const body: Record<string, unknown> = {
        discount_amount: Number(discount),
        payments: [
          {
            method: paymentMethod,
            amount: manualAmount ? Number(manualAmount) : undefined,
            reference_id: refId || undefined,
          },
        ],
      };
      if (manualAmount) {
        body.final_amount = Number(manualAmount);
        body.reason = editReason;
        body.payments = [
          { method: paymentMethod, amount: Number(manualAmount), reference_id: refId || undefined },
        ];
      }
      const res = await fetch(`${API}/api/gaming/sessions/${checkoutSession.id}/checkout/`, {
        method: "POST",
        headers: auth(true),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCheckoutSession(null);
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingOut(false);
    }
  };

  /* ── Cancel ── */
  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API}/api/gaming/sessions/${cancelId}/cancel/`, {
        method: "POST",
        headers: auth(true),
      });
      if (res.ok) {
        setCancelId(null);
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading active sessions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Active Sessions</h1>
          <p className="text-sm text-slate-500 mt-1">{sessions.length} session{sessions.length !== 1 ? "s" : ""} running</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => fetchSessions(true)} loading={refreshing} />
          <button onClick={() => navigate("/snooker/new-session")}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 transition">
            <Plus className="h-4 w-4" /> New Session
          </button>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-400">No active sessions right now.</p>
        </div>
      )}

      <div className="grid gap-4">
        {sessions.map((s) => (
          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                {s.service_type === "SNOOKER" ? (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                    <CircleDot className="h-4.5 w-4.5 text-violet-600" />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                    <Gamepad2 className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-slate-900">{s.customer_name}</p>
                  <p className="text-xs text-slate-500">{s.customer_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  <Clock className="inline h-3 w-3 mr-1" />{fmtDuration(s.running_duration_minutes)}
                </span>
                <span className="text-xs text-slate-400">since {fmtTime(s.check_in)}</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <span>
                  <strong>Type:</strong> {s.service_type}
                </span>
                {s.service_type === "SNOOKER" ? (
                  <>
                    <span><strong>Boards:</strong> {s.board_numbers?.join(", ")}</span>
                    <span><strong>Rate:</strong> ₹{s.price_per_board_per_hour}/board/hr</span>
                  </>
                ) : (
                  <>
                    <span><strong>Console:</strong> {s.console_name} ({s.console_type})</span>
                    <span><strong>Rate:</strong> ₹{s.price_per_person_per_hour}/person/hr</span>
                  </>
                )}
                <span><strong>Players:</strong> {s.num_players}</span>
                <span><strong>Staff:</strong> {s.staff_username}</span>
              </div>

              {/* Running totals */}
              <div className="flex gap-3">
                <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-2 text-center flex-1">
                  <p className="text-lg font-bold text-violet-700">₹{s.running_service_amount?.toFixed(0)}</p>
                  <p className="text-[10px] text-violet-500">Service</p>
                </div>
                <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-center flex-1">
                  <p className="text-lg font-bold text-rose-600">₹{s.food_total?.toFixed(0)}</p>
                  <p className="text-[10px] text-rose-500">Food</p>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-center flex-1">
                  <p className="text-lg font-bold text-emerald-700">₹{s.running_total?.toFixed(0)}</p>
                  <p className="text-[10px] text-emerald-500">Total</p>
                </div>
              </div>

              {/* Food items */}
              {s.items.length > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Food Items</p>
                  <div className="space-y-1">
                    {s.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700">{item.item_name} × {item.quantity}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">₹{item.total_price}</span>
                          <button onClick={() => removeFood(item.id)}
                            className="text-rose-400 hover:text-rose-600">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => openFoodModal(s.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
                  <ShoppingBag className="h-3.5 w-3.5" /> Add Food
                </button>
                <button onClick={() => openCheckout(s)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition">
                  <CreditCard className="h-3.5 w-3.5" /> Checkout
                </button>
                <button onClick={() => setCancelId(s.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition">
                  <XCircle className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Food Add Modal ── */}
      {foodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setFoodModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Food / Beverage</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Item Name *</label>
                <input value={foodName} onChange={(e) => setFoodName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  placeholder="e.g. Cold Coffee, Sandwich" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                  <input type="number" min="1" value={foodQty} onChange={(e) => setFoodQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit Price (₹)</label>
                  <input type="number" value={foodPrice} onChange={(e) => setFoodPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                    placeholder="0" />
                </div>
              </div>
              {foodName && foodPrice && (
                <p className="text-xs text-slate-500">
                  Total: ₹{(Number(foodQty) * Number(foodPrice)).toFixed(2)}
                </p>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setFoodModal(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button disabled={!foodName.trim() || !foodPrice || foodSaving} onClick={addFood}
                className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-50 transition">
                {foodSaving ? "Adding..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {checkoutSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCheckoutSession(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Checkout</h3>
            <p className="text-xs text-slate-500 mb-4">{checkoutSession.customer_name} — {checkoutSession.customer_phone}</p>

            {/* Bill breakdown */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Service ({fmtDuration(checkoutSession.running_duration_minutes)})</span>
                <span className="font-semibold">₹{checkoutSession.running_service_amount?.toFixed(2)}</span>
              </div>
              {checkoutSession.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs text-slate-500">
                  <span>{item.item_name} × {item.quantity}</span>
                  <span>₹{item.total_price}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600">Food Total</span>
                <span className="font-semibold">₹{checkoutSession.food_total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Discount</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm outline-none focus:border-violet-500" />
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                <span>Estimated Total</span>
                <span className="text-emerald-700">
                  ₹{(checkoutSession.running_service_amount + checkoutSession.food_total - Number(discount)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Manual override */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Final Amount (override, optional)</label>
                <input type="number" value={manualAmount} onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="Leave blank to use calculated total"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200" />
              </div>
              {manualAmount && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reason for manual edit *</label>
                  <input value={editReason} onChange={(e) => setEditReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                    placeholder="e.g. Regular customer discount" />
                </div>
              )}

              {/* Payment method */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
                <div className="flex gap-2">
                  {(["CASH", "UPI", "CARD"] as const).map((m) => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-medium transition ${
                        paymentMethod === m
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-slate-200 text-slate-600 hover:border-violet-300"
                      }`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              {paymentMethod !== "CASH" && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reference ID</label>
                  <input value={refId} onChange={(e) => setRefId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                    placeholder="Transaction ID" />
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setCheckoutSession(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button disabled={checkingOut || (!!manualAmount && !editReason.trim())} onClick={handleCheckout}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition">
                {checkingOut ? "Processing..." : "Complete Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Confirm ── */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setCancelId(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Session?</h3>
            <p className="text-sm text-slate-500 mb-5">This will end the session without billing. This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCancelId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">No, Keep</button>
              <button disabled={cancelling} onClick={handleCancel}
                className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50 transition">
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;
