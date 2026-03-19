import { SlidersHorizontal } from "lucide-react";

import { CategoryChipSkeleton } from "./InventoryAtoms";
import type { IngredientCategory } from "./types";

interface InventoryCategoryViewSectionProps {
  categoriesLoading: boolean;
  categories: IngredientCategory[];
  selectedCategoryId: string;
  itemsCount: number;
  categoryCounts: Record<string, number>;
  onSelectCategory: (categoryId: string) => void;
}

const InventoryCategoryViewSection = ({
  categoriesLoading,
  categories,
  selectedCategoryId,
  itemsCount,
  categoryCounts,
  onSelectCategory,
}: InventoryCategoryViewSectionProps) => (
  <section className="rounded-2xl border border-violet-200/70 bg-[linear-gradient(180deg,#ffffff_0%,#fbf8ff_100%)] p-3.5 shadow-[0_8px_18px_rgba(58,28,110,0.07)]">
    <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">
      <SlidersHorizontal className="h-3.5 w-3.5" />
      Category View
    </div>
    <div className="flex flex-wrap gap-2">
      {categoriesLoading ? (
        Array.from({ length: 5 }).map((_, idx) => <CategoryChipSkeleton key={`category-skeleton-${idx}`} />)
      ) : (
        <>
          <button
            onClick={() => onSelectCategory("all")}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selectedCategoryId === "all"
                ? "border-violet-500 bg-violet-600 text-white"
                : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
            }`}
          >
            All ({itemsCount})
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategoryId === category.id
                  ? "border-violet-500 bg-violet-600 text-white"
                  : "border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
              }`}
            >
              {category.name} ({categoryCounts[category.id] || 0})
            </button>
          ))}
        </>
      )}
    </div>
  </section>
);

export default InventoryCategoryViewSection;
