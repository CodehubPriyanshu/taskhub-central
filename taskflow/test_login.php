<?php
require_once 'config.php';

// Test login function
function testLogin($email, $password) {
    global $pdo;
    
    try {
        // Find user by email
        $stmt = $pdo->prepare("
            SELECT u.id, u.email, u.password, p.name, p.phone, p.team_id, p.is_active, p.created_at, u.role
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.email = ? AND u.status = 'active'
        ");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }
        
        if (!password_verify($password, $user['password'])) {
            return ['success' => false, 'message' => 'Invalid password'];
        }
        
        // Create token
        $token = base64_encode(json_encode([
            'id' => $user['id'],
            'email' => $user['email'],
            'exp' => time() + (24 * 60 * 60)
        ]));
        
        return [
            'success' => true,
            'access_token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email']
            ],
            'profile' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'] ?? '',
                'phone' => $user['phone'] ?? null,
                'team_id' => $user['team_id'] ?? null,
                'is_active' => (bool)($user['is_active'] ?? true),
                'created_at' => $user['created_at'] ?? date('Y-m-d H:i:s')
            ],
            'role' => $user['role']
        ];
        
    } catch (PDOException $e) {
        return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
    }
}

// Test the login
echo "Testing login functionality...\n\n";

$tests = [
    ['admin@taskflow.com', 'admin123'],
    ['leader@taskflow.com', 'leader123'],
    ['user@taskflow.com', 'user123'],
    ['invalid@user.com', 'wrongpass']
];

foreach ($tests as $test) {
    list($email, $password) = $test;
    echo "Testing: $email / $password\n";
    $result = testLogin($email, $password);
    echo "Result: " . ($result['success'] ? 'SUCCESS' : 'FAILED') . "\n";
    if (!$result['success']) {
        echo "Message: " . $result['message'] . "\n";
    } else {
        echo "Role: " . $result['role'] . "\n";
    }
    echo "---\n";
}
?>