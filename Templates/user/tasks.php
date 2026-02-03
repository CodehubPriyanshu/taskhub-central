<?php
// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Check if user is authenticated and has user role
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'user') {
    // Redirect to login if not authenticated or not user
    $base_path = defined('BASE_PATH') ? BASE_PATH : '';
    header("Location: $base_path/login");
    exit();
}

// Get user info from session
$user_name = $_SESSION['user_name'] ?? 'User';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Tasks - TaskHub Central</title>
    <link rel="stylesheet" href="/assets/css/common.css">
    <link rel="stylesheet" href="/assets/css/user.css">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f7fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
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
            background: #43e97b;
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
        
        .task-form {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .form-header {
            margin-bottom: 20px;
        }
        
        .form-header h2 {
            margin: 0;
            color: #2c3e50;
            font-size: 24px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #2c3e50;
        }
        
        .form-control {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #43e97b;
            box-shadow: 0 0 0 2px rgba(67, 233, 123, 0.2);
        }
        
        .form-row {
            display: flex;
            gap: 20px;
        }
        
        .form-row .form-group {
            flex: 1;
        }
        
        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            margin-right: 10px;
        }
        
        .submit-btn {
            background: #43e97b;
            color: white;
        }
        
        .submit-btn:hover {
            background: #32d86a;
        }
        
        .update-btn {
            background: #3498db;
            color: white;
        }
        
        .update-btn:hover {
            background: #2980b9;
        }
        
        .task-list {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .task-list h2 {
            margin-top: 0;
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 20px;
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
        
        .priority-high { color: #e74c3c; font-weight: bold; }
        .priority-medium { color: #f39c12; }
        .priority-low { color: #27ae60; }
        
        .task-actions {
            display: flex;
            gap: 5px;
        }
        
        .btn-small {
            padding: 5px 10px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>User Tasks</h1>
            <div class="user-info">
                <div class="user-avatar"><?php echo strtoupper(substr($user_name, 0, 1)); ?></div>
                <div>
                    <div><?php echo htmlspecialchars($user_name); ?></div>
                    <div>Team Member</div>
                </div>
                <button class="logout-btn" onclick="location.href='/logout.php'">Logout</button>
            </div>
        </div>
        
        <!-- Task Submission Form -->
        <div class="task-form">
            <div class="form-header">
                <h2>Submit Task</h2>
            </div>
            <form id="taskForm">
                <div class="form-group">
                    <label for="taskTitle">Task Title</label>
                    <input type="text" id="taskTitle" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea id="taskDescription" class="form-control" rows="4" required></textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="taskPriority">Priority</label>
                        <select id="taskPriority" class="form-control" required>
                            <option value="">Select Priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="taskDeadline">Deadline</label>
                        <input type="date" id="taskDeadline" class="form-control" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <button type="button" id="submitTaskBtn" class="btn submit-btn">Submit Task</button>
                    <button type="button" id="updateStatusBtn" class="btn update-btn">Update Status</button>
                </div>
            </form>
        </div>
        
        <!-- Task List -->
        <div class="task-list">
            <h2>My Tasks</h2>
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="taskTableBody">
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 40px;">
                            No tasks found. Tasks will be populated here.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>