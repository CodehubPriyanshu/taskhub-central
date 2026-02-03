<?php

class Team {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function findById($id) {
        $stmt = $this->pdo->prepare("
            SELECT t.*, u.email as leader_email, p.name as leader_name
            FROM teams t
            LEFT JOIN users u ON t.leader_id = u.id
            LEFT JOIN profiles p ON t.leader_id = p.id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function findAll() {
        $stmt = $this->pdo->prepare("
            SELECT t.*, u.email as leader_email, p.name as leader_name
            FROM teams t
            LEFT JOIN users u ON t.leader_id = u.id
            LEFT JOIN profiles p ON t.leader_id = p.id
            ORDER BY t.name
        ");
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function create($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO teams (name, description, leader_id, created_by, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
            $data['leader_id'] ?? null,
            $data['created_by']
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
        $stmt = $this->pdo->prepare("UPDATE teams SET " . implode(', ', $fields) . " WHERE id = ?");
        return $stmt->execute($values);
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM teams WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    public function getMembers($teamId) {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.email, u.role, p.name, p.phone, p.is_active
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE p.team_id = ?
            ORDER BY p.name
        ");
        $stmt->execute([$teamId]);
        return $stmt->fetchAll();
    }
    
    public function addMember($teamId, $userId) {
        $stmt = $this->pdo->prepare("UPDATE profiles SET team_id = ? WHERE id = ?");
        return $stmt->execute([$teamId, $userId]);
    }
    
    public function removeMember($teamId, $userId) {
        $stmt = $this->pdo->prepare("UPDATE profiles SET team_id = NULL WHERE id = ? AND team_id = ?");
        return $stmt->execute([$userId, $teamId]);
    }
}