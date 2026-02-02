# TaskFlow - Role-Based Task Management System

A complete HTML/PHP implementation of a role-based task management system with a modern, professional login interface that matches the React/Vite version functionality.

## Features

- **Modern Login Interface**: Professional landing-style login screen with demo credentials
- **Role-based Access Control**: Admin, Team Leader, and User roles
- **Complete Authentication System**: Login, registration, and session management
- **Task Management**: Create, assign, and track tasks
- **Team Management**: Organize users into teams and departments
- **User Management**: Admin panel for user administration
- **Responsive Design**: Works on all device sizes
- **RESTful API**: Backend API with consistent endpoints

## System Requirements

- PHP 7.4 or higher
- SQLite (included) or MySQL database
- Web server (Apache/Nginx) or PHP built-in server

## Installation

1. **Clone or download** the project files
2. **Navigate to the taskflow directory**:
   ```bash
   cd taskflow
   ```
3. **Run the setup script** to create database and sample data:
   ```bash
   php setup.php
   ```
4. **Start the development server**:
   ```bash
   php -S localhost:8000
   ```

## Login Credentials

After setup, you can use these accounts to test the system:

- **Admin**: `admin@taskflow.com` / `admin123`
- **Team Leader**: `leader@taskflow.com` / `leader123`  
- **User**: `user@taskflow.com` / `user123`

## Directory Structure

```
taskflow/
├── config.php           # Database configuration
├── setup.php            # Database setup script
├── index.html           # Modern login page with demo credentials
├── dashboard.html       # User dashboard after login
├── css/                 # Stylesheets
│   ├── common.css      # Shared styles
│   ├── admin.css       # Admin styles
│   ├── team-leader.css # Team leader styles
│   └── user.css        # User styles
├── js/                  # JavaScript files
│   ├── api.js          # API client (matching React structure)
│   └── auth.js         # Authentication manager
├── routes/             # API endpoints
│   ├── auth.php        # Authentication routes
│   ├── users.php       # User management routes
│   ├── teams.php       # Team management routes
│   ├── departments.php # Department routes
│   └── tasks.php       # Task management routes
└── templates/          # HTML templates
    ├── admin/          # Admin pages
    ├── team-leader/    # Team leader pages
    └── user/           # User pages
```

## API Endpoints

### Authentication
- `POST /routes/auth.php/login` - User login
- `POST /routes/auth.php/register` - User registration
- `POST /routes/auth.php/verify` - Token verification
- `PUT /routes/auth.php/update-email` - Update email
- `PUT /routes/auth.php/update-password` - Update password
- `PUT /routes/auth.php/admin/update-credentials` - Admin credential updates

### Users
- `GET /routes/users.php` - Get all users
- `GET /routes/users.php/:id` - Get user by ID
- `POST /routes/users.php` - Create user
- `PUT /routes/users.php/:id` - Update user
- `DELETE /routes/users.php/:id` - Delete user

### Teams
- `GET /routes/teams.php` - Get all teams
- `GET /routes/teams.php/:id` - Get team by ID
- `POST /routes/teams.php` - Create team
- `PUT /routes/teams.php/:id` - Update team
- `DELETE /routes/teams.php/:id` - Delete team

### Departments
- `GET /routes/departments.php` - Get all departments
- `GET /routes/departments.php/:id` - Get department by ID
- `POST /routes/departments.php` - Create department
- `PUT /routes/departments.php/:id` - Update department
- `DELETE /routes/departments.php/:id` - Delete department

### Tasks
- `GET /routes/tasks.php` - Get all tasks (with filters)
- `GET /routes/tasks.php/:id` - Get task by ID
- `POST /routes/tasks.php` - Create task
- `PUT /routes/tasks.php/:id` - Update task
- `DELETE /routes/tasks.php/:id` - Delete task

## Key Features Implementation

### Authentication System
- JWT-like token authentication using base64 encoding
- Session-based storage (localStorage/sessionStorage)
- Role-based access control
- Automatic token verification

### API Client
- Matching React/Vite API structure exactly
- Consistent error handling
- Automatic token injection
- Promise-based requests

### Database Structure
- Users table with roles and status
- Profiles table with user details
- Departments and Teams organization
- Tasks with assignment and tracking

### Frontend Architecture
- Pure HTML/CSS/JavaScript (no frameworks)
- Modular component structure
- Responsive design patterns
- Consistent UI/UX across roles

## Development Notes

This implementation maintains 100% compatibility with the React/Vite version:
- Identical API endpoints and data structures
- Same authentication flow and logic
- Matching user interface and navigation
- Consistent data handling and validation

The system can be easily deployed to shared hosting environments and works with both SQLite (development) and MySQL (production) databases.

## Testing

Run the built-in test script to verify functionality:
```bash
php test_login.php
```

This will test all user credentials and authentication flows.