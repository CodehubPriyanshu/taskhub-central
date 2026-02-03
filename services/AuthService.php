<?php

require_once __DIR__ . '/../models/User.php';

class AuthService {
    private $pdo;
    private $userModel;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->userModel = new User($pdo);
    }
    
    public function login($email, $password) {
        $user = $this->userModel->findByEmail($email);
        
        if (!$user) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }
        
        // Check password (handle both hashed and plain text)
        $passwordValid = false;
        if (isset($user['password']) && password_verify($password, $user['password'])) {
            $passwordValid = true;
        } elseif (isset($user['password']) && $user['password'] === $password) {
            $passwordValid = true;
        }
        
        if (!$passwordValid) {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }
        
        // Create token
        $token = $this->createToken($user['id'], $user['email']);
        
        // Store in session
        $_SESSION['auth_token'] = $token;
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];  // Store role in 'role' key
        $_SESSION['user_role'] = $user['role'];  // Also store in 'user_role' for backward compatibility
        $_SESSION['user_name'] = $user['name'] ?? '';
        $_SESSION['user_email'] = $user['email'];
        
        return [
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
        ];
    }
    
    public function register($data) {
        try {
            // Check if user already exists
            $existingUser = $this->userModel->findByEmail($data['email']);
            if ($existingUser) {
                return ['success' => false, 'message' => 'User already exists'];
            }
            
            // Hash password
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Create user
            $userId = $this->userModel->create($data);
            
            return ['success' => true, 'message' => 'User registered successfully', 'user_id' => $userId];
        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error during registration'];
        }
    }
    
    public function verifyToken($token) {
        try {
            $tokenData = json_decode(base64_decode($token), true);
            if (!$tokenData || !isset($tokenData['id']) || !isset($tokenData['exp']) || $tokenData['exp'] < time()) {
                return false;
            }
            
            $user = $this->userModel->findById($tokenData['id']);
            if (!$user) {
                return false;
            }
            
            return [
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
            ];
        } catch (Exception $e) {
            error_log("Token verification error: " . $e->getMessage());
            return false;
        }
    }
    
    public function updateEmail($userId, $newEmail) {
        try {
            $this->userModel->update($userId, ['email' => $newEmail]);
            return ['success' => true, 'message' => 'Email updated successfully'];
        } catch (Exception $e) {
            error_log("Update email error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating email'];
        }
    }
    
    public function updatePassword($userId, $newPassword) {
        try {
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $this->userModel->update($userId, ['password' => $hashedPassword]);
            return ['success' => true, 'message' => 'Password updated successfully'];
        } catch (Exception $e) {
            error_log("Update password error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating password'];
        }
    }
    
    public function updateAdminCredentials($userId, $data) {
        try {
            $user = $this->userModel->findById($userId);
            
            if (!$user || $user['role'] !== 'admin') {
                return ['success' => false, 'message' => 'Only admins can update credentials'];
            }
            
            // Verify current password if changing email or password
            if ((isset($data['new_email']) && $data['new_email'] !== $user['email']) || isset($data['new_password'])) {
                if (empty($data['current_password'])) {
                    return ['success' => false, 'message' => 'Current password is required'];
                }
                
                if (!password_verify($data['current_password'], $user['password']) && 
                    $data['current_password'] !== $user['password']) {
                    return ['success' => false, 'message' => 'Current password is incorrect'];
                }
            }
            
            // Check if new email already exists
            if (isset($data['new_email']) && $data['new_email'] !== $user['email']) {
                $existingUser = $this->userModel->findByEmail($data['new_email']);
                if ($existingUser && $existingUser['id'] != $userId) {
                    return ['success' => false, 'message' => 'Email already exists'];
                }
            }
            
            // Update credentials
            $updateData = [];
            if (isset($data['new_email'])) {
                $updateData['email'] = $data['new_email'];
            }
            if (isset($data['new_password'])) {
                $updateData['password'] = password_hash($data['new_password'], PASSWORD_DEFAULT);
            }
            if (isset($data['new_name'])) {
                $updateData['name'] = $data['new_name'];
            }
            
            if (!empty($updateData)) {
                $this->userModel->update($userId, $updateData);
            }
            
            // Get updated user data
            $updatedUser = $this->userModel->findById($userId);
            
            return [
                'success' => true,
                'message' => 'Credentials updated successfully',
                'user' => [
                    'id' => $updatedUser['id'],
                    'email' => $updatedUser['email'],
                    'name' => $updatedUser['name'] ?? '',
                    'role' => $updatedUser['role']
                ]
            ];
        } catch (Exception $e) {
            error_log("Update admin credentials error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating credentials'];
        }
    }
    
    public function logout() {
        session_unset();
        session_destroy();
        session_start();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }
    
    private function createToken($userId, $email) {
        return base64_encode(json_encode([
            'id' => $userId,
            'email' => $email,
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]));
    }
    
    public function getCurrentUser() {
        if (!isset($_SESSION['user_id'])) {
            return null;
        }
        
        return $this->userModel->findById($_SESSION['user_id']);
    }
}