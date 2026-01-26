const API_BASE_URL = '/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Generic API call function
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // In a real implementation, you would add auth token here
  // const token = localStorage.getItem('auth_token');
  // if (token) {
  //   config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  // }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// User API functions
export const userApi = {
  getAll: (): Promise<any[]> => apiCall('/users'),
  getById: (id: string): Promise<any> => apiCall(`/users/${id}`),
  create: (userData: any): Promise<any> => 
    apiCall('/users', { method: 'POST', body: JSON.stringify(userData) }),
  update: (id: string, userData: any): Promise<any> => 
    apiCall(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  delete: (id: string): Promise<any> => 
    apiCall(`/users/${id}`, { method: 'DELETE' }),
};

// Team API functions
export const teamApi = {
  getAll: (): Promise<any[]> => apiCall('/teams'),
  getById: (id: string): Promise<any> => apiCall(`/teams/${id}`),
  create: (teamData: any): Promise<any> => 
    apiCall('/teams', { method: 'POST', body: JSON.stringify(teamData) }),
  update: (id: string, teamData: any): Promise<any> => 
    apiCall(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(teamData) }),
  delete: (id: string): Promise<any> => 
    apiCall(`/teams/${id}`, { method: 'DELETE' }),
};

// Department API functions
export const departmentApi = {
  getAll: (): Promise<any[]> => apiCall('/departments'),
  getById: (id: string): Promise<any> => apiCall(`/departments/${id}`),
  create: (deptData: any): Promise<any> => 
    apiCall('/departments', { method: 'POST', body: JSON.stringify(deptData) }),
  update: (id: string, deptData: any): Promise<any> => 
    apiCall(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(deptData) }),
  delete: (id: string): Promise<any> => 
    apiCall(`/departments/${id}`, { method: 'DELETE' }),
};

// Task API functions
export const taskApi = {
  getAll: (params?: { assigned_to?: string; status?: string; team_id?: string; created_by_role?: string }): Promise<any[]> => {
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const endpoint = queryParams ? `/tasks?${queryParams}` : '/tasks';
    return apiCall(endpoint);
  },
  getById: (id: string): Promise<any> => apiCall(`/tasks/${id}`),
  create: (taskData: any): Promise<any> => 
    apiCall('/tasks', { method: 'POST', body: JSON.stringify(taskData) }),
  update: (id: string, taskData: any): Promise<any> => 
    apiCall(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(taskData) }),
  delete: (id: string): Promise<any> => 
    apiCall(`/tasks/${id}`, { method: 'DELETE' }),
};