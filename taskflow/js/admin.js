// Admin-specific functionality
class AdminManager {
    constructor() {
        this.users = [];
        this.teams = [];
        this.departments = [];
        this.currentTab = 'pending';
    }

    async init() {
        await this.loadInitialData();
    }

    async loadInitialData() {
        try {
            // Load all necessary data
            await Promise.all([
                this.loadUsers(),
                this.loadTeams(),
                this.loadDepartments()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            showToast('Failed to load data', 'error');
        }
    }

    async loadUsers() {
        try {
            const response = await api.getUsers();
            this.users = response.users || [];
            return this.users;
        } catch (error) {
            console.error('Failed to load users:', error);
            throw error;
        }
    }

    async loadTeams() {
        try {
            const response = await api.getTeams();
            this.teams = response.teams || [];
            return this.teams;
        } catch (error) {
            console.error('Failed to load teams:', error);
            throw error;
        }
    }

    async loadDepartments() {
        try {
            const response = await api.getDepartments();
            this.departments = response.departments || [];
            return this.departments;
        } catch (error) {
            console.error('Failed to load departments:', error);
            throw error;
        }
    }

    // User Management
    renderUsersTable() {
        const container = document.getElementById('users-table-container');
        if (!container) return;

        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>👥</div>
                    <h3>No users found</h3>
                    <p>Start by adding your first user</p>
                </div>
            `;
            return;
        }

        const tableHtml = `
            <div class="table-container">
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Team</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.users.map(user => `
                            <tr>
                                <td>${user.name}</td>
                                <td>${user.email}</td>
                                <td><span class="badge badge-${user.role}">${user.role.replace('_', ' ')}</span></td>
                                <td>${user.team_name || 'No team'}</td>
                                <td><span class="badge ${user.status === 'active' ? 'badge-completed' : 'badge-rejected'}">${user.status}</span></td>
                                <td class="action-buttons">
                                    <button class="btn-edit" onclick="admin.editUser(${user.id})">Edit</button>
                                    <button class="btn-delete" onclick="admin.deleteUser(${user.id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHtml;
    }

    openCreateUserModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.classList.add('show');
            this.populateTeamDropdown();
        }
    }

    closeCreateUserModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.classList.remove('show');
            document.getElementById('createUserForm').reset();
        }
    }

    populateTeamDropdown() {
        const teamSelect = document.getElementById('userTeam');
        if (teamSelect) {
            teamSelect.innerHTML = '<option value="">Select Team (Optional)</option>' + 
                this.teams.map(team => 
                    `<option value="${team.id}">${team.name}</option>`
                ).join('');
        }
    }

    async createUser() {
        const form = document.getElementById('createUserForm');
        const formData = new FormData(form);
        
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: formData.get('role'),
            team_id: formData.get('team_id'),
            status: formData.get('status') || 'active',
            auto_generate: formData.get('auto_generate') === 'on'
        };

        // Validation
        if (!userData.name || !userData.email) {
            showToast('Name and email are required', 'error');
            return;
        }

        if (!userData.auto_generate && !userData.password) {
            showToast('Password is required when not auto-generating', 'error');
            return;
        }

        try {
            const response = await api.createUser(userData);
            if (response.success) {
                showToast('User created successfully!', 'success');
                if (response.generated_password) {
                    showToast(`Generated password: ${response.generated_password}`, 'info');
                }
                this.closeCreateUserModal();
                await this.loadUsers();
                this.renderUsersTable();
            } else {
                showToast(response.error || 'Failed to create user', 'error');
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            showToast('Failed to create user', 'error');
        }
    }

    async editUser(userId) {
        // Implementation for editing user
        showToast('Edit user functionality coming soon', 'info');
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const response = await api.deleteUser(userId);
            if (response.success) {
                showToast('User deleted successfully!', 'success');
                await this.loadUsers();
                this.renderUsersTable();
            } else {
                showToast(response.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            showToast('Failed to delete user', 'error');
        }
    }

    // Team Management
    renderTeams() {
        const container = document.getElementById('teams-container');
        if (!container) return;

        if (this.teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>🏢</div>
                    <h3>No teams found</h3>
                    <p>Create your first team to get started</p>
                </div>
            `;
            return;
        }

        const teamsWithLeaders = this.teams.filter(team => team.leader_id);
        const teamsWithoutLeaders = this.teams.filter(team => !team.leader_id);

        container.innerHTML = `
            <div class="stats-grid mb-30">
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #3498db;">🏢</div>
                    <div class="stat-info">
                        <h3>${this.teams.length}</h3>
                        <p>Total Teams</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #27ae60;">👨‍💼</div>
                    <div class="stat-info">
                        <h3>${teamsWithLeaders.length}</h3>
                        <p>Teams with Leaders</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background-color: #e74c3c;">⚠️</div>
                    <div class="stat-info">
                        <h3>${teamsWithoutLeaders.length}</h3>
                        <p>Teams without Leaders</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Teams</h2>
                    <button class="btn btn-primary" onclick="admin.openCreateTeamModal()">
                        <span>+</span> Create Team
                    </button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Team Name</th>
                                <th>Team Leader</th>
                                <th>Department</th>
                                <th>Members</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.teams.map(team => `
                                <tr>
                                    <td>${team.name}</td>
                                    <td>${team.leader_name || 'No leader assigned'}</td>
                                    <td>${team.department || 'No department'}</td>
                                    <td><span class="badge badge-info">0 members</span></td>
                                    <td><span class="badge ${team.status === 'active' ? 'badge-completed' : 'badge-rejected'}">${team.status}</span></td>
                                    <td class="action-buttons">
                                        <button class="btn-edit" onclick="admin.editTeam(${team.id})">Edit</button>
                                        <button class="btn-delete" onclick="admin.deleteTeam(${team.id})">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    openCreateTeamModal() {
        const modal = document.getElementById('createTeamModal');
        if (modal) {
            modal.classList.add('show');
            this.populateTeamLeaderDropdown();
            this.populateDepartmentDropdown();
        }
    }

    closeCreateTeamModal() {
        const modal = document.getElementById('createTeamModal');
        if (modal) {
            modal.classList.remove('show');
            document.getElementById('createTeamForm').reset();
        }
    }

    populateTeamLeaderDropdown() {
        const leaderSelect = document.getElementById('teamLeader');
        if (leaderSelect) {
            const teamLeaders = this.users.filter(user => user.role === 'team_leader');
            leaderSelect.innerHTML = '<option value="">Select Team Leader (Optional)</option>' + 
                teamLeaders.map(leader => 
                    `<option value="${leader.id}">${leader.name}</option>`
                ).join('');
        }
    }

    populateDepartmentDropdown() {
        const deptSelect = document.getElementById('teamDepartment');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">Select Department (Optional)</option>' + 
                this.departments.map(dept => 
                    `<option value="${dept.name}">${dept.name}</option>`
                ).join('');
        }
    }

    async createTeam() {
        const form = document.getElementById('createTeamForm');
        const formData = new FormData(form);
        
        const teamData = {
            name: formData.get('name'),
            department: formData.get('department'),
            leader_id: formData.get('leader_id')
        };

        // Validation
        if (!teamData.name) {
            showToast('Team name is required', 'error');
            return;
        }

        try {
            const response = await api.createTeam(teamData);
            if (response.success) {
                showToast('Team created successfully!', 'success');
                this.closeCreateTeamModal();
                await this.loadTeams();
                this.renderTeams();
            } else {
                showToast(response.error || 'Failed to create team', 'error');
            }
        } catch (error) {
            console.error('Failed to create team:', error);
            showToast('Failed to create team', 'error');
        }
    }

    async editTeam(teamId) {
        showToast('Edit team functionality coming soon', 'info');
    }

    async deleteTeam(teamId) {
        if (!confirm('Are you sure you want to delete this team?')) {
            return;
        }

        try {
            const response = await api.deleteTeam(teamId);
            if (response.success) {
                showToast('Team deleted successfully!', 'success');
                await this.loadTeams();
                this.renderTeams();
            } else {
                showToast(response.error || 'Failed to delete team', 'error');
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
            showToast('Failed to delete team', 'error');
        }
    }

    // Task Management
    switchTaskTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.task-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        this.renderTasksByStatus(tab);
    }

    async renderTasksByStatus(status) {
        const container = document.getElementById('tasks-container');
        if (!container) return;

        try {
            const response = await api.getTasks();
            let tasks = response.tasks || [];
            
            // Filter by status
            if (status !== 'all') {
                tasks = tasks.filter(task => task.status === status);
            }

            if (tasks.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div>📋</div>
                        <h3>No ${status.replace('_', ' ')} tasks</h3>
                        <p>There are currently no tasks with this status</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = tasks.map(task => `
                <div class="task-card ${task.status}">
                    <div class="task-header">
                        <div>
                            <h4 class="task-title">${task.title}</h4>
                            <div class="task-meta">
                                <span>${getPriorityBadge(task.priority)}</span>
                                <span>${getStatusBadge(task.status)}</span>
                                <span>Due: ${formatDate(task.deadline)}</span>
                                <span>Assigned to: ${task.assigned_user_name || 'Unassigned'}</span>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-primary btn-sm">Edit</button>
                            <button class="btn btn-danger btn-sm">Delete</button>
                        </div>
                    </div>
                    <p class="task-description">${task.description || 'No description'}</p>
                    <div class="task-footer">
                        <small>Created: ${formatDateTime(task.created_at)}</small>
                        <small>Team: ${task.team_name || 'No team'}</small>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load tasks:', error);
            container.innerHTML = '<div class="error">Failed to load tasks</div>';
        }
    }
}

// Create global admin instance
const admin = new AdminManager();

// Initialize when DOM is ready
domReady(async () => {
    if (auth.getUserRole() !== 'admin') {
        window.location.href = '/index.html';
        return;
    }
    
    await admin.init();
});