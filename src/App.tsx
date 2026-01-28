import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { initializeMockData } from "@/lib/mockData";
import AppLayout from "@/components/layout/AppLayout";
import UserLayout from "@/components/layout/UserLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import TeamLeaderLayout from "@/components/layout/TeamLeaderLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRedirect from "@/components/auth/RoleRedirect";
import Login from "./pages/Login";
import SupabaseLogin from "./pages/SupabaseLogin";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import UsersPage from "./pages/UsersPage";
import TeamUsersPage from "./pages/TeamUsersPage";
import TeamsPage from "./pages/TeamsPage";
// DepartmentsPage removed as per requirements
import ProfilePage from "./pages/profile/ProfilePage";
import UserDashboard from "./pages/user/UserDashboard";
import UserTaskList from "./pages/user/UserTaskList";
import TaskDetailPage from "./pages/user/TaskDetailPage";
import UserProfile from "./pages/user/UserProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProfilePage from "./pages/profile/AdminProfilePage";
import TeamLeaderProfilePage from "./pages/profile/TeamLeaderProfilePage";
import TeamLeaderDashboard from "./pages/team-leader/TeamLeaderDashboard";
import TeamLeaderUserTasks from "./pages/team-leader/TeamLeaderUserTasks";
import AdminTasksPage from "./pages/admin/AdminTasksPage";
import AdminTeamsPage from "./pages/admin/AdminTeamsPage";
import NotFound from "./pages/NotFound";

// Initialize mock data
initializeMockData();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/legacy-login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Admin Portal Routes */}
                <Route path="/admin/*" element={<AdminLayout />}>  
                  <Route index element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
                  <Route path="dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
                  <Route path="tasks" element={<ProtectedRoute allowedRoles={['admin']}><AdminTasksPage /></ProtectedRoute>} />
                  <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
                  <Route path="team" element={<ProtectedRoute allowedRoles={['admin']}><AdminTeamsPage /></ProtectedRoute>} />
                  {/* Departments route removed as per requirements */}
                  <Route path="profile" element={<ProtectedRoute allowedRoles={['admin']}><AdminProfilePage /></ProtectedRoute>} />
                </Route>

                {/* Team Leader Portal Routes */}
                <Route path="/team-leader/*" element={<TeamLeaderLayout />}>  
                  <Route index element={<ProtectedRoute allowedRoles={['team_leader']}><TeamLeaderDashboard /></ProtectedRoute>} />
                  <Route path="dashboard" element={<ProtectedRoute allowedRoles={['team_leader']}><TeamLeaderDashboard /></ProtectedRoute>} />
                  <Route path="tasks" element={<ProtectedRoute allowedRoles={['team_leader']}><Tasks /></ProtectedRoute>} />
                  <Route path="tasks-user" element={<ProtectedRoute allowedRoles={['team_leader']}><TeamLeaderUserTasks /></ProtectedRoute>} />
                  {/* Team Members and Teams routes removed as per requirements */}
                  <Route path="profile" element={<ProtectedRoute allowedRoles={['team_leader']}><TeamLeaderProfilePage /></ProtectedRoute>} />
                </Route>

                {/* User Portal Routes */}
                <Route path="/user/*" element={<UserLayout><Outlet /></UserLayout>}>  
                  <Route index element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
                  <Route path="dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
                  <Route path="tasks" element={<ProtectedRoute allowedRoles={['user']}><UserTaskList /></ProtectedRoute>} />
                  <Route path="task/:taskId" element={<ProtectedRoute allowedRoles={['user']}><TaskDetailPage /></ProtectedRoute>} />
                  <Route path="profile" element={<ProtectedRoute allowedRoles={['user']}><UserProfile /></ProtectedRoute>} />
                </Route>

                {/* Dashboard redirect - redirect to role-specific dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'team_leader', 'user']}><RoleRedirect /></ProtectedRoute>} />
                <Route path="/tasks" element={<Navigate to="/user/tasks" replace />} />
                <Route path="/users" element={<Navigate to="/admin/users" replace />} />
                {/* Team Users redirect removed as per requirements */}
                {/* Departments redirect removed as per requirements */}
                <Route path="/profile" element={<Navigate to="/user/profile" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
