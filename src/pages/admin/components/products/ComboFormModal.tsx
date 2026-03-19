import { Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import FormModal from "../../FormModal";
import type { Combo, ComboForm, ComboFormItem, Product } from "./types";

interface ComboFormModalProps {
  open: boolean;
  editCombo: Combo | null;
  comboForm: ComboForm;
  setComboForm: Dispatch<SetStateAction<ComboForm>>;
  products: Product[];
  isSavingCombo: boolean;
  onClose: () => void;
  onSave: () => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  onUpdateItem: (idx: number, key: keyof ComboFormItem, value: string) => void;
}

const ComboFormModal = ({
  open,
  editCombo,
  comboForm,
  setComboForm,
  products,
  isSavingCombo,
  onClose,
  onSave,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: ComboFormModalProps) => (
  <FormModal open={open} title={editCombo ? "Edit Combo" : "Add Combo"} onClose={onClose}>
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-violet-800">Combo Name</label>
        <input
          value={comboForm.name}
          onChange={(e) => setComboForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Enter combo name"
          className="w-full border p-2.5 rounded-lg"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-violet-800">Price</label>
        <input
          value={comboForm.price}
          onChange={(e) => setComboForm((prev) => ({ ...prev, price: e.target.value }))}
          placeholder="Enter combo price"
          type="number"
          className="w-full border p-2.5 rounded-lg"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-violet-800">GST Percent</label>
        <input
          value={comboForm.gstPercent}
          onChange={(e) => setComboForm((prev) => ({ ...prev, gstPercent: e.target.value }))}
          placeholder="Enter GST %"
          type="number"
          className="w-full border p-2.5 rounded-lg"
        />
      </div>

      {(comboForm.imageUrl || comboForm.image) && (
        <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-2">
          <img
            src={comboForm.image ? URL.createObjectURL(comboForm.image) : comboForm.imageUrl}
            alt="Combo preview"
            className="h-28 w-full rounded-md object-cover"
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-violet-800">Combo Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setComboForm((prev) => ({
              ...prev,
              image: e.target.files?.[0] ?? null,
            }))
          }
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={comboForm.isActive}
          onChange={(e) => setComboForm((prev) => ({ ...prev, isActive: e.target.checked }))}
        />
        Combo is active
      </label>

      <div className="space-y-2 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Combo Items</p>
          <button
            onClick={onAddItem}
            className="rounded-md border border-violet-200 px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100"
          >
            Add Item
          </button>
        </div>

        {comboForm.items.map((item, idx) => (
          <div key={`${idx}-${item.productId}`} className="grid grid-cols-12 gap-2">
            <select
              value={item.productId}
              onChange={(e) => onUpdateItem(idx, "productId", e.target.value)}
              className="col-span-7 rounded-lg border p-2 text-sm"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              value={item.quantity}
              onChange={(e) => onUpdateItem(idx, "quantity", e.target.value)}
              type="number"
              min="1"
              placeholder="Qty"
              className="col-span-3 rounded-lg border p-2 text-sm"
            />
            <button
              onClick={() => onRemoveItem(idx)}
              className="col-span-2 inline-flex items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
              title="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={isSavingCombo}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-lg"
      >
        {isSavingCombo ? "Saving..." : editCombo ? "Update Combo" : "Save Combo"}
      </button>
    </div>
  </FormModal>
);

export default ComboFormModal;
