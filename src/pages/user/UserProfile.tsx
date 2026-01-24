import { useEffect, useState } from 'react';
import { useSupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Phone, Users, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];

const UserProfile = () => {
  const { user, profile } = useSupabaseAuthContext();
  const [teamLeader, setTeamLeader] = useState<{ name: string; email: string } | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    submitted: 0,
    reviewed: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !profile) return;

      // Fetch team info
      if (profile.team_id) {
        const { data: teamData } = await supabase
          .from('teams')
          .select('name, leader_id')
          .eq('id', profile.team_id)
          .single();

        if (teamData) {
          setTeamName(teamData.name);
          
          // Fetch team leader profile
          if (teamData.leader_id) {
            const { data: leaderData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', teamData.leader_id)
              .single();
            
            if (leaderData) {
              setTeamLeader(leaderData);
            }
          }
        }
      }

      // Fetch task stats
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('assigned_to', user.id);

      if (tasks) {
        setTaskStats({
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
          submitted: tasks.filter(t => t.status === 'submitted').length,
          reviewed: tasks.filter(t => t.status === 'reviewed').length,
        });
      }
    };

    fetchData();
  }, [user, profile]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{profile?.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">User</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamName ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Team</p>
                  <p className="font-medium">{teamName}</p>
                </div>
              </div>
              {teamLeader && (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Team Leader</p>
                    <p className="font-medium">{teamLeader.name}</p>
                    <p className="text-xs text-muted-foreground">{teamLeader.email}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              You are not assigned to any team yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Task Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Task Summary
          </CardTitle>
          <CardDescription>Overview of your assigned tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{taskStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
              <p className="text-2xl font-bold">{taskStats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <ClipboardList className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{taskStats.submitted}</p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-2xl font-bold">{taskStats.reviewed}</p>
              <p className="text-xs text-muted-foreground">Reviewed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
