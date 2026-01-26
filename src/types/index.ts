export type UserRole = 'admin' | 'team_leader' | 'user';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type TaskAcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'extension_requested';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  teamId?: string;
  departmentId?: string;
  avatar?: string;
  createdAt: string;
  createdById?: string; // Who created this user
  isActive: boolean;
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
  user_count?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  acceptanceStatus: TaskAcceptanceStatus;
  startDate: string;
  deadline: string;
  originalDeadline: string; // Keep track of original deadline for extensions
  assignedUserId: string;
  createdById: string;
  teamId: string;
  comments: TaskComment[];
  rejectionReason?: string;
  extensionReason?: string;
  requestedDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: 'user' | 'task' | 'team' | 'department';
  entityId: string;
  userId: string;
  details: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Credential generation result
export interface GeneratedCredentials {
  email: string;
  password: string;
}
