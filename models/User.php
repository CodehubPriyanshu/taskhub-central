<?php

class User {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function findById($id) {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.email, u.password, u.role, u.status, 
                   p.name, p.phone, p.team_id, p.is_active, p.created_at, p.avatar
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function findByEmail($email) {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.email, u.password, u.role, u.status,
                   p.name, p.phone, p.team_id, p.is_active, p.created_at, p.avatar
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.email = ?
        ");
        $stmt->execute([$email]);
        return $stmt->fetch();
    }
    
    public function findAll() {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.email, u.role, u.status,
                   p.name, p.phone, p.team_id, p.is_active, p.created_at
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            ORDER BY u.created_at DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function create($data) {
        try {
            $this->pdo->beginTransaction();
            
            // Insert into users table
            $stmt = $this->pdo->prepare("
                INSERT INTO users (email, password, role, status) 
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['email'],
                $data['password'],
                $data['role'] ?? 'user',
                'active'
            ]);
            $userId = $this->pdo->lastInsertId();
            
            // Insert into profiles table
            $stmt = $this->pdo->prepare("
                INSERT INTO profiles (id, email, name, phone, team_id, is_active, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $userId,
                $data['email'],
                $data['name'],
                $data['phone'] ?? null,
                $data['team_id'] ?? null,
                1,
                $data['created_by'] ?? $userId
            ]);
            
            $this->pdo->commit();
            return $userId;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    public function update($id, $data) {
        try {
            $this->pdo->beginTransaction();
            
            // Update users table
            if (isset($data['email']) || isset($data['password']) || isset($data['role'])) {
                $fields = [];
                $values = [];
                
                if (isset($data['email'])) {
                    $fields[] = "email = ?";
                    $values[] = $data['email'];
                }
                if (isset($data['password'])) {
                    $fields[] = "password = ?";
                    $values[] = $data['password'];
                }
                if (isset($data['role'])) {
                    $fields[] = "role = ?";
                    $values[] = $data['role'];
                }
                
                if (!empty($fields)) {
                    $values[] = $id;
                    $stmt = $this->pdo->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?");
                    $stmt->execute($values);
                }
            }
            
            // Update profiles table
            if (isset($data['name']) || isset($data['phone']) || isset($data['team_id']) || isset($data['is_active'])) {
                $fields = [];
                $values = [];
                
                if (isset($data['name'])) {
                    $fields[] = "name = ?";
                    $values[] = $data['name'];
                }
                if (isset($data['phone'])) {
                    $fields[] = "phone = ?";
                    $values[] = $data['phone'];
                }
                if (isset($data['team_id'])) {
                    $fields[] = "team_id = ?";
                    $values[] = $data['team_id'];
                }
                if (isset($data['is_active'])) {
                    $fields[] = "is_active = ?";
                    $values[] = $data['is_active'];
                }
                
                if (!empty($fields)) {
                    $values[] = $id;
                    $stmt = $this->pdo->prepare("UPDATE profiles SET " . implode(', ', $fields) . " WHERE id = ?");
                    $stmt->execute($values);
                }
            }
            
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    public function delete($id) {
        try {
            $this->pdo->beginTransaction();
            
            // Delete from profiles first (foreign key constraint)
            $stmt = $this->pdo->prepare("DELETE FROM profiles WHERE id = ?");
            $stmt->execute([$id]);
            
            // Delete from users
            $stmt = $this->pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    public function findByTeam($teamId) {
        $stmt = $this->pdo->prepare("
            SELECT u.id, u.email, u.role, u.status,
                   p.name, p.phone, p.team_id, p.is_active, p.created_at
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE p.team_id = ?
            ORDER BY p.name
        ");
        $stmt->execute([$teamId]);
        return $stmt->fetchAll();
    }
}