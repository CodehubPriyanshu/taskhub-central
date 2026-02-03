<?php

require_once __DIR__ . '/../services/UserService.php';

class UserController {
    private $userService;
    
    public function __construct($pdo) {
        $this->userService = new UserService($pdo);
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->getPath();
        
        // Extract ID from path if present
        $id = null;
        if (preg_match('@/(\d+)$@', $path, $matches)) {
            $id = $matches[1];
            $path = preg_replace('@/(\d+)$@', '', $path);
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
                
            default:
                $this->sendError(404, 'Endpoint not found');
                break;
        }
    }
    
    private function handleGetAll() {
        $users = $this->userService->getAllUsers();
        $this->sendSuccess($users);
    }
    
    private function handleGetById($id) {
        $user = $this->userService->getUserById($id);
        if ($user) {
            $this->sendSuccess($user);
        } else {
            $this->sendError(404, 'User not found');
        }
    }
    
    private function handleCreate() {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['email', 'password', 'name'];
        
        foreach ($required as $field) {
            if (empty(trim($input[$field] ?? ''))) {
                $this->sendError(400, "$field is required");
                return;
            }
        }
        
        $data = [
            'email' => trim($input['email']),
            'password' => $input['password'],
            'name' => trim($input['name']),
            'role' => $input['role'] ?? 'user',
            'team_id' => $input['team_id'] ?? null,
            'phone' => $input['phone'] ?? null,
            'created_by' => $_SESSION['user_id'] ?? null
        ];
        
        $result = $this->userService->createUser($data);
        if ($result['success']) {
            http_response_code(201);
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleUpdate($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $result = $this->userService->updateUser($id, $input);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function handleDelete($id) {
        $result = $this->userService->deleteUser($id);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function getPath() {
        $path_info = $_SERVER['PATH_INFO'] ?? '';
        
        if (empty($path_info) && isset($_SERVER['REQUEST_URI'])) {
            $request_uri = $_SERVER['REQUEST_URI'];
            if (preg_match('@/users(/.*)?$@', $request_uri, $matches)) {
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