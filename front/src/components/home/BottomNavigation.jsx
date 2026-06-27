import { BookOpen, FileText, Home, MoreHorizontal } from 'lucide-react';
import './BottomNavigation.css';

const NAV_ITEMS = [
  { id: 'home', label: '내 암송방', icon: Home },
  { id: 'records', label: '기록', icon: FileText },
  { id: 'bible', label: '성경', icon: BookOpen },
  { id: 'more', label: '더보기', icon: MoreHorizontal },
];

export default function BottomNavigation({ activeId = 'home', onTabClick }) {
  return (
    <nav className="bottom-nav" aria-label="하단 내비게이션">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (!isActive) {
                onTabClick?.(item.id);
              }
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
