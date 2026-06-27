import { Sparkles } from 'lucide-react';
import AppModal from '@/components/ui/AppModal.jsx';
import './ComingSoonModal.css';

export default function ComingSoonModal({
  isOpen,
  onClose,
  featureName = '이 기능',
  description = '더 좋은 경험을 위해 준비하고 있어요. 조금만 기다려 주세요!',
  confirmLabel = '확인',
}) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`${featureName} 준비 중`}
      footer={
        <button type="button" className="app-modal__btn app-modal__btn--primary" onClick={onClose}>
          {confirmLabel}
        </button>
      }
    >
      <div className="coming-soon-modal">
        <div className="coming-soon-modal__icon-wrap" aria-hidden="true">
          <span className="coming-soon-modal__icon-glow" />
          <span className="coming-soon-modal__icon-circle">
            <Sparkles size={26} strokeWidth={2} />
          </span>
        </div>

        <span className="coming-soon-modal__badge">준비 중</span>
        <h3 className="coming-soon-modal__title">{featureName}</h3>
        <p className="coming-soon-modal__description">{description}</p>
        <p className="coming-soon-modal__footnote">추후 기능을 추가할 예정입니다.</p>
      </div>
    </AppModal>
  );
}
