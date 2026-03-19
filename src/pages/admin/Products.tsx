import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AddonFormModal from "./components/products/AddonFormModal";
import CatalogGrid from "./components/products/CatalogGrid";
import CategoryFormModal from "./components/products/CategoryFormModal";
import CategorySidebar from "./components/products/CategorySidebar";
import ComboFormModal from "./components/products/ComboFormModal";
import ConfirmDeleteModal from "./components/products/ConfirmDeleteModal";
import ProductFormModal from "./components/products/ProductFormModal";
import ProductsHeader from "./components/products/ProductsHeader";
import RecipeFormModal from "./components/products/RecipeFormModal";
import {
  CATALOG_ADDONS,
  CATALOG_PRODUCTS,
  COMBO_CATEGORY_NAME,
  initialAddonForm,
  initialCategoryForm,
  initialComboForm,
  initialProductForm,
  placeholderCategoryImage,
} from "./components/products/constants";
import type {
  Addon,
  AddonForm,
  ApiRecord,
  Category,
  CategoryForm,
  Combo,
  ComboForm,
  ComboFormItem,
  IngredientCategoryOption,
  IngredientOption,
  Product,
  ProductForm,
  Recipe,
} from "./components/products/types";
import { convertToBaseUnit, getCompatibleUnits } from "./components/products/unit-utils";

const API_BASE = import.meta.env.VITE_API_BASE;
const UNCATEGORIZED_INGREDIENT_ID = "uncategorized";

