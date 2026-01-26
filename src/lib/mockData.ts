import { User, Team, Department, Task, ActivityLog } from '@/types';

export const mockDepartments: Department[] = [
  { id: 'dept-1', name: 'Engineering', createdAt: '2024-01-01' },
  { id: 'dept-2', name: 'Design', createdAt: '2024-01-01' },
  { id: 'dept-3', name: 'Marketing', createdAt: '2024-01-01' },
];

export const mockTeams: Team[] = [
  { id: 'team-1', name: 'Frontend Team', departmentId: 'dept-1', leaderId: 'user-2', createdAt: '2024-01-01' },
  { id: 'team-2', name: 'Backend Team', departmentId: 'dept-1', leaderId: 'user-3', createdAt: '2024-01-01' },
  { id: 'team-3', name: 'UI/UX Team', departmentId: 'dept-2', createdAt: '2024-01-01' },
];

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin',
    createdAt: '2024-01-01',
    isActive: true,
  },
  {
    id: 'user-2',
    name: 'John Leader',
    email: 'john@company.com',
    password: 'leader123',
    role: 'team_leader',
    teamId: 'team-1',
    departmentId: 'dept-1',
    createdAt: '2024-01-01',
    createdById: 'user-1',
    isActive: true,
  },
  {
    id: 'user-3',
    name: 'Jane Leader',
    email: 'jane@company.com',
    password: 'leader123',
    role: 'team_leader',
    teamId: 'team-2',
    departmentId: 'dept-1',
    createdAt: '2024-01-01',
    createdById: 'user-1',
    isActive: true,
  },
  {
    id: 'user-4',
    name: 'Bob Developer',
    email: 'bob@company.com',
    password: 'user123',
    role: 'user',
    teamId: 'team-1',
    departmentId: 'dept-1',
    createdAt: '2024-01-01',
    createdById: 'user-2',
    isActive: true,
  },
  {
    id: 'user-5',
    name: 'Alice Designer',
    email: 'alice@company.com',
    password: 'user123',
    role: 'user',
    teamId: 'team-1',
    departmentId: 'dept-1',
    createdAt: '2024-01-01',
    createdById: 'user-2',
    isActive: true,
  },
  {
    id: 'user-6',
    name: 'Charlie Backend',
    email: 'charlie@company.com',
    password: 'user123',
    role: 'user',
    teamId: 'team-2',
    departmentId: 'dept-1',
    createdAt: '2024-01-01',
    createdById: 'user-3',
    isActive: true,
  },
];

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Implement user authentication',
    description: 'Add login and registration functionality with JWT tokens',
    priority: 'high',
    status: 'in_progress',
    acceptanceStatus: 'accepted',
    startDate: '2024-01-15',
    deadline: '2024-02-15',
    originalDeadline: '2024-02-15',
    assignedUserId: 'user-4',
    createdById: 'user-2',
    teamId: 'team-1',
    comments: [
      { id: 'comment-1', content: 'Started working on this', userId: 'user-4', createdAt: '2024-01-20' },
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: 'task-2',
    title: 'Design new landing page',
    description: 'Create mockups for the new company landing page',
    priority: 'medium',
    status: 'pending',
    acceptanceStatus: 'pending',
    startDate: '2024-01-18',
    deadline: '2024-02-20',
    originalDeadline: '2024-02-20',
    assignedUserId: 'user-5',
    createdById: 'user-2',
    teamId: 'team-1',
    comments: [],
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18',
  },
  {
    id: 'task-3',
    title: 'API optimization',
    description: 'Optimize database queries for better performance',
    priority: 'high',
    status: 'completed',
    acceptanceStatus: 'accepted',
    startDate: '2024-01-10',
    deadline: '2024-01-25',
    originalDeadline: '2024-01-25',
    assignedUserId: 'user-6',
    createdById: 'user-3',
    teamId: 'team-2',
    comments: [
      { id: 'comment-2', content: 'Completed all optimizations', userId: 'user-6', createdAt: '2024-01-24' },
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-24',
  },
  {
    id: 'task-4',
    title: 'Write unit tests',
    description: 'Add comprehensive unit tests for core modules',
    priority: 'low',
    status: 'pending',
    acceptanceStatus: 'pending',
    startDate: '2024-01-22',
    deadline: '2024-03-01',
    originalDeadline: '2024-03-01',
    assignedUserId: 'user-4',
    createdById: 'user-2',
    teamId: 'team-1',
    comments: [],
    createdAt: '2024-01-22',
    updatedAt: '2024-01-22',
  },
  {
    id: 'task-5',
    title: 'Setup CI/CD pipeline',
    description: 'Configure automated testing and deployment',
    priority: 'medium',
    status: 'in_progress',
    acceptanceStatus: 'accepted',
    startDate: '2024-01-20',
    deadline: '2024-02-10',
    originalDeadline: '2024-02-10',
    assignedUserId: 'user-6',
    createdById: 'user-3',
    teamId: 'team-2',
    comments: [],
    createdAt: '2024-01-20',
    updatedAt: '2024-01-21',
  },
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log-1',
    action: 'created',
    entityType: 'user',
    entityId: 'user-2',
    userId: 'user-1',
    details: 'Admin created Team Leader "John Leader"',
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'log-2',
    action: 'created',
    entityType: 'task',
    entityId: 'task-1',
    userId: 'user-2',
    details: 'Task "Implement user authentication" created and assigned to Bob Developer',
    createdAt: '2024-01-15T09:00:00Z',
  },
];

// Initialize localStorage with mock data if empty
export const initializeMockData = () => {
  if (!localStorage.getItem('tms_users')) {
    localStorage.setItem('tms_users', JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem('tms_teams')) {
    localStorage.setItem('tms_teams', JSON.stringify(mockTeams));
  }
  if (!localStorage.getItem('tms_departments')) {
    localStorage.setItem('tms_departments', JSON.stringify(mockDepartments));
  }
  if (!localStorage.getItem('tms_tasks')) {
    localStorage.setItem('tms_tasks', JSON.stringify(mockTasks));
  }
  if (!localStorage.getItem('tms_activity_logs')) {
    localStorage.setItem('tms_activity_logs', JSON.stringify(mockActivityLogs));
  }
};
