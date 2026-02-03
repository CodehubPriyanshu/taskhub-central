<?php
require_once __DIR__ . '/config/config.php';

// Handle demo login logic at the top
if (isset($_GET['demo'])) {
    $role = $_GET['demo'];
    
    // Validate role
    if (!in_array($role, ['admin', 'team-leader', 'user'])) {
        session_destroy();
        header("Location: /login.php");
        exit;
    }
    
    // Set session for demo user
    $_SESSION['user_id'] = 1;
    $_SESSION['role'] = $role;
    $_SESSION['user_name'] = 'Demo ' . ucfirst(str_replace('-', ' ', $role));
    $_SESSION['user_email'] = $role . '@taskhub.com';
    
    // Redirect based on role
    switch ($role) {
        case 'admin':
            header("Location: /admin/dashboard");
            break;
        case 'team-leader':
            header("Location: /team-leader/dashboard");
            break;
        case 'user':
            header("Location: /user/dashboard");
            break;
    }
    exit;
}

// If user is already logged in, redirect to dashboard
if (isset($_SESSION['role'])) {
    $role_redirects = [
        'admin' => BASE_PATH . '/admin/dashboard',
        'team_leader' => BASE_PATH . '/team-leader/dashboard',
        'user' => BASE_PATH . '/user/dashboard'
    ];
    $redirect_path = $role_redirects[$_SESSION['role']] ?? BASE_PATH . '/user/dashboard';
    header('Location: ' . $redirect_path);
    exit();
}

// Process login if form is submitted
$error_message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        $error_message = 'Email and password are required';
    } else {
        try {
            // Find user by email
            $stmt = $pdo->prepare("
                SELECT u.id, u.email, u.password, p.name, p.phone, p.team_id, p.is_active, p.created_at, u.role, u.status
                FROM users u
                LEFT JOIN profiles p ON u.id = p.id
                WHERE u.email = ? AND u.status = 'active'
            ");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                $error_message = 'Invalid credentials';
            } else {
                // Check password (handle both hashed and plain text)
                $passwordValid = false;
                if (isset($user['password']) && password_verify($password, $user['password'])) {
                    // Hashed password match
                    $passwordValid = true;
                } elseif (isset($user['password']) && $user['password'] === $password) {
                    // Plain text password match (fallback)
                    $passwordValid = true;
                }
                
                if (!$passwordValid) {
                    $error_message = 'Invalid credentials';
                } else {
                    // Create token (for consistency with existing code)
                    $token = base64_encode(json_encode([
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'exp' => time() + (24 * 60 * 60) // 24 hours
                    ]));
                    
                    // Store token and user info in session
                    $_SESSION['auth_token'] = $token;
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_email'] = $user['email'];
                    $_SESSION['user_name'] = $user['name'] ?? '';
                    $_SESSION['user_role'] = $user['role'];
                    $_SESSION['role'] = $user['role'];
                    
                    // Redirect to appropriate dashboard
                    $role_paths = [
                        'admin' => '/admin/dashboard',
                        'team_leader' => '/team-leader/dashboard',
                        'user' => '/user/dashboard'
                    ];
                    $redirect_path = $role_paths[$user['role']] ?? '/user/dashboard';
                    
                    // Add base path if defined
                    $base_path = defined('BASE_PATH') ? BASE_PATH : '';
                    header('Location: ' . $base_path . $redirect_path);
                    exit();
                }
            }
        } catch (PDOException $e) {
            $error_message = 'Server error during login';
            error_log("Login error: " . $e->getMessage());
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - TaskHub Central</title>
    <link rel="stylesheet" href="/assets/css/common.css">
    <link rel="stylesheet" href="/assets/css/admin.css">
    <link rel="stylesheet" href="/assets/css/team-leader.css">
    <link rel="stylesheet" href="/assets/css/user.css">
    <style>
        /* Login Page Styles */
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        
        .login-container {
            width: 100%;
            max-width: 450px;
            margin: 0 auto;
        }
        
        .login-card {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .login-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .login-header {
            margin-bottom: 32px;
        }
        
        .login-header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .login-header p {
            font-size: 16px;
            color: #7f8c8d;
            font-weight: 400;
        }
        
        .login-form {
            text-align: left;
            margin-bottom: 24px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #2c3e50;
            font-size: 14px;
        }
        
        .form-control {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e1e8ed;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-control::placeholder {
            color: #95a5a6;
        }
        
        .login-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 24px;
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .demo-section {
            border-top: 1px solid #eee;
            padding-top: 24px;
            margin-top: 20px;
        }
        
        .demo-title {
            font-size: 18px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .demo-credentials {
            display: grid;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .credential-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 16px;
            text-align: left;
        }
        
        .credential-role {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 15px;
        }
        
        .credential-info {
            font-size: 13px;
            color: #7f8c8d;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .credential-info div {
            margin-bottom: 4px;
        }
        
        .demo-btn {
            width: 100%;
            padding: 10px;
            background: white;
            border: 1px solid #667eea;
            border-radius: 8px;
            color: #667eea;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .demo-btn:hover {
            background: #667eea;
            color: white;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            margin-top: 16px;
            border: 1px solid #fcc;
            <?php if (empty($error_message)): ?>display: none;<?php endif; ?>
        }
        
        .login-footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #7f8c8d;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1>TaskHub Central</h1>
                <p>Role-Based Task Management System</p>
            </div>
            
            <form method="POST" action="login.php" class="login-form">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" class="form-control" placeholder="Enter your email" autocomplete="username" required value="<?php echo htmlspecialchars($_POST['email'] ?? '', ENT_QUOTES); ?>">
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" class="form-control" placeholder="Enter your password" autocomplete="current-password" required>
                </div>
                
                <button type="submit" class="login-btn">Login</button>
                
                <?php if (!empty($error_message)): ?>
                <div class="error-message" style="display: block;">
                    <?php echo htmlspecialchars($error_message, ENT_QUOTES); ?>
                </div>
                <?php endif; ?>
            </form>
            
            <div class="demo-section">
                <h3 class="demo-title">Demo Access Credentials</h3>
                <div class="demo-credentials">
                    <div class="credential-card">
                        <div class="credential-role">Admin Access</div>
                        <div class="credential-info">
                            <div>Email: admin@taskhub.com</div>
                            <div>Password: password</div>
                        </div>
                        <a href="?demo=admin" class="demo-btn">
                            Login as Admin
                        </a>
                    </div>
                    
                    <div class="credential-card">
                        <div class="credential-role">Team Leader Access</div>
                        <div class="credential-info">
                            <div>Email: team-leader@taskhub.com</div>
                            <div>Password: password</div>
                        </div>
                        <a href="?demo=team-leader" class="demo-btn">
                            Login as Team Leader
                        </a>
                    </div>
                    
                    <div class="credential-card">
                        <div class="credential-role">User Access</div>
                        <div class="credential-info">
                            <div>Email: user@taskhub.com</div>
                            <div>Password: password</div>
                        </div>
                        <a href="?demo=user" class="demo-btn">
                            Login as User
                        </a>
                    </div>
                </div>
            </div>
            
            <div class="login-footer">
                <p>&copy; 2026 TaskHub Central. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>