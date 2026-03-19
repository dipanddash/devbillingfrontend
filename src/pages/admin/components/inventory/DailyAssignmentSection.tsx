import { MetricPill, PaginationBar, TableRowSkeleton } from "./InventoryAtoms";
import type { AssignmentVisibleTotals, DailyStockRow, Ingredient } from "./types";
import { formatNum } from "./utils";

interface DailyAssignmentSectionProps {
  pageSize: number;
  selectedDate: string;
  assignmentSaving: boolean;
  assignmentLoading: boolean;
  assignmentFiltered: Ingredient[];
  assignmentTotalCount: number;
  assignmentPage: number;
  assignmentTotalPages: number;
  assignmentVisibleTotals: AssignmentVisibleTotals;
  assignmentSearch: string;
  assignmentError: string | null;
  assignmentMessage: string | null;
  assignmentQuantities: Record<string, string>;
  assignmentFieldErrors: Record<string, string>;
  dailyMap: Record<string, DailyStockRow>;
  onSelectedDateChange: (date: string) => void;
  onSave: () => void;
  onAssignmentSearchChange: (value: string) => void;
  onAssignmentPageChange: (page: number) => void;
  onAssignmentQuantityChange: (ingredientId: string, value: string) => void;
}

const DailyAssignmentSection = ({
  pageSize,
  selectedDate,
  assignmentSaving,
  assignmentLoading,
  assignmentFiltered,
  assignmentTotalCount,
  assignmentPage,
  assignmentTotalPages,
  assignmentVisibleTotals,
  assignmentSearch,
  assignmentError,
  assignmentMessage,
  assignmentQuantities,
  assignmentFieldErrors,
  dailyMap,
  onSelectedDateChange,
  onSave,
  onAssignmentSearchChange,
  onAssignmentPageChange,
  onAssignmentQuantityChange,
}: DailyAssignmentSectionProps) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_20px_rgba(2,6,23,0.06)]">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Daily Stock Assignment</h2>
        <p className="text-xs text-slate-600">
          Assign stock category-wise for the selected day. Staff consumption is allowed only from assigned stock.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onSelectedDateChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={onSave}
          disabled={assignmentSaving || assignmentLoading || assignmentFiltered.length === 0}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {assignmentSaving ? "Saving..." : "Save Assignment"}
        </button>
      </div>
    </div>

    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
      <MetricPill label="Assigned Today" value={assignmentVisibleTotals.assigned} />
      <MetricPill label="Used Today" value={assignmentVisibleTotals.used} />
      <MetricPill label="Remaining Today" value={assignmentVisibleTotals.remaining} />
      <MetricPill label="Valuation" value={`Rs.${assignmentVisibleTotals.valuation}`} />
    </div>

    <input
      value={assignmentSearch}
      onChange={(e) => onAssignmentSearchChange(e.target.value)}
      placeholder="Search ingredient for daily assignment..."
      className="mb-4 w-full rounded-xl border border-violet-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
    />

    {assignmentError ? <p className="mb-3 text-sm font-medium text-rose-600">{assignmentError}</p> : null}
    {assignmentMessage ? <p className="mb-3 text-sm font-medium text-emerald-700">{assignmentMessage}</p> : null}

    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-600">
          <tr>
            <th className="px-3 py-2.5 text-left">Category</th>
            <th className="px-3 py-2.5 text-left">Ingredient</th>
            <th className="px-3 py-2.5 text-left">Carry Forward</th>
            <th className="px-3 py-2.5 text-left">Total Stock</th>
            <th className="px-3 py-2.5 text-left">Assigned Today</th>
            <th className="px-3 py-2.5 text-left">Used Today</th>
            <th className="px-3 py-2.5 text-left">Remaining Today</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {assignmentLoading
            ? Array.from({ length: pageSize }).map((_, idx) => <TableRowSkeleton key={`assign-skeleton-${idx}`} columns={7} />)
            : assignmentTotalCount === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-800">No ingredients added yet.</p>
                    <p className="mt-1 text-xs text-slate-500">Add an ingredient to start daily stock assignment.</p>
                  </td>
                </tr>
              )
            : assignmentFiltered.map((ingredient) => {
                const daily = dailyMap[ingredient.id];
                return (
                  <tr key={`assign-${ingredient.id}`}>
                    <td className="px-3 py-2 text-slate-700">
                      <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                        {ingredient.category_name || "OTHERS"}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800">{ingredient.name}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatNum(daily?.carry_forward ?? "0")} {ingredient.unit}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatNum(ingredient.current_stock)} {ingredient.unit}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step="0.001"
                        value={assignmentQuantities[ingredient.id] ?? daily?.assigned_today ?? "0"}
                        onChange={(e) => onAssignmentQuantityChange(ingredient.id, e.target.value)}
                        className={`h-9 w-36 rounded-md border px-2 text-sm outline-none focus:border-violet-400 ${
                          assignmentFieldErrors[ingredient.id] ? "border-rose-400 bg-rose-50" : "border-slate-300"
                        }`}
                      />
                      {assignmentFieldErrors[ingredient.id] ? (
                        <p className="mt-1 text-xs font-medium text-rose-600">{assignmentFieldErrors[ingredient.id]}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {formatNum(daily?.used_today ?? "0")} {ingredient.unit}
                    </td>
                    <td className="px-3 py-2 font-semibold text-slate-900">
                      {formatNum(daily?.remaining_today ?? "0")} {ingredient.unit}
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
    {!assignmentLoading && assignmentTotalCount > 0 ? (
      <PaginationBar
        totalItems={assignmentTotalCount}
        pageSize={pageSize}
        currentPage={assignmentPage}
        totalPages={assignmentTotalPages}
        onPageChange={onAssignmentPageChange}
      />
    ) : null}
  </section>
);

export default DailyAssignmentSection;
