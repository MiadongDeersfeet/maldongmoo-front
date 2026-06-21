import AppModal from '@/components/ui/AppModal.jsx';

export default function AlertModal({
  isOpen,
  onClose,
  title = '안내',
  message,
  confirmLabel = '확인',
}) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <button type="button" className="app-modal__btn app-modal__btn--primary" onClick={onClose}>
          {confirmLabel}
        </button>
      }
    >
      <p>{message}</p>
    </AppModal>
  );
}
