import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';

export default function GuestOnly({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-placeholder">
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
