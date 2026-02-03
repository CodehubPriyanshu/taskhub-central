<?php
// Environment detection
$environment = getenv('ENVIRONMENT') ?: 'development';  // Default to development

// If running via web server, detect environment from HTTP_HOST
if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false && strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === false) {
    $environment = 'production';
}

// Database configuration - environment aware
if ($environment === 'production') {
    // Production (MilesWeb) configuration
    $host = getenv('DB_HOST') ?: 'localhost';  // Set your MilesWeb database host
    $dbname = getenv('DB_NAME') ?: 'taskhub_central_prod';  // Set your production database name
    $username = getenv('DB_USER') ?: 'your_production_username';  // Set your production username
    $password = getenv('DB_PASS') ?: 'your_production_password';  // Set your production password
} else {
    // Development (localhost) configuration
    $host = '127.0.0.1:4306';  // XAMPP MySQL port
    $dbname = 'taskhub_central';
    $username = 'root';
    $password = '';  // XAMPP default is no password
}

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );
} catch(PDOException $e) {
    // Log the error internally but don't expose sensitive details
    error_log("Database connection failed: " . $e->getMessage());
    
    // Return JSON error response for API requests
    if (isset($_SERVER['REQUEST_METHOD'])) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage()
        ]);
        exit;
    } else {
        // For non-API requests, show detailed error
        die("Connection failed: " . $e->getMessage() . "\nPlease contact administrator.");
    }
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

// Safe session start - check if session already exists
if (session_status() == PHP_SESSION_NONE && !headers_sent()) {
    session_start();
} elseif (session_status() == PHP_SESSION_ACTIVE) {
    // Session already active, no need to start
    error_log('Session already started - skipping session_start()');
}
?>