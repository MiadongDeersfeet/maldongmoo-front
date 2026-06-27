import AppModal from '@/components/ui/AppModal.jsx';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmLabel = '확인',
  cancelLabel = '취소',
  isConfirming = false,
  confirmTone = 'primary',
}) {
  const confirmClassName =
    confirmTone === 'danger'
      ? 'app-modal__btn app-modal__btn--danger'
      : 'app-modal__btn app-modal__btn--primary';

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button
            type="button"
            className="app-modal__btn app-modal__btn--secondary"
            onClick={onClose}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClassName}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-modal">
        <p className="confirm-modal__message">{message}</p>
        {description ? <p className="confirm-modal__description">{description}</p> : null}
      </div>
    </AppModal>
  );
}
