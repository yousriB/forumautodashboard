import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const ProtectedRoute = () => {
  const { user, loading } = useUser();

  // While Supabase Auth is restoring the session, render nothing
  // (prevents a flash-redirect to /login on page refresh)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated → render child routes
  return <Outlet />;
};

export default ProtectedRoute;
