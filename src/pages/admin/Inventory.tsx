import { useEffect, useMemo, useState } from "react";

import CategoryManagerModal from "./components/inventory/CategoryManagerModal";
import DailyAssignmentSection from "./components/inventory/DailyAssignmentSection";
import DeleteModal from "./components/inventory/DeleteModal";
import IngredientModal from "./components/inventory/IngredientModal";
import InventoryCategoryViewSection from "./components/inventory/InventoryCategoryViewSection";
import InventoryHeaderSection from "./components/inventory/InventoryHeaderSection";
import InventorySummaryCardsSection from "./components/inventory/InventorySummaryCardsSection";
import InventoryTableSection from "./components/inventory/InventoryTableSection";
import { emptyForm, INVENTORY_UNITS } from "./components/inventory/constants";
import type {
  DailyStockRow,
  DailySummaryResponse,
  HealthFilter,
  Ingredient,
  IngredientCategory,
  IngredientFormState,
  InventorySortBy,
} from "./components/inventory/types";
import { asArray, asNumber, extractApiMessage, todayIso } from "./components/inventory/utils";

const API_BASE = `${import.meta.env.VITE_API_BASE}/api/inventory`;
const PAGE_SIZE = 5;

const Inventory = () => {
  const token = localStorage.getItem("access");
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [items, setItems] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<IngredientCategory[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [sortBy, setSortBy] = useState<InventorySortBy>("name");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);

  const [dailySummary, setDailySummary] = useState<DailySummaryResponse | null>(null);
  const [assignmentQuantities, setAssignmentQuantities] = useState<Record<string, string>>({});
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentFieldErrors, setAssignmentFieldErrors] = useState<Record<string, string>>({});

  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [addForm, setAddForm] = useState<IngredientFormState>(emptyForm);
  const [editForm, setEditForm] = useState<IngredientFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const loadItems = async () => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const res = await fetch(`${API_BASE}/ingredients/`, { headers: authHeaders });
      const payload = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(extractApiMessage(payload, "Unable to load ingredients."));
      }
      const rows = asArray<Ingredient>(payload).map((row) => ({
        ...row,
        category_id: row.category_id ? String(row.category_id) : null,
        category_name: String(row.category_name ?? "OTHERS"),
        unit_price: String(row.unit_price ?? "0"),
        current_stock: String(row.current_stock ?? "0"),
        min_stock: String(row.min_stock ?? "0"),
      }));
      setItems(rows);
    } catch (error) {
      setItems([]);
      setItemsError(error instanceof Error ? error.message : "Unable to load ingredients.");
    } finally {
      setItemsLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/categories/`, { headers: authHeaders });
      const payload = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(extractApiMessage(payload, "Unable to load categories."));
      }
      const rows = asArray<IngredientCategory>(payload)
        .map((row) => ({
          id: String(row.id),
          name: String(row.name ?? "OTHERS"),
          is_active: Boolean(row.is_active),
          ingredients_count: Number(row.ingredients_count ?? 0),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCategories(rows);
    } catch {
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadDailySummary = async (dateToLoad: string) => {
    setAssignmentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/daily-stock/summary/?date=${encodeURIComponent(dateToLoad)}`, {
        headers: authHeaders,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(extractApiMessage(payload, "Failed to load daily stock summary."));

      const parsed = payload as DailySummaryResponse;
      setDailySummary(parsed);
      const nextQuantities: Record<string, string> = {};
      (parsed.rows || []).forEach((row) => {
        nextQuantities[String(row.ingredient_id)] = String(row.assigned_today ?? "0");
      });
      setAssignmentQuantities(nextQuantities);
      setAssignmentError(null);
      setAssignmentFieldErrors({});
    } catch (error) {
      setDailySummary(null);
      setAssignmentError(error instanceof Error ? error.message : "Unable to load daily stock summary.");
    } finally {
      setAssignmentLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
    void loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadDailySummary(selectedDate);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    setEditForm({
      name: selected.name,
      category_id: selected.category_id ?? "",
      unit: selected.unit || INVENTORY_UNITS[0],
      unit_price: String(selected.unit_price ?? ""),
      current_stock: String(selected.current_stock ?? ""),
      min_stock: String(selected.min_stock ?? ""),
      is_active: Boolean(selected.is_active),
    });
  }, [selected]);

  useEffect(() => {
    if (!categories.length) return;
    setAddForm((prev) => {
      if (prev.category_id) return prev;
      return { ...prev, category_id: categories[0].id };
    });
  }, [categories]);

  useEffect(() => {
    if (selectedCategoryId === "all") return;
    const exists = categories.some((category) => category.id === selectedCategoryId);
    if (!exists) {
      setSelectedCategoryId("all");
    }
  }, [categories, selectedCategoryId]);

  const dailyMap = useMemo(() => {
    const map: Record<string, DailyStockRow> = {};
    (dailySummary?.rows || []).forEach((row) => {
      map[String(row.ingredient_id)] = row;
    });
    return map;
  }, [dailySummary]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      const key = String(item.category_id ?? "");
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    const searchKey = search.trim().toLowerCase();
    const list = items.filter((item) => {
      if (selectedCategoryId !== "all" && String(item.category_id ?? "") !== selectedCategoryId) return false;
      if (searchKey && !item.name.toLowerCase().includes(searchKey)) return false;
      const current = asNumber(item.current_stock);
      const min = asNumber(item.min_stock);
      if (healthFilter === "out") return current <= 0;
      if (healthFilter === "low") return current > 0 && current <= min;
      if (healthFilter === "healthy") return current > min;
      return true;
    });

    if (sortBy === "stock") {
      return [...list].sort((a, b) => asNumber(b.current_stock) - asNumber(a.current_stock));
    }
    if (sortBy === "valuation") {
      return [...list].sort(
        (a, b) =>
          asNumber(b.current_stock) * asNumber(b.unit_price) - asNumber(a.current_stock) * asNumber(a.unit_price),
      );
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search, selectedCategoryId, healthFilter, sortBy]);

  const assignmentFiltered = useMemo(() => {
    const searchKey = assignmentSearch.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedCategoryId !== "all" && String(item.category_id ?? "") !== selectedCategoryId) return false;
      if (searchKey && !item.name.toLowerCase().includes(searchKey)) return false;
      return true;
    });
  }, [items, assignmentSearch, selectedCategoryId]);

  useEffect(() => {
    setAssignmentPage(1);
  }, [assignmentSearch, selectedCategoryId, items.length]);

  useEffect(() => {
    setInventoryPage(1);
  }, [search, selectedCategoryId, healthFilter, sortBy, items.length]);

  const assignmentTotalPages = useMemo(
    () => Math.max(1, Math.ceil(assignmentFiltered.length / PAGE_SIZE)),
    [assignmentFiltered.length],
  );
  const inventoryTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length],
  );

  useEffect(() => {
    if (assignmentPage > assignmentTotalPages) {
      setAssignmentPage(assignmentTotalPages);
    }
  }, [assignmentPage, assignmentTotalPages]);

  useEffect(() => {
    if (inventoryPage > inventoryTotalPages) {
      setInventoryPage(inventoryTotalPages);
    }
  }, [inventoryPage, inventoryTotalPages]);

  const assignmentPaginated = useMemo(() => {
    const startIdx = (assignmentPage - 1) * PAGE_SIZE;
    return assignmentFiltered.slice(startIdx, startIdx + PAGE_SIZE);
  }, [assignmentFiltered, assignmentPage]);

  const filteredPaginated = useMemo(() => {
    const startIdx = (inventoryPage - 1) * PAGE_SIZE;
    return filtered.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filtered, inventoryPage]);

  const assignmentVisibleTotals = useMemo(() => {
    let assigned = 0;
    let used = 0;
    let remaining = 0;
    let valuation = 0;
    assignmentFiltered.forEach((item) => {
      const row = dailyMap[item.id];
      assigned += asNumber(row?.assigned_today);
      used += asNumber(row?.used_today);
      remaining += asNumber(row?.remaining_today);
      valuation += asNumber(item.current_stock) * asNumber(item.unit_price);
    });
    return {
      assigned: assigned.toFixed(3),
      used: used.toFixed(3),
      remaining: remaining.toFixed(3),
      valuation: valuation.toFixed(2),
    };
  }, [assignmentFiltered, dailyMap]);

  const lowCount = useMemo(
    () => items.filter((item) => asNumber(item.current_stock) > 0 && asNumber(item.current_stock) <= asNumber(item.min_stock)).length,
    [items],
  );
  const outCount = useMemo(() => items.filter((item) => asNumber(item.current_stock) <= 0).length, [items]);
  const totalValuation = useMemo(
    () => items.reduce((sum, item) => sum + asNumber(item.current_stock) * asNumber(item.unit_price), 0),
    [items],
  );

  const validateForm = (form: IngredientFormState) => {
    if (!form.name.trim()) return "Ingredient name is required.";
    if (!form.category_id.trim()) return "Category is required.";
    if (!form.unit.trim()) return "Unit is required.";
    if (!Number.isFinite(Number(form.unit_price)) || Number(form.unit_price) <= 0) {
      return "Unit price must be greater than zero.";
    }
    if (form.current_stock.trim() !== "" && (!Number.isFinite(Number(form.current_stock)) || Number(form.current_stock) < 0)) {
      return "Current stock cannot be negative.";
    }
    if (form.min_stock.trim() !== "" && (!Number.isFinite(Number(form.min_stock)) || Number(form.min_stock) < 0)) {
      return "Minimum stock cannot be negative.";
    }
    return null;
  };

  const resetAddForm = () => {
    setAddForm({
      ...emptyForm,
      category_id: categories[0]?.id ?? "",
    });
  };

  const handleAdd = async () => {
    const err = validateForm(addForm);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);

    const payload = {
      ...addForm,
      current_stock: addForm.current_stock.trim() === "" ? "0" : addForm.current_stock,
      min_stock: addForm.min_stock.trim() === "" ? "0" : addForm.min_stock,
    };

    const res = await fetch(`${API_BASE}/ingredients/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    const responsePayload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFormError(extractApiMessage(responsePayload, "Failed to add ingredient."));
      return;
    }

    setShowAdd(false);
    resetAddForm();
    await loadItems();
    await loadDailySummary(selectedDate);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const err = validateForm(editForm);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);

    const payload = {
      ...editForm,
      current_stock: editForm.current_stock.trim() === "" ? "0" : editForm.current_stock,
      min_stock: editForm.min_stock.trim() === "" ? "0" : editForm.min_stock,
    };

    const res = await fetch(`${API_BASE}/ingredients/${selected.id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    const responsePayload = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFormError(extractApiMessage(responsePayload, "Failed to update ingredient."));
      return;
    }

    setShowEdit(false);
    setSelected(null);
    await loadItems();
    await loadDailySummary(selectedDate);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleteError(null);
    try {
      const res = await fetch(`${API_BASE}/ingredients/${selected.id}/`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(
          extractApiMessage(
            payload,
            "Unable to delete ingredient. This ingredient may be in use by recipes or transactions.",
          ),
        );
        return;
      }
      setShowDelete(false);
      setSelected(null);
      await loadItems();
      await loadDailySummary(selectedDate);
    } catch {
      setDeleteError("Unable to delete ingredient right now. Please try again.");
    }
  };

  const handleCreateCategory = async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return "Category name is required.";
    const res = await fetch(`${API_BASE}/categories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ name: trimmed, is_active: true }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return extractApiMessage(payload, "Failed to create category.");
    await loadCategories();
    await loadItems();
    return null;
  };

  const handleRenameCategory = async (id: string, name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return "Category name is required.";
    const res = await fetch(`${API_BASE}/categories/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ name: trimmed }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return extractApiMessage(payload, "Failed to update category.");
    await loadCategories();
    await loadItems();
    return null;
  };

  const handleDeleteCategory = async (id: string): Promise<string | null> => {
    const res = await fetch(`${API_BASE}/categories/${id}/`, {
      method: "DELETE",
      headers: authHeaders,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) return extractApiMessage(payload, "Failed to delete category.");
    await loadCategories();
    await loadItems();
    if (selectedCategoryId === id) setSelectedCategoryId("all");
    return null;
  };

  const handleSaveDailyAssignment = async () => {
    const nextFieldErrors: Record<string, string> = {};
    assignmentFiltered.forEach((ingredient) => {
      const raw = (assignmentQuantities[ingredient.id] ?? dailyMap[ingredient.id]?.assigned_today ?? "0").trim();
      const qty = Number(raw || "0");
      const totalStock = asNumber(dailyMap[ingredient.id]?.total_stock ?? ingredient.current_stock);
      const usedToday = asNumber(dailyMap[ingredient.id]?.used_today ?? "0");

      if (!Number.isFinite(qty) || qty < 0) {
        nextFieldErrors[ingredient.id] = `Enter a valid non-negative quantity for ${ingredient.name}.`;
        return;
      }
      if (qty > totalStock) {
        nextFieldErrors[ingredient.id] = `${ingredient.name}: assign ${totalStock.toFixed(3)} ${ingredient.unit} or less.`;
        return;
      }
      if (qty < usedToday) {
        nextFieldErrors[ingredient.id] =
          `${ingredient.name}: assigned quantity cannot be below used quantity (${usedToday.toFixed(3)} ${ingredient.unit}).`;
      }
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setAssignmentFieldErrors(nextFieldErrors);
      setAssignmentError(Object.values(nextFieldErrors)[0]);
      setAssignmentMessage(null);
      return;
    }

    const payloadItems = assignmentFiltered.map((item) => ({
      ingredient: item.id,
      quantity: (assignmentQuantities[item.id] ?? dailyMap[item.id]?.assigned_today ?? "0").trim() || "0",
    }));

    setAssignmentSaving(true);
    setAssignmentError(null);
    setAssignmentMessage(null);
    setAssignmentFieldErrors({});
    try {
      const res = await fetch(`${API_BASE}/daily-stock/assign/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          date: selectedDate,
          items: payloadItems,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(extractApiMessage(payload, "Failed to save daily assignment."));
      }

      setAssignmentMessage(String((payload as { message?: string }).message ?? "Daily stock assignment saved."));
      await loadDailySummary(selectedDate);
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Unable to save daily assignment.");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleAssignmentQuantityChange = (ingredientId: string, value: string) => {
    setAssignmentQuantities((prev) => ({
      ...prev,
      [ingredientId]: value,
    }));
    setAssignmentFieldErrors((prev) => {
      if (!prev[ingredientId]) return prev;
      const { [ingredientId]: _discard, ...rest } = prev;
      return rest;
    });
  };

  const openAddModal = () => {
    resetAddForm();
    setFormError(null);
    setShowAdd(true);
  };

  return (
    <div className="relative -mt-4 space-y-6 animate-fade-in md:-mt-6">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />

      <InventoryHeaderSection
        filteredCount={filtered.length}
        search={search}
        selectedCategoryId={selectedCategoryId}
        healthFilter={healthFilter}
        sortBy={sortBy}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategoryId}
        onHealthFilterChange={setHealthFilter}
        onSortByChange={setSortBy}
        onAddIngredient={openAddModal}
        onManageCategories={() => {
          setCategoryError(null);
          setShowCategoryModal(true);
        }}
      />

      <InventoryCategoryViewSection
        categoriesLoading={categoriesLoading}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        itemsCount={items.length}
        categoryCounts={categoryCounts}
        onSelectCategory={setSelectedCategoryId}
      />

      <InventorySummaryCardsSection
        itemsCount={items.length}
        lowCount={lowCount}
        outCount={outCount}
        totalValuation={totalValuation}
      />

      <DailyAssignmentSection
        pageSize={PAGE_SIZE}
        selectedDate={selectedDate}
        assignmentSaving={assignmentSaving}
        assignmentLoading={assignmentLoading}
        assignmentFiltered={assignmentPaginated}
        assignmentTotalCount={assignmentFiltered.length}
        assignmentPage={assignmentPage}
        assignmentTotalPages={assignmentTotalPages}
        assignmentVisibleTotals={assignmentVisibleTotals}
        assignmentSearch={assignmentSearch}
        assignmentError={assignmentError}
        assignmentMessage={assignmentMessage}
        assignmentQuantities={assignmentQuantities}
        assignmentFieldErrors={assignmentFieldErrors}
        dailyMap={dailyMap}
        onSelectedDateChange={setSelectedDate}
        onSave={handleSaveDailyAssignment}
        onAssignmentSearchChange={setAssignmentSearch}
        onAssignmentPageChange={setAssignmentPage}
        onAssignmentQuantityChange={handleAssignmentQuantityChange}
      />

      <InventoryTableSection
        pageSize={PAGE_SIZE}
        itemsLoading={itemsLoading}
        filtered={filteredPaginated}
        totalCount={filtered.length}
        currentPage={inventoryPage}
        totalPages={inventoryTotalPages}
        dailyMap={dailyMap}
        itemsError={itemsError}
        onPageChange={setInventoryPage}
        onEdit={(ingredient) => {
          setSelected(ingredient);
          setFormError(null);
          setShowEdit(true);
        }}
        onDelete={(ingredient) => {
          setSelected(ingredient);
          setDeleteError(null);
          setShowDelete(true);
        }}
      />

      {showAdd && (
        <IngredientModal
          title="Add Ingredient"
          form={addForm}
          setForm={setAddForm}
          categories={categories}
          error={formError}
          onOpenCategoryManager={() => {
            setShowAdd(false);
            setShowCategoryModal(true);
          }}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {showEdit && selected && (
        <IngredientModal
          title={`Edit Ingredient - ${selected.name}`}
          form={editForm}
          setForm={setEditForm}
          categories={categories}
          error={formError}
          onOpenCategoryManager={() => {
            setShowEdit(false);
            setShowCategoryModal(true);
          }}
          onClose={() => setShowEdit(false)}
          onSave={handleUpdate}
        />
      )}

      {showDelete && selected && (
        <DeleteModal
          name={selected.name}
          error={deleteError}
          onClose={() => setShowDelete(false)}
          onDelete={handleDelete}
        />
      )}

      {showCategoryModal && (
        <CategoryManagerModal
          categories={categories}
          error={categoryError}
          loading={categoriesLoading}
          onClose={() => {
            setShowCategoryModal(false);
            setCategoryError(null);
          }}
          onCreate={async (name) => {
            const error = await handleCreateCategory(name);
            setCategoryError(error);
            return error;
          }}
          onRename={async (id, name) => {
            const error = await handleRenameCategory(id, name);
            setCategoryError(error);
            return error;
          }}
          onDelete={async (id) => {
            const error = await handleDeleteCategory(id);
            setCategoryError(error);
            return error;
          }}
        />
      )}
    </div>
  );
};

export default Inventory;
