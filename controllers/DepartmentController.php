<?php

require_once __DIR__ . '/../services/DepartmentService.php';

class DepartmentController {
    private $departmentService;
    
    public function __construct($pdo) {
        $this->departmentService = new DepartmentService($pdo);
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
        $departments = $this->departmentService->getAllDepartments();
        $this->sendSuccess($departments);
    }
    
    private function handleGetById($id) {
        $department = $this->departmentService->getDepartmentById($id);
        if ($department) {
            $this->sendSuccess($department);
        } else {
            $this->sendError(404, 'Department not found');
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
            'created_by' => $_SESSION['user_id'] ?? null
        ];
        
        $result = $this->departmentService->createDepartment($data);
        if ($result['success']) {
            http_response_code(201);
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleUpdate($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $result = $this->departmentService->updateDepartment($id, $input);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(404, $result['message']);
        }
    }
    
    private function handleDelete($id) {
        $result = $this->departmentService->deleteDepartment($id);
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
            if (preg_match('@/departments(/.*)?$@', $request_uri, $matches)) {
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