const AdminProducts = () => {
  const [search, setSearch] = useState("");
  const [catalogMode, setCatalogMode] = useState<"products" | "addons">(CATALOG_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState("All");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [comboLoading, setComboLoading] = useState(false);
  const [showComboModal, setShowComboModal] = useState(false);
  const [showDeleteComboModal, setShowDeleteComboModal] = useState(false);
  const [editCombo, setEditCombo] = useState<Combo | null>(null);
  const [comboForm, setComboForm] = useState<ComboForm>(initialComboForm);
  const [isSavingCombo, setIsSavingCombo] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(initialProductForm);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [editAddon, setEditAddon] = useState<Addon | null>(null);
  const [addonForm, setAddonForm] = useState<AddonForm>(initialAddonForm);
  const [isSavingAddon, setIsSavingAddon] = useState(false);
  const [showDeleteAddonModal, setShowDeleteAddonModal] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(initialCategoryForm);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipeProduct, setSelectedRecipeProduct] = useState<Product | null>(null);
  const [recipeMode, setRecipeMode] = useState<"view" | "edit">("view");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [newRecipeIngredient, setNewRecipeIngredient] = useState("");
  const [newRecipeCategoryId, setNewRecipeCategoryId] = useState("");
  const [newRecipeQuantity, setNewRecipeQuantity] = useState("");
  const [newRecipeInputUnit, setNewRecipeInputUnit] = useState("");
  const [addonCategoryId, setAddonCategoryId] = useState("");
  const [addonIngredientId, setAddonIngredientId] = useState("");
  const [showRecipeSubmitConfirm, setShowRecipeSubmitConfirm] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
    void fetchAddons();
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/products/`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setProducts([]);
        return;
      }

      const data = await res.json();
      const list: ApiRecord[] = Array.isArray(data) ? data : [];

      const formatted: Product[] = list.map((item) => ({
        id: String(item.id),
        name: String(item.name ?? ""),
        category_name:
          typeof item.category_name === "string"
            ? item.category_name
            : typeof (item.category as ApiRecord | undefined)?.name === "string"
            ? String((item.category as ApiRecord).name)
            : "Uncategorized",
        category_id: String(item.category ?? item.category_id ?? ""),
        price: Number(item.price ?? 0),
        gst_percent: Number(item.gst_percent ?? 0),
        image_url: String(item.image_url ?? item.image ?? ""),
        is_active: Boolean(item.is_active),
      }));

      setProducts(formatted);
    } catch (err) {
      console.error("Fetch products error:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/categories/`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setCategories([]);
        return;
      }

      const data = await res.json();
      const list: ApiRecord[] = Array.isArray(data) ? data : [];

      const mapped: Category[] = list.map((c) => ({
        id: String(c.id),
        name: String(c.name ?? ""),
        image_url: String(c.image_url ?? c.image ?? ""),
      }));

      setCategories([
        { id: "all", name: "All", image_url: placeholderCategoryImage },
        ...mapped,
      ]);
    } catch (err) {
      console.error("Fetch categories error:", err);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchAddons = async () => {
    setAddonsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/addons/`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        setAddons([]);
        return;
      }

      const data = await res.json();
      const list: ApiRecord[] = Array.isArray(data) ? data : [];

      const mapped: Addon[] = list.map((item) => ({
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        price: Number(item.price ?? 0),
        image_url: String(item.image_url ?? item.image ?? ""),
        ingredient_id: item.ingredient_id ? String(item.ingredient_id) : null,
        ingredient_name: item.ingredient_name ? String(item.ingredient_name) : "",
        ingredient_unit: item.ingredient_unit ? String(item.ingredient_unit) : "",
        ingredient_category_id: item.ingredient_category_id
          ? String(item.ingredient_category_id)
          : "",
        ingredient_category_name: item.ingredient_category_name
          ? String(item.ingredient_category_name)
          : "",
        ingredient_quantity: Number(item.ingredient_quantity ?? 0),
      }));
      setAddons(mapped);
    } catch (err) {
      console.error("Fetch addons error:", err);
      setAddons([]);
    } finally {
      setAddonsLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/ingredients/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: ApiRecord[] =
        Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      const mapped: IngredientOption[] = list.map((item) => {
        const category = item.category as ApiRecord | undefined;
        const categoryIdRaw = item.category_id ?? category?.id ?? item.category;
        const categoryNameRaw = item.category_name ?? category?.name ?? "OTHERS";
        const categoryId =
          typeof categoryIdRaw === "string" || typeof categoryIdRaw === "number"
            ? String(categoryIdRaw)
            : UNCATEGORIZED_INGREDIENT_ID;
        return {
          id: String(item.id),
          name: String(item.name ?? item.ingredient_name ?? item.id),
          unit: String(item.unit ?? "unit"),
          category_id: categoryId,
          category_name: String(categoryNameRaw || "OTHERS"),
        };
      });
      setIngredients(mapped);
    } catch (err) {
      console.error("Fetch ingredients error:", err);
    }
  };

  const fetchCombos = async () => {
    setComboLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/combos/`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setCombos([]);
        return;
      }
      const data = await res.json();
      const list: ApiRecord[] =
        Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

      const mapped: Combo[] = list.map((row) => {
        const itemsRaw: ApiRecord[] = Array.isArray(row.items)
          ? (row.items as ApiRecord[])
          : [];
        return {
          id: String(row.id),
          name: String(row.name ?? ""),
          price: Number(row.price ?? 0),
          gst_percent: Number(row.gst_percent ?? 0),
          image_url: String(row.image_url ?? row.image ?? ""),
          is_active: Boolean(row.is_active),
          items: itemsRaw.map((item) => ({
            id: String(item.id),
            combo: String(item.combo ?? row.id ?? ""),
            combo_name: item.combo_name ? String(item.combo_name) : undefined,
            product: String(item.product ?? ""),
            product_name: String(item.product_name ?? ""),
            quantity: Number(item.quantity ?? 0),
          })),
        };
      });
      setCombos(mapped);
    } catch (err) {
      console.error("Fetch combos error:", err);
      setCombos([]);
    } finally {
      setComboLoading(false);
    }
  };

  const fetchProductRecipes = async (productId: string) => {
    setRecipeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/recipes/?product=${productId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        setRecipes([]);
        return;
      }
      const data = await res.json();
      const list: ApiRecord[] =
        Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      const mapped: Recipe[] = list.map((item) => ({
        id: Number(item.id),
        ingredient_name: String(item.ingredient_name ?? ""),
        product_name: item.product_name ? String(item.product_name) : undefined,
        product: String(item.product),
        ingredient: String(item.ingredient),
        quantity: String(item.quantity ?? "0"),
      }));
      setRecipes(mapped);
      setRecipeMode(mapped.length ? "view" : "edit");
    } catch (err) {
      console.error("Fetch recipes error:", err);
      setRecipes([]);
    } finally {
      setRecipeLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === "All" || p.category_name === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  const filteredCombos = useMemo(() => {
    return combos.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [combos, search]);

  const filteredAddons = useMemo(() => {
    return addons.filter((addon) =>
      addon.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [addons, search]);

  const selectedCategoryObj = useMemo(
    () => categories.find((c) => c.id === productForm.categoryId),
    [categories, productForm.categoryId]
  );

  const recipeIngredientCategories = useMemo<IngredientCategoryOption[]>(() => {
    const seen = new Map<string, string>();
    ingredients.forEach((item) => {
      if (!seen.has(item.category_id)) {
        seen.set(item.category_id, item.category_name || "OTHERS");
      }
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ingredients]);

  const filteredRecipeIngredients = useMemo(
    () =>
      ingredients.filter(
        (item) => newRecipeCategoryId && item.category_id === newRecipeCategoryId
      ),
    [ingredients, newRecipeCategoryId]
  );

  const filteredAddonIngredients = useMemo(
    () =>
      ingredients.filter(
        (item) => addonCategoryId && item.category_id === addonCategoryId
      ),
    [ingredients, addonCategoryId]
  );

  const selectedAddonIngredient = useMemo(
    () => ingredients.find((item) => item.id === addonIngredientId) ?? null,
    [ingredients, addonIngredientId]
  );

  const addonUnitOptions = useMemo(() => {
    const baseUnit = selectedAddonIngredient?.unit || "";
    if (!baseUnit) return [];
    return getCompatibleUnits(baseUnit);
  }, [selectedAddonIngredient]);

  const ingredientUnitById = useMemo(() => {
    const unitMap: Record<string, string> = {};
    ingredients.forEach((item) => {
      unitMap[item.id] = item.unit || "unit";
    });
    return unitMap;
  }, [ingredients]);

  const selectedNewRecipeIngredient = useMemo(
    () => ingredients.find((item) => item.id === newRecipeIngredient) ?? null,
    [ingredients, newRecipeIngredient]
  );

  const recipeUnitOptions = useMemo(() => {
    const baseUnit = selectedNewRecipeIngredient?.unit || "";
    if (!baseUnit) return [];
    return getCompatibleUnits(baseUnit);
  }, [selectedNewRecipeIngredient]);

  useEffect(() => {
    if (!newRecipeIngredient) return;
    const isValidIngredient = ingredients.some(
      (item) =>
        item.id === newRecipeIngredient &&
        item.category_id === newRecipeCategoryId
    );
    if (!isValidIngredient) {
      setNewRecipeIngredient("");
      setNewRecipeInputUnit("");
    }
  }, [ingredients, newRecipeCategoryId, newRecipeIngredient]);

  useEffect(() => {
    if (!addonIngredientId || addonCategoryId) return;
    const matched = ingredients.find((item) => item.id === addonIngredientId);
    if (matched?.category_id) {
      setAddonCategoryId(matched.category_id);
    }
  }, [ingredients, addonIngredientId, addonCategoryId]);

  useEffect(() => {
    if (!addonIngredientId) return;
    const isValidIngredient = ingredients.some(
      (item) => item.id === addonIngredientId && item.category_id === addonCategoryId
    );
    if (!isValidIngredient) {
      setAddonIngredientId("");
      setAddonForm((prev) => ({
        ...prev,
        ingredientQuantity: "",
        ingredientInputUnit: "",
      }));
    }
  }, [ingredients, addonCategoryId, addonIngredientId]);

  useEffect(() => {
    if (!selectedAddonIngredient) {
      setAddonForm((prev) => ({ ...prev, ingredientInputUnit: "" }));
      return;
    }
    setAddonForm((prev) => ({
      ...prev,
      ingredientInputUnit: prev.ingredientInputUnit || selectedAddonIngredient.unit,
    }));
  }, [selectedAddonIngredient?.id]);

  useEffect(() => {
    if (!selectedNewRecipeIngredient) {
      setNewRecipeInputUnit("");
      return;
    }
    setNewRecipeInputUnit(selectedNewRecipeIngredient.unit);
  }, [selectedNewRecipeIngredient?.id]);

  const setEditMode = (product: Product | null) => {
    setEditProduct(product);

    if (!product) {
      setProductForm({ ...initialProductForm, categoryId: categories[1]?.id ?? "" });
      return;
    }

    const categoryMatch =
      categories.find((c) => c.id === product.category_id) ||
      categories.find((c) => c.name === product.category_name);

    setProductForm({
      name: product.name,
      categoryId: categoryMatch?.id ?? "",
      price: String(product.price),
      gstPercent: String(product.gst_percent),
      image: null,
      isActive: product.is_active,
    });
  };

  const openAddProductModal = () => {
    setEditMode(null);
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditMode(product);
    setShowProductModal(true);
  };

  const openAddAddonModal = () => {
    setEditAddon(null);
    setAddonForm(initialAddonForm);
    setAddonCategoryId("");
    setAddonIngredientId("");
    if (!ingredients.length) {
      void fetchIngredients();
    }
    setShowAddonModal(true);
  };

  const openEditAddonModal = (addon: Addon) => {
    setEditAddon(addon);
    if (!ingredients.length) {
      void fetchIngredients();
    }
    const matchedIngredient =
      ingredients.find((item) => item.id === String(addon.ingredient_id ?? "")) ??
      ingredients.find(
        (item) => item.name.trim().toLowerCase() === addon.name.trim().toLowerCase(),
      );
    setAddonCategoryId(
      matchedIngredient?.category_id ||
        String(addon.ingredient_category_id ?? "")
    );
    setAddonIngredientId(
      matchedIngredient?.id || String(addon.ingredient_id ?? "")
    );
    setAddonForm({
      name: addon.name,
      price: String(addon.price),
      image: null,
      ingredientQuantity:
        addon.ingredient_quantity && addon.ingredient_quantity > 0
          ? String(addon.ingredient_quantity)
          : "",
      ingredientInputUnit:
        matchedIngredient?.unit || String(addon.ingredient_unit ?? ""),
    });
    setShowAddonModal(true);
  };

  const openRecipeModal = async (product: Product) => {
    setSelectedRecipeProduct(product);
    setNewRecipeCategoryId("");
    setNewRecipeIngredient("");
    setNewRecipeQuantity("");
    setNewRecipeInputUnit("");
    setShowRecipeModal(true);
    if (!ingredients.length) {
      await fetchIngredients();
    }
    await fetchProductRecipes(product.id);
  };

  const handleSelectCategory = async (categoryName: string) => {
    setActiveCategory(categoryName);
    if (categoryName === COMBO_CATEGORY_NAME) {
      await fetchCombos();
    }
  };

  const openAddComboModal = () => {
    setEditCombo(null);
    setComboForm(initialComboForm);
    setShowComboModal(true);
  };

  const openEditComboModal = (combo: Combo) => {
    setEditCombo(combo);
    setComboForm({
      name: combo.name,
      price: String(combo.price),
      gstPercent: String(combo.gst_percent ?? 0),
      isActive: combo.is_active,
      image: null,
      imageUrl: combo.image_url ?? "",
      items:
        combo.items.length > 0
          ? combo.items.map((item) => ({
              productId: item.product,
              quantity: String(item.quantity),
            }))
          : [{ productId: "", quantity: "1" }],
    });
    setShowComboModal(true);
  };

  const closeComboModal = () => {
    setShowComboModal(false);
    setEditCombo(null);
    setComboForm(initialComboForm);
  };

  const addComboFormItem = () => {
    setComboForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: "1" }],
    }));
  };

  const removeComboFormItem = (idx: number) => {
    setComboForm((prev) => {
      const next = prev.items.filter((_, i) => i !== idx);
      return {
        ...prev,
        items: next.length > 0 ? next : [{ productId: "", quantity: "1" }],
      };
    });
  };

  const updateComboFormItem = (
    idx: number,
    key: keyof ComboFormItem,
    value: string
  ) => {
    setComboForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [key]: value } : item
      ),
    }));
  };

  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setSelectedRecipeProduct(null);
    setRecipes([]);
    setRecipeMode("view");
    setNewRecipeCategoryId("");
    setNewRecipeIngredient("");
    setNewRecipeQuantity("");
    setNewRecipeInputUnit("");
    setShowRecipeSubmitConfirm(false);
  };

  const submitRecipeList = async () => {
    if (!selectedRecipeProduct) return;
    await fetchProductRecipes(selectedRecipeProduct.id);
    toast.success("Recipe submitted successfully.");
    closeRecipeModal();
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditProduct(null);
    setProductForm(initialProductForm);
  };

  const closeAddonModal = () => {
    setShowAddonModal(false);
    setEditAddon(null);
    setAddonCategoryId("");
    setAddonIngredientId("");
    setAddonForm(initialAddonForm);
  };

  const openAddCategoryModal = () => {
    setEditCategory(null);
    setCategoryForm(initialCategoryForm);
    setShowCategoryModal(true);
  };

  const closeAddCategoryModal = () => {
    setEditCategory(null);
    setShowCategoryModal(false);
    setCategoryForm(initialCategoryForm);
  };

  const openEditCategoryModal = (category: Category) => {
    if (category.id === "all") return;
    setEditCategory(category);
    setCategoryForm({ name: category.name, image: null });
    setShowCategoryModal(true);
  };

  const openDeleteCategoryModal = (category: Category) => {
    if (category.id === "all") return;
    setEditCategory(category);
    setShowDeleteCategoryModal(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price || !productForm.categoryId) {
      toast.error("Name, category, and price are required.");
      return;
    }

    setIsSavingProduct(true);

    const formData = new FormData();
    formData.append("name", productForm.name.trim());
    formData.append("price", productForm.price);
    formData.append("gst_percent", productForm.gstPercent || "0");
    formData.append("is_active", String(productForm.isActive));

    if (productForm.categoryId !== "all") {
      formData.append("category", productForm.categoryId);
      if (selectedCategoryObj?.name) {
        formData.append("category_name", selectedCategoryObj.name);
      }
    }

    if (productForm.image) {
      formData.append("image", productForm.image);
    }

    try {
      const url = editProduct
        ? `${API_BASE}/api/products/products/${editProduct.id}/`
        : `${API_BASE}/api/products/products/`;

      const res = await fetch(url, {
        method: editProduct ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        toast.error("Could not save product. Please verify backend fields.");
        return;
      }

      await fetchProducts();
      toast.success(editProduct ? "Product updated." : "Product created.");
      closeProductModal();
    } catch (err) {
      console.error("Save product error:", err);
      toast.error("Could not save product.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const saveAddon = async () => {
    if (!addonCategoryId || !addonIngredientId) {
      toast.error("Ingredient category and ingredient are required.");
      return;
    }

    if (!addonForm.name.trim() || !addonForm.price || !addonForm.ingredientQuantity) {
      toast.error("Addon name, price, and ingredient quantity are required.");
      return;
    }

    const selectedIngredient = ingredients.find((item) => item.id === addonIngredientId);
    if (!selectedIngredient) {
      toast.error("Select a valid ingredient.");
      return;
    }

    const inputQty = Number(addonForm.ingredientQuantity);
    if (!Number.isFinite(inputQty) || inputQty <= 0) {
      toast.error("Enter a valid ingredient quantity.");
      return;
    }

    const baseUnit = selectedIngredient.unit || "unit";
    const fromUnit = addonForm.ingredientInputUnit || baseUnit;
    const normalizedQty = convertToBaseUnit(inputQty, fromUnit, baseUnit);
    const quantityForApi = String(Number(normalizedQty.toFixed(6)));

    setIsSavingAddon(true);
    const formData = new FormData();
    formData.append("name", addonForm.name.trim());
    formData.append("price", addonForm.price);
    formData.append("ingredient_id", addonIngredientId);
    formData.append("ingredient_quantity", quantityForApi);
    if (addonForm.image) {
      formData.append("image", addonForm.image);
    }

    try {
      const url = editAddon
        ? `${API_BASE}/api/products/addons/${editAddon.id}/`
        : `${API_BASE}/api/products/addons/`;

      const res = await fetch(url, {
        method: editAddon ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        toast.error(editAddon ? "Could not update addon." : "Could not create addon.");
        return;
      }

      await fetchAddons();
      toast.success(editAddon ? "Addon updated." : "Addon created.");
      closeAddonModal();
    } catch (err) {
      console.error("Save addon error:", err);
      toast.error(editAddon ? "Could not update addon." : "Could not create addon.");
    } finally {
      setIsSavingAddon(false);
    }
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setIsSavingCategory(true);

    const formData = new FormData();
    formData.append("name", categoryForm.name.trim());
    if (categoryForm.image) {
      formData.append("image", categoryForm.image);
    }

    try {
      const previousName = editCategory?.name ?? "";
      const url = editCategory
        ? `${API_BASE}/api/products/categories/${editCategory.id}/`
        : `${API_BASE}/api/products/categories/`;

      const res = await fetch(url, {
        method: editCategory ? "PUT" : "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        toast.error(
          editCategory
            ? "Could not update category. Please verify backend category fields."
            : "Could not create category. Please verify backend category fields."
        );
        return;
      }

      await fetchCategories();
      if (!editCategory || activeCategory === previousName) {
        setActiveCategory(categoryForm.name.trim());
      }
      toast.success(editCategory ? "Category updated." : "Category created.");
      closeAddCategoryModal();
    } catch (err) {
      console.error("Save category error:", err);
      toast.error(editCategory ? "Could not update category." : "Could not create category.");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const deleteCategory = async () => {
    if (!editCategory || editCategory.id === "all") return;

    try {
      const res = await fetch(`${API_BASE}/api/products/categories/${editCategory.id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        try {
          const body = await res.json();
          toast.error(body.detail || "Failed to delete category.");
        } catch {
          toast.error("Failed to delete category.");
        }
        return;
      }

      await fetchCategories();
      if (activeCategory === editCategory.name) {
        setActiveCategory("All");
      }
      toast.success("Category deleted.");
      setShowDeleteCategoryModal(false);
      setEditCategory(null);
    } catch (err) {
      console.error("Delete category failed:", err);
      toast.error("Failed to delete category.");
    }
  };

  const deleteProduct = async () => {
    if (!editProduct) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/products/${editProduct.id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        toast.error("Failed to delete product.");
        return;
      }

      await fetchProducts();
      toast.success("Product deleted.");
      setEditProduct(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete product.");
    }
  };

  const deleteAddon = async () => {
    if (!editAddon) return;

    try {
      const res = await fetch(`${API_BASE}/api/products/addons/${editAddon.id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        toast.error("Failed to delete addon.");
        return;
      }

      await fetchAddons();
      toast.success("Addon deleted.");
      setShowDeleteAddonModal(false);
      setEditAddon(null);
    } catch (err) {
      console.error("Delete addon failed:", err);
      toast.error("Failed to delete addon.");
    }
  };

  const toggleAvailability = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    try {
      await fetch(`${API_BASE}/api/products/products/${id}/`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !product.is_active,
        }),
      });

      await fetchProducts();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const updateRecipeQuantity = async (recipe: Recipe, quantity: string) => {
    if (!selectedRecipeProduct || !quantity) return;
    setRecipeSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/recipes/${recipe.id}/`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: selectedRecipeProduct.id,
          ingredient: recipe.ingredient,
          quantity,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to update recipe quantity.");
        return;
      }
      await fetchProductRecipes(selectedRecipeProduct.id);
      toast.success("Recipe updated.");
    } catch (err) {
      console.error("Update recipe failed:", err);
      toast.error("Failed to update recipe quantity.");
    } finally {
      setRecipeSaving(false);
    }
  };

  const deleteRecipeItem = async (recipeId: number) => {
    if (!selectedRecipeProduct) return;
    setRecipeSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/recipes/${recipeId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        toast.error("Failed to delete recipe item.");
        return;
      }
      await fetchProductRecipes(selectedRecipeProduct.id);
      toast.success("Recipe item deleted.");
    } catch (err) {
      console.error("Delete recipe item failed:", err);
      toast.error("Failed to delete recipe item.");
    } finally {
      setRecipeSaving(false);
    }
  };

  const addRecipeItem = async () => {
    if (!selectedRecipeProduct || !newRecipeIngredient || !newRecipeQuantity) {
      toast.error("Select ingredient and quantity.");
      return;
    }

    const inputQty = Number(newRecipeQuantity);
    if (!Number.isFinite(inputQty) || inputQty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }

    const baseUnit = ingredientUnitById[newRecipeIngredient] || "unit";
    const fromUnit = newRecipeInputUnit || baseUnit;
    const normalizedQty = convertToBaseUnit(inputQty, fromUnit, baseUnit);
    const quantityForApi = String(Number(normalizedQty.toFixed(6)));

    setRecipeSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/recipes/`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: selectedRecipeProduct.id,
          ingredient: newRecipeIngredient,
          quantity: quantityForApi,
        }),
      });
      if (!res.ok) {
        toast.error("Failed to add recipe item.");
        return;
      }
      setNewRecipeCategoryId("");
      setNewRecipeIngredient("");
      setNewRecipeQuantity("");
      await fetchProductRecipes(selectedRecipeProduct.id);
      toast.success("Recipe item added.");
    } catch (err) {
      console.error("Add recipe item failed:", err);
      toast.error("Failed to add recipe item.");
    } finally {
      setRecipeSaving(false);
    }
  };

