import { Pencil, Trash2 } from "lucide-react";

import { HealthBadge, PaginationBar, StockProgressBar, TableRowSkeleton } from "./InventoryAtoms";
import type { DailyStockRow, Ingredient } from "./types";
import { asNumber, formatNum } from "./utils";

interface InventoryTableSectionProps {
  pageSize: number;
  itemsLoading: boolean;
  filtered: Ingredient[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  dailyMap: Record<string, DailyStockRow>;
  itemsError: string | null;
  onPageChange: (page: number) => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
}

const InventoryTableSection = ({
  pageSize,
  itemsLoading,
  filtered,
  totalCount,
  currentPage,
  totalPages,
  dailyMap,
  itemsError,
  onPageChange,
  onEdit,
  onDelete,
}: InventoryTableSectionProps) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_20px_rgba(2,6,23,0.06)]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-sm">
        <thead className="bg-slate-100 text-[11px] uppercase tracking-[0.12em] text-slate-600">
          <tr>
            <th className="px-3 py-2.5 text-left">Category</th>
            <th className="px-3 py-2.5 text-left">Ingredient</th>
            <th className="px-3 py-2.5 text-left">Price</th>
            <th className="px-3 py-2.5 text-left">Stock</th>
            <th className="px-3 py-2.5 text-left">Min</th>
            <th className="px-3 py-2.5 text-left">Assigned</th>
            <th className="px-3 py-2.5 text-left">Used</th>
            <th className="px-3 py-2.5 text-left">Remain</th>
            <th className="px-3 py-2.5 text-left">Value</th>
            <th className="hidden px-3 py-2.5 text-left 2xl:table-cell">Health</th>
            <th className="sticky right-0 z-20 bg-slate-100 px-3 py-2.5 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {itemsLoading
            ? Array.from({ length: pageSize }).map((_, idx) => <TableRowSkeleton key={`master-skeleton-${idx}`} columns={11} />)
            : totalCount === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center">
                    <p className="text-sm font-semibold text-slate-800">No ingredients added yet.</p>
                    <p className="mt-1 text-xs text-slate-500">Use Add Ingredient to create your first inventory item.</p>
                  </td>
                </tr>
              )
            : filtered.map((ingredient) => {
                const daily = dailyMap[ingredient.id];
                const current = asNumber(ingredient.current_stock);
                const min = asNumber(ingredient.min_stock);
                const valuation = current * asNumber(ingredient.unit_price);
                const health = current <= 0 ? "out" : current <= min ? "low" : "good";

                return (
                  <tr key={ingredient.id} className="transition hover:bg-slate-50/60">
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                        {ingredient.category_name || "OTHERS"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        <span className="font-semibold tracking-tight text-slate-900">{ingredient.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">
                      Rs.{asNumber(ingredient.unit_price).toFixed(2)} / {ingredient.unit}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">
                      <p>
                        {formatNum(ingredient.current_stock)} {ingredient.unit}
                      </p>
                      <StockProgressBar current={current} min={min} />
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">
                      {formatNum(ingredient.min_stock)} {ingredient.unit}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatNum(daily?.assigned_today ?? "0")} {ingredient.unit}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatNum(daily?.used_today ?? "0")} {ingredient.unit}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {formatNum(daily?.remaining_today ?? "0")} {ingredient.unit}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">Rs.{valuation.toFixed(2)}</td>
                    <td className="hidden px-3 py-2.5 2xl:table-cell">
                      <HealthBadge health={health} />
                    </td>
                    <td className="sticky right-0 z-10 bg-white px-3 py-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEdit(ingredient)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(ingredient)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
          </tr>
                );
              })}
        </tbody>
      </table>
    </div>
    {!itemsLoading && totalCount > 0 ? (
      <PaginationBar
        totalItems={totalCount}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    ) : null}
    {itemsError ? <p className="border-t border-slate-200 px-6 py-3 text-sm font-medium text-rose-600">{itemsError}</p> : null}
  </section>
);

export default InventoryTableSection;
