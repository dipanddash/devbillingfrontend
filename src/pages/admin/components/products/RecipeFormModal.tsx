import FormModal from "../../FormModal";
import type { IngredientCategoryOption, IngredientOption, Recipe } from "./types";

interface RecipeFormModalProps {
  open: boolean;
  selectedRecipeProductName: string | null;
  onClose: () => void;
  recipeMode: "view" | "edit";
  onRecipeModeChange: (mode: "view" | "edit") => void;
  recipeLoading: boolean;
  recipes: Recipe[];
  ingredientUnitById: Record<string, string>;
  recipeSaving: boolean;
  onUpdateRecipeQuantity: (recipe: Recipe, quantity: string) => void;
  onDeleteRecipeItem: (recipeId: number) => void;
  newRecipeCategoryId: string;
  onNewRecipeCategoryChange: (value: string) => void;
  ingredientCategories: IngredientCategoryOption[];
  newRecipeIngredient: string;
  onNewRecipeIngredientChange: (value: string) => void;
  ingredients: IngredientOption[];
  newRecipeQuantity: string;
  onNewRecipeQuantityChange: (value: string) => void;
  newRecipeInputUnit: string;
  onNewRecipeInputUnitChange: (value: string) => void;
  selectedNewRecipeIngredient: IngredientOption | null;
  recipeUnitOptions: string[];
  onAddRecipeItem: () => void;
  showRecipeSubmitConfirm: boolean;
  onShowRecipeSubmitConfirmChange: (show: boolean) => void;
  onSubmitRecipeList: () => void;
}

const RecipeFormModal = ({
  open,
  selectedRecipeProductName,
  onClose,
  recipeMode,
  onRecipeModeChange,
  recipeLoading,
  recipes,
  ingredientUnitById,
  recipeSaving,
  onUpdateRecipeQuantity,
  onDeleteRecipeItem,
  newRecipeCategoryId,
  onNewRecipeCategoryChange,
  ingredientCategories,
  newRecipeIngredient,
  onNewRecipeIngredientChange,
  ingredients,
  newRecipeQuantity,
  onNewRecipeQuantityChange,
  newRecipeInputUnit,
  onNewRecipeInputUnitChange,
  selectedNewRecipeIngredient,
  recipeUnitOptions,
  onAddRecipeItem,
  showRecipeSubmitConfirm,
  onShowRecipeSubmitConfirmChange,
  onSubmitRecipeList,
}: RecipeFormModalProps) => (
  <FormModal open={open} title={selectedRecipeProductName ? `Recipe - ${selectedRecipeProductName}` : "Recipe"} onClose={onClose}>
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 p-1 text-xs font-semibold">
          <button
            onClick={() => onRecipeModeChange("view")}
            className={`rounded-full px-3 py-1 ${recipeMode === "view" ? "bg-violet-600 text-white" : "text-violet-700"}`}
          >
            View Mode
          </button>
          <button
            onClick={() => onRecipeModeChange("edit")}
            className={`rounded-full px-3 py-1 ${recipeMode === "edit" ? "bg-violet-600 text-white" : "text-violet-700"}`}
          >
            Edit Mode
          </button>
        </div>
      </div>

      {recipeLoading ? (
        <p className="text-sm text-muted-foreground">Loading recipe...</p>
      ) : (
        <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
          {!recipes.length ? (
            <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50 px-3 py-4 text-sm text-violet-700">
              No recipe items found. Add ingredients in Edit Mode.
            </div>
          ) : (
            recipes.map((recipe) => (
              <div key={recipe.id} className="rounded-lg border border-border p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{recipe.ingredient_name || recipe.ingredient}</p>
                  {recipeMode === "view" ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">Qty: {recipe.quantity}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        Unit: {ingredientUnitById[recipe.ingredient] || "unit"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.001"
                        defaultValue={recipe.quantity}
                        onBlur={(e) => onUpdateRecipeQuantity(recipe, e.target.value)}
                        className="w-24 rounded-md border p-1.5 text-xs"
                      />
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                        {ingredientUnitById[recipe.ingredient] || "unit"}
                      </span>
                      <button
                        onClick={() => onDeleteRecipeItem(recipe.id)}
                        disabled={recipeSaving}
                        className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {recipeMode === "edit" && (
        <div className="space-y-2 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Add Ingredient</p>
          <select
            value={newRecipeCategoryId}
            onChange={(e) => onNewRecipeCategoryChange(e.target.value)}
            className="w-full rounded-lg border p-2 text-sm"
          >
            <option value="">Select category</option>
            {ingredientCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={newRecipeIngredient}
            onChange={(e) => onNewRecipeIngredientChange(e.target.value)}
            disabled={!newRecipeCategoryId}
            className="w-full rounded-lg border p-2 text-sm disabled:bg-slate-50"
          >
            <option value="">
              {!newRecipeCategoryId ? "Select category first" : "Select ingredient"}
            </option>
            {ingredients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit})
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.001"
            value={newRecipeQuantity}
            onChange={(e) => onNewRecipeQuantityChange(e.target.value)}
            placeholder="Quantity (e.g. 0.250)"
            className="w-full rounded-lg border p-2 text-sm"
          />
          <select
            value={newRecipeInputUnit}
            onChange={(e) => onNewRecipeInputUnitChange(e.target.value)}
            disabled={!selectedNewRecipeIngredient}
            className="w-full rounded-lg border bg-white p-2 text-sm text-slate-700 disabled:bg-slate-50"
          >
            {!selectedNewRecipeIngredient ? (
              <option value="">Select unit</option>
            ) : (
              recipeUnitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))
            )}
          </select>
          {selectedNewRecipeIngredient ? (
            <p className="text-[11px] text-slate-500">
              Saved in base unit: <span className="font-semibold">{selectedNewRecipeIngredient.unit}</span>
            </p>
          ) : null}
          <button
            onClick={onAddRecipeItem}
            disabled={recipeSaving}
            className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {recipeSaving ? "Saving..." : "Add Line"}
          </button>
        </div>
      )}

      {recipeMode === "view" && recipes.length > 0 && (
        <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
          {!showRecipeSubmitConfirm ? (
            <button
              onClick={() => onShowRecipeSubmitConfirmChange(true)}
              className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Submit Recipe
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-800">Confirm submit this recipe list?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onShowRecipeSubmitConfirmChange(false)}
                  className="w-1/2 rounded-lg border border-emerald-300 bg-white py-2 text-xs font-medium text-emerald-700"
                >
                  Cancel
                </button>
                <button
                  onClick={onSubmitRecipeList}
                  className="w-1/2 rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </FormModal>
);

export default RecipeFormModal;
