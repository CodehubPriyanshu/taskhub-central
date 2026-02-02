-- Simple TaskHub Central MySQL Setup
-- Run this ENTIRE script in phpMyAdmin SQL tab at once
-- Make sure you've selected the 'taskhub_central' database first

-- Create all tables in correct order
-- 1. Users table (foundation)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'team_leader', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Teams table (no foreign keys yet)
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    leader_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Profiles table (only references users)
CREATE TABLE IF NOT EXISTS profiles (
    id INT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    team_id INT,
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    avatar TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    assigned_to INT NOT NULL,
    created_by INT NOT NULL,
    due_date DATE NOT NULL,
    start_date DATE,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'rejected', 'awaiting_acceptance', 'needs_attention') DEFAULT 'pending',
    team_id INT,
    allows_file_upload BOOLEAN DEFAULT TRUE,
    allows_text_submission BOOLEAN DEFAULT TRUE,
    max_files INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Task submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    user_id INT NOT NULL,
    submission_text TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT,
    feedback TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Submission files table
CREATE TABLE IF NOT EXISTS submission_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints that reference other tables
ALTER TABLE teams 
    ADD CONSTRAINT fk_teams_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_teams_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE profiles
    ADD CONSTRAINT fk_profiles_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_profiles_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE tasks
    ADD CONSTRAINT fk_tasks_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Insert sample data
-- Departments
INSERT IGNORE INTO departments (name) VALUES 
('Engineering'),
('Marketing'),
('Sales'),
('HR'),
('Finance'),
('Operations');

-- Users
INSERT IGNORE INTO users (email, password, role) VALUES 
('admin@taskhub.com', 'password', 'admin'),
('leader@taskhub.com', 'password', 'team_leader'),
('user@taskhub.com', 'password', 'user');

-- Profiles (using subqueries to get user IDs)
INSERT IGNORE INTO profiles (id, email, name, created_by) 
SELECT id, email, 
       CASE 
           WHEN email = 'admin@taskhub.com' THEN 'Admin User'
           WHEN email = 'leader@taskhub.com' THEN 'Team Leader'
           WHEN email = 'user@taskhub.com' THEN 'Regular User'
       END,
       id 
FROM users 
WHERE email IN ('admin@taskhub.com', 'leader@taskhub.com', 'user@taskhub.com');

-- Teams
SET @engineering_id = (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1);
SET @leader_id = (SELECT id FROM users WHERE email = 'leader@taskhub.com');

INSERT IGNORE INTO teams (name, department_id, leader_id) 
VALUES ('Development Team', @engineering_id, @leader_id);

-- Assign users to team
SET @team_id = (SELECT id FROM teams WHERE name = 'Development Team');
SET @user_id = (SELECT id FROM users WHERE email = 'user@taskhub.com');

UPDATE profiles SET team_id = @team_id, department_id = @engineering_id
WHERE id IN (@leader_id, @user_id);

-- Sample task
INSERT IGNORE INTO tasks (title, description, assigned_to, created_by, due_date, priority, status, team_id) 
VALUES (
    'Setup TaskHub System',
    'Complete the initial setup of the TaskHub Central system',
    @user_id,
    @leader_id,
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    'high',
    'pending',
    @team_id
);

-- Verify setup
SELECT 'Setup Complete!' as Status;
SELECT COUNT(*) as Users FROM users;
SELECT COUNT(*) as Departments FROM departments;
SELECT COUNT(*) as Teams FROM teams;
SELECT COUNT(*) as Tasks FROM tasks;