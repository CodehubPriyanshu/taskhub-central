// Authentication Module (matching React logic)
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isLoading = true;
        this.init();
    }
    
    async init() {
        // Check for existing session
        const storedUser = localStorage.getItem('tms_current_user') || sessionStorage.getItem('tms_current_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                // Verify token is still valid
                const userData = await api.auth.verifyToken();
                if (userData) {
                    this.currentUser = user;
                    this.isAuthenticated = true;
                    this.updateUI();
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Token verification failed:', error);
                this.logout();
            }
        }
        this.isLoading = false;
        this.updateUI();
    }
    
    async login(email, password, rememberMe = false) {
        try {
            // First, try to authenticate with backend API (matching React logic)
            const data = await api.auth.login(email, password);
            
            if (data.success && data.access_token) {
                const { access_token, user, profile, role } = data;
                
                // Store the token
                if (rememberMe) {
                    localStorage.setItem('auth_token', access_token);
                } else {
                    sessionStorage.setItem('auth_token', access_token);
                }
                
                // Construct user object from API response (matching React structure)
                const fullUser = {
                    id: user.id,
                    email: user.email,
                    name: profile.name || '',
                    password: '', // Not stored for security
                    role: role,
                    teamId: profile.team_id || undefined,
                    avatar: profile.avatar || undefined,
                    createdAt: profile.created_at || new Date().toISOString(),
                    createdById: profile.created_by || undefined,
                    isActive: profile.is_active !== false,
                };
                
                this.currentUser = fullUser;
                this.isAuthenticated = true;
                
                // Store user data
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('tms_current_user', JSON.stringify(fullUser));
                storage.setItem('user_role', role);
                
                this.updateUI();
                
                // Redirect based on role
                // this.redirectByRole(role); // Temporarily disabled for testing
                
                return { 
                    success: true, 
                    role: role, 
                    userId: user.id,
                    error: undefined 
                };
            } else {
                // Fallback to local storage authentication if API fails (matching React logic)
                return await this.fallbackLogin(email, password, rememberMe);
            }
        } catch (error) {
            console.error('Login error:', error);
            
            // Provide user-friendly error messages
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message.includes('Database connection failed')) {
                errorMessage = 'Service temporarily unavailable. Please try again later.';
            } else if (error.message.includes('Invalid credentials') || error.message.includes('Unauthorized')) {
                errorMessage = 'Invalid email or password.';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Unable to connect to server. Please check your connection.';
            }
            
            return { success: false, error: errorMessage };
        }
    }
    
    async fallbackLogin(email, password, rememberMe) {
        // Removed fallback authentication to ensure consistent error handling
        return { success: false, error: 'Invalid email or password' };
    }
    
    logout() {
        // Clear both API token and local storage user
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('tms_current_user');
        sessionStorage.removeItem('tms_current_user');
        localStorage.removeItem('user_role');
        sessionStorage.removeItem('user_role');
        
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUI();
        
        // Redirect to login page
        if (window.location.pathname !== '/index.html' && window.location.pathname !== '/taskhub-central/index.html') {
            window.location.href = './index.html';
        }
    }
    
    updateCurrentUser(updatedUser) {
        const storage = localStorage.getItem('tms_current_user') ? localStorage : sessionStorage;
        storage.setItem('tms_current_user', JSON.stringify(updatedUser));
        this.currentUser = updatedUser;
        this.updateUI();
    }
    
    async updateEmail(newEmail) {
        try {
            const token = getAuthToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }
            
            const data = await api.auth.updateEmail(newEmail);
            
            if (data.message && data.message.includes('successfully')) {
                // Update local user state
                const updatedUser = { ...this.currentUser, email: newEmail };
                this.updateCurrentUser(updatedUser);
                return { success: true };
            } else {
                return { success: false, error: data.message || 'Update email failed' };
            }
        } catch (error) {
            console.error('Update email error:', error);
            return { success: false, error: 'Network error' };
        }
    }
    
    async updatePassword(newPassword) {
        try {
            const token = getAuthToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }
            
            const data = await api.auth.updatePassword(newPassword);
            
            if (data.message && data.message.includes('successfully')) {
                return { success: true };
            } else {
                return { success: false, error: data.message || 'Update password failed' };
            }
        } catch (error) {
            console.error('Update password error:', error);
            return { success: false, error: 'Network error' };
        }
    }
    
    async updateAdminCredentials(credentials) {
        try {
            const token = getAuthToken();
            if (!token) {
                return { success: false, error: 'Not authenticated' };
            }
            
            const data = await api.auth.updateAdminCredentials(credentials);
            
            if (data.message && data.message.includes('successfully')) {
                // Update local user state
                const updatedUser = {
                    ...this.currentUser,
                    email: data.user.email,
                    name: data.user.name
                };
                this.updateCurrentUser(updatedUser);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.message || 'Update credentials failed' };
            }
        } catch (error) {
            console.error('Update admin credentials error:', error);
            return { success: false, error: 'Network error' };
        }
    }
    
    updateUI() {
        // Update UI elements based on authentication state
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const userNameSpan = document.getElementById('userName');
        const userRoleSpan = document.getElementById('userRole');
        
        if (this.isAuthenticated && this.currentUser) {
            if (loginForm) loginForm.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userNameSpan) userNameSpan.textContent = this.currentUser.name;
            if (userRoleSpan) userRoleSpan.textContent = this.currentUser.role.replace('_', ' ').toUpperCase();
        } else {
            if (loginForm) loginForm.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userNameSpan) userNameSpan.textContent = 'Guest';
            if (userRoleSpan) userRoleSpan.textContent = 'NOT LOGGED IN';
        }
    }
    
    // Get current user data
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Get user ID
    getUserId() {
        return this.currentUser?.id || null;
    }
    
    // Get user role
    getUserRole() {
        return this.currentUser?.role || null;
    }
    
    // Check if user is authenticated
    getIsAuthenticated() {
        return this.isAuthenticated;
    }
    
    // Check if still loading
    getIsLoading() {
        return this.isLoading;
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Export for global access
window.AuthManager = AuthManager;

// Add role-based redirect method outside the class
AuthManager.prototype.redirectByRole = function(role) {
    const rolePaths = {
        'admin': './admin/dashboard.html',
        'team_leader': './leader/dashboard.html',
        'user': './user/dashboard.html'
    };
    
    const redirectPath = rolePaths[role] || './user/dashboard.html';
    setTimeout(() => {
        window.location.href = redirectPath;
    }, 1000); // Small delay to show success message
};
