<?php

require_once __DIR__ . '/../models/Team.php';

class TeamService {
    private $teamModel;
    
    public function __construct($pdo) {
        $this->teamModel = new Team($pdo);
    }
    
    public function getAllTeams() {
        return $this->teamModel->findAll();
    }
    
    public function getTeamById($id) {
        return $this->teamModel->findById($id);
    }
    
    public function createTeam($data) {
        try {
            $teamId = $this->teamModel->create($data);
            return ['success' => true, 'team_id' => $teamId, 'message' => 'Team created successfully'];
        } catch (Exception $e) {
            error_log("Create team error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error creating team'];
        }
    }
    
    public function updateTeam($id, $data) {
        try {
            $result = $this->teamModel->update($id, $data);
            if ($result) {
                return ['success' => true, 'message' => 'Team updated successfully'];
            }
            return ['success' => false, 'message' => 'Team not found'];
        } catch (Exception $e) {
            error_log("Update team error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error updating team'];
        }
    }
    
    public function deleteTeam($id) {
        try {
            $result = $this->teamModel->delete($id);
            if ($result) {
                return ['success' => true, 'message' => 'Team deleted successfully'];
            }
            return ['success' => false, 'message' => 'Team not found'];
        } catch (Exception $e) {
            error_log("Delete team error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error deleting team'];
        }
    }
    
    public function getTeamMembers($teamId) {
        return $this->teamModel->getMembers($teamId);
    }
    
    public function addTeamMember($teamId, $userId) {
        try {
            $result = $this->teamModel->addMember($teamId, $userId);
            if ($result) {
                return ['success' => true, 'message' => 'Member added successfully'];
            }
            return ['success' => false, 'message' => 'Error adding member'];
        } catch (Exception $e) {
            error_log("Add team member error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error adding member'];
        }
    }
    
    public function removeTeamMember($teamId, $userId) {
        try {
            $result = $this->teamModel->removeMember($teamId, $userId);
            if ($result) {
                return ['success' => true, 'message' => 'Member removed successfully'];
            }
            return ['success' => false, 'message' => 'Error removing member'];
        } catch (Exception $e) {
            error_log("Remove team member error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Server error removing member'];
        }
    }
}