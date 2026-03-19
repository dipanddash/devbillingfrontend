import { Tag } from "lucide-react";
import type { KeyboardEvent, MutableRefObject } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DEFAULT_MENU_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  category_name: string;
  image: string;
  gst_percent: number;
  is_available?: boolean;
  availability_reason?: string | null;
}

interface ComboItem {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
}

interface Combo {
  id: string;
  name: string;
  price: string;
  gst_percent: number;
  image: string;
  is_available?: boolean;
  availability_reason?: string | null;
  items: ComboItem[];
}

interface PosCatalogPanelProps {
  searchDropdownRef: MutableRefObject<HTMLDivElement | null>;
  searchInputRef: MutableRefObject<HTMLInputElement | null>;
  search: string;
  showSearchDropdown: boolean;
  searchSuggestions: Product[];
  categories: Category[];
  activeCategory: string;
  filteredProducts: Product[];
  filteredCombos: Combo[];
  hasBillingContext: boolean;
  isOnlineNow: boolean;
  productNameById: Record<string, string>;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSelectSuggestion: (product: Product) => void;
  onCategoryChange: (categoryName: string) => void;
  onOpenProduct: (product: Product) => void;
  onOpenCombo: (combo: Combo) => void;
}

const PosCatalogPanel = ({
  searchDropdownRef,
  searchInputRef,
  search,
  showSearchDropdown,
  searchSuggestions,
  categories,
  activeCategory,
  filteredProducts,
  filteredCombos,
  hasBillingContext,
  isOnlineNow,
  productNameById,
  onSearchChange,
  onSearchFocus,
  onSearchKeyDown,
  onSelectSuggestion,
  onCategoryChange,
  onOpenProduct,
  onOpenCombo,
}: PosCatalogPanelProps) => (
  <div className="space-y-5 lg:col-span-6 xl:col-span-7">
    <div ref={searchDropdownRef} className="relative w-full max-w-xl">
      <Input
        placeholder="Search products..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onSearchFocus}
        onKeyDown={onSearchKeyDown}
        ref={searchInputRef}
        className="h-12 rounded-2xl border-purple-200 bg-white px-4 text-sm text-purple-950 placeholder:text-purple-400 focus-visible:ring-purple-300"
      />
      {showSearchDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-80 overflow-auto rounded-2xl border border-purple-200 bg-white p-2 shadow-[0_18px_45px_rgba(91,33,182,0.2)]">
          {searchSuggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSuggestion(item)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-purple-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={item.image || DEFAULT_MENU_IMAGE}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_MENU_IMAGE;
                  }}
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-purple-950 break-words">{item.name}</p>
                  <p className="truncate text-xs text-purple-700/70">{item.category_name}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-purple-800">Rs {item.price}</p>
                <p className="text-[11px] font-semibold text-purple-600">Add</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-3">
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeCategory === cat.name ? "default" : "outline"}
          onClick={() => onCategoryChange(cat.name)}
          className={
            activeCategory === cat.name
              ? "rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] px-5 text-white shadow-md hover:opacity-95"
              : "rounded-full border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
          }
        >
          {cat.name}
        </Button>
      ))}
      <Button
        variant={activeCategory === "Combo" ? "default" : "outline"}
        onClick={() => onCategoryChange("Combo")}
        className={
          activeCategory === "Combo"
            ? "rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#5b21b6_100%)] px-5 text-white shadow-md hover:opacity-95"
            : "rounded-full border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
        }
      >
        Combo
      </Button>
    </div>

    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] justify-items-center gap-4">
      {filteredProducts.map((product) => (
        <Card
          key={product.id}
          onClick={() => onOpenProduct(product)}
          className={`group overflow-hidden rounded-2xl border border-purple-100 bg-white/95 transition duration-200 ${
            hasBillingContext && (product.is_available !== false || !isOnlineNow)
              ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(109,40,217,0.2)]"
              : "cursor-not-allowed opacity-60"
          } w-full max-w-[320px]`}
        >
          <img
            src={product.image || DEFAULT_MENU_IMAGE}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.src = DEFAULT_MENU_IMAGE;
            }}
            className="h-40 w-full object-cover"
          />
          <CardContent className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-purple-950 break-words">{product.name}</h3>
              <span className="rounded-md bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700">
                {product.category_name}
              </span>
            </div>
            {product.is_available === false && (
              <p className="mb-2 text-[11px] font-semibold text-rose-700">
                {product.availability_reason || "Out of stock"}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-800">Rs {product.price}</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white transition group-hover:bg-purple-700">
                <Tag className="h-3 w-3" />
                Add
              </span>
            </div>
            <p className="mt-2 text-[11px] text-purple-600/80">GST {product.gst_percent}%</p>
          </CardContent>
        </Card>
      ))}

      {filteredCombos.map((combo) => (
        <Card
          key={combo.id}
          onClick={() => onOpenCombo(combo)}
          className={`group overflow-hidden rounded-2xl border border-purple-100 bg-white/95 transition duration-200 ${
            hasBillingContext && (combo.is_available !== false || !isOnlineNow)
              ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(109,40,217,0.2)]"
              : "cursor-not-allowed opacity-60"
          } w-full max-w-[320px]`}
        >
          <img
            src={combo.image || DEFAULT_MENU_IMAGE}
            alt={combo.name}
            onError={(event) => {
              event.currentTarget.src = DEFAULT_MENU_IMAGE;
            }}
            className="h-40 w-full object-cover"
          />
          <CardContent className="p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-purple-950 break-words">{combo.name}</h3>
              <span className="rounded-md bg-purple-100 px-2 py-1 text-[10px] font-semibold text-purple-700">
                Combo
              </span>
            </div>
            {combo.is_available === false && (
              <p className="mb-2 text-[11px] font-semibold text-rose-700">
                {combo.availability_reason || "Out of stock"}
              </p>
            )}
            <p className="text-[11px] text-purple-600/80">
              {combo.items.length} item{combo.items.length === 1 ? "" : "s"}
            </p>
            <div className="mb-2 space-y-0.5">
              {combo.items.slice(0, 2).map((item) => (
                <p key={item.id} className="text-[11px] text-purple-700/75 break-words">
                  {(item.product_name || productNameById[item.product] || "Product")} x {item.quantity}
                </p>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-purple-800">Rs {combo.price}</span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white transition group-hover:bg-purple-700">
                <Tag className="h-3 w-3" />
                Add
              </span>
            </div>
            <p className="mt-1 text-[11px] text-purple-600/80">GST {combo.gst_percent}%</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default PosCatalogPanel;
