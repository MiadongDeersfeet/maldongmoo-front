import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './RoomListHeader.css';

export const ROOM_SORT_OPTIONS = [
  { value: 'pending-first', label: '미완료 순' },
  { value: 'completed-first', label: '완료 순' },
];

export default function RoomListHeader({
  sortOrder = 'pending-first',
  onSortOrderChange,
}) {
  const menuId = useId();
  const containerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const selectedOption =
    ROOM_SORT_OPTIONS.find((option) => option.value === sortOrder) ?? ROOM_SORT_OPTIONS[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleSelect = (nextSortOrder) => {
    onSortOrderChange?.(nextSortOrder);
    setIsMenuOpen(false);
  };

  return (
    <div className="room-list-header">
      <h2 className="room-list-header__title">오늘의 암송방</h2>

      <div className="room-list-header__sort-wrap" ref={containerRef}>
        <button
          type="button"
          className={`room-list-header__sort ${isMenuOpen ? 'is-open' : ''}`}
          aria-label="정렬 방식 선택"
          aria-haspopup="listbox"
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {selectedOption.label}
          <ChevronDown size={14} strokeWidth={2.25} aria-hidden="true" />
        </button>

        {isMenuOpen && (
          <ul id={menuId} className="room-list-header__sort-menu" role="listbox" aria-label="정렬 방식">
            {ROOM_SORT_OPTIONS.map((option) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === sortOrder}
                  className={`room-list-header__sort-option ${option.value === sortOrder ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
