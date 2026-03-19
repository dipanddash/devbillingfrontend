type ConnectivityListener = (online: boolean) => void;

const listeners = new Set<ConnectivityListener>();

export function isOnline(): boolean {
  return true;
}

export function forceOfflineMode() {
  // Offline mode removed (online-only).
  return;
}

export function onConnectivityChange(listener: ConnectivityListener): () => void {
  listeners.add(listener);
  listener(true);
  return () => listeners.delete(listener);
}

export function startConnectivityMonitor() {
  listeners.forEach((listener) => listener(true));
}

export function stopConnectivityMonitor() {
  return;
}

