import type { Dispatch, SetStateAction } from "react";

import FormModal from "../../FormModal";
import type {
  Addon,
  AddonForm,
  IngredientCategoryOption,
  IngredientOption,
} from "./types";

interface AddonFormModalProps {
  open: boolean;
  editAddon: Addon | null;
  addonForm: AddonForm;
  setAddonForm: Dispatch<SetStateAction<AddonForm>>;
  addonCategoryId: string;
  setAddonCategoryId: Dispatch<SetStateAction<string>>;
  ingredientCategories: IngredientCategoryOption[];
  addonIngredientId: string;
  setAddonIngredientId: Dispatch<SetStateAction<string>>;
  ingredients: IngredientOption[];
  selectedAddonIngredient: IngredientOption | null;
  addonUnitOptions: string[];
  isSavingAddon: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AddonFormModal = ({
  open,
  editAddon,
  addonForm,
  setAddonForm,
  addonCategoryId,
  setAddonCategoryId,
  ingredientCategories,
  addonIngredientId,
  setAddonIngredientId,
  ingredients,
  selectedAddonIngredient,
  addonUnitOptions,
  isSavingAddon,
  onClose,
  onSave,
}: AddonFormModalProps) => (
  <FormModal open={open} title={editAddon ? "Edit Addon" : "Add Addon"} onClose={onClose}>
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-violet-800">Ingredient Category</label>
        <select
          value={addonCategoryId}
          onChange={(e) => {
            setAddonCategoryId(e.target.value);
            setAddonIngredientId("");
            setAddonForm((prev) => ({
              ...prev,
              ingredientQuantity: "",
              ingredientInputUnit: "",
            }));
          }}
          className="w-full border p-2.5 rounded-lg"
        >
          <option value="">Select category</option>
          {ingredientCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-violet-800">Ingredient (from Ingredients Entry)</label>
        <select
          value={addonIngredientId}
          onChange={(e) => {
            const nextId = e.target.value;
            setAddonIngredientId(nextId);
            const selectedIngredient = ingredients.find((item) => item.id === nextId);
            if (selectedIngredient) {
              setAddonForm((prev) => ({
                ...prev,
                name: prev.name.trim() ? prev.name : selectedIngredient.name,
                ingredientInputUnit: selectedIngredient.unit,
              }));
            }
          }}
          disabled={!addonCategoryId}
          className="w-full border p-2.5 rounded-lg disabled:bg-slate-50"
        >
          <option value="">{!addonCategoryId ? "Select category first" : "Select ingredient"}</option>
          {ingredients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <input
        value={addonForm.name}
        onChange={(e) => setAddonForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="Addon name"
        className="w-full border p-2.5 rounded-lg"
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="number"
          step="0.001"
          value={addonForm.ingredientQuantity}
          onChange={(e) =>
            setAddonForm((prev) => ({ ...prev, ingredientQuantity: e.target.value }))
          }
          placeholder="Ingredient quantity"
          className="w-full border p-2.5 rounded-lg"
        />
        <select
          value={addonForm.ingredientInputUnit}
          onChange={(e) =>
            setAddonForm((prev) => ({ ...prev, ingredientInputUnit: e.target.value }))
          }
          disabled={!selectedAddonIngredient}
          className="w-full border p-2.5 rounded-lg disabled:bg-slate-50"
        >
          {!selectedAddonIngredient ? (
            <option value="">Select unit</option>
          ) : (
            addonUnitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))
          )}
        </select>
      </div>
      {selectedAddonIngredient ? (
        <p className="text-[11px] text-slate-500">
          Inventory base unit: <span className="font-semibold">{selectedAddonIngredient.unit}</span>
        </p>
      ) : null}

      <input
        value={addonForm.price}
        onChange={(e) => setAddonForm((prev) => ({ ...prev, price: e.target.value }))}
        placeholder="Price"
        type="number"
        className="w-full border p-2.5 rounded-lg"
      />

      <input
        type="file"
        onChange={(e) =>
          setAddonForm((prev) => ({
            ...prev,
            image: e.target.files?.[0] ?? null,
          }))
        }
      />

      <button
        onClick={onSave}
        disabled={isSavingAddon}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-lg"
      >
        {isSavingAddon ? "Saving..." : editAddon ? "Update Addon" : "Save Addon"}
      </button>
    </div>
  </FormModal>
);

export default AddonFormModal;
