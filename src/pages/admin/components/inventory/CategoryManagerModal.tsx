import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { TableRowSkeleton } from "./InventoryAtoms";
import type { IngredientCategory } from "./types";

interface CategoryManagerModalProps {
  categories: IngredientCategory[];
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<string | null>;
  onRename: (id: string, name: string) => Promise<string | null>;
  onDelete: (id: string) => Promise<string | null>;
}

const CategoryManagerModal = ({ categories, error, loading, onClose, onCreate, onRename, onDelete }: CategoryManagerModalProps) => {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError = localError ?? error;

  const handleCreate = async () => {
    setBusy(true);
    const nextError = await onCreate(newName);
    setBusy(false);
    if (nextError) {
      setLocalError(nextError);
      return;
    }
    setLocalError(null);
    setNewName("");
  };

  const handleRename = async () => {
    if (!editingId) return;
    setBusy(true);
    const nextError = await onRename(editingId, editingName);
    setBusy(false);
    if (nextError) {
      setLocalError(nextError);
      return;
    }
    setLocalError(null);
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (category: IngredientCategory) => {
    if (!window.confirm(`Delete category "${category.name}"? Ingredients will move to OTHERS.`)) {
      return;
    }
    setBusy(true);
    const nextError = await onDelete(category.id);
    setBusy(false);
    if (nextError) {
      setLocalError(nextError);
      return;
    }
    setLocalError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[660px] space-y-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-violet-950">Ingredient Categories</h2>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
            Close
          </button>
        </div>

        {activeError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{activeError}</p> : null}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (localError) setLocalError(null);
            }}
            placeholder="New category name"
            className="rounded-xl border border-violet-200 px-4 py-2 outline-none focus:border-violet-400"
          />
          <button
            onClick={handleCreate}
            disabled={busy || loading}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add Category
          </button>
        </div>

        <div className="max-h-[340px] overflow-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.12em] text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Ingredients</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }).map((_, idx) => <TableRowSkeleton key={`category-row-${idx}`} columns={3} />)
                : categories.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-slate-500">
                        No categories yet.
                      </td>
                    </tr>
                  )
                : categories.map((category) => {
                    const isEditing = editingId === category.id;
                    const isDefault = category.name.toUpperCase() === "OTHERS";
                    return (
                      <tr key={category.id}>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full rounded-lg border border-violet-200 px-2 py-1.5 outline-none focus:border-violet-400"
                            />
                          ) : (
                            <span className="font-semibold text-slate-800">{category.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{category.ingredients_count ?? 0}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={handleRename}
                                disabled={busy}
                                className="rounded-md bg-violet-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName("");
                                }}
                                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingId(category.id);
                                  setEditingName(category.name);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => void handleDelete(category)}
                                disabled={isDefault}
                                title={isDefault ? "Default category cannot be deleted." : "Delete category"}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
