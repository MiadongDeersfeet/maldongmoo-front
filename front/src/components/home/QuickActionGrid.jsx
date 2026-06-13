import { Link } from 'react-router-dom';
import { Plus, QrCode } from 'lucide-react';
import './QuickActionGrid.css';

export default function QuickActionGrid() {
  return (
    <section className="quick-action-grid" aria-label="빠른 액션">
      <Link to="/rooms/new" className="quick-action-btn">
        <span className="quick-action-btn__icon" aria-hidden="true">
          <Plus size={20} strokeWidth={2.25} />
        </span>
        <span className="quick-action-btn__label">암송방 만들기</span>
      </Link>
      <Link to="/rooms/join" className="quick-action-btn">
        <span className="quick-action-btn__icon" aria-hidden="true">
          <QrCode size={20} strokeWidth={2.25} />
        </span>
        <span className="quick-action-btn__label">초대코드 입장</span>
      </Link>
    </section>
  );
}
