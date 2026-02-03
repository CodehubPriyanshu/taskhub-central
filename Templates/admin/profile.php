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
    <title>Admin Profile - TaskHub Central</title>
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
        
        .profile-container {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 30px;
        }
        
        .profile-sidebar {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .profile-image {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .avatar {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: #667eea;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .profile-name {
            font-size: 24px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 5px 0;
        }
        
        .profile-role {
            color: #7f8c8d;
            font-size: 16px;
        }
        
        .stats-container {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }
        
        .stat-card {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
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
        
        .profile-details {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }
        
        .detail-item:last-child {
            border-bottom: none;
        }
        
        .detail-label {
            font-weight: 600;
            color: #7f8c8d;
        }
        
        .detail-value {
            color: #2c3e50;
        }
        
        .user-form {
            background: white;
            border-radius: 10px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-top: 30px;
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
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Admin Profile</h1>
            <div class="user-info">
                <div class="user-avatar"><?php echo strtoupper(substr($user_name, 0, 1)); ?></div>
                <div>
                    <div><?php echo htmlspecialchars($user_name); ?></div>
                    <div>Administrator</div>
                </div>
                <button class="logout-btn" onclick="location.href='/logout.php'">Logout</button>
            </div>
        </div>
        
        <div class="profile-container">
            <!-- Profile Sidebar -->
            <div class="profile-sidebar">
                <div class="profile-image">
                    <div class="avatar"><?php echo strtoupper(substr($user_name, 0, 1)); ?></div>
                    <h2 class="profile-name"><?php echo htmlspecialchars($user_name); ?></h2>
                    <div class="profile-role">Administrator</div>
                </div>
            </div>
            
            <!-- Stats Section -->
            <div class="stats-container">
                <h2>System Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Users</h3>
                        <p class="stat-value" id="totalUsers">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Active Teams</h3>
                        <p class="stat-value" id="activeTeams">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Departments</h3>
                        <p class="stat-value" id="totalDepartments">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Pending Tasks</h3>
                        <p class="stat-value" id="pendingTasks">0</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Profile Details -->
        <div class="profile-details">
            <h2>Profile Information</h2>
            <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value" id="profileName"><?php echo htmlspecialchars($user_name); ?></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value" id="profileEmail"><?php echo htmlspecialchars($_SESSION['user_email'] ?? ''); ?></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Role:</span>
                <span class="detail-value" id="profileRole">Administrator</span>
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
    </div>
</body>
</html>