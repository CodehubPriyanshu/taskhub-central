<?php
require_once __DIR__ . '/../config/config.php';

header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the request path and method
// Handle routing for PHP built-in server
$path_info = $_SERVER['PATH_INFO'] ?? '';

// If PATH_INFO is not set, extract from REQUEST_URI for built-in server
if (empty($path_info) && isset($_SERVER['REQUEST_URI'])) {
    $request_uri = $_SERVER['REQUEST_URI'];
    // For built-in server, the route file is called directly
    // Extract path after /api/auth
    if (preg_match('@/api/auth(/.*)?$@', $request_uri, $matches)) {
        $path_info = $matches[1] ?? '/';
    }
    // Also handle direct access to auth.php
    elseif (preg_match('@/auth\.php(/.*)?$@', $request_uri, $matches)) {
        $path_info = $matches[1] ?? '/';
    }
}

$path = $path_info ?: '/';
$method = $_SERVER['REQUEST_METHOD'];

// Route handling
switch ($path) {
    case '/login':
        if ($method === 'POST') {
            handleLogin();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/register':
        if ($method === 'POST') {
            handleRegister();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/verify':
        if ($method === 'POST') {
            handleVerifyToken();
        } else if ($method === 'GET') {
            handleSessionVerify();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/update-email':
        if ($method === 'PUT') {
            handleUpdateEmail();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/update-password':
        if ($method === 'PUT') {
            handleUpdatePassword();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/admin/update-credentials':
        if ($method === 'PUT') {
            handleUpdateAdminCredentials();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    default:
        // Fallback for direct access without path routing
        if ($path === '/' && $method === 'POST') {
            // Check if it's a login request sent directly to auth.php
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['email']) && isset($input['password'])) {
                handleLogin();
                break;
            }
        }
        http_response_code(404);
        echo json_encode(['message' => 'Endpoint not found']);
        break;
}

function handleLogin() {
    global $pdo;
    
    // Get the request path and method from global scope
    $path = $_SERVER['PATH_INFO'] ?? '';
    $path = $path ?: '/';
    $method = $_SERVER['REQUEST_METHOD'];
    
    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['message' => 'Email and password are required']);
        return;
    }
    
    try {
        // Find user by email (adapted for current database structure)
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, u.password, p.name, p.phone, p.team_id, p.is_active, p.created_at, u.role, u.status
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.email = ? AND u.status = 'active'
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials']);
            return;
        }
        
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
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials']);
            return;
        }
        
        // Create JWT-like token (simplified for this implementation)
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

        // Server-side redirect for all login requests
        $role_paths = [
            'admin' => '/admin/dashboard',
            'team_leader' => '/team-leader/dashboard',
            'user' => '/user/dashboard'
        ];
        $redirect_path = $role_paths[$user['role']] ?? '/user/dashboard';
        
        // Check if this is a direct login request (not token verification)
        if ($path === '/login' && $method === 'POST') {
            // Return a small HTML page that redirects to the dashboard
            header('Content-Type: text/html');
            echo '<!DOCTYPE html>
';
            echo '<html><head>
';
            echo '<meta http-equiv="refresh" content="0;url=' . htmlspecialchars($redirect_path, ENT_QUOTES, 'UTF-8') . '">
';
            echo '<script>window.location.href = \'' . addslashes($redirect_path) . '\';</script>
';
            echo '</head><body>Redirecting...</body></html>';
            exit();
        }
                
        echo json_encode([
            'success' => true,
            'access_token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email']
            ],
            'profile' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'] ?? '',
                'phone' => $user['phone'] ?? null,
                'team_id' => $user['team_id'] ?? null,
                'is_active' => (bool)($user['is_active'] ?? true),
                'created_at' => $user['created_at'] ?? date('Y-m-d H:i:s')
            ],
            'role' => $user['role']
        ]);
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error during login'
        ]);
    }
}

function handleRegister() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? '');
    $role = $input['role'] ?? 'user';
    $team_id = $input['team_id'] ?? null;
    
    if (empty($email) || empty($password) || empty($name)) {
        http_response_code(400);
        echo json_encode(['message' => 'Email, password, and name are required']);
        return;
    }
    
    try {
        $pdo->beginTransaction();
        
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['message' => 'User already exists']);
            return;
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $pdo->prepare("INSERT INTO users (email, password, role, status) VALUES (?, ?, ?, 'active')");
        $stmt->execute([$email, $password, $role]);
        $userId = $pdo->lastInsertId();
        
        // Insert profile
        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, email, name, phone, team_id, is_active, created_by, created_at) 
            VALUES (?, ?, ?, NULL, ?, TRUE, ?, NOW())
        ");
        $stmt->execute([$userId, $email, $name, $team_id, $userId]);
        
        $pdo->commit();
        
        http_response_code(201);
        echo json_encode(['message' => 'User registered successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Registration error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error during registration']);
    }
}

function handleVerifyToken() {
    global $pdo;
    
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['message' => 'Access token required']);
        return;
    }
    
    $token = $matches[1];
    
    try {
        // Verify token (simplified)
        $tokenData = json_decode(base64_decode($token), true);
        if (!$tokenData || !isset($tokenData['id']) || !isset($tokenData['exp']) || $tokenData['exp'] < time()) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid token']);
            return;
        }
        
        // Get user data
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, u.password, p.name, p.phone, p.team_id, p.is_active, p.created_at, u.role
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$tokenData['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode(['message' => 'User not found']);
            return;
        }
        
        echo json_encode([
            'id' => $user['id'],
            'email' => $user['email'],
            'profile' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'] ?? '',
                'phone' => $user['phone'] ?? null,
                'team_id' => $user['team_id'] ?? null,
                'is_active' => (bool)($user['is_active'] ?? true),
                'created_at' => $user['created_at'] ?? date('Y-m-d H:i:s')
            ],
            'role' => $user['role']
        ]);
    } catch (PDOException $e) {
        error_log("Token verification error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error during token verification']);
    }
}

