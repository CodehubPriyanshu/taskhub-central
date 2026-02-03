<?php

require_once __DIR__ . '/../services/AuthService.php';

// Base path for the application
if (!defined('BASE_PATH')) {
    define('BASE_PATH', '/cm-tm');
}

class AuthController {
    private $authService;
    
    public function __construct($pdo) {
        $this->authService = new AuthService($pdo);
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->getPath();
        
        switch ($path) {
            case '/login':
                if ($method === 'POST') {
                    $this->handleLogin();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/register':
                if ($method === 'POST') {
                    $this->handleRegister();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/verify':
                if ($method === 'POST') {
                    $this->handleVerifyToken();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/update-email':
                if ($method === 'PUT') {
                    $this->handleUpdateEmail();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/update-password':
                if ($method === 'PUT') {
                    $this->handleUpdatePassword();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/admin/update-credentials':
                if ($method === 'PUT') {
                    $this->handleUpdateAdminCredentials();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/logout':
                if ($method === 'POST') {
                    $this->handleLogout();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            case '/me':
                if ($method === 'GET') {
                    $this->handleGetCurrentUser();
                } else {
                    $this->sendError(405, 'Method not allowed');
                }
                break;
                
            default:
                $this->sendError(404, 'Endpoint not found');
                break;
        }
    }
    
    private function handleLogin() {
        $input = json_decode(file_get_contents('php://input'), true);
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            $this->sendError(400, 'Email and password are required');
            return;
        }
        
        $result = $this->authService->login($email, $password);
        if ($result['success']) {
            // Server-side redirect based on role with base path
            $role_redirects = [
                'admin' => BASE_PATH . '/admin/dashboard',
                'team_leader' => BASE_PATH . '/team-leader/dashboard',
                'user' => BASE_PATH . '/user/dashboard'
            ];
            
            $redirect_path = $role_redirects[$result['role']] ?? BASE_PATH . '/user/dashboard';
            
            // Perform server-side redirect
            header('Location: ' . $redirect_path);
            exit();
        } else {
            $this->sendError(401, $result['message']);
        }
    }
    
    private function handleRegister() {
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
        
        $result = $this->authService->register($data);
        if ($result['success']) {
            http_response_code(201);
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleVerifyToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $this->sendError(401, 'Access token required');
            return;
        }
        
        $token = $matches[1];
        $userData = $this->authService->verifyToken($token);
        
        if ($userData) {
            $this->sendSuccess($userData);
        } else {
            $this->sendError(401, 'Invalid token');
        }
    }
    
    private function handleUpdateEmail() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        $input = json_decode(file_get_contents('php://input'), true);
        $newEmail = trim($input['new_email'] ?? '');
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $this->sendError(401, 'Authorization token required');
            return;
        }
        
        if (empty($newEmail)) {
            $this->sendError(400, 'New email is required');
            return;
        }
        
        $token = $matches[1];
        $tokenData = json_decode(base64_decode($token), true);
        
        if (!$tokenData || !isset($tokenData['id'])) {
            $this->sendError(401, 'Invalid token');
            return;
        }
        
        $result = $this->authService->updateEmail($tokenData['id'], $newEmail);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleUpdatePassword() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        $input = json_decode(file_get_contents('php://input'), true);
        $newPassword = $input['new_password'] ?? '';
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $this->sendError(401, 'Authorization token required');
            return;
        }
        
        if (empty($newPassword)) {
            $this->sendError(400, 'New password is required');
            return;
        }
        
        $token = $matches[1];
        $tokenData = json_decode(base64_decode($token), true);
        
        if (!$tokenData || !isset($tokenData['id'])) {
            $this->sendError(401, 'Invalid token');
            return;
        }
        
        $result = $this->authService->updatePassword($tokenData['id'], $newPassword);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $this->sendError(500, $result['message']);
        }
    }
    
    private function handleUpdateAdminCredentials() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $this->sendError(401, 'Authorization token required');
            return;
        }
        
        $token = $matches[1];
        $tokenData = json_decode(base64_decode($token), true);
        
        if (!$tokenData || !isset($tokenData['id'])) {
            $this->sendError(401, 'Invalid token');
            return;
        }
        
        $data = [
            'current_password' => $input['current_password'] ?? '',
            'new_password' => $input['new_password'] ?? null,
            'new_email' => trim($input['new_email'] ?? ''),
            'new_name' => trim($input['new_name'] ?? '')
        ];
        
        $result = $this->authService->updateAdminCredentials($tokenData['id'], $data);
        if ($result['success']) {
            $this->sendSuccess($result);
        } else {
            $errorCode = 400;
            if (strpos($result['message'], 'Only admins') !== false) {
                $errorCode = 403;
            } elseif (strpos($result['message'], 'incorrect') !== false) {
                $errorCode = 401;
            }
            $this->sendError($errorCode, $result['message']);
        }
    }
    
    private function handleLogout() {
        $result = $this->authService->logout();
        $this->sendSuccess($result);
    }
    
    private function handleGetCurrentUser() {
        $user = $this->authService->getCurrentUser();
        if ($user) {
            $this->sendSuccess($user);
        } else {
            $this->sendError(401, 'Not authenticated');
        }
    }
    
    private function getPath() {
        $path_info = $_SERVER['PATH_INFO'] ?? '';
        
        if (empty($path_info) && isset($_SERVER['REQUEST_URI'])) {
            $request_uri = $_SERVER['REQUEST_URI'];
            // Extract path after /api/auth
            if (preg_match('@/api/auth(/.*)?$@', $request_uri, $matches)) {
                $path_info = $matches[1] ?? '/';
            }
        }
        
        return $path_info ?: '/';
    }
    
    private function sendSuccess($data) {
        header('Content-Type: application/json');
        echo json_encode($data);
    }
    
    private function sendError($code, $message) {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $message]);
    }
}