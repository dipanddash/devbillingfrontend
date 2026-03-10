import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Activity, CheckCircle2, IndianRupee,
  Gamepad2, CircleDot, Plus, ListChecks, LogOut as LogOutIcon,
} from "lucide-react";
import RefreshButton from "@/components/RefreshButton";

const API_BASE = import.meta.env.VITE_API_BASE;

interface DashboardStats {
  customers_today: number;
  active_sessions: number;
  completed_today: number;
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
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SnookerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/gaming/dashboard/`, { headers: getAuthHeaders() });
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div className="p-6 text-sm">Loading dashboard...</div>;

  const s = stats || {} as DashboardStats;

  const kpis = [
    { label: "Customers Today", value: s.customers_today, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Active Sessions", value: s.active_sessions, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Completed Today", value: s.completed_today, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Snooker Revenue", value: `₹${s.snooker_revenue?.toFixed(0) || 0}`, icon: CircleDot, color: "text-green-600", bg: "bg-green-50" },
    { label: "Console Revenue", value: `₹${s.console_revenue?.toFixed(0) || 0}`, icon: Gamepad2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Food Revenue", value: `₹${s.food_revenue?.toFixed(0) || 0}`, icon: IndianRupee, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Total Revenue", value: `₹${s.total_revenue?.toFixed(0) || 0}`, icon: IndianRupee, color: "text-purple-700", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gaming Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Live overview of today's gaming operations</p>
        </div>
        <RefreshButton onClick={() => fetchStats(true)} loading={refreshing} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/snooker/new-session")}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 transition"
        >
          <Plus className="h-4 w-4" /> New Session
        </button>
        <button
          onClick={() => navigate("/snooker/active")}
          className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm hover:bg-violet-50 transition"
        >
          <ListChecks className="h-4 w-4" /> Active Sessions
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <p className="text-lg font-bold text-slate-900">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resource Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-3">Snooker Boards</h2>
          <div className="flex gap-4 text-sm">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold text-emerald-700">{s.available_boards}</p>
              <p className="text-xs text-emerald-600">Available</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold text-rose-700">{s.occupied_boards}</p>
              <p className="text-xs text-rose-600">Occupied</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold text-slate-700">{s.total_boards}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600 mb-3">Consoles</h2>
          <div className="flex gap-4 text-sm">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold text-emerald-700">{s.available_consoles}</p>
              <p className="text-xs text-emerald-600">Available</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold text-rose-700">{s.occupied_consoles}</p>
              <p className="text-xs text-rose-600">Occupied</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1 text-center">
              <p className="text-2xl font-bold text-slate-700">{s.total_consoles}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnookerDashboard;
