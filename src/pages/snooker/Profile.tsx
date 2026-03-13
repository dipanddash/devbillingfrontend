import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOffline } from "@/contexts/OfflineContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  KeyRound,
  Mail,
  Phone,
  RefreshCcw,
  Save,
  Sparkles,
  UploadCloud,
  UserRound,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_BASE;

const SnookerProfile = () => {
  const { user, setUser } = useAuth();
  const { isOnline, pendingSyncCount, syncNow, isReady } = useOffline();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingOfflineData, setSyncingOfflineData] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<Record<string, any> | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const token = localStorage.getItem("access");

  const displayRole = useMemo(
    () => String(profile?.role ?? user?.role ?? "SNOOKER_STAFF").replace(/_/g, " "),
    [profile?.role, user?.role],
  );
  const displayName = useMemo(
    () => form.name || user?.name || user?.username || "Snooker Staff",
    [form.name, user?.name, user?.username],
  );
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "SS";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [displayName]);
  const profileCompletion = useMemo(() => {
    const checks = [form.name.trim(), form.email.trim(), form.phone.trim()];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("Not logged in.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_URL}/api/accounts/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load profile.");
        const data = await res.json();
        setProfile(data);
        setForm({
          name: data?.name || data?.full_name || data?.username || user?.name || "",
          email: data?.email || user?.email || "",
          phone: data?.phone || data?.phone_number || "",
        });
      } catch (e: any) {
        setError(e?.message || "Unable to fetch profile.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, user?.email, user?.name]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Missing token.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name.trim(),
        full_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      const res = await fetch(`${BASE_URL}/api/accounts/me/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.detail || "Failed.");
      }
      const updated = await res.json();
      const merged = {
        ...user,
        ...updated,
        name: updated?.name || form.name,
        username: updated?.username || user?.username,
        email: updated?.email || form.email,
      };
      setProfile((prev) => ({ ...(prev || {}), ...updated }));
      setUser(merged);
      localStorage.setItem("user", JSON.stringify(merged));
      setSuccess("Profile updated.");
    } catch (e: any) {
      setError(e?.message || "Error.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshToken = async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) {
      setError("Refresh token not found.");
      return;
    }
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/accounts/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) throw new Error("Token refresh failed.");
      const data = await res.json();
      if (data?.access) localStorage.setItem("access", data.access);
      setSuccess("Session refreshed.");
    } catch (e: any) {
      setError(e?.message || "Error.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleOfflineSync = async () => {
    if (!isReady || !isOnline || pendingSyncCount === 0 || syncingOfflineData) return;
    setSyncingOfflineData(true);
    setError("");
    setSuccess("");
    try {
      await syncNow();
      setSuccess("Offline data synced successfully.");
    } catch (e: any) {
      setError(e?.message || "Unable to sync offline data.");
    } finally {
      setSyncingOfflineData(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-violet-100/90" />
        <div className="h-96 animate-pulse rounded-2xl bg-violet-100/80" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-violet-200/80 bg-[linear-gradient(120deg,#4c1d95_0%,#5b21b6_45%,#6d28d9_100%)] p-6 text-white shadow-[0_30px_70px_rgba(109,40,217,0.35)] md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_40%)]" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-xl font-semibold shadow-inner ring-1 ring-white/20">{initials}</div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5" /> Snooker Staff Profile
              </p>
              <h1 className="mt-2 text-2xl font-bold md:text-3xl">{displayName}</h1>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-white/70">Role</p>
              <p className="mt-1 font-semibold">{displayRole}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-white/70">Profile</p>
              <p className="mt-1 font-semibold">{profileCompletion}%</p>
            </div>
          </div>
        </div>
      </section>

      {!!error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {!!success && <div className="rounded-xl border border-violet-300/70 bg-violet-50 px-4 py-3 text-sm text-violet-800">{success}</div>}

      <Card className="overflow-hidden border-violet-200/80 bg-white shadow-[0_18px_50px_rgba(91,33,182,0.16)]">
        <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white">
          <CardTitle className="inline-flex items-center gap-2 text-lg">
            <UserRound className="h-4 w-4 text-violet-700" /> Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 md:p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                <Label htmlFor="name" className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-violet-700">
                  <UserRound className="h-3.5 w-3.5" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="border-violet-200/80 bg-white focus-visible:ring-violet-400/30"
                />
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                <Label htmlFor="email" className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-violet-700">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="border-violet-200/80 bg-white focus-visible:ring-violet-400/30"
                />
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                <Label htmlFor="phone" className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-violet-700">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="border-violet-200/80 bg-white focus-visible:ring-violet-400/30"
                />
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
                <Label className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-violet-700">
                  <KeyRound className="h-3.5 w-3.5" /> Role
                </Label>
                <Input value={displayRole} disabled className="border-violet-200/80 bg-violet-100/50 text-violet-600" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRefreshToken}
                disabled={refreshing}
                className="gap-2 border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh Session
              </Button>
              <Button type="submit" disabled={saving} className="gap-2 bg-violet-600 text-white shadow hover:bg-violet-700">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-violet-200/80 bg-white shadow-[0_18px_50px_rgba(91,33,182,0.16)]">
        <CardHeader className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white">
          <CardTitle className="inline-flex items-center gap-2 text-lg">
            <UploadCloud className="h-4 w-4 text-violet-700" /> Offline Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 md:p-6">
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm text-slate-700">
            {!isReady
              ? "Preparing offline storage..."
              : !isOnline
                ? "You're offline right now. Reconnect, then sync your pending data from here."
                : pendingSyncCount > 0
                  ? `${pendingSyncCount} item${pendingSyncCount !== 1 ? "s" : ""} waiting to sync.`
                  : "No offline data is waiting to sync."}
          </div>
          <Button
            type="button"
            onClick={handleOfflineSync}
            disabled={!isReady || !isOnline || pendingSyncCount === 0 || syncingOfflineData}
            className="gap-2 bg-violet-600 text-white shadow hover:bg-violet-700"
          >
            <UploadCloud className="h-4 w-4" />
            {syncingOfflineData ? "Syncing Offline Data..." : "Sync Offline Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SnookerProfile;
