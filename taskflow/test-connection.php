<?php
// Test database connection
require_once 'config.php';

echo "<h2>TaskFlow Database Connection Test</h2>";

try {
    // Test basic connection
    echo "<p>✅ Database connection: <strong>SUCCESS</strong></p>";
    
    // Test users table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch()['count'];
    echo "<p>✅ Users table: Found {$userCount} users</p>";
    
    // Test teams table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM teams");
    $teamCount = $stmt->fetch()['count'];
    echo "<p>✅ Teams table: Found {$teamCount} teams</p>";
    
    // Test departments table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM departments");
    $deptCount = $stmt->fetch()['count'];
    echo "<p>✅ Departments table: Found {$deptCount} departments</p>";
    
    // Test tasks table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tasks");
    $taskCount = $stmt->fetch()['count'];
    echo "<p>✅ Tasks table: Found {$taskCount} tasks</p>";
    
    // Check default admin user
    $stmt = $pdo->query("SELECT * FROM users WHERE email = 'admin@taskflow.com'");
    $adminUser = $stmt->fetch();
    
    if ($adminUser) {
        echo "<p>✅ Default admin user found:</p>";
        echo "<ul>";
        echo "<li>Name: {$adminUser['name']}</li>";
        echo "<li>Email: {$adminUser['email']}</li>";
        echo "<li>Role: {$adminUser['role']}</li>";
        echo "</ul>";
    } else {
        echo "<p>❌ Default admin user not found!</p>";
    }
    
    echo "<h3>System Ready!</h3>";
    echo "<p>You can now access the system at: <a href='index.html'>Login Page</a></p>";
    
} catch (PDOException $e) {
    echo "<p>❌ Database connection failed: " . $e->getMessage() . "</p>";
    echo "<p>Please check your database configuration in config.php</p>";
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>