interface DeleteModalProps {
  name: string;
  error: string | null;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteModal = ({ name, error, onClose, onDelete }: DeleteModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="w-[420px] space-y-5 rounded-2xl border border-violet-200 bg-white p-6 shadow-2xl">
      <h2 className="text-lg font-semibold text-rose-600">Delete Ingredient</h2>
      <p className="text-sm text-violet-600/75">
        Are you sure you want to delete <strong>{name}</strong>?
      </p>
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <div className="flex justify-end gap-4">
        <button onClick={onClose} className="text-violet-500 hover:text-violet-700">
          Cancel
        </button>
        <button onClick={onDelete} className="rounded-xl bg-rose-600 px-5 py-2 text-white transition hover:bg-rose-700">
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default DeleteModal;
