import type { AddonForm, CategoryForm, ComboForm, ProductForm } from "./types";

export const COMBO_CATEGORY_NAME = "Combo";
export const CATALOG_PRODUCTS = "products";
export const CATALOG_ADDONS = "addons";

export const initialProductForm: ProductForm = {
  name: "",
  categoryId: "",
  price: "",
  gstPercent: "",
  image: null,
  isActive: true,
};

export const initialCategoryForm: CategoryForm = {
  name: "",
  image: null,
};

export const initialAddonForm: AddonForm = {
  name: "",
  price: "",
  image: null,
  ingredientQuantity: "",
  ingredientInputUnit: "",
};

export const initialComboForm: ComboForm = {
  name: "",
  price: "",
  gstPercent: "0",
  isActive: true,
  image: null,
  imageUrl: "",
  items: [{ productId: "", quantity: "1" }],
};

export const placeholderCategoryImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80";
