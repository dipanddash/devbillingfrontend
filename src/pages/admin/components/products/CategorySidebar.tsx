import { Edit2, Layers, Trash2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { COMBO_CATEGORY_NAME, placeholderCategoryImage } from "./constants";
import type { Category, Product } from "./types";

interface CategorySidebarProps {
  categoriesLoading: boolean;
  categories: Category[];
  products: Product[];
  combosCount: number;
  activeCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

const CategorySidebar = ({
  categoriesLoading,
  categories,
  products,
  combosCount,
  activeCategory,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
}: CategorySidebarProps) => (
  <aside className="lg:col-span-3 xl:col-span-3 h-fit rounded-2xl border border-purple-100 bg-gradient-to-b from-white to-violet-50/60 p-3 shadow-sm">
    <div className="mb-3 rounded-xl border border-purple-100 bg-white/90 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-700">Category Control</p>
      <p className="mt-1 text-xs text-muted-foreground">Filter products by menu groups instantly.</p>
      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-medium text-violet-700">
        <Layers className="h-3.5 w-3.5" />
        {categoriesLoading ? "Loading..." : `${categories.length + 1} categories`}
      </div>
    </div>

    <div className="category-scroll max-h-[560px] overflow-y-auto space-y-2 pr-0">
      {categoriesLoading ? (
        Array.from({ length: 5 }).map((_, idx) => (
          <div key={`category-skeleton-${idx}`} className="rounded-xl border border-purple-100 bg-white/80 p-2.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))
      ) : (
        <>
          {categories.map((cat) => {
            const active = activeCategory === cat.name;
            const img = cat.image_url || cat.image || placeholderCategoryImage;
            const countForCategory = cat.name === "All" ? products.length : products.filter((p) => p.category_name === cat.name).length;

            return (
              <div
                key={cat.id}
                className={`group w-full rounded-xl border p-2.5 text-left transition ${
                  active
                    ? "border-purple-500 bg-purple-50 shadow-[0_6px_18px_rgba(124,58,237,0.14)]"
                    : "border-purple-100 bg-white/80 hover:border-purple-300 hover:bg-purple-50/60"
                }`}
              >
                <button onClick={() => onSelectCategory(cat.name)} className="w-full text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-white shadow-sm">
                      <img src={img} alt={cat.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs font-semibold ${active ? "text-purple-800" : "text-foreground"}`}>{cat.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {countForCategory} item{countForCategory === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </button>

                {cat.id !== "all" && (
                  <div className="mt-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onEditCategory(cat)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
                      title={`Edit ${cat.name}`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
                      title={`Delete ${cat.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <div
            className={`group w-full rounded-xl border p-2.5 text-left transition ${
              activeCategory === COMBO_CATEGORY_NAME
                ? "border-purple-500 bg-purple-50 shadow-[0_6px_18px_rgba(124,58,237,0.14)]"
                : "border-purple-100 bg-white/80 hover:border-purple-300 hover:bg-purple-50/60"
            }`}
          >
            <button onClick={() => onSelectCategory(COMBO_CATEGORY_NAME)} className="w-full text-left">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-white shadow-sm">
                  <img src={placeholderCategoryImage} alt={COMBO_CATEGORY_NAME} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-xs font-semibold ${activeCategory === COMBO_CATEGORY_NAME ? "text-purple-800" : "text-foreground"}`}>
                    {COMBO_CATEGORY_NAME}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {combosCount} combo{combosCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  </aside>
);

export default CategorySidebar;
