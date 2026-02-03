<?php
session_start();

// Unset all session variables
$_SESSION = array();

// Destroy the session
session_destroy();

// Redirect to login page
$base_path = defined('BASE_PATH') ? BASE_PATH : '';
header("Location: $base_path/login");
exit();
?>