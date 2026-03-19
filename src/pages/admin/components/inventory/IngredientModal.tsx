import type { Dispatch, SetStateAction } from "react";

import { UNIT_GROUPS } from "./constants";
import type { IngredientCategory, IngredientFormState } from "./types";

interface IngredientModalProps {
  title: string;
  form: IngredientFormState;
  setForm: Dispatch<SetStateAction<IngredientFormState>>;
  categories: IngredientCategory[];
  error: string | null;
  onOpenCategoryManager: () => void;
  onClose: () => void;
  onSave: () => void;
}

const IngredientModal = ({
  title,
  form,
  setForm,
  categories,
  error,
  onOpenCategoryManager,
  onClose,
  onSave,
}: IngredientModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="w-[560px] space-y-4 rounded-2xl border border-violet-200 bg-white p-5 shadow-2xl">
      <h2 className="text-lg font-semibold text-violet-950">{title}</h2>
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <input
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="Ingredient Name"
        className="w-full rounded-xl border border-violet-200 px-4 py-2 outline-none focus:border-violet-400"
      />

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <select
          value={form.category_id}
          onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
          className="w-full rounded-xl border border-violet-200 bg-white px-4 py-2 outline-none focus:border-violet-400"
        >
          <option value="">Select Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onOpenCategoryManager}
          className="rounded-xl border border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50"
        >
          + New
        </button>
      </div>

      <select
        value={form.unit}
        onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
        className="w-full rounded-xl border border-violet-200 bg-white px-4 py-2 outline-none focus:border-violet-400"
      >
        {UNIT_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label} style={{ color: group.color, fontWeight: 700 }}>
            {group.options.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <input
        type="number"
        min={0}
        step="0.01"
        value={form.unit_price}
        onChange={(e) => setForm((prev) => ({ ...prev, unit_price: e.target.value }))}
        placeholder="Price Per Selected Unit"
        className="w-full rounded-xl border border-violet-200 px-4 py-2 outline-none focus:border-violet-400"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={0}
          step="0.001"
          value={form.current_stock}
          onChange={(e) => setForm((prev) => ({ ...prev, current_stock: e.target.value }))}
          placeholder="Total Stock"
          className="w-full rounded-xl border border-violet-200 px-4 py-2 outline-none focus:border-violet-400"
        />
        <input
          type="number"
          min={0}
          step="0.001"
          value={form.min_stock}
          onChange={(e) => setForm((prev) => ({ ...prev, min_stock: e.target.value }))}
          placeholder="Minimum Level"
          className="w-full rounded-xl border border-violet-200 px-4 py-2 outline-none focus:border-violet-400"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))} />
        Active ingredient
      </label>

      <div className="flex justify-end gap-4">
        <button onClick={onClose} className="text-violet-500 hover:text-violet-700">
          Cancel
        </button>
        <button onClick={onSave} className="rounded-xl bg-violet-600 px-5 py-2 text-white transition hover:bg-violet-700">
          Save
        </button>
      </div>
    </div>
  </div>
);

export default IngredientModal;
