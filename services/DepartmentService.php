<?php

require_once __DIR__ . '/../models/Department.php';

class DepartmentService {
    private $departmentModel;
    
    public function __construct($pdo) {
        $this->departmentModel = new Department($pdo);
    }
    
    public function getAllDepartments() {
        return $this->departmentModel->findAll();
    }
    
    public function getDepartmentById($id) {
        return $this->departmentModel->findById($id);
    }
    
    public function createDepartment($data) {
        try {
            $deptId = $this->departmentModel->create($data);
            return ['success' => true, 'department_id' => $deptId, 'message' => 'Department created successfully'];
        } catch (Exception $e) {
            error_log("Create department error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error creating department'];
        }
    }
    
    public function updateDepartment($id, $data) {
        try {
            $result = $this->departmentModel->update($id, $data);
            if ($result) {
                return ['success' => true, 'message' => 'Department updated successfully'];
            }
            return ['success' => false, 'message' => 'Department not found'];
        } catch (Exception $e) {
            error_log("Update department error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating department'];
        }
    }
    
    public function deleteDepartment($id) {
        try {
            $result = $this->departmentModel->delete($id);
            if ($result) {
                return ['success' => true, 'message' => 'Department deleted successfully'];
            }
            return ['success' => false, 'message' => 'Department not found'];
        } catch (Exception $e) {
            error_log("Delete department error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error deleting department'];
        }
    }
}