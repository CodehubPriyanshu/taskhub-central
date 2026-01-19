import React, { createContext, useContext, ReactNode } from 'react';
import { useData } from '@/hooks/useData';
import { User, Team, Department, Task, TaskComment } from '@/types';

interface DataContextType {
  users: User[];
  teams: Team[];
  departments: Department[];
  tasks: Task[];
  loadData: () => void;
  createUser: (userData: Omit<User, 'id' | 'createdAt'>) => User;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  createTeam: (teamData: Omit<Team, 'id' | 'createdAt'>) => Team;
  updateTeam: (id: string, teamData: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  createDepartment: (deptData: Omit<Department, 'id' | 'createdAt'>) => Department;
  updateDepartment: (id: string, deptData: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => Task;
  updateTask: (id: string, taskData: Partial<Task>) => void;
  deleteTask: (id: string) => void;
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

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
};
