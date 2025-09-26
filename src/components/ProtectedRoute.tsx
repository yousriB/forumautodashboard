import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const ProtectedRoute = () => {
  const { user } = useUser();
  
  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
