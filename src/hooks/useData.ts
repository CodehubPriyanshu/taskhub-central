import { useState, useCallback, useEffect } from 'react';
import { User, Team, Department, Task, TaskComment, ActivityLog, TaskAcceptanceStatus } from '@/types';
import { generateCredentials, simpleHash } from '@/lib/credentialGenerator';

// Simple UUID generator
const generateId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
};

export const useData = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Load data from localStorage
  const loadData = useCallback(() => {
    setUsers(JSON.parse(localStorage.getItem('tms_users') || '[]'));
    setTeams(JSON.parse(localStorage.getItem('tms_teams') || '[]'));
    setDepartments(JSON.parse(localStorage.getItem('tms_departments') || '[]'));
    setTasks(JSON.parse(localStorage.getItem('tms_tasks') || '[]'));
    setActivityLogs(JSON.parse(localStorage.getItem('tms_activity_logs') || '[]'));
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

  // Activity log helper
  const addActivityLog = useCallback((log: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    const updatedLogs = [...activityLogs, newLog];
    localStorage.setItem('tms_activity_logs', JSON.stringify(updatedLogs));
    setActivityLogs(updatedLogs);
    triggerUpdate();
    return newLog;
  }, [activityLogs]);

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

    addActivityLog({
      action: 'created',
      entityType: 'user',
      entityId: newUser.id,
      userId: creatorId,
      details: `Created ${newUser.role === 'team_leader' ? 'Team Leader' : 'User'} "${newUser.name}" with email ${newUser.email}`,
    });

    triggerUpdate();
    return { user: newUser, credentials: generatedCreds };
  }, [users, addActivityLog]);

  const updateUser = useCallback((id: string, userData: Partial<User>, updaterId?: string) => {
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...userData } : u);
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    if (updaterId) {
      addActivityLog({
        action: 'updated',
        entityType: 'user',
        entityId: id,
        userId: updaterId,
        details: `Updated user "${users.find(u => u.id === id)?.name}"`,
      });
    }

    triggerUpdate();
  }, [users, addActivityLog]);

  const deleteUser = useCallback((id: string, deleterId?: string) => {
    const user = users.find(u => u.id === id);
    const updatedUsers = users.filter(u => u.id !== id);
    localStorage.setItem('tms_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    if (deleterId && user) {
      addActivityLog({
        action: 'deleted',
        entityType: 'user',
        entityId: id,
        userId: deleterId,
        details: `Deleted user "${user.name}"`,
      });
    }

    triggerUpdate();
  }, [users, addActivityLog]);

  const deactivateUser = useCallback((id: string, deactivatorId: string) => {
    const user = users.find(u => u.id === id);
    updateUser(id, { isActive: false });

    addActivityLog({
      action: 'deactivated',
      entityType: 'user',
      entityId: id,
      userId: deactivatorId,
      details: `Deactivated user "${user?.name}"`,
    });
  }, [users, updateUser, addActivityLog]);

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

    if (creatorId) {
      addActivityLog({
        action: 'created',
        entityType: 'team',
        entityId: newTeam.id,
        userId: creatorId,
        details: `Created team "${newTeam.name}"`,
      });
    }

    triggerUpdate();
    return newTeam;
  }, [teams, addActivityLog]);

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

    const assignedUser = users.find(u => u.id === taskData.assignedUserId);
    addActivityLog({
      action: 'created',
      entityType: 'task',
      entityId: newTask.id,
      userId: creatorId,
      details: `Created task "${newTask.title}" and assigned to ${assignedUser?.name || 'Unknown'}`,
    });

    triggerUpdate();
    return newTask;
  }, [tasks, users, addActivityLog]);

  const updateTask = useCallback((id: string, taskData: Partial<Task>, updaterId?: string) => {
    const oldTask = tasks.find(t => t.id === id);
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, ...taskData, updatedAt: new Date().toISOString() } : t
    );
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);

    if (updaterId && oldTask) {
      let details = `Updated task "${oldTask.title}"`;
      if (taskData.status && taskData.status !== oldTask.status) {
        details = `Changed task "${oldTask.title}" status to ${taskData.status}`;
      }
      if (taskData.acceptanceStatus && taskData.acceptanceStatus !== oldTask.acceptanceStatus) {
        details = `Task "${oldTask.title}" ${taskData.acceptanceStatus}`;
      }
      addActivityLog({
        action: 'updated',
        entityType: 'task',
        entityId: id,
        userId: updaterId,
        details,
      });
    }

    triggerUpdate();
  }, [tasks, addActivityLog]);

  const deleteTask = useCallback((id: string, deleterId?: string) => {
    const task = tasks.find(t => t.id === id);
    const updatedTasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tms_tasks', JSON.stringify(updatedTasks));
    setTasks(updatedTasks);

    if (deleterId && task) {
      addActivityLog({
        action: 'deleted',
        entityType: 'task',
        entityId: id,
        userId: deleterId,
        details: `Deleted task "${task.title}"`,
      });
    }

    triggerUpdate();
  }, [tasks, addActivityLog]);

  // Task workflow actions
  const acceptTask = useCallback((taskId: string, userId: string) => {
    updateTask(taskId, { acceptanceStatus: 'accepted', status: 'in_progress' }, userId);
  }, [updateTask]);

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
    activityLogs,
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
    addTaskComment,
    addActivityLog,
  };
};
