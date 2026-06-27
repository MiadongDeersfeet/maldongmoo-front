import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';

export default function AuthGuard({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="page-placeholder">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
