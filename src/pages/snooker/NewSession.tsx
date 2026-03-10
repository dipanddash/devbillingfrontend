import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleDot, Gamepad2, ArrowLeft } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE;

interface Board {
  id: string;
  number: number;
  label: string;
  is_occupied: boolean;
}

interface ConsoleResource {
  id: string;
  name: string;
  console_type: string;
  is_occupied: boolean;
}

const getAuthHeaders = (json = false) => {
  const token = localStorage.getItem("access");
  const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  if (json) h["Content-Type"] = "application/json";
  return h;
};

const DEFAULT_CONSOLE_PRICES: Record<string, number> = {
  PS2: 49,
  PS4: 75,
  PS5: 100,
  XBOX: 100,
};

const NewSession = () => {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serviceType, setServiceType] = useState<"SNOOKER" | "CONSOLE" | "">("");

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Snooker
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [pricePerBoard, setPricePerBoard] = useState("200");
  const [snookerPlayers, setSnookerPlayers] = useState("2");

  // Console
  const [consoles, setConsoles] = useState<ConsoleResource[]>([]);
  const [selectedConsole, setSelectedConsole] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [consolePlayers, setConsolePlayers] = useState("1");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/api/gaming/boards/`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/api/gaming/consoles/`, { headers: getAuthHeaders() }),
        ]);
        if (bRes.ok) setBoards(await bRes.json());
        if (cRes.ok) setConsoles(await cRes.json());
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const toggleBoard = (id: string) => {
    setSelectedBoards((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleConsoleSelect = (id: string) => {
    setSelectedConsole(id);
    const c = consoles.find((x) => x.id === id);
    if (c && !pricePerPerson) {
      setPricePerPerson(String(DEFAULT_CONSOLE_PRICES[c.console_type] || 100));
    }
  };

  const canProceedStep2 = customerName.trim() && customerPhone.trim();

  const canSubmit =
    serviceType === "SNOOKER"
      ? selectedBoards.length > 0 && Number(pricePerBoard) > 0
      : selectedConsole && Number(pricePerPerson) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim(),
      service_type: serviceType,
      num_players: serviceType === "SNOOKER" ? Number(snookerPlayers) : Number(consolePlayers),
    };

    if (serviceType === "SNOOKER") {
      body.board_ids = selectedBoards;
      body.price_per_board_per_hour = Number(pricePerBoard);
    } else {
      body.console = selectedConsole;
      body.price_per_person_per_hour = Number(pricePerPerson);
    }

    try {
      const res = await fetch(`${API_BASE}/api/gaming/sessions/`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        const msg =
          data.detail ||
          Object.values(data).flat().join(", ") ||
          "Failed to create session.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }
      navigate("/snooker/active");
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/snooker")} className="rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Session</h1>
          <p className="text-sm text-slate-500">Step {step} of 3</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* STEP 1 — Service Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Choose Service Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setServiceType("SNOOKER"); setStep(2); }}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-violet-200 bg-white p-6 shadow-sm hover:border-violet-500 hover:bg-violet-50 transition"
            >
              <CircleDot className="h-10 w-10 text-violet-600" />
              <span className="text-lg font-bold text-slate-900">Snooker</span>
              <span className="text-xs text-slate-500">Board-based, per hour</span>
            </button>
            <button
              onClick={() => { setServiceType("CONSOLE"); setStep(2); }}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <Gamepad2 className="h-10 w-10 text-blue-600" />
              <span className="text-lg font-bold text-slate-900">Console</span>
              <span className="text-xs text-slate-500">PS / Xbox, per person per hour</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Customer Details */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Customer Details</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email (optional)</label>
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                placeholder="Email address"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setStep(1); setServiceType(""); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Back
            </button>
            <button
              disabled={!canProceedStep2}
              onClick={() => setStep(3)}
              className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Resource Selection */}
      {step === 3 && serviceType === "SNOOKER" && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Select Snooker Boards</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              {boards.map((b) => {
                const selected = selectedBoards.includes(b.id);
                return (
                  <button
                    key={b.id}
                    disabled={b.is_occupied}
                    onClick={() => toggleBoard(b.id)}
                    className={`rounded-xl border-2 p-4 text-center transition ${
                      b.is_occupied
                        ? "border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed"
                        : selected
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-violet-300"
                    }`}
                  >
                    <p className="text-lg font-bold">Board {b.number}</p>
                    <p className="text-xs mt-1">{b.is_occupied ? "Occupied" : selected ? "Selected" : "Available"}</p>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Price per board per hour (₹)</label>
                <input
                  type="number"
                  value={pricePerBoard}
                  onChange={(e) => setPricePerBoard(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Number of players</label>
                <input
                  type="number"
                  min="1"
                  value={snookerPlayers}
                  onChange={(e) => setSnookerPlayers(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Back
            </button>
            <button
              disabled={!canSubmit || saving}
              onClick={handleSubmit}
              className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-50 transition"
            >
              {saving ? "Creating..." : "Start Session"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && serviceType === "CONSOLE" && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Select Console</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3">
              {consoles.map((c) => {
                const selected = selectedConsole === c.id;
                return (
                  <button
                    key={c.id}
                    disabled={c.is_occupied}
                    onClick={() => handleConsoleSelect(c.id)}
                    className={`rounded-xl border-2 p-4 text-center transition ${
                      c.is_occupied
                        ? "border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed"
                        : selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <p className="text-lg font-bold">{c.name}</p>
                    <p className="text-xs mt-1">{c.console_type} — {c.is_occupied ? "In Use" : selected ? "Selected" : "Available"}</p>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Price per person per hour (₹)</label>
                <input
                  type="number"
                  value={pricePerPerson}
                  onChange={(e) => setPricePerPerson(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Number of players</label>
                <input
                  type="number"
                  min="1"
                  value={consolePlayers}
                  onChange={(e) => setConsolePlayers(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Back
            </button>
            <button
              disabled={!canSubmit || saving}
              onClick={handleSubmit}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? "Creating..." : "Start Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSession;
