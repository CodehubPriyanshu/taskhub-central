import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDataContext } from '@/contexts/DataContext';
import { Department } from '@/types';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Building2, UsersRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';

const DepartmentsPage = () => {
  const { user: currentUser } = useAuthContext();
  const { departments, teams, createDepartment, updateDepartment, deleteDepartment } = useDataContext();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formName, setFormName] = useState('');

  // Only admin can access this page
  if (currentUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormName(dept.name);
    } else {
      setEditingDept(null);
      setFormName('');
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a department name',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate name
    const existingDept = departments.find(
      d => d.name.toLowerCase() === formName.toLowerCase() && d.id !== editingDept?.id
    );
    if (existingDept) {
      toast({
        title: 'Validation Error',
        description: 'A department with this name already exists',
        variant: 'destructive',
      });
      return;
    }

    if (editingDept) {
      updateDepartment(editingDept.id, { name: formName });
      toast({
        title: 'Department Updated',
        description: 'Department has been updated successfully',
      });
    } else {
      createDepartment({ name: formName });
      toast({
        title: 'Department Created',
        description: 'Department has been created successfully',
      });
    }

    setDialogOpen(false);
  };

  const handleDelete = (deptId: string) => {
    const hasTeams = teams.some(t => t.departmentId === deptId);
    if (hasTeams) {
      toast({
        title: 'Cannot Delete',
        description: 'This department has teams. Please reassign or delete them first.',
        variant: 'destructive',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteDepartment(deptId);
      toast({
        title: 'Department Deleted',
        description: 'Department has been deleted successfully',
      });
    }
  };

  const getTeamCount = (deptId: string) => {
    return teams.filter(t => t.departmentId === deptId).length;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage company departments</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search departments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Departments Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepartments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              filteredDepartments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{dept.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4 text-muted-foreground" />
                      {getTeamCount(dept.id)} teams
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(dept.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(dept)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Department Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter department name"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingDept ? 'Save Changes' : 'Add Department'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DepartmentsPage;
