import { BookOpen, FileText, Home, MoreHorizontal } from 'lucide-react';
import './BottomNavigation.css';

const NAV_ITEMS = [
  { id: 'home', label: '내 암송방', icon: Home, active: true },
  { id: 'records', label: '기록', icon: FileText, active: false },
  { id: 'bible', label: '성경', icon: BookOpen, active: false },
  { id: 'more', label: '더보기', icon: MoreHorizontal, active: false },
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="하단 내비게이션">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item ${item.active ? 'bottom-nav__item--active' : ''}`}
            aria-current={item.active ? 'page' : undefined}
            disabled={!item.active}
          >
            <Icon size={22} strokeWidth={item.active ? 2.25 : 2} aria-hidden="true" />
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
