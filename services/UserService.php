<?php

require_once __DIR__ . '/../models/User.php';

class UserService {
    private $userModel;
    
    public function __construct($pdo) {
        $this->userModel = new User($pdo);
    }
    
    public function getAllUsers() {
        return $this->userModel->findAll();
    }
    
    public function getUserById($id) {
        return $this->userModel->findById($id);
    }
    
    public function createUser($data) {
        try {
            $userId = $this->userModel->create($data);
            return ['success' => true, 'user_id' => $userId, 'message' => 'User created successfully'];
        } catch (Exception $e) {
            error_log("Create user error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error creating user'];
        }
    }
    
    public function updateUser($id, $data) {
        try {
            $result = $this->userModel->update($id, $data);
            if ($result) {
                return ['success' => true, 'message' => 'User updated successfully'];
            }
            return ['success' => false, 'message' => 'User not found'];
        } catch (Exception $e) {
            error_log("Update user error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating user'];
        }
    }
    
    public function deleteUser($id) {
        try {
            $result = $this->userModel->delete($id);
            if ($result) {
                return ['success' => true, 'message' => 'User deleted successfully'];
            }
            return ['success' => false, 'message' => 'User not found'];
        } catch (Exception $e) {
            error_log("Delete user error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error deleting user'];
        }
    }
    
    public function getUsersByTeam($teamId) {
        return $this->userModel->findByTeam($teamId);
    }
}