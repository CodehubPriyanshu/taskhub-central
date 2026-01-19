export type UserRole = 'admin' | 'team_leader' | 'user';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  teamId?: string;
  avatar?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  leaderId?: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  assignedUserId: string;
  createdById: string;
  teamId: string;
  comments: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