/**
 * Handle session verification for frontend authentication check
 * This is called via GET request to check if user is logged in
 */
function handleSessionVerify() {
    // Start session if not already started
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }
    
    // Check if user is authenticated
    if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
        // User is authenticated
        echo json_encode([
            'authenticated' => true,
            'role' => $_SESSION['role'],
            'user' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'] ?? '',
                'email' => $_SESSION['user_email'] ?? '',
                'role' => $_SESSION['role']
            ]
        ]);
    } else {
        // User is not authenticated
        echo json_encode([
            'authenticated' => false
        ]);
    }
}

function handleUpdateEmail() {
    global $pdo;
    
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $input = json_decode(file_get_contents('php://input'), true);
    $newEmail = trim($input['new_email'] ?? '');
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['message' => 'Authorization token required']);
        return;
    }
    
    if (empty($newEmail)) {
        http_response_code(400);
        echo json_encode(['message' => 'New email is required']);
        return;
    }
    
    try {
        $token = $matches[1];
        $tokenData = json_decode(base64_decode($token), true);
        
        if (!$tokenData || !isset($tokenData['id'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid token']);
            return;
        }
        
        $pdo->beginTransaction();
        
        // Update users table
        $stmt = $pdo->prepare("UPDATE users SET email = ? WHERE id = ?");
        $stmt->execute([$newEmail, $tokenData['id']]);
        
        // Update profiles table
        $stmt = $pdo->prepare("UPDATE profiles SET email = ? WHERE id = ?");
        $stmt->execute([$newEmail, $tokenData['id']]);
        
        $pdo->commit();
        
        echo json_encode(['message' => 'Email updated successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Update email error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error updating email']);
    }
}

function handleUpdatePassword() {
    global $pdo;
    
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $input = json_decode(file_get_contents('php://input'), true);
    $newPassword = $input['new_password'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['message' => 'Authorization token required']);
        return;
    }
    
    if (empty($newPassword)) {
        http_response_code(400);
        echo json_encode(['message' => 'New password is required']);
        return;
    }
    
    try {
        $token = $matches[1];
        $tokenData = json_decode(base64_decode($token), true);
        
        if (!$tokenData || !isset($tokenData['id'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid token']);
            return;
        }
        
        $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$newPassword, $tokenData['id']]);
        
        echo json_encode(['message' => 'Password updated successfully']);
    } catch (PDOException $e) {
        error_log("Update password error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error updating password']);
    }
}

function handleUpdateAdminCredentials() {
    global $pdo;
    
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    $input = json_decode(file_get_contents('php://input'), true);
    $currentPassword = $input['current_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';
    $newEmail = trim($input['new_email'] ?? '');
    $newName = trim($input['new_name'] ?? '');
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['message' => 'Authorization token required']);
        return;
    }
    
    try {
        $token = $matches[1];
        $tokenData = json_decode(base64_decode($token), true);
        
        if (!$tokenData || !isset($tokenData['id'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid token']);
            return;
        }
        
        // Get current user data
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, u.password, p.name, u.role
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.id = ? AND u.status = 'active'
        ");
        $stmt->execute([$tokenData['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['message' => 'User not found']);
            return;
        }
        
        // Check if user is admin
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['message' => 'Only admins can update credentials']);
            return;
        }
        
        // Verify current password if changing email or password
        if (($newEmail && $newEmail !== $user['email']) || $newPassword) {
            if (empty($currentPassword)) {
                http_response_code(400);
                echo json_encode(['message' => 'Current password is required to update email or password']);
                return;
            }
            
            if (!password_verify($currentPassword, $user['password']) && $currentPassword !== $user['password']) {
                http_response_code(401);
                echo json_encode(['message' => 'Current password is incorrect']);
                return;
            }
        }
        
        // Check if new email already exists
        if ($newEmail && $newEmail !== $user['email']) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $stmt->execute([$newEmail, $tokenData['id']]);
            if ($stmt->fetch()) {
                http_response_code(409);
                echo json_encode(['message' => 'Email already exists']);
                return;
            }
        }
        
        $pdo->beginTransaction();
        
        try {
            if ($newEmail && $newEmail !== $user['email']) {
                $stmt = $pdo->prepare("UPDATE users SET email = ? WHERE id = ?");
                $stmt->execute([$newEmail, $tokenData['id']]);
                
                $stmt = $pdo->prepare("UPDATE profiles SET email = ? WHERE id = ?");
                $stmt->execute([$newEmail, $tokenData['id']]);
            }
            
            if ($newPassword) {
                $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->execute([$newPassword, $tokenData['id']]);
            }
            
            if ($newName && $newName !== $user['name']) {
                $stmt = $pdo->prepare("UPDATE profiles SET name = ? WHERE id = ?");
                $stmt->execute([$newName, $tokenData['id']]);
            }
            
            $pdo->commit();
            
            // Fetch updated user data
            $stmt = $pdo->prepare("
                SELECT u.id, u.email, p.name, u.role
                FROM users u
                LEFT JOIN profiles p ON u.id = p.id
                WHERE u.id = ?
            ");
            $stmt->execute([$tokenData['id']]);
            $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'message' => 'Credentials updated successfully',
                'user' => [
                    'id' => $updatedUser['id'],
                    'email' => $updatedUser['email'],
                    'name' => $updatedUser['name'] ?? '',
                    'role' => $updatedUser['role']
                ]
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    } catch (PDOException $e) {
        error_log("Update admin credentials error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error updating credentials']);
    }
}
?>