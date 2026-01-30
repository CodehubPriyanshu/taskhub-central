<?php
require_once '../config.php';

header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the request path and method
$path = $_SERVER['PATH_INFO'] ?? '/';
$method = $_SERVER['REQUEST_METHOD'];

// Extract ID from path if present
$userId = null;
if (preg_match('#^/(\d+)$#', $path, $matches)) {
    $userId = $matches[1];
    $path = '/:id'; // Normalize path for routing
}

// Route handling
switch ($path) {
    case '/':
        if ($method === 'GET') {
            handleGetAllUsers();
        } elseif ($method === 'POST') {
            handleCreateUser();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/:id':
        if ($method === 'GET') {
            handleGetUser($userId);
        } elseif ($method === 'PUT') {
            handleUpdateUser($userId);
        } elseif ($method === 'DELETE') {
            handleDeleteUser($userId);
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['message' => 'Endpoint not found']);
        break;
}

function handleGetAllUsers() {
    global $pdo;
    
    try {
        $query = "
            SELECT u.id, u.email, u.role, u.status, u.created_at,
                   p.name, p.phone, p.team_id, p.department_id, p.is_active, p.avatar,
                   t.name as team_name, d.name as department_name
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN teams t ON p.team_id = t.id
            LEFT JOIN departments d ON p.department_id = d.id
            ORDER BY u.created_at DESC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($users);
    } catch (PDOException $e) {
        error_log("Get users error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving users']);
    }
}

function handleGetUser($id) {
    global $pdo;
    
    try {
        $query = "
            SELECT u.id, u.email, u.role, u.status, u.created_at,
                   p.name, p.phone, p.team_id, p.department_id, p.is_active, p.avatar,
                   t.name as team_name, d.name as department_name
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN teams t ON p.team_id = t.id
            LEFT JOIN departments d ON p.department_id = d.id
            WHERE u.id = ?
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['message' => 'User not found']);
            return;
        }
        
        echo json_encode($user);
    } catch (PDOException $e) {
        error_log("Get user error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving user']);
    }
}

function handleCreateUser() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? '');
    $role = $input['role'] ?? 'user';
    $team_id = $input['team_id'] ?? null;
    $department_id = $input['department_id'] ?? null;
    $phone = $input['phone'] ?? null;
    $avatar = $input['avatar'] ?? null;
    
    // Validate required fields
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
        $stmt = $pdo->prepare("INSERT INTO users (email, password, role, status, created_at) VALUES (?, ?, ?, 'active', NOW())");
        $stmt->execute([$email, $hashedPassword, $role]);
        $newUserId = $pdo->lastInsertId();
        
        // Insert profile
        $stmt = $pdo->prepare("
            INSERT INTO profiles (id, email, name, phone, team_id, department_id, is_active, avatar, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, ?, NOW())
        ");
        $stmt->execute([$newUserId, $email, $name, $phone, $team_id, $department_id, $avatar, $newUserId]);
        
        $pdo->commit();
        
        http_response_code(201);
        echo json_encode(['id' => $newUserId, 'message' => 'User created successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Create user error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error creating user']);
    }
}

function handleUpdateUser($id) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $pdo->beginTransaction();
        
        // Update users table
        if (isset($input['email']) || isset($input['role']) || isset($input['status'])) {
            $query = "UPDATE users SET ";
            $params = [];
            $updates = [];
            
            if (isset($input['email'])) {
                $updates[] = "email = ?";
                $params[] = $input['email'];
            }
            
            if (isset($input['role'])) {
                $updates[] = "role = ?";
                $params[] = $input['role'];
            }
            
            if (isset($input['status'])) {
                $updates[] = "status = ?";
                $params[] = $input['status'];
            }
            
            if (!empty($updates)) {
                $query .= implode(', ', $updates) . " WHERE id = ?";
                $params[] = $id;
                
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
            }
        }
        
        // Update profiles table
        if (isset($input['name']) || isset($input['phone']) || isset($input['team_id']) || isset($input['department_id']) || isset($input['is_active']) || isset($input['avatar'])) {
            $query = "UPDATE profiles SET ";
            $params = [];
            $updates = [];
            
            if (isset($input['name'])) {
                $updates[] = "name = ?";
                $params[] = $input['name'];
            }
            
            if (isset($input['phone'])) {
                $updates[] = "phone = ?";
                $params[] = $input['phone'];
            }
            
            if (isset($input['team_id'])) {
                $updates[] = "team_id = ?";
                $params[] = $input['team_id'];
            }
            
            if (isset($input['department_id'])) {
                $updates[] = "department_id = ?";
                $params[] = $input['department_id'];
            }
            
            if (isset($input['is_active'])) {
                $updates[] = "is_active = ?";
                $params[] = $input['is_active'];
            }
            
            if (isset($input['avatar'])) {
                $updates[] = "avatar = ?";
                $params[] = $input['avatar'];
            }
            
            if (!empty($updates)) {
                $query .= implode(', ', $updates) . " WHERE id = ?";
                $params[] = $id;
                
                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
            }
        }
        
        $pdo->commit();
        
        echo json_encode(['message' => 'User updated successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Update user error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error updating user']);
    }
}

function handleDeleteUser($id) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Delete related records first
        $stmt = $pdo->prepare("DELETE FROM task_submissions WHERE user_id = ?");
        $stmt->execute([$id]);
        
        $stmt = $pdo->prepare("DELETE FROM submission_files WHERE submission_id IN (SELECT id FROM task_submissions WHERE user_id = ?)");
        $stmt->execute([$id]);
        
        $stmt = $pdo->prepare("DELETE FROM profiles WHERE id = ?");
        $stmt->execute([$id]);
        
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        
        echo json_encode(['message' => 'User deleted successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Delete user error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error deleting user']);
    }
}
?>