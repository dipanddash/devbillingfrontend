import { Layers, Plus } from "lucide-react";

import { CATALOG_ADDONS, CATALOG_PRODUCTS, COMBO_CATEGORY_NAME } from "./constants";
import type { CatalogMode } from "./types";

interface ProductsHeaderProps {
  catalogMode: CatalogMode;
  activeCategory: string;
  onCatalogProducts: () => void;
  onCatalogAddons: () => void;
  onAddCategory: () => void;
  onAddAddon: () => void;
  onAddProductOrCombo: () => void;
}

const ProductsHeader = ({
  catalogMode,
  activeCategory,
  onCatalogProducts,
  onCatalogAddons,
  onAddCategory,
  onAddAddon,
  onAddProductOrCombo,
}: ProductsHeaderProps) => (
  <div className="rounded-2xl border border-border bg-gradient-to-br from-white via-violet-50 to-purple-50 p-4 md:p-5 mb-5 shadow-sm">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-xs text-muted-foreground mt-1">Design, manage, and publish your full cafe menu.</p>
        <div className="mt-3 inline-flex rounded-full border border-violet-200 bg-white p-1 text-xs font-semibold">
          <button
            onClick={onCatalogProducts}
            className={`rounded-full px-3 py-1 ${catalogMode === CATALOG_PRODUCTS ? "bg-violet-600 text-white" : "text-violet-700"}`}
          >
            Products
          </button>
          <button
            onClick={onCatalogAddons}
            className={`rounded-full px-3 py-1 ${catalogMode === CATALOG_ADDONS ? "bg-violet-600 text-white" : "text-violet-700"}`}
          >
            Addons
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {catalogMode === CATALOG_PRODUCTS && (
          <button
            onClick={onAddCategory}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full border border-purple-300 bg-white hover:bg-purple-50 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            Add Category
          </button>
        )}

        <button
          onClick={onAddAddon}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-purple-600 text-white hover:bg-purple-700 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Addon
        </button>

        {catalogMode === CATALOG_PRODUCTS && (
          <button
            onClick={onAddProductOrCombo}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-full bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            {activeCategory === COMBO_CATEGORY_NAME ? "Add Combo" : "Add Product"}
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ProductsHeader;
