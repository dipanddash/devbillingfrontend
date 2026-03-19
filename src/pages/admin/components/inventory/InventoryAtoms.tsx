import type { ReactNode } from "react";

import type { StockHealth } from "./types";

export const Card = ({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) => (
  <div className="flex items-center justify-between rounded-2xl border border-violet-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] p-4 shadow-[0_8px_18px_rgba(75,35,132,0.07)]">
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-violet-500">{title}</p>
      <h3 className="mt-1 text-[1.9rem] font-semibold leading-none text-violet-950">{value}</h3>
    </div>
    {icon}
  </div>
);

export const MetricPill = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
  </div>
);

export const TableRowSkeleton = ({ columns }: { columns: number }) => (
  <tr>
    {Array.from({ length: columns }).map((_, idx) => (
      <td key={`skeleton-cell-${idx}`} className="px-4 py-3">
        <div className="h-4 w-full animate-pulse rounded-md bg-slate-200" />
      </td>
    ))}
  </tr>
);

export const CategoryChipSkeleton = () => <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200" />;

export const StockProgressBar = ({ current, min }: { current: number; min: number }) => {
  const safeMin = min > 0 ? min : 1;
  const ratio = Math.max(0, Math.min(100, (current / safeMin) * 50));
  const tone = current <= 0 ? "bg-rose-500" : current <= min ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full ${tone}`} style={{ width: `${ratio}%` }} />
    </div>
  );
};

export const HealthBadge = ({ health }: { health: StockHealth }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
      health === "good" ? "text-emerald-700" : health === "low" ? "text-amber-700" : "text-rose-700"
    }`}
  >
    <span
      className={`h-2 w-2 rounded-full ${
        health === "good" ? "bg-emerald-500" : health === "low" ? "bg-amber-500" : "bg-rose-500"
      }`}
    />
    {health === "good" ? "Healthy" : health === "low" ? "Low Stock" : "Out of Stock"}
  </span>
);

interface PaginationBarProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationBar = ({
  totalItems,
  pageSize,
  currentPage,
  totalPages,
  onPageChange,
}: PaginationBarProps) => {
  const safeTotal = Math.max(0, totalItems);
  const start = safeTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, safeTotal);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-600">
      <p>
        Showing <span className="font-semibold text-slate-800">{start}</span>-
        <span className="font-semibold text-slate-800">{end}</span> of{" "}
        <span className="font-semibold text-slate-800">{safeTotal}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <span className="font-semibold text-slate-700">
          {currentPage} / {Math.max(totalPages, 1)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
