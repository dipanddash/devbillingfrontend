export interface Ingredient {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string;
  unit: string;
  unit_price: string;
  current_stock: string;
  min_stock: string;
  is_active: boolean;
  valuation?: string;
  health?: StockHealth;
}

export type StockHealth = "good" | "low" | "out";
export type HealthFilter = "all" | "healthy" | "low" | "out";
export type InventorySortBy = "name" | "stock" | "valuation";

export interface DailyStockRow {
  ingredient_id: string;
  ingredient_name: string;
  category_id: string | null;
  category_name?: string;
  unit: string;
  unit_price: string;
  assigned_today: string;
  used_today: string;
  remaining_today: string;
  carry_forward: string;
  total_stock: string;
  min_stock: string;
  valuation: string;
  health: StockHealth;
  is_active: boolean;
}

export interface DailySummaryResponse {
  date: string;
  totals: {
    ingredients_count: number;
    assigned_today: string;
    used_today: string;
    remaining_today: string;
    valuation: string;
  };
  rows: DailyStockRow[];
}

export interface IngredientFormState {
  name: string;
  category_id: string;
  unit: string;
  unit_price: string;
  current_stock: string;
  min_stock: string;
  is_active: boolean;
}

export interface IngredientCategory {
  id: string;
  name: string;
  is_active: boolean;
  ingredients_count?: number;
}

export interface AssignmentVisibleTotals {
  assigned: string;
  used: string;
  remaining: string;
  valuation: string;
}
