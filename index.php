<?php
require_once __DIR__ . '/config/config.php';

// Get the request URI and normalize it
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_uri = rtrim($request_uri, '/');

// Base path for the application (auto-detect)
$base_path = '';
if (strpos($request_uri, '/cm-tm') === 0) {
    $base_path = '/cm-tm';
}
define('BASE_PATH', $base_path);

// Handle static assets - serve them directly
if (preg_match('/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i', $request_uri)) {
    // Remove base path for static assets
    $asset_path = $request_uri;
    if (BASE_PATH !== '' && strpos($asset_path, BASE_PATH) === 0) {
        $asset_path = substr($asset_path, strlen(BASE_PATH));
    }
    $full_path = __DIR__ . $asset_path;
    
    if (file_exists($full_path)) {
        // Set appropriate content type
        $extension = pathinfo($full_path, PATHINFO_EXTENSION);
        $content_types = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
            'eot' => 'application/vnd.ms-fontobject'
        ];
        
        if (isset($content_types[$extension])) {
            header('Content-Type: ' . $content_types[$extension]);
        }
        
        readfile($full_path);
        exit();
    }
    // If asset doesn't exist, return 404
    http_response_code(404);
    exit();
}

// Handle root route - redirect to login
if ($request_uri === '' || $request_uri === '/' || $request_uri === BASE_PATH) {
    header('Location: ' . BASE_PATH . '/login');
    exit();
}

// Handle API routes that go to individual route files
$api_prefixes = array_filter(array_unique([
    BASE_PATH . '/api/',
    '/api/',
    BASE_PATH . '/cm-tm/api/',
    '/cm-tm/api/'
]));
foreach ($api_prefixes as $api_prefix) {
    if ($api_prefix !== '' && strpos($request_uri, $api_prefix) === 0) {
        // Extract the API resource (auth, users, tasks, etc.)
        $path_parts = explode('/', trim(substr($request_uri, strlen($api_prefix)), '/'));
        $resource = $path_parts[0] ?? '';
        
        // Map API resource to the appropriate route file
        $route_file = __DIR__ . '/routes/' . $resource . '.php';
        
        if (file_exists($route_file)) {
            // Include the route file
            require_once $route_file;
            exit();
        } else {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'API endpoint not found']);
            exit();
        }
    }
}

// Handle login page route
if ($request_uri === BASE_PATH . '/login' || $request_uri === BASE_PATH . '/login.php') {
    // Check if already logged in
    if (isset($_SESSION['role'])) {
        // Redirect to appropriate dashboard
        $role_redirects = [
            'admin' => BASE_PATH . '/admin/dashboard',
            'team_leader' => BASE_PATH . '/team-leader/dashboard',
            'user' => BASE_PATH . '/user/dashboard'
        ];
        $redirect_path = $role_redirects[$_SESSION['role']] ?? BASE_PATH . '/user/dashboard';
        header('Location: ' . $redirect_path);
        exit();
    }
    
    // Serve login page
    if (file_exists(__DIR__ . '/login.php')) {
        require_once __DIR__ . '/login.php';
        exit();
    } else {
        http_response_code(404);
        echo '<!DOCTYPE html>
        <html>
        <head><title>404 - Page Not Found</title></head>
        <body><h1>404 - Login page not found</h1></body>
        </html>';
        exit();
    }
}

// Define template routes
$template_routes = [
    // Admin routes
    BASE_PATH . '/admin/dashboard' => [
        'template' => 'Templates/admin/dashboard.php',
        'role' => 'admin'
    ],
    BASE_PATH . '/admin/profile' => [
        'template' => 'Templates/admin/profile.php',
        'role' => 'admin'
    ],
    BASE_PATH . '/admin/tasks' => [
        'template' => 'Templates/admin/tasks.php',
        'role' => 'admin'
    ],
    BASE_PATH . '/admin/teams' => [
        'template' => 'Templates/admin/teams.php',
        'role' => 'admin'
    ],
    BASE_PATH . '/admin/users' => [
        'template' => 'Templates/admin/users.php',
        'role' => 'admin'
    ],
    
    // Team Leader routes
    BASE_PATH . '/team-leader/dashboard' => [
        'template' => 'Templates/team-leader/dashboard.php',
        'role' => 'team_leader'
    ],
    BASE_PATH . '/team-leader/profile' => [
        'template' => 'Templates/team-leader/profile.php',
        'role' => 'team_leader'
    ],
    BASE_PATH . '/team-leader/tasks-user' => [
        'template' => 'Templates/team-leader/tasks-user.php',
        'role' => 'team_leader'
    ],
    BASE_PATH . '/team-leader/tasks' => [
        'template' => 'Templates/team-leader/dashboard.php',
        'role' => 'team_leader'
    ],
    
    // User routes
    BASE_PATH . '/user/dashboard' => [
        'template' => 'Templates/user/dashboard.php',
        'role' => 'user'
    ],
    BASE_PATH . '/user/profile' => [
        'template' => 'Templates/user/profile.php',
        'role' => 'user'
    ],
    BASE_PATH . '/user/tasks' => [
        'template' => 'Templates/user/dashboard.php',
        'role' => 'user'
    ]
];

