// API Configuration
const API_BASE_URL = '/routes';

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

// Generic API call function (matching React structure)
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };
    
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    
    try {
        const response = await fetch(url, config);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (!response.ok) {
            // Handle error responses
            if (isJson) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
            } else {
                // Handle non-JSON error responses
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }
        }
        
        // Parse successful responses
        if (isJson) {
            return await response.json();
        } else {
            // Handle non-JSON successful responses
            const text = await response.text();
            throw new Error(`Expected JSON response, got: ${text.substring(0, 100)}`);
        }
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Auth API functions (matching React structure)
const authApi = {
    login: async (email, password) => {
        return await apiCall('/auth.php/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    
    register: async (userData) => {
        return await apiCall('/auth.php/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    verifyToken: async () => {
        return await apiCall('/auth.php/verify', {
            method: 'POST'
        });
    },
    
    updateEmail: async (newEmail) => {
        return await apiCall('/auth.php/update-email', {
            method: 'PUT',
            body: JSON.stringify({ new_email: newEmail })
        });
    },
    
    updatePassword: async (newPassword) => {
        return await apiCall('/auth.php/update-password', {
            method: 'PUT',
            body: JSON.stringify({ new_password: newPassword })
        });
    },
    
    updateAdminCredentials: async (credentials) => {
        return await apiCall('/auth.php/admin/update-credentials', {
            method: 'PUT',
            body: JSON.stringify(credentials)
        });
    }
};

// User API functions (matching React structure)
const userApi = {
    getAll: async () => {
        return await apiCall('/users.php');
    },
    
    getById: async (id) => {
        return await apiCall(`/users.php/${id}`);
    },
    
    create: async (userData) => {
        return await apiCall('/users.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    update: async (id, userData) => {
        return await apiCall(`/users.php/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },
    
    delete: async (id) => {
        return await apiCall(`/users.php/${id}`, {
            method: 'DELETE'
        });
    }
};

// Team API functions (matching React structure)
const teamApi = {
    getAll: async () => {
        return await apiCall('/teams.php');
    },
    
    getById: async (id) => {
        return await apiCall(`/teams.php/${id}`);
    },
    
    create: async (teamData) => {
        return await apiCall('/teams.php', {
            method: 'POST',
            body: JSON.stringify(teamData)
        });
    },
    
    update: async (id, teamData) => {
        return await apiCall(`/teams.php/${id}`, {
            method: 'PUT',
            body: JSON.stringify(teamData)
        });
    },
    
    delete: async (id) => {
        return await apiCall(`/teams.php/${id}`, {
            method: 'DELETE'
        });
    }
};

// Department API functions (matching React structure)
const departmentApi = {
    getAll: async () => {
        return await apiCall('/departments.php');
    },
    
    getById: async (id) => {
        return await apiCall(`/departments.php/${id}`);
    },
    
    create: async (deptData) => {
        return await apiCall('/departments.php', {
            method: 'POST',
            body: JSON.stringify(deptData)
        });
    },
    
    update: async (id, deptData) => {
        return await apiCall(`/departments.php/${id}`, {
            method: 'PUT',
            body: JSON.stringify(deptData)
        });
    },
    
    delete: async (id) => {
        return await apiCall(`/departments.php/${id}`, {
            method: 'DELETE'
        });
    }
};

// Task API functions (matching React structure)
const taskApi = {
    getAll: async (params) => {
        const queryParams = params ? new URLSearchParams(params).toString() : '';
        const endpoint = queryParams ? `/tasks.php?${queryParams}` : '/tasks.php';
        return await apiCall(endpoint);
    },
    
    getById: async (id) => {
        return await apiCall(`/tasks.php/${id}`);
    },
    
    create: async (taskData) => {
        return await apiCall('/tasks.php', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },
    
    update: async (id, taskData) => {
        return await apiCall(`/tasks.php/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    },
    
    delete: async (id) => {
        return await apiCall(`/tasks.php/${id}`, {
            method: 'DELETE'
        });
    }
};

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getPriorityClass(priority) {
    switch (priority) {
        case 'high': return 'priority-high';
        case 'medium': return 'priority-medium';
        case 'low': return 'priority-low';
        default: return '';
    }
}

function getStatusClass(status) {
    switch (status) {
        case 'completed': return 'status-completed';
        case 'in_progress': return 'status-in-progress';
        case 'pending': return 'status-pending';
        default: return '';
    }
}

// Export all APIs and utilities
window.api = {
    auth: authApi,
    users: userApi,
    teams: teamApi,
    departments: departmentApi,
    tasks: taskApi,
    utils: {
        formatDate,
        formatDateTime,
        getPriorityClass,
        getStatusClass
    }
};