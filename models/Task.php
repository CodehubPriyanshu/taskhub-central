<?php

class Task {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function findById($id) {
        $stmt = $this->pdo->prepare("
            SELECT t.*, u.email as assigned_user_email, p.name as assigned_user_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN profiles p ON t.assigned_to = p.id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function findAll() {
        $stmt = $this->pdo->prepare("
            SELECT t.*, u.email as assigned_user_email, p.name as assigned_user_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN profiles p ON t.assigned_to = p.id
            ORDER BY t.created_at DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function findByUser($userId) {
        $stmt = $this->pdo->prepare("
            SELECT t.*, u.email as assigned_user_email, p.name as assigned_user_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN profiles p ON t.assigned_to = p.id
            WHERE t.assigned_to = ? OR t.created_by = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$userId, $userId]);
        return $stmt->fetchAll();
    }
    
    public function findByTeam($teamId) {
        $stmt = $this->pdo->prepare("
            SELECT t.*, u.email as assigned_user_email, p.name as assigned_user_name
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN profiles p ON t.assigned_to = p.id
            WHERE t.team_id = ?
            ORDER BY t.created_at DESC
        ");
        $stmt->execute([$teamId]);
        return $stmt->fetchAll();
    }
    
    public function create($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO tasks (title, description, status, priority, assigned_to, team_id, created_by, created_at, due_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        ");
        $stmt->execute([
            $data['title'],
            $data['description'] ?? null,
            $data['status'] ?? 'pending',
            $data['priority'] ?? 'medium',
            $data['assigned_to'] ?? null,
            $data['team_id'] ?? null,
            $data['created_by'],
            $data['due_date'] ?? null
        ]);
        return $this->pdo->lastInsertId();
    }
    
    public function update($id, $data) {
        $fields = [];
        $values = [];
        
        foreach ($data as $key => $value) {
            if ($key !== 'id') {
                $fields[] = "$key = ?";
                $values[] = $value;
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $stmt = $this->pdo->prepare("UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = ?");
        return $stmt->execute($values);
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM tasks WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    public function assignTask($taskId, $userId) {
        $stmt = $this->pdo->prepare("UPDATE tasks SET assigned_to = ? WHERE id = ?");
        return $stmt->execute([$userId, $taskId]);
    }
    
    public function updateStatus($id, $status) {
        $stmt = $this->pdo->prepare("UPDATE tasks SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
}