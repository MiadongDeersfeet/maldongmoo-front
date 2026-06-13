import { BookOpen, ChevronDown } from 'lucide-react';
import { getRecitationPreview, PASSAGE_LABEL } from '@/utils/recitationText.js';
import './RoomMiniBar.css';

export default function PinnedSectionBar({ section, onToggleExpand }) {
  const preview = section
    ? getRecitationPreview(section.recitationText)
    : '방장이 본문을 등록하면 함께 암송할 수 있어요';

  return (
    <button
      type="button"
      className="room-mini-bar room-mini-bar--section"
      onClick={onToggleExpand}
      aria-expanded={false}
      aria-label="이번주 본문 펼치기"
    >
      <BookOpen size={16} strokeWidth={2.25} className="room-mini-bar__icon" aria-hidden="true" />
      <span className="room-mini-bar__content">
        <span className="room-mini-bar__title-row">
          <span className="room-mini-bar__label">{PASSAGE_LABEL}</span>
          <ChevronDown size={16} strokeWidth={2} className="room-mini-bar__chevron" aria-hidden="true" />
        </span>
        <span className="room-mini-bar__preview">{preview}</span>
      </span>
    </button>
  );
}
