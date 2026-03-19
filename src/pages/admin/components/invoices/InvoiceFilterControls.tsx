import { STATUS_FILTER_OPTIONS } from "./constants";
import type { InvoiceStatusFilter } from "./types";

interface InvoiceFilterControlsProps {
  search: string;
  filterFrom: string;
  filterTo: string;
  exportFrom: string;
  exportTo: string;
  statusFilter: InvoiceStatusFilter;
  onSearchChange: (value: string) => void;
  onFilterFromChange: (value: string) => void;
  onFilterToChange: (value: string) => void;
  onExportFromChange: (value: string) => void;
  onExportToChange: (value: string) => void;
  onStatusFilterChange: (status: InvoiceStatusFilter) => void;
}

const InvoiceFilterControls = ({
  search,
  filterFrom,
  filterTo,
  exportFrom,
  exportTo,
  statusFilter,
  onSearchChange,
  onFilterFromChange,
  onFilterToChange,
  onExportFromChange,
  onExportToChange,
  onStatusFilterChange,
}: InvoiceFilterControlsProps) => (
  <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_4px_16px_rgba(20,10,50,0.06)]">
    <h3 className="text-sm font-semibold text-foreground">Filter Controls</h3>
    <p className="mt-1 text-xs text-muted-foreground">Search and narrow invoice records</p>
    <div className="mt-4 space-y-3">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search invoices..."
        className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-400"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => onFilterFromChange(e.target.value)}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => onFilterToChange(e.target.value)}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm"
        />
      </div>
      <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-500">
          Export Date Range
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            type="date"
            value={exportFrom}
            onChange={(e) => onExportFromChange(e.target.value)}
            className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-slate-700"
          />
          <input
            type="date"
            value={exportTo}
            onChange={(e) => onExportToChange(e.target.value)}
            className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs text-slate-700"
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Export will include invoices between the selected dates.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => onStatusFilterChange(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
              statusFilter === status
                ? "bg-violet-600 text-white shadow-[0_6px_16px_rgba(124,58,237,0.3)]"
                : "border border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default InvoiceFilterControls;
