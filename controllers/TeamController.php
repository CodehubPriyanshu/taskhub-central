<?php

require_once __DIR__ . '/../services/TeamService.php';

class TeamController {
    private $teamService;
    
    public function __construct($pdo) {
        $this->teamService = new TeamService($pdo);
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->getPath();
        
        // Extract ID and action from path
        $id = null;
        $action = null;
        
        if (preg_match('@/(\d+)$@', $path, $matches)) {
            $id = $matches[1];
            $path = preg_replace('@/(\d+)$@', '', $path);
        }
        
        if (preg_match('@/action/([^/]+)@', $path, $matches)) {
            $action = $matches[1];
            $path = preg_replace('@/action/[^/]+@', '', $path);
        }
        
        switch ($path) {
            case '/':
            case '':
                if ($method === 'GET') {
                    $this->handleGetAll();
                } elseif ($method === 'POST') {
                    $this->handleCreate();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/':
                if ($id && $method === 'GET') {
                    $this->handleGetById($id);
                } elseif ($id && $method === 'PUT') {
                    $this->handleUpdate($id);
                } elseif ($id && $method === 'DELETE') {
                    $this->handleDelete($id);
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/members':
                if ($id && $method === 'GET') {
                    $this->handleGetMembers($id);
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/add_member':
                if ($id && $method === 'POST') {
                    $this->handleAddMember($id);
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/remove_member':
                if ($id && $method === 'POST') {
                    $this->handleRemoveMember($id);
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            default:
                $this->sendError(404, 'Endpoint not found');
                break;
        }
    }
    
    private function handleGetAll() {
        $teams = $this->teamService->getAllTeams();
        $this->sendSuccess($teams);
    }
    
    private function handleGetById($id) {
        $team = $this->teamService->getTeamById($id);
        if ($team) {
            $this->sendSuccess($team);
        } else {
            $this->sendError(404, 'Team not found');
        }
    }
    
    private function handleCreate() {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['name'];
        
        foreach ($required as $field) {
            if (empty(trim($input[$field] ?? ''))) {
                $this->sendError(400, "$field is required");
                return;
            }
        }
        
        $data = [
            'name' => trim($input['name']),
            'description' => $input['description'] ?? null,
            'leader_id' => $input['leader_id'] ?? null,
            'created_by' => $_SESSION['user_id'] ?? null
        ];
        
        $result = $this->teamService->createTeam($data);
        if ($result['success']) {
            http_response_code(201);
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleUpdate($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $result = $this->teamService->updateTeam($id, $input);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function handleDelete($id) {
        $result = $this->teamService->deleteTeam($id);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function handleGetMembers($teamId) {
        $members = $this->teamService->getTeamMembers($teamId);
        $this->sendSuccess($members);
    }
    
    private function handleAddMember($teamId) {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? null;
        
        if (!$userId) {
            $this->sendError(400, 'User ID is required');
            return;
        }
        
        $result = $this->teamService->addTeamMember($teamId, $userId);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleRemoveMember($teamId) {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? null;
        
        if (!$userId) {
            $this->sendError(400, 'User ID is required');
            return;
        }
        
        $result = $this->teamService->removeTeamMember($teamId, $userId);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function getPath() {
        $path_info = $_SERVER['PATH_INFO'] ?? '';
        
        if (empty($path_info) && isset($_SERVER['REQUEST_URI'])) {
            $request_uri = $_SERVER['REQUEST_URI'];
            if (preg_match('@/teams(/.*)?$@', $request_uri, $matches)) {
                $path_info = $matches[1] ?? '/';
            }
        }
        
        return $path_info ?: '/';
    }
    
    private function sendSuccess($data) {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'data' => $data]);
    }
    
    private function sendError($code, $message) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $message]);
    }
}