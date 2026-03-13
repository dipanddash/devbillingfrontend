/**
 * A small status bar that shows when the app is offline or has pending sync items.
 * Non-intrusive - sits at the top of the screen.
 */
import { useOffline } from "@/contexts/OfflineContext";
import { Cloud, CloudOff } from "lucide-react";

export default function OfflineIndicator() {
  const { isOnline, pendingSyncCount } = useOffline();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      className={`flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        isOnline
          ? "border-b border-amber-200 bg-amber-50 text-amber-700"
          : "border-b border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {isOnline ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}

      <span>
        {isOnline
          ? `Online - ${pendingSyncCount} item${pendingSyncCount !== 1 ? "s" : ""} pending sync. Open Profile to sync.`
          : "Offline - Working locally"}
      </span>
    </div>
  );
}
