import { useState, useCallback, useEffect } from 'react';
import { User, Team, Department, Task, TaskComment } from '@/types';

// Simple UUID generator
const generateId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};

export const useData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load data from localStorage
  const loadData = useCallback(() => {
    setUsers(JSON.parse(localStorage.getItem('tms_users') || '[]'));
    setTeams(JSON.parse(localStorage.getItem('tms_teams') || '[]'));
    setDepartments(JSON.parse(localStorage.getItem('tms_departments') || '[]'));
    setTasks(JSON.parse(localStorage.getItem('tms_tasks') || '[]'));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // User operations
  const createUser = useCallback((userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    return newUser;
  }, [users]);

  const updateUser = useCallback((id: string, userData: Partial<User>) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...userData } : u);
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  }, [users]);

  const deleteUser = useCallback((id: string) => {
    const updatedUsers = users.filter(u => u.id !== id);
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  }, [users]);

  // Team operations
  const createTeam = useCallback((teamData: Omit<Team, 'id' | 'createdAt'>) => {
    const newTeam: Team = {
      ...teamData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedTeams = [...teams, newTeam];
    localStorage.setItem('tms_teams', JSON.stringify(updatedTeams));
    setTeams(updatedTeams);
    return newTeam;
  }, [teams]);

  const updateTeam = useCallback((id: string, teamData: Partial<Team>) => {
    const updatedTeams = teams.map(t => t.id === id ? { ...t, ...teamData } : t);
    localStorage.setItem('tms_teams', JSON.stringify(updatedTeams));
    setTeams(updatedTeams);
  }, [teams]);

  const deleteTeam = useCallback((id: string) => {
    const updatedTeams = teams.filter(t => t.id !== id);
    localStorage.setItem('tms_teams', JSON.stringify(updatedTeams));
    setTeams(updatedTeams);
  }, [teams]);

  // Department operations
  const createDepartment = useCallback((deptData: Omit<Department, 'id' | 'createdAt'>) => {
    const newDept: Department = {
      ...deptData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedDepts = [...departments, newDept];
    localStorage.setItem('tms_departments', JSON.stringify(updatedDepts));
    setDepartments(updatedDepts);
    return newDept;
  }, [departments]);

  const updateDepartment = useCallback((id: string, deptData: Partial<Department>) => {
    const updatedDepts = departments.map(d => d.id === id ? { ...d, ...deptData } : d);
    localStorage.setItem('tms_departments', JSON.stringify(updatedDepts));
    setDepartments(updatedDepts);
  }, [departments]);

  const deleteDepartment = useCallback((id: string) => {
    const updatedDepts = departments.filter(d => d.id !== id);
    localStorage.setItem('tms_departments', JSON.stringify(updatedDepts));
    setDepartments(updatedDepts);
  }, [departments]);

  // Task operations
  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, newTask];
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
    return newTask;
  }, [tasks]);

  const updateTask = useCallback((id: string, taskData: Partial<Task>) => {
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, ...taskData, updatedAt: new Date().toISOString() } : t
    );
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  }, [tasks]);

  const deleteTask = useCallback((id: string) => {
    const updatedTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  }, [tasks]);

  const addTaskComment = useCallback((taskId: string, content: string, userId: string) => {
    const comment: TaskComment = {
      id: generateId(),
      content,
      userId,
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = tasks.map(t => 
      t.id === taskId 
        ? { ...t, comments: [...t.comments, comment], updatedAt: new Date().toISOString() } 
        : t
    );
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
    return comment;
  }, [tasks]);

  return {
    users,
    teams,
    departments,
    tasks,
    loadData,
    createUser,
    updateUser,
    deleteUser,
    createTeam,
    updateTeam,
    deleteTeam,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createTask,
    updateTask,
    deleteTask,
    addTaskComment,
  };
};
