<?php
require_once 'config.php';

echo "Setting up TaskFlow database...\n";

try {
    // Create tables if they don't exist
    $queries = [
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        
        "CREATE TABLE IF NOT EXISTS profiles (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            team_id INTEGER,
            department_id INTEGER,
            is_active BOOLEAN DEFAULT 1,
            avatar TEXT,
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
        )",
        
        "CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        
        "CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            department_id INTEGER,
            leader_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )",
        
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            assigned_to INTEGER NOT NULL,
            created_by INTEGER NOT NULL,
            due_date DATE NOT NULL,
            start_date DATE,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'pending',
            team_id INTEGER,
            allows_file_upload BOOLEAN DEFAULT 1,
            allows_text_submission BOOLEAN DEFAULT 1,
            max_files INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )"
    ];
    
    foreach ($queries as $query) {
        $pdo->exec($query);
    }
    
    echo "Tables created successfully!\n";
    
    // Insert sample data
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = 'admin@taskflow.com'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        // Insert admin user
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')");
        $stmt->execute(['admin@taskflow.com', $hashedPassword]);
        $adminId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("INSERT INTO profiles (id, email, name, created_by) VALUES (?, ?, ?, ?)");
        $stmt->execute([$adminId, 'admin@taskflow.com', 'Admin User', $adminId]);
        
        echo "Admin user created: admin@taskflow.com / admin123\n";
    }
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = 'leader@taskflow.com'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        // Insert team leader
        $hashedPassword = password_hash('leader123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'team_leader')");
        $stmt->execute(['leader@taskflow.com', $hashedPassword]);
        $leaderId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("INSERT INTO profiles (id, email, name, created_by) VALUES (?, ?, ?, ?)");
        $stmt->execute([$leaderId, 'leader@taskflow.com', 'Team Leader', $leaderId]);
        
        echo "Team leader created: leader@taskflow.com / leader123\n";
    }
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = 'user@taskflow.com'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        // Insert regular user
        $hashedPassword = password_hash('user123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, 'user')");
        $stmt->execute(['user@taskflow.com', $hashedPassword]);
        $userId = $pdo->lastInsertId();
        
        $stmt = $pdo->prepare("INSERT INTO profiles (id, email, name, created_by) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, 'user@taskflow.com', 'Regular User', $userId]);
        
        echo "Regular user created: user@taskflow.com / user123\n";
    }
    
    // Insert sample department
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM departments WHERE name = 'Engineering'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO departments (name) VALUES (?)");
        $stmt->execute(['Engineering']);
        echo "Sample department created: Engineering\n";
    }
    
    // Insert sample team
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM teams WHERE name = 'Development Team'");
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO teams (name, department_id) VALUES (?, 1)");
        $stmt->execute(['Development Team']);
        echo "Sample team created: Development Team\n";
    }
    
    echo "\nSetup completed successfully!\n";
    echo "You can now access the application at: http://localhost:8000\n";
    echo "Login credentials:\n";
    echo "- Admin: admin@taskflow.com / admin123\n";
    echo "- Team Leader: leader@taskflow.com / leader123\n";
    echo "- User: user@taskflow.com / user123\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>