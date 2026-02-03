<?php

class Department {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function findById($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM departments WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function findAll() {
        $stmt = $this->pdo->prepare("SELECT * FROM departments ORDER BY name");
        $stmt->execute();
        return $stmt->fetchAll();
    }
    
    public function create($data) {
        $stmt = $this->pdo->prepare("
            INSERT INTO departments (name, description, created_by, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([
            $data['name'],
            $data['description'] ?? null,
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
        $stmt = $this->pdo->prepare("UPDATE departments SET " . implode(', ', $fields) . " WHERE id = ?");
        return $stmt->execute($values);
    }
    
    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM departments WHERE id = ?");
        return $stmt->execute([$id]);
    }
}