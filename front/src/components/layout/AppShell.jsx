import Header from './Header.jsx';
import './AppShell.css';

export default function AppShell({
  title,
  showBack = false,
  onBack,
  member = null,
  children,
}) {
  return (
    <div className="app-shell">
      {title && (
        <Header title={title} showBack={showBack} onBack={onBack} member={member} />
      )}
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
