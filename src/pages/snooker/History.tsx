import { useEffect, useState, useCallback } from "react";
import { Clock, CircleDot, Gamepad2, Search, Filter, ChevronDown } from "lucide-react";

const API = import.meta.env.VITE_API_BASE;
const auth = () => {
  const t = localStorage.getItem("access");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

interface SessionItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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
  num_players: number;
  check_in: string;
  check_out: string;
  running_duration_minutes: number;
  running_service_amount: number;
  food_total: number;
  running_total: number;
  discount_amount: string;
  final_amount: string;
  staff_username: string;
  items: SessionItem[];
  payments: { method: string; amount: number; reference_id: string }[];
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const fmtTime = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};
const fmtDuration = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const History = () => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "CANCELLED">("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SNOOKER" | "CONSOLE">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      let url = `${API}/api/gaming/sessions/?today=false`;
      const params: string[] = [];
      if (statusFilter !== "ALL") params.push(`status=${statusFilter}`);
      if (typeFilter !== "ALL") params.push(`service_type=${typeFilter}`);
      url = `${API}/api/gaming/sessions/?` + params.join("&");
      const res = await fetch(url, { headers: auth() });
      if (res.ok) {
        const data: GameSession[] = await res.json();
        setSessions(data.filter((s) => s.status === "COMPLETED" || s.status === "CANCELLED"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchSessions();
  }, [fetchSessions]);

  const filtered = sessions.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.customer_name.toLowerCase().includes(q) ||
      s.customer_phone.includes(q) ||
      s.staff_username.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading history...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Session History</h1>
        <p className="text-sm text-slate-500 mt-1">All completed and cancelled sessions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or staff..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
        >
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"
        >
          <option value="ALL">All Types</option>
          <option value="SNOOKER">Snooker</option>
          <option value="CONSOLE">Console</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-slate-400">No sessions found.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((s) => {
          const expanded = expandedId === s.id;
          return (
            <div key={s.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setExpandedId(expanded ? null : s.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  {s.service_type === "SNOOKER" ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50">
                      <CircleDot className="h-4 w-4 text-violet-600" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                      <Gamepad2 className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-slate-900">{s.customer_name}</p>
                    <p className="text-xs text-slate-500">{s.customer_phone} — {fmtDate(s.check_in)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    s.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}>
                    {s.status}
                  </span>
                  {s.final_amount && (
                    <span className="text-sm font-bold text-slate-800">₹{Number(s.final_amount).toFixed(0)}</span>
                  )}
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition ${expanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {expanded && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Type</p>
                      <p className="font-medium">{s.service_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">
                        {s.service_type === "SNOOKER" ? "Boards" : "Console"}
                      </p>
                      <p className="font-medium">
                        {s.service_type === "SNOOKER" ? s.board_numbers?.join(", ") : `${s.console_name} (${s.console_type})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Duration</p>
                      <p className="font-medium">{fmtDuration(s.running_duration_minutes)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Players</p>
                      <p className="font-medium">{s.num_players}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Check In</p>
                      <p className="font-medium">{fmtTime(s.check_in)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Check Out</p>
                      <p className="font-medium">{fmtTime(s.check_out)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Staff</p>
                      <p className="font-medium">{s.staff_username}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-slate-400">Discount</p>
                      <p className="font-medium">₹{Number(s.discount_amount).toFixed(0)}</p>
                    </div>
                  </div>

                  {s.items.length > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Food Items</p>
                      {s.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs py-0.5">
                          <span className="text-slate-600">{item.item_name} × {item.quantity}</span>
                          <span className="font-medium text-slate-800">₹{item.total_price}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.payments.length > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Payments</p>
                      {s.payments.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs py-0.5">
                          <span className="text-slate-600">{p.method}{p.reference_id ? ` (${p.reference_id})` : ""}</span>
                          <span className="font-medium text-slate-800">₹{Number(p.amount).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold">
                    <span>Final Amount</span>
                    <span className="text-emerald-700">₹{Number(s.final_amount).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default History;
