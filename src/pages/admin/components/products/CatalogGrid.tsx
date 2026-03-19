import { motion } from "framer-motion";
import { BookOpen, Edit2, Trash2, Zap } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { CATALOG_ADDONS, CATALOG_PRODUCTS, COMBO_CATEGORY_NAME } from "./constants";
import type { Addon, CatalogMode, Combo, Product } from "./types";

interface CatalogGridProps {
  catalogMode: CatalogMode;
  activeCategory: string;
  search: string;
  onSearchChange: (value: string) => void;
  addonsLoading: boolean;
  productsLoading: boolean;
  comboLoading: boolean;
  filteredAddons: Addon[];
  filteredProducts: Product[];
  filteredCombos: Combo[];
  onEditAddon: (addon: Addon) => void;
  onDeleteAddon: (addon: Addon) => void;
  onToggleProductAvailability: (id: string) => void;
  onOpenRecipe: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onToggleComboAvailability: (id: string) => void;
  onEditCombo: (combo: Combo) => void;
  onDeleteCombo: (combo: Combo) => void;
}

const CatalogGrid = ({
  catalogMode,
  activeCategory,
  search,
  onSearchChange,
  addonsLoading,
  productsLoading,
  comboLoading,
  filteredAddons,
  filteredProducts,
  filteredCombos,
  onEditAddon,
  onDeleteAddon,
  onToggleProductAvailability,
  onOpenRecipe,
  onEditProduct,
  onDeleteProduct,
  onToggleComboAvailability,
  onEditCombo,
  onDeleteCombo,
}: CatalogGridProps) => (
  <section className={catalogMode === CATALOG_PRODUCTS ? "lg:col-span-9 xl:col-span-9" : "lg:col-span-12 xl:col-span-12"}>
    <div className="relative mb-4 flex items-center justify-between gap-3">
      <input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={
          catalogMode === CATALOG_ADDONS
            ? "Search addons..."
            : activeCategory === COMBO_CATEGORY_NAME
            ? "Search combos..."
            : "Search products..."
        }
        className="w-full md:w-[360px] rounded-xl border border-purple-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-purple-400"
      />

      <span className="hidden rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 md:inline-flex">
        {catalogMode === CATALOG_ADDONS ? "All Addons" : activeCategory === "All" ? "All Categories" : activeCategory}
      </span>
    </div>

    <div
      className={
        catalogMode === CATALOG_ADDONS
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-5 gap-4"
          : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
      }
    >
      {catalogMode === CATALOG_ADDONS &&
        (addonsLoading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={`addon-skeleton-${idx}`} className="bg-white border rounded-xl overflow-hidden shadow-sm p-3">
                <Skeleton className="h-36 w-full rounded-lg" />
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-7 w-7 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : filteredAddons.map((addon, idx) => (
              <motion.div
                key={addon.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="h-36 bg-purple-50 relative">
                  {addon.image_url ? (
                    <img src={addon.image_url} alt={addon.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xl">Addon</div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-sm leading-tight">{addon.name}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-base font-bold">Rs.{addon.price.toFixed(2)}</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditAddon(addon)}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-purple-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteAddon(addon)}
                        className="w-7 h-7 rounded-full border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )))}

      {catalogMode === CATALOG_PRODUCTS &&
        activeCategory !== COMBO_CATEGORY_NAME &&
        (productsLoading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={`product-skeleton-${idx}`} className="bg-white border rounded-xl overflow-hidden shadow-sm p-3">
                <Skeleton className="h-36 w-full rounded-lg" />
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="flex gap-1.5">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-7 w-7 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          : filteredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="h-36 bg-purple-50 relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xl">?</div>
                  )}

                  <button
                    onClick={() => onToggleProductAvailability(product.id)}
                    className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      product.is_active ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    {product.is_active ? "Active" : "Inactive"}
                  </button>
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{product.category_name}</p>
                    </div>
                    <button
                      onClick={() => onOpenRecipe(product)}
                      className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Recipe
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold">Rs.{product.price.toFixed(2)}</p>
                      <p className="text-[11px] text-muted-foreground">GST {product.gst_percent}%</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditProduct(product)}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-purple-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteProduct(product)}
                        className="w-7 h-7 rounded-full border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )))}

      {catalogMode === CATALOG_PRODUCTS &&
        activeCategory === COMBO_CATEGORY_NAME &&
        (comboLoading ? (
          <div className="col-span-full rounded-xl border border-dashed border-violet-200 bg-violet-50 p-5 text-sm text-violet-700">
            Loading combos...
          </div>
        ) : (
          filteredCombos.map((combo, idx) => (
            <motion.div
              key={combo.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="h-36 bg-violet-50 relative">
                {combo.image_url ? (
                  <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="h-full flex items-center justify-center text-xl">Combo</div>
                )}
                <button
                  onClick={() => onToggleComboAvailability(combo.id)}
                  className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    combo.is_active ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  {combo.is_active ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-sm leading-tight">{combo.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {combo.items.length} item{combo.items.length === 1 ? "" : "s"}
                </p>
                <div className="mt-2 space-y-0.5">
                  {combo.items.slice(0, 2).map((item) => (
                    <p key={item.id} className="text-[11px] text-muted-foreground truncate">
                      {item.product_name} x {item.quantity}
                    </p>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-base font-bold">Rs.{combo.price.toFixed(2)}</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditCombo(combo)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-purple-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCombo(combo)}
                      className="w-7 h-7 rounded-full border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">GST {combo.gst_percent}%</p>
              </div>
            </motion.div>
          ))
        ))}
    </div>
  </section>
);

export default CatalogGrid;
