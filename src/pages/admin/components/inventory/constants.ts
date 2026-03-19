import type { IngredientFormState } from "./types";

export const UNIT_GROUPS = [
  { label: "Weight", color: "#7c3aed", options: ["kg", "g", "mg", "lb", "oz", "ton"] as const },
  { label: "Volume", color: "#2563eb", options: ["L", "ml", "cl", "gal"] as const },
  { label: "Count", color: "#0891b2", options: ["pcs", "count", "unit", "dozen", "pair", "set"] as const },
  {
    label: "Pack/Container",
    color: "#f59e0b",
    options: ["pack", "box", "bottle", "can", "jar", "sachet", "tray", "bag", "bundle"] as const,
  },
  { label: "Length/Area", color: "#16a34a", options: ["m", "cm", "mm", "ft", "inch", "sheet", "roll"] as const },
] as const;

export const INVENTORY_UNITS = UNIT_GROUPS.flatMap((group) => group.options);

export const emptyForm: IngredientFormState = {
  name: "",
  category_id: "",
  unit: INVENTORY_UNITS[0],
  unit_price: "",
  current_stock: "",
  min_stock: "",
  is_active: true,
};
