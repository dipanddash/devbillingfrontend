/**
 * Connectivity detection with health-check ping to the backend.
 * Uses navigator.onLine + periodic server ping for reliable detection.
 */

import { withRequestMeta } from "@/lib/requestMeta";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const HEALTH_URL = `${API_BASE}/api/sync/health/`;
const PING_INTERVAL = 15_000; // 15 seconds
const PING_TIMEOUT = 5_000;   // 5 second timeout for health check

type ConnectivityListener = (online: boolean) => void;

let _isOnline = navigator.onLine;
let _listeners: ConnectivityListener[] = [];
let _pingTimer: ReturnType<typeof setInterval> | null = null;

export function isOnline(): boolean {
  return _isOnline;
}

function _notify(online: boolean) {
  if (_isOnline === online) return;
  _isOnline = online;
  _listeners.forEach((fn) => {
    try { fn(online); } catch { /* ignore listener errors */ }
  });
}

/**
 * Immediately switch app network state to offline.
 * Useful when a request fails mid-session even before heartbeat catches up.
 */
export function forceOfflineMode() {
  _notify(false);
}

async function _healthPing(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT);
    const res = await fetch(
      HEALTH_URL,
      withRequestMeta(
        { signal: controller.signal, cache: "no-store" },
        {
          showLoader: false,
          loaderType: "silent",
          requestPurpose: "healthCheck",
        },
      ),
    );
    clearTimeout(timeout);
    if (!res.ok) return false;
    const payload = await res.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload || typeof payload !== "object") return true;

    const offlineMode = Boolean(payload.offline_mode);
    const neonReachable = Boolean(
      payload.neon_reachable ??
      payload.sync_available ??
      (((payload.db as Record<string, unknown> | undefined)?.neon as Record<string, unknown> | undefined)?.ok),
    );

    return !offlineMode && neonReachable;
  } catch {
    return false;
  }
}

async function _checkConnectivity() {
  const online = await _healthPing();
  _notify(online);
}

/** Subscribe to connectivity changes. Returns unsubscribe function. */
export function onConnectivityChange(listener: ConnectivityListener): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((fn) => fn !== listener);
  };
}

/** Start monitoring connectivity. Call once at app startup. */
export function startConnectivityMonitor() {
  // Browser events
  window.addEventListener("online", () => _checkConnectivity());
  window.addEventListener("offline", () => _notify(false));

  // Periodic health ping
  _checkConnectivity(); // initial check
  if (_pingTimer) clearInterval(_pingTimer);
  _pingTimer = setInterval(_checkConnectivity, PING_INTERVAL);
}

/** Stop monitoring (for cleanup). */
export function stopConnectivityMonitor() {
  if (_pingTimer) {
    clearInterval(_pingTimer);
    _pingTimer = null;
  }
}
