export interface Product {
  id: string;
  name: string;
  category_name: string;
  category_id: string;
  price: number;
  gst_percent: number;
  image_url: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  image_url?: string;
  image?: string;
}

export interface ProductForm {
  name: string;
  categoryId: string;
  price: string;
  gstPercent: string;
  image: File | null;
  isActive: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  image_url: string;
  ingredient_id?: string | null;
  ingredient_name?: string;
  ingredient_unit?: string;
  ingredient_category_id?: string;
  ingredient_category_name?: string;
  ingredient_quantity?: number;
}

export interface AddonForm {
  name: string;
  price: string;
  image: File | null;
  ingredientQuantity: string;
  ingredientInputUnit: string;
}

export interface CategoryForm {
  name: string;
  image: File | null;
}

export interface Recipe {
  id: number;
  ingredient_name: string;
  product_name?: string;
  product: string;
  ingredient: string;
  quantity: string;
}

export interface IngredientOption {
  id: string;
  name: string;
  unit: string;
  category_id: string;
  category_name: string;
}

export interface IngredientCategoryOption {
  id: string;
  name: string;
}

export interface ComboItem {
  id: string;
  combo: string;
  combo_name?: string;
  product: string;
  product_name: string;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  price: number;
  gst_percent: number;
  image_url: string;
  is_active: boolean;
  items: ComboItem[];
}

export interface ComboFormItem {
  productId: string;
  quantity: string;
}

export interface ComboForm {
  name: string;
  price: string;
  gstPercent: string;
  isActive: boolean;
  image: File | null;
  imageUrl?: string;
  items: ComboFormItem[];
}

export type ApiRecord = Record<string, unknown>;

export type CatalogMode = "products" | "addons";
