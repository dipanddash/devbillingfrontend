import { Download } from "lucide-react";

interface InvoicesHeaderProps {
  exportFrom: string;
  exportTo: string;
  showExportMenu: boolean;
  onExportFromChange: (value: string) => void;
  onExportToChange: (value: string) => void;
  onToggleExportMenu: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

const InvoicesHeader = ({
  exportFrom,
  exportTo,
  showExportMenu,
  onExportFromChange,
  onExportToChange,
  onToggleExportMenu,
  onExportPdf,
  onExportExcel,
}: InvoicesHeaderProps) => (
  <section className="relative rounded-2xl border border-violet-200 bg-[linear-gradient(135deg,#1f1638_0%,#35235f_45%,#5e3aa3_100%)] p-6 text-white shadow-[0_14px_34px_rgba(45,22,82,0.24)]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_85%_25%,rgba(255,255,255,0.16),transparent_28%)]" />
    <div className="relative z-10 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-violet-200">Finance Control</p>
        <h1 className="mt-2 text-3xl font-bold">Invoices</h1>
        <p className="mt-1 text-sm text-violet-100/90">Manage and track all invoices</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] text-white/90">
          <input
            type="date"
            value={exportFrom}
            onChange={(e) => onExportFromChange(e.target.value)}
            className="h-8 rounded-md border border-white/20 bg-white/15 px-2 text-[11px] text-white placeholder:text-white/60"
          />
          <span className="text-white/70">to</span>
          <input
            type="date"
            value={exportTo}
            onChange={(e) => onExportToChange(e.target.value)}
            className="h-8 rounded-md border border-white/20 bg-white/15 px-2 text-[11px] text-white placeholder:text-white/60"
          />
        </div>
        <div className="relative">
          <button
            onClick={onToggleExportMenu}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/25"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-44 overflow-hidden rounded-xl border border-violet-200 bg-white text-slate-900 shadow-2xl">
              <button
                onClick={onExportPdf}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-violet-50"
              >
                Download PDF
              </button>
              <button
                onClick={onExportExcel}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-violet-50"
              >
                Download Excel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </section>
);

export default InvoicesHeader;
