// Team Leader-specific functionality
class TeamLeaderManager {
    constructor() {
        this.teamMembers = [];
        this.myTasks = [];
        this.currentTab = 'pending';
    }

    async init() {
        await this.loadInitialData();
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadTeamMembers(),
                this.loadMyTasks()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            showToast('Failed to load data', 'error');
        }
    }

    async loadTeamMembers() {
        try {
            const response = await api.getUsers();
            this.teamMembers = response.users.filter(user => 
                user.team_id && user.role === 'user'
            ) || [];
            return this.teamMembers;
        } catch (error) {
            console.error('Failed to load team members:', error);
            throw error;
        }
    }

    async loadMyTasks() {
        try {
            const response = await api.getTasks();
            this.myTasks = response.tasks || [];
            return this.myTasks;
        } catch (error) {
            console.error('Failed to load tasks:', error);
            throw error;
        }
    }

    // Render team members
    renderTeamMembers() {
        const container = document.getElementById('team-members-container');
        if (!container) return;

        if (this.teamMembers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div>👥</div>
                    <h3>No team members</h3>
                    <p>Add team members to get started</p>
                    <button class="btn btn-primary" onclick="teamLeader.openCreateUserModal()">
                        <span>+</span> Create Team User
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="team-members-list">
                ${this.teamMembers.map(member => `
                    <div class="member-card">
                        <div class="member-avatar">${member.name.charAt(0).toUpperCase()}</div>
                        <div class="member-name">${member.name}</div>
                        <div class="member-email">${member.email}</div>
                        <span class="member-status member-${member.status}">
                            ${member.status}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Task management
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
            let tasks = [...this.myTasks];
            
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
                            <button class="btn btn-primary btn-sm" onclick="teamLeader.editTask(${task.id})">Edit</button>
                            <button class="btn btn-danger btn-sm" onclick="teamLeader.deleteTask(${task.id})">Delete</button>
                        </div>
                    </div>
                    <p class="task-description">${task.description || 'No description'}</p>
                    <div class="task-footer">
                        <small>Created: ${formatDateTime(task.created_at)}</small>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load tasks:', error);
            container.innerHTML = '<div class="error">Failed to load tasks</div>';
        }
    }

    // Create task functionality
    openCreateTaskModal() {
        const modal = document.getElementById('createTaskModal');
        if (modal) {
            modal.classList.add('show');
            this.populateTeamMemberDropdown();
        }
    }

    closeCreateTaskModal() {
        const modal = document.getElementById('createTaskModal');
        if (modal) {
            modal.classList.remove('show');
            document.getElementById('createTaskForm').reset();
        }
    }

    populateTeamMemberDropdown() {
        const memberSelect = document.getElementById('assignedUser');
        if (memberSelect) {
            memberSelect.innerHTML = '<option value="">Select Team Member</option>' + 
                this.teamMembers.map(member => 
                    `<option value="${member.id}">${member.name}</option>`
                ).join('');
        }
    }

    async createTask() {
        const form = document.getElementById('createTaskForm');
        const formData = new FormData(form);
        
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            assigned_to: formData.get('assigned_to'),
            priority: formData.get('priority'),
            status: formData.get('status'),
            start_date: formData.get('start_date'),
            deadline: formData.get('deadline')
        };

        // Validation
        if (!taskData.title || !taskData.assigned_to) {
            showToast('Task title and assignee are required', 'error');
            return;
        }

        try {
            const response = await api.createTask(taskData);
            if (response.success) {
                showToast('Task created successfully!', 'success');
                this.closeCreateTaskModal();
                await this.loadMyTasks();
                this.renderTasksByStatus(this.currentTab);
            } else {
                showToast(response.error || 'Failed to create task', 'error');
            }
        } catch (error) {
            console.error('Failed to create task:', error);
            showToast('Failed to create task', 'error');
        }
    }

    // Edit task functionality
    async editTask(taskId) {
        // Implementation for editing task
        showToast('Edit task functionality coming soon', 'info');
    }

    // Delete task functionality
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const response = await api.deleteTask(taskId);
            if (response.success) {
                showToast('Task deleted successfully!', 'success');
                await this.loadMyTasks();
                this.renderTasksByStatus(this.currentTab);
            } else {
                showToast(response.error || 'Failed to delete task', 'error');
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            showToast('Failed to delete task', 'error');
        }
    }

    // Create team user functionality
    openCreateUserModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeCreateUserModal() {
        const modal = document.getElementById('createUserModal');
        if (modal) {
            modal.classList.remove('show');
            document.getElementById('createUserForm').reset();
        }
    }

    async createTeamUser() {
        const form = document.getElementById('createUserForm');
        const formData = new FormData(form);
        
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            role: 'user',
            team_id: auth.getCurrentUser()?.team_id,
            status: 'active'
        };

        // Validation
        if (!userData.name || !userData.email || !userData.password) {
            showToast('All fields are required', 'error');
            return;
        }

        if (!validateEmail(userData.email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        try {
            const response = await api.createUser(userData);
            if (response.success) {
                showToast('Team user created successfully!', 'success');
                this.closeCreateUserModal();
                await this.loadTeamMembers();
                this.renderTeamMembers();
            } else {
                showToast(response.error || 'Failed to create team user', 'error');
            }
        } catch (error) {
            console.error('Failed to create team user:', error);
            showToast('Failed to create team user', 'error');
        }
    }

    // Update task status
    async updateTaskStatus(taskId, newStatus) {
        try {
            const response = await api.updateTask(taskId, { status: newStatus });
            if (response.success) {
                showToast('Task status updated successfully!', 'success');
                await this.loadMyTasks();
                this.renderTasksByStatus(this.currentTab);
            } else {
                showToast(response.error || 'Failed to update task status', 'error');
            }
        } catch (error) {
            console.error('Failed to update task status:', error);
            showToast('Failed to update task status', 'error');
        }
    }
}

// Create global team leader instance
const teamLeader = new TeamLeaderManager();

// Initialize when DOM is ready
domReady(async () => {
    if (auth.getUserRole() !== 'team_leader') {
        window.location.href = '/index.html';
        return;
    }
    
    await teamLeader.init();
});