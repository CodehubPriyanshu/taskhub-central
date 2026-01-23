import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import AdminProfilePage from './AdminProfilePage';
import TeamLeaderProfilePage from './TeamLeaderProfilePage';
import UserProfilePage from './UserProfilePage';

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Route to role-specific profile page
  switch (user?.role) {
    case 'admin':
      return <AdminProfilePage />;
    case 'team_leader':
      return <TeamLeaderProfilePage />;
    case 'user':
      return <UserProfilePage />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default ProfilePage;
