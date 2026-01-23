import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Building2, 
  UsersRound, 
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Sidebar = () => {
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeamLeader = user?.role === 'team_leader';

  const navItems = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard',
      show: true 
    },
    { 
      label: 'Tasks', 
      icon: CheckSquare, 
      path: '/tasks',
      show: true 
    },
    { 
      label: 'Users', 
      icon: Users, 
      path: '/users',
      show: isAdmin 
    },
    { 
      label: 'Team Members', 
      icon: UserCircle, 
      path: '/team-users',
      show: isTeamLeader
    },
    { 
      label: 'Teams', 
      icon: UsersRound, 
      path: '/teams',
      show: isAdmin || isTeamLeader
    },
    { 
      label: 'Departments', 
      icon: Building2, 
      path: '/departments',
      show: isAdmin 
    },
  ];

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const getRoleBadgeText = () => {
    if (!user?.role) return '';
    switch (user.role) {
      case 'admin':
        return 'Administrator';
      case 'team_leader':
        return 'Team Leader';
      case 'user':
        return 'User';
      default:
        return String(user.role).replace('_', ' ');
    }
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">TaskFlow</span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.filter(item => item.show).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section - Clickable Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleProfileClick}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 mb-2 rounded-lg transition-colors",
            location.pathname === '/profile' 
              ? "bg-sidebar-primary text-sidebar-primary-foreground" 
              : "hover:bg-sidebar-accent"
          )}
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-medium text-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{getRoleBadgeText()}</p>
            </div>
          )}
          {!collapsed && <Settings className="h-4 w-4 text-muted-foreground" />}
        </button>
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-0"
          )}
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
