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
$teamId = null;
if (preg_match('#^/(\d+)$#', $path, $matches)) {
    $teamId = $matches[1];
    $path = '/:id'; // Normalize path for routing
}

// Route handling
switch ($path) {
    case '/':
        if ($method === 'GET') {
            handleGetAllTeams();
        } elseif ($method === 'POST') {
            handleCreateTeam();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Method not allowed']);
        }
        break;
        
    case '/:id':
        if ($method === 'GET') {
            handleGetTeam($teamId);
        } elseif ($method === 'PUT') {
            handleUpdateTeam($teamId);
        } elseif ($method === 'DELETE') {
            handleDeleteTeam($teamId);
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

function handleGetAllTeams() {
    global $pdo;
    
    try {
        $query = "
            SELECT t.id, t.name, t.department_id, t.leader_id, t.created_at, t.updated_at,
                   d.name as department_name,
                   p.name as leader_name, p.email as leader_email
            FROM teams t
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN profiles p ON t.leader_id = p.id
            ORDER BY t.name ASC
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add user count for each team
        foreach ($teams as &$team) {
            $stmt = $pdo->prepare("SELECT COUNT(*) as user_count FROM profiles WHERE team_id = ?");
            $stmt->execute([$team['id']]);
            $count = $stmt->fetch(PDO::FETCH_ASSOC);
            $team['user_count'] = $count['user_count'];
        }
        
        echo json_encode($teams);
    } catch (PDOException $e) {
        error_log("Get teams error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving teams']);
    }
}

function handleGetTeam($id) {
    global $pdo;
    
    try {
        $query = "
            SELECT t.id, t.name, t.department_id, t.leader_id, t.created_at, t.updated_at,
                   d.name as department_name,
                   p.name as leader_name, p.email as leader_email
            FROM teams t
            LEFT JOIN departments d ON t.department_id = d.id
            LEFT JOIN profiles p ON t.leader_id = p.id
            WHERE t.id = ?
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        $team = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$team) {
            http_response_code(404);
            echo json_encode(['message' => 'Team not found']);
            return;
        }
        
        // Add user count
        $stmt = $pdo->prepare("SELECT COUNT(*) as user_count FROM profiles WHERE team_id = ?");
        $stmt->execute([$id]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $team['user_count'] = $count['user_count'];
        
        echo json_encode($team);
    } catch (PDOException $e) {
        error_log("Get team error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error retrieving team']);
    }
}

function handleCreateTeam() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($input['name'] ?? '');
    $department_id = $input['department_id'] ?? null;
    $leader_id = $input['leader_id'] ?? null;
    
    // Validate required fields
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['message' => 'Team name is required']);
        return;
    }
    
    try {
        $query = "INSERT INTO teams (name, department_id, leader_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$name, $department_id, $leader_id]);
        $teamId = $pdo->lastInsertId();
        
        http_response_code(201);
        echo json_encode(['id' => $teamId, 'message' => 'Team created successfully']);
    } catch (PDOException $e) {
        error_log("Create team error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error creating team']);
    }
}

function handleUpdateTeam($id) {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $query = "UPDATE teams SET ";
        $params = [];
        $updates = [];
        
        if (isset($input['name'])) {
            $updates[] = "name = ?";
            $params[] = $input['name'];
        }
        
        if (isset($input['department_id'])) {
            $updates[] = "department_id = ?";
            $params[] = $input['department_id'];
        }
        
        if (isset($input['leader_id'])) {
            $updates[] = "leader_id = ?";
            $params[] = $input['leader_id'];
        }
        
        if (empty($updates)) {
            echo json_encode(['message' => 'No fields to update']);
            return;
        }
        
        $query .= implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        echo json_encode(['message' => 'Team updated successfully']);
    } catch (PDOException $e) {
        error_log("Update team error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error updating team']);
    }
}

function handleDeleteTeam($id) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Update profiles to remove team association
        $stmt = $pdo->prepare("UPDATE profiles SET team_id = NULL WHERE team_id = ?");
        $stmt->execute([$id]);
        
        // Delete the team
        $stmt = $pdo->prepare("DELETE FROM teams WHERE id = ?");
        $stmt->execute([$id]);
        
        $pdo->commit();
        
        echo json_encode(['message' => 'Team deleted successfully']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Delete team error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['message' => 'Server error deleting team']);
    }
}
?>