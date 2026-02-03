<?php
// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Check if user is authenticated and has admin role
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    // Redirect to login if not authenticated or not admin
    $base_path = defined('BASE_PATH') ? BASE_PATH : '';
    header("Location: $base_path/login");
    exit();
}

// Get user info from session
$user_name = $_SESSION['user_name'] ?? 'Admin';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Users - TaskHub Central</title>
    <link rel="stylesheet" href="/assets/css/common.css">
    <link rel="stylesheet" href="/assets/css/admin.css">
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
            background: #667eea;
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
        
        .user-form {
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
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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
            background: #667eea;
            color: white;
        }
        
        .submit-btn:hover {
            background: #5a6fd8;
        }
        
        .cancel-btn {
            background: #95a5a6;
            color: white;
        }
        
        .cancel-btn:hover {
            background: #7f8c8d;
        }
        
        .user-list {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .user-list h2 {
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
        
        .status-active { background: #d4edda; color: #155724; }
        .status-inactive { background: #f8d7da; color: #721c24; }
        
        .user-actions {
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
            <h1>User Management</h1>
            <div class="user-info">
                <div class="user-avatar"><?php echo strtoupper(substr($user_name, 0, 1)); ?></div>
                <div>
                    <div><?php echo htmlspecialchars($user_name); ?></div>
                    <div>Administrator</div>
                </div>
                <button class="logout-btn" onclick="location.href='/logout.php'">Logout</button>
            </div>
        </div>
        
        <!-- User Creation Form -->
        <div class="user-form">
            <div class="form-header">
                <h2>Create New User</h2>
            </div>
            <form id="userForm">
                <div class="form-group">
                    <label for="userName">Full Name</label>
                    <input type="text" id="userName" class="form-control" required>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="userEmail">Email</label>
                        <input type="email" id="userEmail" class="form-control" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="userRole">Role</label>
                        <select id="userRole" class="form-control" required>
                            <option value="">Select Role</option>
                            <option value="admin">Administrator</option>
                            <option value="team_leader">Team Leader</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="userPassword">Password</label>
                    <input type="password" id="userPassword" class="form-control" required>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">Create User</button>
                </div>
            </form>
        </div>
        
        <!-- User List -->
        <div class="user-list">
            <h2>Existing Users</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="usersTableBody">
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px;">
                            No users found. Users will be populated here.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>