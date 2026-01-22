import React, { createContext, useContext, ReactNode } from 'react';
import { useData } from '@/hooks/useData';
import { User, Team, Department, Task, TaskComment, ActivityLog, GeneratedCredentials } from '@/types';

interface DataContextType {
  users: User[];
  teams: Team[];
  departments: Department[];
  tasks: Task[];
  activityLogs: ActivityLog[];
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
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'acceptanceStatus' | 'originalDeadline'>, creatorId: string) => Task;
  updateTask: (id: string, taskData: Partial<Task>, updaterId?: string) => void;
  deleteTask: (id: string, deleterId?: string) => void;
  acceptTask: (taskId: string, userId: string) => void;
  rejectTask: (taskId: string, userId: string, reason: string) => void;
  requestExtension: (taskId: string, userId: string, reason: string, requestedDeadline: string) => void;
  approveExtension: (taskId: string, approverId: string, newDeadline?: string) => void;
  rejectExtension: (taskId: string, approverId: string) => void;
  addTaskComment: (taskId: string, content: string, userId: string) => TaskComment;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'createdAt'>) => ActivityLog;
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

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
};
