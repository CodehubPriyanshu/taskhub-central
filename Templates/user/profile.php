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
$user_email = $_SESSION['user_email'] ?? '';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Profile - TaskHub Central</title>
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
            background: #43e97b;
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
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>My Profile</h1>
            <div class="user-info">
                <div class="user-avatar"><?php echo strtoupper(substr($user_name, 0, 1)); ?></div>
                <div>
                    <div><?php echo htmlspecialchars($user_name); ?></div>
                    <div>Team Member</div>
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
                    <div class="profile-role">Team Member</div>
                </div>
            </div>
            
            <!-- Stats Section -->
            <div class="stats-container">
                <h2>My Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Tasks</h3>
                        <p class="stat-value" id="totalTasks">0</p>
                    </div>
                    <div class="stat-card">
                        <h3>Completed Tasks</h3>
                        <p class="stat-value" id="completedTasks">0</p>
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
                <span class="detail-value" id="profileEmail"><?php echo htmlspecialchars($user_email); ?></span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Role:</span>
                <span class="detail-value" id="profileRole">Team Member</span>
            </div>
        </div>
    </div>
</body>
</html>