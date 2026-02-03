<?php

require_once __DIR__ . '/../services/TaskService.php';

class TaskController {
    private $taskService;
    
    public function __construct($pdo) {
        $this->taskService = new TaskService($pdo);
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
                
            case '/assign':
                if ($id && $method === 'POST') {
                    $this->handleAssign($id);
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/status':
                if ($id && $method === 'PUT') {
                    $this->handleUpdateStatus($id);
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
        $tasks = $this->taskService->getAllTasks();
        $this->sendSuccess($tasks);
    }
    
    private function handleGetById($id) {
        $task = $this->taskService->getTaskById($id);
        if ($task) {
            $this->sendSuccess($task);
        } else {
            $this->sendError(404, 'Task not found');
        }
    }
    
    private function handleCreate() {
        $input = json_decode(file_get_contents('php://input'), true);
        $required = ['title'];
        
        foreach ($required as $field) {
            if (empty(trim($input[$field] ?? ''))) {
                $this->sendError(400, "$field is required");
                return;
            }
        }
        
        $data = [
            'title' => trim($input['title']),
            'description' => $input['description'] ?? null,
            'status' => $input['status'] ?? 'pending',
            'priority' => $input['priority'] ?? 'medium',
            'assigned_to' => $input['assigned_to'] ?? null,
            'team_id' => $input['team_id'] ?? null,
            'created_by' => $_SESSION['user_id'] ?? null,
            'due_date' => $input['due_date'] ?? null
        ];
        
        $result = $this->taskService->createTask($data);
        if ($result['success']) {
            http_response_code(201);
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleUpdate($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $result = $this->taskService->updateTask($id, $input);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function handleDelete($id) {
        $result = $this->taskService->deleteTask($id);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function handleAssign($taskId) {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $input['user_id'] ?? null;
        
        if (!$userId) {
            $this->sendError(400, 'User ID is required');
            return;
        }
        
        $result = $this->taskService->assignTask($taskId, $userId);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function handleUpdateStatus($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $status = $input['status'] ?? null;
        
        if (!$status) {
            $this->sendError(400, 'Status is required');
            return;
        }
        
        $result = $this->taskService->updateTaskStatus($id, $status);
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
            if (preg_match('@/tasks(/.*)?$@', $request_uri, $matches)) {
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