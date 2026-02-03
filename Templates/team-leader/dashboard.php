<?php
// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Check if user is authenticated and has team_leader role
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'team_leader') {
    // Redirect to login if not authenticated or not team leader
    $base_path = defined('BASE_PATH') ? BASE_PATH : '';
    header("Location: $base_path/login");
    exit();
}

// Get user info from session
$user_name = $_SESSION['user_name'] ?? 'Team Leader';
$user_initial = strtoupper(substr($user_name, 0, 1));
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Leader Dashboard - TaskHub Central</title>
    <link rel="stylesheet" href="/assets/css/common.css">
    <link rel="stylesheet" href="/assets/css/team-leader.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
        }
        
        .dashboard-container {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 20px 0;
            box-shadow: 3px 0 10px rgba(0,0,0,0.1);
        }
        
        .sidebar-header {
            padding: 0 20px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            margin-bottom: 20px;
        }
        
        .sidebar-header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        
        .sidebar-nav {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .sidebar-nav li {
            margin: 0;
        }
        
        .sidebar-nav a {
            display: block;
            padding: 15px 20px;
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            transition: all 0.3s ease;
            border-left: 3px solid transparent;
        }
        
        .sidebar-nav a:hover, .sidebar-nav a.active {
            background: rgba(255,255,255,0.1);
            color: white;
            border-left-color: white;
        }
        
        .main-content {
            flex: 1;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e1e8ed;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #4facfe;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        
        .logout-btn {
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        
        .logout-btn:hover {
            background: #c0392b;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-card h3 {
            margin: 0 0 10px 0;
            color: #7f8c8d;
            font-size: 16px;
            font-weight: 500;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #2c3e50;
            margin: 0;
        }
        
        .content-section {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .section-header h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 24px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: #4facfe;
            color: white;
        }
        
        .btn-primary:hover {
            background: #3a9bef;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e1e8ed;
        }
        
        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .status-badge {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .status-pending { background: #fff3cd; color: #856404; }
        .status-in-progress { background: #cce5ff; color: #004085; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-needs-attention { background: #f8d7da; color: #721c24; }
        
        .task-actions {
            display: flex;
            gap: 5px;
        }
        
        .due-soon {
            color: #e74c3c;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>Team Leader Panel</h2>
            </div>
            <ul class="sidebar-nav">
                <li><a href="#" class="active" data-section="overview">Overview</a></li>
                <li><a href="#" data-section="tasks">Team Tasks</a></li>
                <li><a href="#" data-section="members">Team Members</a></li>
                <li><a href="#" data-section="reports">Reports</a></li>
            </ul>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="header">
                <h1>Team Leader Dashboard</h1>
                <div class="user-info">
                    <div class="user-avatar"><?php echo htmlspecialchars($user_initial); ?></div>
                    <div>
                        <div><?php echo htmlspecialchars($user_name); ?></div>
                        <div>Team Leader</div>
                    </div>
                    <button class="logout-btn" onclick="location.href='/logout.php'">Logout</button>
                </div>
            </div>
            
            <!-- Overview Section -->
            <div id="overview-section" class="content-section">
                <div class="section-header">
                    <h2>Team Overview</h2>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Team Members</h3>
                        <p class="stat-value" id="teamMembersCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Pending Tasks</h3>
                        <p class="stat-value" id="pendingTasksCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>In Progress</h3>
                        <p class="stat-value" id="inProgressTasksCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Completed</h3>
                        <p class="stat-value" id="completedTasksCount">0</p>
                    </div>
                </div>
            </div>
            
            <!-- Tasks Section -->
            <div id="tasks-section" class="content-section" style="display: none;">
                <div class="section-header">
                    <h2>Team Tasks</h2>
                    <button class="btn btn-primary" id="addTaskBtn">Create New Task</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Task Title</th>
                            <th>Assigned To</th>
                            <th>Status</th>
                            <th>Due Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tasksTableBody">
                        <!-- Tasks will be populated here -->
                    </tbody>
                </table>
            </div>
            
            <!-- Members Section -->
            <div id="members-section" class="content-section" style="display: none;">
                <div class="section-header">
                    <h2>Team Members</h2>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Tasks Assigned</th>
                        </tr>
                    </thead>
                    <tbody id="teamMembersTableBody">
                        <!-- Team members will be populated here -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>