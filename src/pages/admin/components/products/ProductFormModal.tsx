import type { Dispatch, SetStateAction } from "react";

import FormModal from "../../FormModal";
import type { Category, Product, ProductForm } from "./types";

interface ProductFormModalProps {
  open: boolean;
  editProduct: Product | null;
  categories: Category[];
  productForm: ProductForm;
  setProductForm: Dispatch<SetStateAction<ProductForm>>;
  isSavingProduct: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ProductFormModal = ({
  open,
  editProduct,
  categories,
  productForm,
  setProductForm,
  isSavingProduct,
  onClose,
  onSave,
}: ProductFormModalProps) => (
  <FormModal open={open} title={editProduct ? "Edit Product" : "Add Product"} onClose={onClose}>
    <div className="space-y-4">
      <input
        value={productForm.name}
        onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="Product name"
        className="w-full border p-2.5 rounded-lg"
      />

      <select
        value={productForm.categoryId}
        onChange={(e) => setProductForm((prev) => ({ ...prev, categoryId: e.target.value }))}
        className="w-full border p-2.5 rounded-lg"
      >
        <option value="">Select category</option>
        {categories
          .filter((c) => c.id !== "all")
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input
          value={productForm.price}
          onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
          placeholder="Price"
          type="number"
          className="w-full border p-2.5 rounded-lg"
        />

        <input
          value={productForm.gstPercent}
          onChange={(e) => setProductForm((prev) => ({ ...prev, gstPercent: e.target.value }))}
          placeholder="GST %"
          type="number"
          className="w-full border p-2.5 rounded-lg"
        />
      </div>

      <input
        type="file"
        onChange={(e) =>
          setProductForm((prev) => ({
            ...prev,
            image: e.target.files?.[0] ?? null,
          }))
        }
      />

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={productForm.isActive}
          onChange={(e) =>
            setProductForm((prev) => ({
              ...prev,
              isActive: e.target.checked,
            }))
          }
        />
        Product is active
      </label>

      <button
        onClick={onSave}
        disabled={isSavingProduct}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2.5 rounded-lg"
      >
        {isSavingProduct ? "Saving..." : "Save Product"}
      </button>
    </div>
  </FormModal>
);

export default ProductFormModal;
