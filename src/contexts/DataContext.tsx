import React, { createContext, useContext, ReactNode } from 'react';
import { useData } from '@/hooks/useData';
import { User, Team, Department, Task, TaskComment, GeneratedCredentials } from '@/types';

interface DataContextType {
  users: User[];
  teams: Team[];
  departments: Department[];
  tasks: Task[];
  loadData: () => void;
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>, creatorId: string, autoGenerateCredentials?: boolean) => { user: User; credentials: GeneratedCredentials | null };
  updateUser: (id: string, userData: Partial<User>, updaterId?: string) => void;
  deleteUser: (id: string, deleterId?: string) => void;
  deactivateUser: (id: string, deactivatorId: string) => void;
  createTeam: (teamData: Omit<Team, 'id' | 'createdAt'>, creatorId?: string) => Team;
  updateTeam: (id: string, teamData: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  createDepartment: (deptData: Omit<Department, 'id' | 'createdAt'>) => Department;
  updateDepartment: (id: string, deptData: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'acceptanceStatus' | 'originalDeadline' | 'estimatedTimeToComplete' | 'acceptanceTimestamp' | 'isOverdue' | 'isAtRisk' | 'editRequestStatus' | 'editRequestReason' | 'editRequestDetails'>, creatorId: string) => Task;
  updateTask: (id: string, taskData: Partial<Task>, updaterId?: string) => void;
  deleteTask: (id: string, deleterId?: string) => void;
  acceptTask: (taskId: string, userId: string, estimatedTime?: string) => void;
  rejectTask: (taskId: string, userId: string, reason: string) => void;
  requestExtension: (taskId: string, userId: string, reason: string, requestedDeadline: string) => void;
  approveExtension: (taskId: string, approverId: string, newDeadline?: string) => void;
  rejectExtension: (taskId: string, approverId: string) => void;
  requestTaskEdit: (taskId: string, userId: string, reason: string, details: string) => void;
  approveTaskEdit: (taskId: string, approverId: string) => void;
  rejectTaskEdit: (taskId: string, approverId: string) => void;
  addTaskComment: (taskId: string, content: string, userId: string) => TaskComment;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const data = useData();

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
};

// Helper functions for task monitoring
export const calculateTaskStatus = (task: Task): { isOverdue: boolean; isAtRisk: boolean } => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const acceptedTime = task.acceptanceTimestamp ? new Date(task.acceptanceTimestamp) : null;
  
  let isOverdue = false;
  let isAtRisk = false;
  
  // Check if task is overdue
  if (task.status === 'in_progress' && now > deadline) {
    isOverdue = true;
  }
  
  // Check if task is at risk (approaching deadline)
  if (task.status === 'in_progress' && acceptedTime && task.estimatedTimeToComplete) {
    // Parse estimated time
    const estimatedMs = parseEstimatedTime(task.estimatedTimeToComplete);
    const estimatedCompletion = new Date(acceptedTime.getTime() + estimatedMs);
    
    // If estimated completion is close to or past deadline
    if (estimatedCompletion >= deadline || 
        (deadline.getTime() - now.getTime()) < 24 * 60 * 60 * 1000) { // Less than 1 day remaining
      isAtRisk = true;
    }
  }
  
  return { isOverdue, isAtRisk };
};

// Helper to parse estimated time string
const parseEstimatedTime = (timeStr: string): number => {
  const match = timeStr.match(/(\d+)\s*(hour|day|week)s?/i);
  if (!match) return 0;
  
  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'hour': return value * 60 * 60 * 1000;
    case 'day': return value * 24 * 60 * 60 * 1000;
    case 'week': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 0;
  }
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
};
