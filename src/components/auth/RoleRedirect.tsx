import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

const RoleRedirect = () => {
  const { role, isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      switch (role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'team_leader':
          navigate('/team-leader/dashboard', { replace: true });
          break;
        case 'user':
          navigate('/user/dashboard', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, role, navigate]);

  return null; // This component doesn't render anything
};

export default RoleRedirect;