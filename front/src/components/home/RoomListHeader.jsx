import { ChevronDown } from 'lucide-react';
import './RoomListHeader.css';

export default function RoomListHeader() {
  return (
    <div className="room-list-header">
      <h2 className="room-list-header__title">오늘의 암송방</h2>
      <button type="button" className="room-list-header__sort" aria-label="미완료 순 정렬">
        미완료 순
        <ChevronDown size={14} strokeWidth={2.25} aria-hidden="true" />
      </button>
    </div>
  );
}
