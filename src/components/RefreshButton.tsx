import { RefreshCw } from "lucide-react";

interface RefreshButtonProps {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  className?: string;
}

export default function RefreshButton({ onClick, loading = false, className = "" }: RefreshButtonProps) {
  const handleClick = () => {
    if (loading) return;
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
