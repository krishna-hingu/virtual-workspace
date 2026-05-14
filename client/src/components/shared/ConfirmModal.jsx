import { Modal } from './Modal';
import { Button } from './Button';
import { useUIStore } from '../../store/uiStore';

export const ConfirmModal = () => {
  const { showConfirmModal, confirmData, closeConfirm } = useUIStore();

  if (!confirmData) return null;

  const handleConfirm = async () => {
    if (confirmData.onConfirm) {
      await confirmData.onConfirm();
    }
    closeConfirm();
  };

  const handleCancel = () => {
    if (confirmData.onCancel) {
      confirmData.onCancel();
    }
    closeConfirm();
  };

  return (
    <Modal
      isOpen={showConfirmModal}
      title={confirmData.title}
      onClose={handleCancel}
      size="sm"
    >
      <p className="text-text-secondary mb-6">{confirmData.message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
};
