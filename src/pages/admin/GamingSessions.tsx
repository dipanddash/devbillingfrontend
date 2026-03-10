import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import RefreshButton from "@/components/RefreshButton";

const API = import.meta.env.VITE_API_BASE;

interface Analytics {
  customers_today: number;
  active_sessions: number;
  completed_today: number;
  cancelled_today: number;
  snooker_revenue: number;
  console_revenue: number;
  food_revenue: number;
  total_revenue: number;
  available_boards: number;
  occupied_boards: number;
  total_boards: number;
  available_consoles: number;
  occupied_consoles: number;
  total_consoles: number;
  avg_duration_minutes: number;
  peak_hours: { hour: number; count: number }[];
  board_utilization: Record<string, number>;
  console_utilization: Record<string, number>;
  top_selling_items: { item_name: string; total_qty: number; total_amount: number }[];
  staff_stats: { staff__username: string; sessions_count: number; revenue: number }[];
  override_count: number;
}

interface AuditLog {
  id: string;
  session: string;
  action: string;
  changed_by_name?: string;
  changed_by?: { username: string };
  details: string;
  created_at: string;
}

interface GameSession {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  status: string;
  check_in: string;
  check_out: string | null;
  final_amount: number | null;
  staff_name?: string;
  staff?: { username: string };
  running_total?: number;
}

function authHeaders() {
  const t = localStorage.getItem("access");
  return { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };
}

function formatCurrency(v: number | null | undefined) {
  return `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export default function GamingSessions() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState<"overview" | "sessions" | "audit">("overview");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [aRes, sRes, lRes] = await Promise.all([
        fetch(`${API}/api/gaming/admin-analytics/`, { headers: authHeaders() }),
        fetch(`${API}/api/gaming/sessions/`, { headers: authHeaders() }),
        fetch(`${API}/api/gaming/audit-logs/?today=true`, { headers: authHeaders() }),
      ]);
      if (aRes.ok) setAnalytics(await aRes.json());
      if (sRes.ok) setSessions(await sRes.json());
      if (lRes.ok) setAuditLogs(await lRes.json());
    } catch {
      toast({ title: "Failed to load gaming data", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && s.service_type !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  const a = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Gaming Center</h1>
          <RefreshButton onClick={() => fetchAll(true)} loading={refreshing} />
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["overview", "sessions", "audit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "overview" ? "Overview" : t === "sessions" ? "Sessions" : "Audit Logs"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {tab === "overview" && a && (
        <div className="space-y-6">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <KPICard label="Customers Today" value={a.customers_today} />
            <KPICard label="Active Sessions" value={a.active_sessions} accent="green" />
            <KPICard label="Completed" value={a.completed_today} accent="blue" />
            <KPICard label="Cancelled" value={a.cancelled_today} accent="red" />
            <KPICard label="Avg Duration" value={`${a.avg_duration_minutes} min`} />
            <KPICard label="Overrides" value={a.override_count} accent={a.override_count > 0 ? "red" : undefined} />
          </div>

          {/* Revenue */}
          <div className="grid md:grid-cols-4 gap-4">
            <RevenueCard label="Snooker Revenue" amount={a.snooker_revenue} />
            <RevenueCard label="Console Revenue" amount={a.console_revenue} />
            <RevenueCard label="Food Revenue" amount={a.food_revenue} />
            <RevenueCard label="Total Revenue" amount={a.total_revenue} highlight />
          </div>

          {/* Resources */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Board Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold">{a.occupied_boards}/{a.total_boards}</span>
                  <span className="text-sm text-slate-500">boards occupied</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(a.board_utilization).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{name}</span>
                      <span className="font-medium">{count} sessions</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Console Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-bold">{a.occupied_consoles}/{a.total_consoles}</span>
                  <span className="text-sm text-slate-500">consoles occupied</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(a.console_utilization).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{name}</span>
                      <span className="font-medium">{count} sessions</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours + Top Items + Staff */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                {a.peak_hours.length === 0 ? (
                  <p className="text-sm text-slate-400">No data yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {a.peak_hours.map((ph) => (
                      <div key={ph.hour} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{formatHour(ph.hour)}</span>
                        <span className="font-medium">{ph.count} sessions</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                {a.top_selling_items.length === 0 ? (
                  <p className="text-sm text-slate-400">No food orders yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {a.top_selling_items.map((item) => (
                      <div key={item.item_name} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 truncate max-w-[140px]">{item.item_name}</span>
                        <span className="font-medium">{item.total_qty} × {formatCurrency(item.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {a.staff_stats.length === 0 ? (
                  <p className="text-sm text-slate-400">No completed sessions</p>
                ) : (
                  <div className="space-y-1.5">
                    {a.staff_stats.map((st) => (
                      <div key={st.staff__username} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{st.staff__username}</span>
                        <span className="font-medium">{st.sessions_count} / {formatCurrency(st.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB: SESSIONS ── */}
      {tab === "sessions" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="SNOOKER">Snooker</option>
              <option value="CONSOLE">Console</option>
            </select>
            <span className="text-sm text-slate-500 self-center">{filteredSessions.length} sessions</span>
          </div>

          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Phone</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Check-In</th>
                  <th className="px-4 py-2 font-medium">Check-Out</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">{s.customer_name || "Walk-in"}</td>
                    <td className="px-4 py-2">{s.customer_phone || "-"}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline">{s.service_type}</Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={s.status === "ACTIVE" ? "default" : s.status === "COMPLETED" ? "secondary" : "destructive"}
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{new Date(s.check_in).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="px-4 py-2">{s.check_out ? new Date(s.check_out).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "-"}</td>
                    <td className="px-4 py-2 text-right font-medium">
                      {s.status === "COMPLETED" ? formatCurrency(s.final_amount) : s.running_total != null ? formatCurrency(s.running_total) : "-"}
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No sessions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: AUDIT LOGS ── */}
      {tab === "audit" && (
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Changed By</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">{log.action}</Badge>
                  </td>
                  <td className="px-4 py-2">{log.changed_by_name || log.changed_by?.username || "-"}</td>
                  <td className="px-4 py-2 max-w-[300px] truncate">{log.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No audit logs today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  const colors: Record<string, string> = {
    green: "text-green-600",
    blue: "text-blue-600",
    red: "text-red-600",
  };
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className={`text-xl font-bold ${accent ? colors[accent] ?? "" : "text-slate-900"}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function RevenueCard({ label, amount, highlight }: { label: string; amount: number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="pt-4 pb-3 px-4">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className={`text-xl font-bold ${highlight ? "text-primary" : "text-slate-900"}`}>
          {formatCurrency(amount)}
        </p>
      </CardContent>
    </Card>
  );
}
