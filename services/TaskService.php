<?php

require_once __DIR__ . '/../models/Task.php';

class TaskService {
    private $taskModel;
    
    public function __construct($pdo) {
        $this->taskModel = new Task($pdo);
    }
    
    public function getAllTasks() {
        return $this->taskModel->findAll();
    }
    
    public function getTaskById($id) {
        return $this->taskModel->findById($id);
    }
    
    public function getTasksByUser($userId) {
        return $this->taskModel->findByUser($userId);
    }
    
    public function getTasksByTeam($teamId) {
        return $this->taskModel->findByTeam($teamId);
    }
    
    public function createTask($data) {
        try {
            $taskId = $this->taskModel->create($data);
            return ['success' => true, 'task_id' => $taskId, 'message' => 'Task created successfully'];
        } catch (Exception $e) {
            error_log("Create task error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error creating task'];
        }
    }
    
    public function updateTask($id, $data) {
        try {
            $result = $this->taskModel->update($id, $data);
            if ($result) {
                return ['success' => true, 'message' => 'Task updated successfully'];
            }
            return ['success' => false, 'message' => 'Task not found'];
        } catch (Exception $e) {
            error_log("Update task error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating task'];
        }
    }
    
    public function deleteTask($id) {
        try {
            $result = $this->taskModel->delete($id);
            if ($result) {
                return ['success' => true, 'message' => 'Task deleted successfully'];
            }
            return ['success' => false, 'message' => 'Task not found'];
        } catch (Exception $e) {
            error_log("Delete task error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error deleting task'];
        }
    }
    
    public function assignTask($taskId, $userId) {
        try {
            $result = $this->taskModel->assignTask($taskId, $userId);
            if ($result) {
                return ['success' => true, 'message' => 'Task assigned successfully'];
            }
            return ['success' => false, 'message' => 'Task not found'];
        } catch (Exception $e) {
            error_log("Assign task error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error assigning task'];
        }
    }
    
    public function updateTaskStatus($id, $status) {
        try {
            $result = $this->taskModel->updateStatus($id, $status);
            if ($result) {
                return ['success' => true, 'message' => 'Task status updated successfully'];
            }
            return ['success' => false, 'message' => 'Task not found'];
        } catch (Exception $e) {
            error_log("Update task status error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating task status'];
        }
    }
}