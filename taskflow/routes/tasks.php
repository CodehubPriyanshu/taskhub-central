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
$taskId = null;
if (preg_match('#^/(\d+)$#', $path, $matches)) {
    $taskId = $matches[1];
    $path = '/:id'; // Normalize path for routing
}

// Route handling
switch ($path) {
    case '/':
        if ($method === 'GET') {
            handleGetAllTasks();
        } elseif ($method === 'POST') {
            handleCreateTask();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/:id':
        if ($method === 'GET') {
            handleGetTask($taskId);
        } elseif ($method === 'PUT') {
            handleUpdateTask($taskId);
        } elseif ($method === 'DELETE') {
            handleDeleteTask($taskId);
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

function handleGetAllTasks() {
    global $pdo;
    
    // Get query parameters
    $assigned_to = $_GET['assigned_to'] ?? null;
    $status = $_GET['status'] ?? null;
    $team_id = $_GET['team_id'] ?? null;
    $created_by_role = $_GET['created_by_role'] ?? null;
    
    try {
        $query = "
            SELECT t.*, p.name as assigned_user_name, p.email as assigned_user_email, 
                   tp.name as team_name, dp.name as department_name, u.role as created_by_role
            FROM tasks t
            LEFT JOIN profiles p ON t.assigned_to = p.id
            LEFT JOIN teams tp ON t.team_id = tp.id
            LEFT JOIN departments dp ON tp.department_id = dp.id
            LEFT JOIN users u ON t.created_by = u.id
            WHERE 1=1
        ";
        $params = [];
        
        if ($assigned_to) {
            $query .= ' AND t.assigned_to = ?';
            $params[] = $assigned_to;
        }
        
        if ($status) {
            $query .= ' AND t.status = ?';
            $params[] = $status;
        }
        
        if ($team_id) {
            $query .= ' AND t.team_id = ?';
            $params[] = $team_id;
        }
        
        if ($created_by_role) {
            $query .= ' AND u.role = ?';
            $params[] = $created_by_role;
        }
        
        $query .= ' ORDER BY t.created_at DESC';
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($tasks);
    } catch (PDOException $e) {
        error_log("Get tasks error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving tasks']);
    }
}

function handleGetTask($id) {
    global $pdo;
    
    try {
        $query = "
            SELECT t.*, p.name as assigned_user_name, p.email as assigned_user_email,
                   tp.name as team_name, dp.name as department_name
            FROM tasks t
            LEFT JOIN profiles p ON t.assigned_to = p.id
            LEFT JOIN teams tp ON t.team_id = tp.id
            LEFT JOIN departments dp ON tp.department_id = dp.id
            WHERE t.id = ?
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$task) {
            http_response_code(404);
            echo json_encode(['message' => 'Task not found']);
            return;
        }
        
        echo json_encode($task);
    } catch (PDOException $e) {
        error_log("Get task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving task']);
    }
}

function handleCreateTask() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $title = trim($input['title'] ?? '');
    $description = $input['description'] ?? null;
    $assigned_to = $input['assigned_to'] ?? null;
    $created_by = $input['created_by'] ?? null;
    $due_date = $input['due_date'] ?? null;
    $start_date = $input['start_date'] ?? null;
    $priority = $input['priority'] ?? 'medium';
    $status = $input['status'] ?? 'pending';
    $team_id = $input['team_id'] ?? null;
    $allows_file_upload = $input['allows_file_upload'] ?? true;
    $allows_text_submission = $input['allows_text_submission'] ?? true;
    $max_files = $input['max_files'] ?? null;
    
    // Validate required fields
    if (empty($title) || empty($assigned_to) || empty($created_by) || empty($due_date)) {
        http_response_code(400);
        echo json_encode(['message' => 'Title, assigned_to, created_by, and due_date are required']);
        return;
    }
    
    try {
        $query = "
            INSERT INTO tasks (
                title, description, assigned_to, created_by, due_date, start_date, 
                priority, status, team_id, 
                allows_file_upload, allows_text_submission, max_files, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ";
        
        $params = [
            $title, $description, $assigned_to, $created_by, $due_date, $start_date,
            $priority, $status, $team_id,
            $allows_file_upload, $allows_text_submission, $max_files
        ];
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $taskId = $pdo->lastInsertId();
        
        http_response_code(201);
        echo json_encode(['id' => $taskId, 'message' => 'Task created successfully']);
    } catch (PDOException $e) {
        error_log("Create task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error creating task']);
    }
}

function handleUpdateTask($id) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $query = "
            UPDATE tasks SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                assigned_to = COALESCE(?, assigned_to),
                due_date = COALESCE(?, due_date),
                start_date = COALESCE(?, start_date),
                priority = COALESCE(?, priority),
                status = COALESCE(?, status),
                team_id = COALESCE(?, team_id),
                allows_file_upload = COALESCE(?, allows_file_upload),
                allows_text_submission = COALESCE(?, allows_text_submission),
                max_files = COALESCE(?, max_files),
                updated_at = NOW()
            WHERE id = ?
        ";
        
        $params = [
            $input['title'] ?? null,
            $input['description'] ?? null,
            $input['assigned_to'] ?? null,
            $input['due_date'] ?? null,
            $input['start_date'] ?? null,
            $input['priority'] ?? null,
            $input['status'] ?? null,
            $input['team_id'] ?? null,
            $input['allows_file_upload'] ?? null,
            $input['allows_text_submission'] ?? null,
            $input['max_files'] ?? null,
            $id
        ];
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        echo json_encode(['message' => 'Task updated successfully']);
    } catch (PDOException $e) {
        error_log("Update task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error updating task']);
    }
}

function handleDeleteTask($id) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Delete related submissions and files first (if tables exist)
        $stmt = $pdo->prepare("DELETE FROM submission_files WHERE submission_id IN (SELECT id FROM task_submissions WHERE task_id = ?)");
        $stmt->execute([$id]);
        
        $stmt = $pdo->prepare("DELETE FROM task_submissions WHERE task_id = ?");
        $stmt->execute([$id]);
        
        // Delete the task
        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        
        echo json_encode(['message' => 'Task deleted successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Delete task error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error deleting task']);
    }
}