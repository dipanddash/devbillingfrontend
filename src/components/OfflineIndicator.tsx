/**
 * A small status bar that shows when the app is offline or has pending sync items.
 * Non-intrusive — sits at the top of the screen.
 */
import { useOffline } from "@/contexts/OfflineContext";
import { Cloud, CloudOff, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";

export default function OfflineIndicator() {
  const { isOnline, pendingSyncCount, syncNow } = useOffline();
  const [syncing, setSyncing] = useState(false);

  // Don't show anything if online and no pending items
  if (isOnline && pendingSyncCount === 0) return null;

  const handleSync = async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    try {
      await syncNow();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        isOnline
          ? "bg-amber-50 text-amber-700 border-b border-amber-200"
          : "bg-red-50 text-red-700 border-b border-red-200"
      }`}
    >
      {isOnline ? (
        <Cloud className="h-3.5 w-3.5" />
      ) : (
        <CloudOff className="h-3.5 w-3.5" />
      )}

      <span>
        {isOnline
          ? `Online — ${pendingSyncCount} item${pendingSyncCount !== 1 ? "s" : ""} pending sync`
          : "Offline — Working locally"}
      </span>

      {pendingSyncCount > 0 && isOnline && (
        <button
          onClick={handleSync}
          disabled={syncing}
          className="ml-2 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 transition-colors disabled:opacity-50"
        >
          {syncing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Sync Now
        </button>
      )}
    </div>
  );
}
