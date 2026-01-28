import { useState, useMemo, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Users, User, Building2, Search } from 'lucide-react';
import { Team, User as UserType } from '@/types';
import { useToast } from '@/hooks/use-toast';

const AdminTeamsPage = () => {
  const { user: currentUser } = useAuthContext();
  const { teams, users, departments, createTeam, updateTeam, deleteTeam } = useDataContext();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Team creation/editing form state
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    leaderId: 'none',
    departmentId: '',
    description: '',
  });

  // Filter teams based on search
  const filteredTeams = useMemo(() => {
    if (!searchQuery) return teams;
    
    const query = searchQuery.toLowerCase();
    return teams.filter(team => 
      team.name.toLowerCase().includes(query) ||
      (team.leaderId && users.find(u => u.id === team.leaderId)?.name.toLowerCase().includes(query))
    );
  }, [teams, users, searchQuery]);

  // Get team leader user object
  const getTeamLeader = (leaderId?: string) => {
    if (!leaderId) return null;
    return users.find(u => u.id === leaderId && u.role === 'team_leader');
  };

  // Get department name
  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return 'No Department';
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || 'Unknown Department';
  };

  // Get team member count
  const getTeamMemberCount = (teamId: string) => {
    return users.filter(u => u.teamId === teamId && u.role === 'user').length;
  };

  // Handle create team button click
  const handleCreateTeam = () => {
    setSelectedTeam(null);
    setDialogMode('create');
    setTeamFormData({
      name: '',
      leaderId: 'none',
      departmentId: '',
      description: '',
    });
    setDialogOpen(true);
  };

  // Handle edit team
  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setDialogMode('edit');
    setTeamFormData({
      name: team.name,
      leaderId: team.leaderId || 'none',
      departmentId: team.departmentId,
      description: '', // Description not in current Team type
    });
    setDialogOpen(true);
  };

  // Handle form submission
  const handleTeamFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamFormData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }

    if (dialogMode === 'create' && (!teamFormData.leaderId || teamFormData.leaderId === 'none')) {
      toast({
        title: 'Validation Error',
        description: 'Please select a team leader',
        variant: 'destructive',
      });
      return;
    }

    if (dialogMode === 'create') {
      // Validate leader is a team leader
      const leader = users.find(u => u.id === teamFormData.leaderId);
      if (!leader || leader.role !== 'team_leader') {
        toast({
          title: 'Validation Error',
          description: 'Please select a valid team leader',
          variant: 'destructive',
        });
        return;
      }

      // Check if leader already has a team
      const existingTeamWithLeader = teams.find(t => t.leaderId === teamFormData.leaderId);
      if (existingTeamWithLeader) {
        toast({
          title: 'Validation Error',
          description: 'This team leader already manages another team',
          variant: 'destructive',
        });
        return;
      }

      createTeam(
        {
          name: teamFormData.name.trim(),
          departmentId: teamFormData.departmentId,
          leaderId: teamFormData.leaderId === 'none' ? undefined : teamFormData.leaderId,
        },
        currentUser?.id
      );

      toast({
        title: 'Team Created',
        description: `Team "${teamFormData.name}" created successfully`,
      });
    } else if (dialogMode === 'edit' && selectedTeam) {
      updateTeam(selectedTeam.id, {
        name: teamFormData.name.trim(),
        departmentId: teamFormData.departmentId,
        leaderId: teamFormData.leaderId === 'none' ? undefined : teamFormData.leaderId,
      });

      toast({
        title: 'Team Updated',
        description: `Team "${teamFormData.name}" updated successfully`,
      });
    }

    setDialogOpen(false);
  };

  // Get available team leaders (those not already leading a team)
  const getAvailableTeamLeaders = () => {
    const currentLeaderIds = teams.map(t => t.leaderId).filter(Boolean);
    return users.filter(u => 
      u.role === 'team_leader' && 
      u.isActive &&
      u.id &&
      u.name &&
      (!selectedTeam || u.id === selectedTeam.leaderId || !currentLeaderIds.includes(u.id))
    );
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setTeamFormData({
        name: '',
        leaderId: 'none',
        departmentId: '',
        description: '',
      });
    }
  }, [dialogOpen]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Create and manage teams with team leaders</p>
        </div>
        <Button onClick={handleCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teams.length}</p>
                <p className="text-xs text-muted-foreground">Total Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <User className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teams.filter(t => t.leaderId).length}
                </p>
                <p className="text-xs text-muted-foreground">Teams with Leaders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {teams.filter(t => !t.leaderId).length}
                </p>
                <p className="text-xs text-muted-foreground">Teams without Leaders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teams or team leaders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No teams found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search query' 
                  : 'Create your first team to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateTeam}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Team Leader</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => {
                  const leader = getTeamLeader(team.leaderId);
                  const memberCount = getTeamMemberCount(team.id);
                  
                  return (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        {leader ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                              {leader.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{leader.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No Leader</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{getDepartmentName(team.departmentId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{memberCount} members</Badge>
                      </TableCell>
                      <TableCell>
                        {leader ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Needs Leader</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Team Creation/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create New Team' : 'Edit Team'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTeamFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                value={teamFormData.name}
                onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                placeholder="Enter team name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team-leader">Team Leader *</Label>
              {getAvailableTeamLeaders().length > 0 ? (
                <Select
                  value={teamFormData.leaderId}
                  onValueChange={(value) => setTeamFormData({ ...teamFormData, leaderId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTeamLeaders().map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-destructive/50 bg-destructive/5 p-3">
                  <p className="text-sm text-destructive">
                    No available team leaders. Please create a user with Team Leader role first.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Only users with Team Leader role can be assigned
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={teamFormData.departmentId}
                onValueChange={(value) => setTeamFormData({ ...teamFormData, departmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {dialogMode === 'create' ? 'Create Team' : 'Update Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeamsPage;