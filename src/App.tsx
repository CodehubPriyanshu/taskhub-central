import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { initializeMockData } from "@/lib/mockData";
import AppLayout from "@/components/layout/AppLayout";
import UserLayout from "@/components/layout/UserLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import SupabaseLogin from "./pages/SupabaseLogin";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import UsersPage from "./pages/UsersPage";
import TeamUsersPage from "./pages/TeamUsersPage";
import TeamsPage from "./pages/TeamsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import UserDashboard from "./pages/user/UserDashboard";
import UserTaskList from "./pages/user/UserTaskList";
import TaskSubmission from "./pages/user/TaskSubmission";
import UserProfile from "./pages/user/UserProfile";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

// Initialize mock data
initializeMockData();

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SupabaseAuthProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<SupabaseLogin />} />
                <Route path="/legacy-login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* User Portal Routes */}
                <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserLayout><UserDashboard /></UserLayout></ProtectedRoute>} />
                <Route path="/user/tasks" element={<ProtectedRoute allowedRoles={['user']}><UserLayout><UserTaskList /></UserLayout></ProtectedRoute>} />
                <Route path="/user/task/:taskId" element={<ProtectedRoute allowedRoles={['user']}><UserLayout><TaskSubmission /></UserLayout></ProtectedRoute>} />
                <Route path="/user/profile" element={<ProtectedRoute allowedRoles={['user']}><UserLayout><UserProfile /></UserLayout></ProtectedRoute>} />

                {/* Admin Settings */}
                {/* Admin Settings - using standalone layout */}
                <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

                {/* Admin/Team Leader Routes */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/team-users" element={<TeamUsersPage />} />
                  <Route path="/teams" element={<TeamsPage />} />
                  <Route path="/departments" element={<DepartmentsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </SupabaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
