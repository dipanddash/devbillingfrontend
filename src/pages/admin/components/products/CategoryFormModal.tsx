import type { Dispatch, SetStateAction } from "react";

import FormModal from "../../FormModal";
import type { Category, CategoryForm } from "./types";

interface CategoryFormModalProps {
  open: boolean;
  editCategory: Category | null;
  categoryForm: CategoryForm;
  setCategoryForm: Dispatch<SetStateAction<CategoryForm>>;
  isSavingCategory: boolean;
  onClose: () => void;
  onSave: () => void;
}

const CategoryFormModal = ({
  open,
  editCategory,
  categoryForm,
  setCategoryForm,
  isSavingCategory,
  onClose,
  onSave,
}: CategoryFormModalProps) => (
  <FormModal open={open} title={editCategory ? "Edit Category" : "Add Category"} onClose={onClose}>
    <div className="space-y-4">
      <input
        value={categoryForm.name}
        onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="Category name"
        className="w-full border p-2.5 rounded-lg"
      />

      <input
        type="file"
        onChange={(e) =>
          setCategoryForm((prev) => ({
            ...prev,
            image: e.target.files?.[0] ?? null,
          }))
        }
      />

      <button
        onClick={onSave}
        disabled={isSavingCategory}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-lg"
      >
        {isSavingCategory ? "Saving..." : editCategory ? "Update Category" : "Save Category"}
      </button>
    </div>
  </FormModal>
);

export default CategoryFormModal;
