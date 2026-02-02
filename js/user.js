// User-specific functionality
class UserManager {
    constructor() {
        this.myTasks = [];
        this.currentTab = 'pending';
    }

    async init() {
        await this.loadInitialData();
    }

    async loadInitialData() {
        try {
            await this.loadMyTasks();
        } catch (error) {
            console.error('Failed to load initial data:', error);
            showToast('Failed to load data', 'error');
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
                        <p>You don't have any tasks with this status</p>
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
                                <span>Created by: ${task.created_by_name || 'Unknown'}</span>
                            </div>
                        </div>
                        ${this.getActionButtons(task)}
                    </div>
                    <p class="task-description">${task.description || 'No description'}</p>
                    ${this.getTaskFooter(task)}
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load tasks:', error);
            container.innerHTML = '<div class="error">Failed to load tasks</div>';
        }
    }

    getActionButtons(task) {
        switch (task.status) {
            case 'pending':
                return `
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="user.startTask(${task.id})">Start Task</button>
                        <button class="btn btn-success" onclick="user.submitTask(${task.id})">Submit</button>
                    </div>
                `;
            case 'in_progress':
                return `
                    <div class="action-buttons">
                        <button class="btn btn-success" onclick="user.submitTask(${task.id})">Submit</button>
                        <button class="btn btn-warning" onclick="user.requestExtension(${task.id})">Request Extension</button>
                    </div>
                `;
            case 'submitted':
                return `
                    <div class="action-buttons">
                        <span class="status-badge status-submitted-user">Submitted for Review</span>
                    </div>
                `;
            case 'reviewed':
                return `
                    <div class="action-buttons">
                        <span class="status-badge status-reviewed-user">Reviewed</span>
                    </div>
                `;
            default:
                return '';
        }
    }

    getTaskFooter(task) {
        const footerItems = [];
        
        if (task.created_at) {
            footerItems.push(`<small>Created: ${formatDateTime(task.created_at)}</small>`);
        }
        
        if (task.submitted_at) {
            footerItems.push(`<small>Submitted: ${formatDateTime(task.submitted_at)}</small>`);
        }
        
        if (task.reviewed_at) {
            footerItems.push(`<small>Reviewed: ${formatDateTime(task.reviewed_at)}</small>`);
        }
        
        if (task.deadline) {
            const isOverdue = new Date(task.deadline) < new Date();
            const deadlineClass = isOverdue ? 'text-danger' : '';
            footerItems.push(`<small class="${deadlineClass}">Deadline: ${formatDate(task.deadline)}</small>`);
        }
        
        return `
            <div class="task-footer">
                ${footerItems.join('')}
            </div>
        `;
    }

    // Task actions
    async startTask(taskId) {
        try {
            const response = await api.updateTask(taskId, { status: 'in_progress' });
            if (response.success) {
                showToast('Task started successfully!', 'success');
                await this.loadMyTasks();
                this.renderTasksByStatus(this.currentTab);
            } else {
                showToast(response.error || 'Failed to start task', 'error');
            }
        } catch (error) {
            console.error('Failed to start task:', error);
            showToast('Failed to start task', 'error');
        }
    }

    async submitTask(taskId) {
        if (!confirm('Are you sure you want to submit this task for review?')) {
            return;
        }

        try {
            const response = await api.updateTask(taskId, { 
                status: 'submitted',
                submitted_at: new Date().toISOString()
            });
            
            if (response.success) {
                showToast('Task submitted successfully!', 'success');
                await this.loadMyTasks();
                this.renderTasksByStatus(this.currentTab);
            } else {
                showToast(response.error || 'Failed to submit task', 'error');
            }
        } catch (error) {
            console.error('Failed to submit task:', error);
            showToast('Failed to submit task', 'error');
        }
    }

    async requestExtension(taskId) {
        const reason = prompt('Please provide a reason for the extension request:');
        if (!reason) return;

        try {
            const response = await api.updateTask(taskId, { 
                extension_requested: true,
                extension_reason: reason
            });
            
            if (response.success) {
                showToast('Extension request submitted!', 'success');
                await this.loadMyTasks();
                this.renderTasksByStatus(this.currentTab);
            } else {
                showToast(response.error || 'Failed to request extension', 'error');
            }
        } catch (error) {
            console.error('Failed to request extension:', error);
            showToast('Failed to request extension', 'error');
        }
    }

    // Profile management
    async updatePassword(currentPassword, newPassword) {
        // This would typically involve an API call to update the user's password
        // For now, we'll simulate the functionality
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showToast('Password updated successfully!', 'success');
            return { success: true };
        } catch (error) {
            console.error('Failed to update password:', error);
            showToast('Failed to update password', 'error');
            return { success: false, error: error.message };
        }
    }

    async updateProfile(profileData) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showToast('Profile updated successfully!', 'success');
            return { success: true };
        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast('Failed to update profile', 'error');
            return { success: false, error: error.message };
        }
    }

    // Performance tracking
    getPerformanceMetrics() {
        const totalTasks = this.myTasks.length;
        const completedTasks = this.myTasks.filter(task => task.status === 'reviewed').length;
        const onTimeTasks = this.myTasks.filter(task => {
            if (task.status !== 'reviewed') return false;
            return new Date(task.deadline) >= new Date(task.reviewed_at);
        }).length;
        
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const onTimeRate = completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 0;
        
        return {
            totalTasks,
            completedTasks,
            completionRate,
            onTimeRate,
            performanceRating: this.getPerformanceRating(completionRate, onTimeRate)
        };
    }

    getPerformanceRating(completionRate, onTimeRate) {
        const avgScore = (completionRate + onTimeRate) / 2;
        
        if (avgScore >= 90) return 'excellent';
        if (avgScore >= 75) return 'good';
        if (avgScore >= 60) return 'average';
        return 'needs-improvement';
    }

    renderPerformanceMetrics() {
        const metrics = this.getPerformanceMetrics();
        const container = document.getElementById('performance-metrics');
        if (!container) return;

        container.innerHTML = `
            <div class="performance-metrics">
                <div class="metric-card">
                    <div class="metric-value">${metrics.totalTasks}</div>
                    <div class="metric-label">Total Tasks</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.completedTasks}</div>
                    <div class="metric-label">Completed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.completionRate}%</div>
                    <div class="metric-label">Completion Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${metrics.onTimeRate}%</div>
                    <div class="metric-label">On-Time Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">
                        <span class="performance-badge badge-${metrics.performanceRating}">
                            ${metrics.performanceRating.replace('-', ' ')}
                        </span>
                    </div>
                    <div class="metric-label">Performance</div>
                </div>
            </div>
        `;
    }
}

// Create global user instance
const user = new UserManager();

// Initialize when DOM is ready
domReady(async () => {
    if (auth.getUserRole() !== 'user') {
        window.location.href = '/index.html';
        return;
    }
    
    await user.init();
});