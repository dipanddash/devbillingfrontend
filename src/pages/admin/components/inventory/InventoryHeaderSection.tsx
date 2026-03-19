import { Plus, Sparkles, Tags } from "lucide-react";

import type { HealthFilter, IngredientCategory, InventorySortBy } from "./types";

interface InventoryHeaderSectionProps {
  filteredCount: number;
  search: string;
  selectedCategoryId: string;
  healthFilter: HealthFilter;
  sortBy: InventorySortBy;
  categories: IngredientCategory[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onHealthFilterChange: (filter: HealthFilter) => void;
  onSortByChange: (sortBy: InventorySortBy) => void;
  onAddIngredient: () => void;
  onManageCategories: () => void;
}

const InventoryHeaderSection = ({
  filteredCount,
  search,
  selectedCategoryId,
  healthFilter,
  sortBy,
  categories,
  onSearchChange,
  onCategoryChange,
  onHealthFilterChange,
  onSortByChange,
  onAddIngredient,
  onManageCategories,
}: InventoryHeaderSectionProps) => (
  <section className="flex flex-col gap-4 xl:flex-row xl:items-start">
    <div className="relative overflow-hidden rounded-3xl border border-violet-200 bg-[linear-gradient(130deg,#1b1132_0%,#452678_42%,#7441c9_100%)] px-7 py-6 text-white shadow-[0_18px_40px_rgba(52,22,97,0.28)] xl:min-w-0 xl:flex-1">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,255,255,0.26),transparent_34%),radial-gradient(circle_at_82%_26%,rgba(255,255,255,0.14),transparent_28%)]" />
      <div className="relative z-10">
        <p className="pl-0.5 text-xs uppercase tracking-[0.24em] text-violet-100/90">Enterprise Supply Desk</p>
        <h1 className="mt-2 pl-0.5 text-[2.2rem] font-bold leading-[1.12]">Inventory Intelligence</h1>
        <p className="mt-1.5 max-w-xl text-sm text-violet-100/95">
          Category-based stock assignment, usage tracking, valuation, and stock health in one operations screen.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">Daily Assignment</span>
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">Category Filters</span>
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5">Transparent Valuation</span>
        </div>
      </div>
    </div>

    <div className="rounded-3xl border border-violet-200/80 bg-white/92 p-5 shadow-[0_12px_28px_rgba(72,35,130,0.1)] backdrop-blur-sm xl:w-[460px] xl:flex-shrink-0 2xl:w-[500px]">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-violet-700">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em]">Actions</span>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{filteredCount} visible</span>
      </div>

      <div className="space-y-2.5">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search ingredients..."
          className="w-full rounded-xl border border-violet-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)] px-4 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="h-11 min-w-0 rounded-xl border border-violet-200 bg-white px-3 text-sm outline-none focus:border-violet-400"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={healthFilter}
            onChange={(e) => onHealthFilterChange(e.target.value as HealthFilter)}
            className="h-11 min-w-0 rounded-xl border border-violet-200 bg-white px-3 text-sm outline-none focus:border-violet-400"
          >
            <option value="all">All Health</option>
            <option value="healthy">Healthy</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as InventorySortBy)}
            className="h-11 min-w-0 rounded-xl border border-violet-200 bg-white px-3 text-sm outline-none focus:border-violet-400 sm:col-span-2"
          >
            <option value="name">Sort: Name</option>
            <option value="stock">Sort: Stock</option>
            <option value="valuation">Sort: Valuation</option>
          </select>
        </div>

        <button
          onClick={onAddIngredient}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#7f56d9_0%,#6f43cf_100%)] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(111,67,207,0.28)] transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Add Ingredient
        </button>

        <button
          onClick={onManageCategories}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
        >
          <Tags className="h-4 w-4" />
          Manage Categories
        </button>
      </div>
    </div>
  </section>
);

export default InventoryHeaderSection;
