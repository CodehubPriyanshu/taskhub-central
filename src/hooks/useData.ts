import { useState, useCallback, useEffect } from 'react';
import { User, Team, Department, Task, TaskComment, TaskAcceptanceStatus } from '@/types';
import { generateCredentials, simpleHash } from '@/lib/credentialGenerator';
import { userApi, teamApi, departmentApi, taskApi } from '@/services/api';
import { format, isPast, parseISO } from 'date-fns';

// Simple UUID generator
const generateId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};

export const useData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Load data from localStorage
  const loadData = useCallback(() => {
    setUsers(JSON.parse(localStorage.getItem('tms_users') || '[]'));
    setTeams(JSON.parse(localStorage.getItem('tms_teams') || '[]'));
    setDepartments(JSON.parse(localStorage.getItem('tms_departments') || '[]'));
    setTasks(JSON.parse(localStorage.getItem('tms_tasks') || '[]'));
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Simulated real-time updates via polling
  useEffect(() => {
    const interval = setInterval(() => {
      const storedUpdate = localStorage.getItem('tms_last_update');
      if (storedUpdate && parseInt(storedUpdate) > lastUpdate) {
        loadData();
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [lastUpdate, loadData]);

  const triggerUpdate = () => {
    const now = Date.now();
    localStorage.setItem('tms_last_update', now.toString());
    setLastUpdate(now);
  };



  // User operations with auto-credential generation
  const createUser = useCallback((
    userData: Omit<User, 'id' | 'createdAt' | 'isActive'>, 
    creatorId: string,
    autoGenerateCredentials: boolean = false
  ) => {
    let finalData = { ...userData };
    let generatedCreds = null;

    if (autoGenerateCredentials && userData.name) {
      const existingEmails = users.map(u => u.email);
      generatedCreds = generateCredentials(userData.name, existingEmails);
      finalData.email = generatedCreds.email;
      finalData.password = generatedCreds.password;
    }

    const newUser: User = {
      ...finalData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      createdById: creatorId,
      isActive: true,
    };
    
    const updatedUsers = [...users, newUser];
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);



    triggerUpdate();
    return { user: newUser, credentials: generatedCreds };
  }, [users]);

  const updateUser = useCallback((id: string, userData: Partial<User>, updaterId?: string) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...userData } : u);
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);



    triggerUpdate();
  }, [users]);

  const deleteUser = useCallback((id: string, deleterId?: string) => {
    const user = users.find(u => u.id === id);
    const updatedUsers = users.filter(u => u.id !== id);
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);



    triggerUpdate();
  }, [users]);

  const deactivateUser = useCallback((id: string, deactivatorId: string) => {
    const user = users.find(u => u.id === id);
    updateUser(id, { isActive: false });


  }, [users, updateUser]);

  // Team operations
  const createTeam = useCallback((teamData: Omit<Team, 'id' | 'createdAt'>, creatorId?: string) => {
    const newTeam: Team = {
      ...teamData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedTeams = [...teams, newTeam];
    localStorage.setItem('tms_teams', JSON.stringify(updatedTeams));
    setTeams(updatedTeams);



    triggerUpdate();
    return newTeam;
  }, [teams]);

  const updateTeam = useCallback((id: string, teamData: Partial<Team>) => {
    const updatedTeams = teams.map(t => t.id === id ? { ...t, ...teamData } : t);
    localStorage.setItem('tms_teams', JSON.stringify(updatedTeams));
    setTeams(updatedTeams);
    triggerUpdate();
  }, [teams]);

  const deleteTeam = useCallback((id: string) => {
    const updatedTeams = teams.filter(t => t.id !== id);
    localStorage.setItem('tms_teams', JSON.stringify(updatedTeams));
    setTeams(updatedTeams);
    triggerUpdate();
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
    triggerUpdate();
    return newDept;
  }, [departments]);

  const updateDepartment = useCallback((id: string, deptData: Partial<Department>) => {
    const updatedDepts = departments.map(d => d.id === id ? { ...d, ...deptData } : d);
    localStorage.setItem('tms_departments', JSON.stringify(updatedDepts));
    setDepartments(updatedDepts);
    triggerUpdate();
  }, [departments]);

  const deleteDepartment = useCallback((id: string) => {
    const updatedDepts = departments.filter(d => d.id !== id);
    localStorage.setItem('tms_departments', JSON.stringify(updatedDepts));
    setDepartments(updatedDepts);
    triggerUpdate();
  }, [departments]);

  // Task operations with enhanced workflow
  const createTask = useCallback((
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments' | 'acceptanceStatus' | 'originalDeadline'>,
    creatorId: string
  ) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      comments: [],
      acceptanceStatus: 'pending',
      originalDeadline: taskData.deadline,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, newTask];
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);



    triggerUpdate();
    return newTask;
  }, [tasks, users]);

  const updateTask = useCallback((id: string, taskData: Partial<Task>, updaterId?: string) => {
    const oldTask = tasks.find(t => t.id === id);
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, ...taskData, updatedAt: new Date().toISOString() } : t
    );
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);



    triggerUpdate();
  }, [tasks]);

  const deleteTask = useCallback((id: string, deleterId?: string) => {
    const task = tasks.find(t => t.id === id);
    const updatedTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);



    triggerUpdate();
  }, [tasks]);

  // Task workflow actions
  const acceptTask = useCallback((taskId: string, userId: string, estimatedTime?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updates: Partial<Task> = { 
      acceptanceStatus: 'accepted', 
      status: 'in_progress',
      acceptanceTimestamp: new Date().toISOString()
    };
    
    if (estimatedTime) {
      updates.estimatedTimeToComplete = estimatedTime;
    }
    
    // Calculate overdue and at-risk status
    const calculatedStatus = calculateTaskStatus({ ...task, ...updates } as Task);
    updates.isOverdue = calculatedStatus.isOverdue;
    updates.isAtRisk = calculatedStatus.isAtRisk;
    
    updateTask(taskId, updates, userId);
  }, [updateTask, tasks]);

  // Helper functions for task monitoring
  const calculateTaskStatus = (task: Task): { isOverdue: boolean; isAtRisk: boolean } => {
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
  
  const rejectTask = useCallback((taskId: string, userId: string, reason: string) => {
    updateTask(taskId, { 
      acceptanceStatus: 'rejected', 
      rejectionReason: reason 
    }, userId);
  }, [updateTask]);

  const requestExtension = useCallback((
    taskId: string, 
    userId: string, 
    reason: string, 
    requestedDeadline: string
  ) => {
    updateTask(taskId, { 
      acceptanceStatus: 'extension_requested',
      extensionReason: reason,
      requestedDeadline,
    }, userId);
  }, [updateTask]);

  const approveExtension = useCallback((taskId: string, approverId: string, newDeadline?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTask(taskId, { 
      acceptanceStatus: 'accepted',
      deadline: newDeadline || task.requestedDeadline || task.deadline,
      extensionReason: undefined,
      requestedDeadline: undefined,
    }, approverId);
  }, [tasks, updateTask]);

  const rejectExtension = useCallback((taskId: string, approverId: string) => {
    updateTask(taskId, { 
      acceptanceStatus: 'accepted',
      extensionReason: undefined,
      requestedDeadline: undefined,
    }, approverId);
  }, [updateTask]);

  const requestTaskEdit = useCallback((taskId: string, userId: string, reason: string, details: string) => {
    updateTask(taskId, { 
      editRequestStatus: 'pending',
      editRequestReason: reason,
      editRequestDetails: details
    }, userId);
  }, [updateTask]);

  const approveTaskEdit = useCallback((taskId: string, approverId: string) => {
    updateTask(taskId, { 
      editRequestStatus: 'approved',
      editRequestReason: undefined,
      editRequestDetails: undefined
    }, approverId);
  }, [updateTask]);

  const rejectTaskEdit = useCallback((taskId: string, approverId: string) => {
    updateTask(taskId, { 
      editRequestStatus: 'rejected',
      editRequestReason: undefined,
      editRequestDetails: undefined
    }, approverId);
  }, [updateTask]);

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
    triggerUpdate();
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
    deactivateUser,
    createTeam,
    updateTeam,
    deleteTeam,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createTask,
    updateTask,
    deleteTask,
    acceptTask,
    rejectTask,
    requestExtension,
    approveExtension,
    rejectExtension,
    requestTaskEdit,
    approveTaskEdit,
    rejectTaskEdit,
    addTaskComment,
  };
};
