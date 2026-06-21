import { useState } from 'react';
import AppModal from '@/components/ui/AppModal.jsx';
import { validateSectionContent } from '@/utils/sectionForm.js';
import './SectionEditorModal.css';

export default function SectionEditorModal({
  isOpen,
  onClose,
  onSubmit,
  mode = 'create',
  initialContent = '',
  isSubmitting = false,
}) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState(null);

  const title = mode === 'edit' ? '암송 본문 수정' : '암송 본문 등록';
  const submitLabel = mode === 'edit' ? '저장' : '등록';

  const handleSubmit = async () => {
    const validationError = validateSectionContent(content);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    await onSubmit(content);
  };

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
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="button"
            className="app-modal__btn app-modal__btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {submitLabel}
          </button>
        </>
      }
    >
      {error ? <p className="section-editor-modal__error">{error}</p> : null}
      <textarea
        className="section-editor-modal__textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="이번 주 암송할 본문을 입력해 주세요."
        disabled={isSubmitting}
        rows={8}
      />
    </AppModal>
  );
}
