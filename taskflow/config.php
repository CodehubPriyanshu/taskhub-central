<?php
// Database configuration (using SQLite for simplicity)
$dbFile = __DIR__ . '/taskflow.db';

try {
    $pdo = new PDO("sqlite:$dbFile");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Enable foreign key constraints
    $pdo->exec("PRAGMA foreign_keys = ON");
    
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// Set default timezone
ini_set('date.timezone', 'UTC');

// Enable CORS for API requests (only for API requests)
if (isset($_SERVER['REQUEST_METHOD'])) {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

// Start session (only if not already started and no headers sent)
if(session_status() == PHP_SESSION_NONE && !headers_sent()) {
    session_start();
}
?>