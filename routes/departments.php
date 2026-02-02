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
$departmentId = null;
if (preg_match('#^/(\d+)$#', $path, $matches)) {
    $departmentId = $matches[1];
    $path = '/:id'; // Normalize path for routing
}

// Route handling
switch ($path) {
    case '/':
        if ($method === 'GET') {
            handleGetAllDepartments();
        } elseif ($method === 'POST') {
            handleCreateDepartment();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/:id':
        if ($method === 'GET') {
            handleGetDepartment($departmentId);
        } elseif ($method === 'PUT') {
            handleUpdateDepartment($departmentId);
        } elseif ($method === 'DELETE') {
            handleDeleteDepartment($departmentId);
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

function handleGetAllDepartments() {
    global $pdo;
    
    try {
        $query = "
            SELECT d.id, d.name, d.created_at, d.updated_at,
                   COUNT(p.id) as user_count
            FROM departments d
            LEFT JOIN profiles p ON d.id = p.department_id
            GROUP BY d.id, d.name, d.created_at, d.updated_at
            ORDER BY d.name ASC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($departments);
    } catch (PDOException $e) {
        error_log("Get departments error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving departments']);
    }
}

function handleGetDepartment($id) {
    global $pdo;
    
    try {
        $query = "
            SELECT d.id, d.name, d.created_at, d.updated_at,
                   COUNT(p.id) as user_count
            FROM departments d
            LEFT JOIN profiles p ON d.id = p.department_id
            WHERE d.id = ?
            GROUP BY d.id, d.name, d.created_at, d.updated_at
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        $department = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$department) {
            http_response_code(404);
            echo json_encode(['message' => 'Department not found']);
            return;
        }
        
        echo json_encode($department);
    } catch (PDOException $e) {
        error_log("Get department error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving department']);
    }
}

function handleCreateDepartment() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($input['name'] ?? '');
    
    // Validate required fields
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['message' => 'Department name is required']);
        return;
    }
    
    try {
        // Check if department already exists
        $stmt = $pdo->prepare("SELECT id FROM departments WHERE name = ?");
        $stmt->execute([$name]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['message' => 'Department already exists']);
            return;
        }
        
        $query = "INSERT INTO departments (name, created_at, updated_at) VALUES (?, NOW(), NOW())";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$name]);
        $departmentId = $pdo->lastInsertId();
        
        http_response_code(201);
        echo json_encode(['id' => $departmentId, 'message' => 'Department created successfully']);
    } catch (PDOException $e) {
        error_log("Create department error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error creating department']);
    }
}

function handleUpdateDepartment($id) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        if (isset($input['name'])) {
            // Check if new name already exists
            $stmt = $pdo->prepare("SELECT id FROM departments WHERE name = ? AND id != ?");
            $stmt->execute([$input['name'], $id]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['message' => 'Department name already exists']);
                return;
            }
            
            $query = "UPDATE departments SET name = ?, updated_at = NOW() WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$input['name'], $id]);
        }
        
        echo json_encode(['message' => 'Department updated successfully']);
    } catch (PDOException $e) {
        error_log("Update department error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error updating department']);
    }
}

function handleDeleteDepartment($id) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Update profiles to remove department association
        $stmt = $pdo->prepare("UPDATE profiles SET department_id = NULL WHERE department_id = ?");
        $stmt->execute([$id]);
        
        // Update teams to remove department association
        $stmt = $pdo->prepare("UPDATE teams SET department_id = NULL WHERE department_id = ?");
        $stmt->execute([$id]);
        
        // Delete the department
        $stmt = $pdo->prepare("DELETE FROM departments WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        
        echo json_encode(['message' => 'Department deleted successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Delete department error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error deleting department']);
    }
}
?>