import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

const TeamsPage = () => {
  const { user: currentUser } = useAuthContext();
  const { teams, departments, users, createTeam, updateTeam, deleteTeam } = useDataContext();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    leaderId: '',
  });

  const isAdmin = currentUser?.role === 'admin';
  const isTeamLeader = currentUser?.role === 'team_leader';

  // Team leaders can only see their own team
  if (!isAdmin && !isTeamLeader) {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredTeams = isAdmin ? teams : teams.filter(t => t.id === currentUser?.teamId);

  const handleOpenDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        departmentId: team.departmentId,
        leaderId: team.leaderId || '',
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        departmentId: departments[0]?.id || '',
        leaderId: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.departmentId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (editingTeam) {
      updateTeam(editingTeam.id, {
        name: formData.name,
        departmentId: formData.departmentId,
        leaderId: formData.leaderId || undefined,
      });
      toast({
        title: 'Team Updated',
        description: 'Team has been updated successfully',
      });
    } else {
      createTeam({
        name: formData.name,
        departmentId: formData.departmentId,
        leaderId: formData.leaderId || undefined,
      });
      toast({
        title: 'Team Created',
        description: 'Team has been created successfully',
      });
    }

    setDialogOpen(false);
  };

  const handleDelete = (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteTeam(teamId);
      toast({
        title: 'Team Deleted',
        description: 'Team has been deleted successfully',
      });
    }
  };

  const getDepartmentName = (deptId: string) => {
    return departments.find(d => d.id === deptId)?.name || '-';
  };

  const getLeaderName = (leaderId?: string) => {
    if (!leaderId) return 'No leader assigned';
    return users.find(u => u.id === leaderId)?.name || '-';
  };

  const getTeamMembers = (teamId: string) => {
    return users.filter(u => u.teamId === teamId && u.role === 'user');
  };

  const teamLeaders = users.filter(u => u.role === 'team_leader');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage teams and assign leaders' : 'View your team details'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => {
          const members = getTeamMembers(team.id);
          return (
            <Card key={team.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getDepartmentName(team.departmentId)}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(team)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(team.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Leader</p>
                  <p className="text-sm">{getLeaderName(team.leaderId)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {members.length} Member{members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {members.slice(0, 3).map((member) => (
                      <Badge key={member.id} variant="secondary" className="text-xs">
                        {member.name}
                      </Badge>
                    ))}
                    {members.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{members.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No teams found
        </div>
      )}

      {/* Team Dialog */}
      {isAdmin && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeam ? 'Edit Team' : 'Add Team'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter team name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leader">Team Leader</Label>
                <Select
                  value={formData.leaderId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, leaderId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Leader</SelectItem>
                    {teamLeaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>{leader.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingTeam ? 'Save Changes' : 'Add Team'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TeamsPage;