// Check if template route exists
if (!isset($template_routes[$request_uri])) {
    http_response_code(404);
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>404 - Page Not Found</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            a { color: #3498db; text-decoration: none; }
        </style>
    </head>
    <body>
        <h1>404 - Page Not Found</h1>
        <p>The requested page could not be found.</p>
        <a href="' . BASE_PATH . '/login">Return to Login</a>
    </body>
    </html>';
    exit();
}

// Get route configuration
$route_config = $template_routes[$request_uri];
$required_role = $route_config['role'];
$template_file = $route_config['template'];

// Check authentication and role authorization
$auth_check_path = __DIR__ . '/includes/auth_check.php';
if (file_exists($auth_check_path)) {
    require_once $auth_check_path;
}
if (!function_exists('checkRoleAuthorization')) {
    function checkRoleAuthorization($required_role) {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['role'])) {
            header('Location: ' . BASE_PATH . '/login');
            exit();
        }

        if ($_SESSION['role'] !== $required_role) {
            http_response_code(403);
            echo '<!DOCTYPE html>
            <html>
            <head>
                <title>403 - Forbidden</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    h1 { color: #e74c3c; }
                    a { color: #3498db; text-decoration: none; }
                </style>
            </head>
            <body>
                <h1>403 - Access Denied</h1>
                <p>You do not have permission to access this page.</p>
                <a href="' . BASE_PATH . '/login">Return to Login</a>
            </body>
            </html>';
            exit();
        }
    }
}
checkRoleAuthorization($required_role);

// Check if template file exists
if (!file_exists($template_file)) {
    http_response_code(500);
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>500 - Server Error</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            a { color: #3498db; text-decoration: none; }
        </style>
    </head>
    <body>
        <h1>500 - Template File Not Found</h1>
        <p>The requested template could not be loaded.</p>
        <p>Template: ' . htmlspecialchars($template_file) . '</p>
        <a href="' . BASE_PATH . '/login">Return to Login</a>
    </body>
    </html>';
    exit();
}

// Load the template file
$template_content = file_get_contents($template_file);

// Extract the body content from the template
$body_start = strpos($template_content, '<body>');
$body_end = strrpos($template_content, '</body>');
    
if ($body_start !== false && $body_end !== false) {
    $body_content = substr($template_content, $body_start + 6, $body_end - ($body_start + 6));
    
    // Extract title if available
    $title = 'TaskHub Central';
    if (preg_match('/<title>(.*?)<\/title>/i', $template_content, $title_matches)) {
        $title = $title_matches[1];
    }
    
    // Extract CSS links
    $css_links = '';
    preg_match_all('/<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']*)["\'][^>]*>/i', $template_content, $css_matches);
    if (!empty($css_matches[1])) {
        foreach ($css_matches[1] as $css_href) {
            // Adjust path relative to root
            $adjusted_href = ltrim($css_href, '.');
            $css_links .= '<link rel="stylesheet" href="' . BASE_PATH . $adjusted_href . '">' . "\n";
        }
    }
    
    // Extract inline styles
    $inline_styles = '';
    if (preg_match('/<style[^>]*>(.*?)<\/style>/is', $template_content, $style_matches)) {
        $inline_styles = $style_matches[1];
    }
    
    // Extract JavaScript
    $scripts = '';
    preg_match_all('/<script[^>]*src=["\']([^"\']*)["\'][^>]*><\/script>/i', $template_content, $script_matches);
    if (!empty($script_matches[1])) {
        foreach ($script_matches[1] as $script_src) {
            // Adjust path relative to root
            $adjusted_src = ltrim($script_src, '.');
            $scripts .= '<script src="' . BASE_PATH . $adjusted_src . '"></script>' . "\n";
        }
    }
    
    // Extract inline script content
    $inline_scripts = '';
    if (preg_match('/<script[^>]*>(.*?)<\/script>/is', $template_content, $inline_script_matches)) {
        $inline_scripts = $inline_script_matches[1];
    }
    
    // Generate the complete page with proper base structure
    $output = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($title) . '</title>
    ' . $css_links . '
    <style>
        ' . $inline_styles . '
    </style>
</head>
<body>
    ' . $body_content . '
    ' . $scripts . '
</body>
</html>';

    echo $output;
} else {
    http_response_code(500);
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>500 - Template Parse Error</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            a { color: #3498db; text-decoration: none; }
        </style>
    </head>
    <body>
        <h1>500 - Template Parse Error</h1>
        <p>Could not parse the template file correctly.</p>
        <a href="' . BASE_PATH . '/login">Return to Login</a>
    </body>
    </html>';
}
?>