const saveCombo = async () => {
  if (!comboForm.name.trim() || !comboForm.price) {
    toast.error("Combo name and price are required.");
    return;
  }

  const validItems = comboForm.items
    .filter((item) => item.productId && Number(item.quantity) > 0)
    .map((item) => ({
      product: item.productId,
      quantity: Number(item.quantity),
    }));

  if (!validItems.length) {
    toast.error("Add at least one valid combo item.");
    return;
  }

  // optional but recommended: block duplicate product rows
  const productIds = validItems.map((i) => i.product);
  if (new Set(productIds).size !== productIds.length) {
    toast.error("Same product cannot be added twice in one combo.");
    return;
  }

  setIsSavingCombo(true);
  try {
    const payload = {
      name: comboForm.name.trim(),
      price: comboForm.price,
      gst_percent: comboForm.gstPercent || "0",
      is_active: comboForm.isActive,
      items: validItems,
    };

    const url = editCombo
      ? `${API_BASE}/api/products/combos/${editCombo.id}/`
      : `${API_BASE}/api/products/combos/`;

    const res = await fetch(url, {
      method: editCombo ? "PUT" : "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        data?.detail ||
        data?.error ||
        data?.name?.[0] ||
        data?.price?.[0] ||
        data?.items?.[0]?.product?.[0] ||
        data?.items?.[0]?.quantity?.[0] ||
        JSON.stringify(data) ||
        `Failed (${res.status})`;

      toast.error(msg);
      return;
    }

    const comboId = String(data?.id ?? editCombo?.id ?? "");
    if (comboForm.image && comboId) {
      const imageForm = new FormData();
      imageForm.append("image", comboForm.image);
      await fetch(`${API_BASE}/api/products/combos/${comboId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: imageForm,
      });
    }

    await fetchCombos();
    toast.success(editCombo ? "Combo updated." : "Combo created.");
    closeComboModal();
  } catch (err) {
    console.error("Save combo error:", err);
    toast.error("Could not save combo.");
  } finally {
    setIsSavingCombo(false);
  }
};


  const deleteCombo = async () => {
    if (!editCombo) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/combos/${editCombo.id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        toast.error("Failed to delete combo.");
        return;
      }
      await fetchCombos();
      setShowDeleteComboModal(false);
      toast.success("Combo deleted.");
      setEditCombo(null);
    } catch (err) {
      console.error("Delete combo failed:", err);
      toast.error("Failed to delete combo.");
    }
  };

  const toggleComboAvailability = async (comboId: string) => {
    const combo = combos.find((c) => c.id === comboId);
    if (!combo) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/combos/${comboId}/`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !combo.is_active }),
      });
      if (!res.ok) return;
      await fetchCombos();
    } catch (err) {
      console.error("Toggle combo failed:", err);
    }
  };

  return (
    <div className="w-full">
      <style>{`
        .category-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .category-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <ProductsHeader
        catalogMode={catalogMode}
        activeCategory={activeCategory}
        onCatalogProducts={() => setCatalogMode(CATALOG_PRODUCTS)}
        onCatalogAddons={() => {
          setCatalogMode(CATALOG_ADDONS);
          void fetchAddons();
        }}
        onAddCategory={openAddCategoryModal}
        onAddAddon={openAddAddonModal}
        onAddProductOrCombo={activeCategory === COMBO_CATEGORY_NAME ? openAddComboModal : openAddProductModal}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {catalogMode === CATALOG_PRODUCTS && (
          <CategorySidebar
            categoriesLoading={categoriesLoading}
            categories={categories}
            products={products}
            combosCount={combos.length}
            activeCategory={activeCategory}
            onSelectCategory={(categoryName) => {
              void handleSelectCategory(categoryName);
            }}
            onEditCategory={openEditCategoryModal}
            onDeleteCategory={openDeleteCategoryModal}
          />
        )}

        <CatalogGrid
          catalogMode={catalogMode}
          activeCategory={activeCategory}
          search={search}
          onSearchChange={setSearch}
          addonsLoading={addonsLoading}
          productsLoading={productsLoading}
          comboLoading={comboLoading}
          filteredAddons={filteredAddons}
          filteredProducts={filteredProducts}
          filteredCombos={filteredCombos}
          onEditAddon={openEditAddonModal}
          onDeleteAddon={(addon) => {
            setEditAddon(addon);
            setShowDeleteAddonModal(true);
          }}
          onToggleProductAvailability={(id) => {
            void toggleAvailability(id);
          }}
          onOpenRecipe={(product) => {
            void openRecipeModal(product);
          }}
          onEditProduct={openEditProductModal}
          onDeleteProduct={(product) => {
            setEditProduct(product);
            setShowDeleteModal(true);
          }}
          onToggleComboAvailability={(id) => {
            void toggleComboAvailability(id);
          }}
          onEditCombo={openEditComboModal}
          onDeleteCombo={(combo) => {
            setEditCombo(combo);
            setShowDeleteComboModal(true);
          }}
        />
      </div>

      <ProductFormModal
        open={showProductModal}
        editProduct={editProduct}
        categories={categories}
        productForm={productForm}
        setProductForm={setProductForm}
        isSavingProduct={isSavingProduct}
        onClose={closeProductModal}
        onSave={() => {
          void saveProduct();
        }}
      />

      <CategoryFormModal
        open={showCategoryModal}
        editCategory={editCategory}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        isSavingCategory={isSavingCategory}
        onClose={closeAddCategoryModal}
        onSave={() => {
          void saveCategory();
        }}
      />

      <AddonFormModal
        open={showAddonModal}
        editAddon={editAddon}
        addonForm={addonForm}
        setAddonForm={setAddonForm}
        addonCategoryId={addonCategoryId}
        setAddonCategoryId={setAddonCategoryId}
        ingredientCategories={recipeIngredientCategories}
        addonIngredientId={addonIngredientId}
        setAddonIngredientId={setAddonIngredientId}
        ingredients={filteredAddonIngredients}
        selectedAddonIngredient={selectedAddonIngredient}
        addonUnitOptions={addonUnitOptions}
        isSavingAddon={isSavingAddon}
        onClose={closeAddonModal}
        onSave={() => {
          void saveAddon();
        }}
      />

      <ConfirmDeleteModal
        open={showDeleteCategoryModal}
        title="Delete Category"
        message={`Delete category "${editCategory?.name ?? ""}"?`}
        buttonLabel="Delete Category"
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setEditCategory(null);
        }}
        onConfirm={() => {
          void deleteCategory();
        }}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Delete Product"
        message="Delete this product?"
        buttonLabel="Delete"
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          void deleteProduct();
        }}
      />

      <ConfirmDeleteModal
        open={showDeleteAddonModal}
        title="Delete Addon"
        message={`Delete addon "${editAddon?.name ?? ""}"?`}
        buttonLabel="Delete Addon"
        onClose={() => {
          setShowDeleteAddonModal(false);
          setEditAddon(null);
        }}
        onConfirm={() => {
          void deleteAddon();
        }}
      />

      <ComboFormModal
        open={showComboModal}
        editCombo={editCombo}
        comboForm={comboForm}
        setComboForm={setComboForm}
        products={products}
        isSavingCombo={isSavingCombo}
        onClose={closeComboModal}
        onSave={() => {
          void saveCombo();
        }}
        onAddItem={addComboFormItem}
        onRemoveItem={removeComboFormItem}
        onUpdateItem={updateComboFormItem}
      />

      <ConfirmDeleteModal
        open={showDeleteComboModal}
        title="Delete Combo"
        message={`Delete combo "${editCombo?.name ?? ""}"?`}
        buttonLabel="Delete Combo"
        onClose={() => {
          setShowDeleteComboModal(false);
          setEditCombo(null);
        }}
        onConfirm={() => {
          void deleteCombo();
        }}
      />

      <RecipeFormModal
        open={showRecipeModal}
        selectedRecipeProductName={selectedRecipeProduct?.name ?? null}
        onClose={closeRecipeModal}
        recipeMode={recipeMode}
        onRecipeModeChange={setRecipeMode}
        recipeLoading={recipeLoading}
        recipes={recipes}
        ingredientUnitById={ingredientUnitById}
        recipeSaving={recipeSaving}
        onUpdateRecipeQuantity={(recipe, quantity) => {
          void updateRecipeQuantity(recipe, quantity);
        }}
        onDeleteRecipeItem={(recipeId) => {
          void deleteRecipeItem(recipeId);
        }}
        newRecipeCategoryId={newRecipeCategoryId}
        onNewRecipeCategoryChange={setNewRecipeCategoryId}
        ingredientCategories={recipeIngredientCategories}
        newRecipeIngredient={newRecipeIngredient}
        onNewRecipeIngredientChange={setNewRecipeIngredient}
        ingredients={filteredRecipeIngredients}
        newRecipeQuantity={newRecipeQuantity}
        onNewRecipeQuantityChange={setNewRecipeQuantity}
        newRecipeInputUnit={newRecipeInputUnit}
        onNewRecipeInputUnitChange={setNewRecipeInputUnit}
        selectedNewRecipeIngredient={selectedNewRecipeIngredient}
        recipeUnitOptions={recipeUnitOptions}
        onAddRecipeItem={() => {
          void addRecipeItem();
        }}
        showRecipeSubmitConfirm={showRecipeSubmitConfirm}
        onShowRecipeSubmitConfirmChange={setShowRecipeSubmitConfirm}
        onSubmitRecipeList={() => {
          void submitRecipeList();
        }}
      />
    </div>
  );
};

export default AdminProducts;



