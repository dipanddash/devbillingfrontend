import FormModal from "../../FormModal";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  message: string;
  buttonLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDeleteModal = ({ open, title, message, buttonLabel, onClose, onConfirm }: ConfirmDeleteModalProps) => (
  <FormModal open={open} title={title} onClose={onClose}>
    <div className="space-y-4">
      <p>{message}</p>
      <button onClick={onConfirm} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">
        {buttonLabel}
      </button>
    </div>
  </FormModal>
);

export default ConfirmDeleteModal;
