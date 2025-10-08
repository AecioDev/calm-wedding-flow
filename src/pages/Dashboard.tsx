import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Users, 
  LogOut,
  Settings,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo-no-bg.png';

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksTotal: 0,
    guestsConfirmed: 0,
    guestsTotal: 0,
    budgetSpent: 0,
    budgetTotal: 0,
  });
  const [hasOrganization, setHasOrganization] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkOrganization();
    }
  }, [user]);

  const checkOrganization = async () => {
    if (!user) return;
    
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!org) {
        setHasOrganization(false);
        navigate('/setup');
      } else {
        setHasOrganization(true);
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error checking organization:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Get user's organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!org) {
        setHasOrganization(false);
        return;
      }

      // Get tasks stats
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status')
        .eq('organization_id', org.id);

      const tasksTotal = tasks?.length || 0;
      const tasksCompleted = tasks?.filter(t => t.status === 'completed').length || 0;

      // Get guests stats
      const { data: guests } = await supabase
        .from('guests')
        .select('status')
        .eq('organization_id', org.id);

      const guestsTotal = guests?.length || 0;
      const guestsConfirmed = guests?.filter(g => g.status === 'confirmed').length || 0;

      // Get budget stats
      const { data: expenses } = await supabase
        .from('expenses')
        .select('estimated_amount, actual_amount')
        .eq('organization_id', org.id);

      const budgetTotal = expenses?.reduce((sum, e) => sum + (Number(e.estimated_amount) || 0), 0) || 0;
      const budgetSpent = expenses?.reduce((sum, e) => sum + (Number(e.actual_amount) || 0), 0) || 0;

      setStats({
        tasksCompleted,
        tasksTotal,
        guestsConfirmed,
        guestsTotal,
        budgetSpent,
        budgetTotal,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Até logo! 💍');
  };

  if (loading || hasOrganization === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="CaZen" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = stats.tasksTotal > 0 
    ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CaZen" className="h-10" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Olá! 💫</h1>
          <p className="text-muted-foreground text-lg">
            Respire fundo, está tudo sob controle. Seu grande dia está mais próximo a cada tarefa concluída.
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 shadow-soft animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Progresso do Casamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tarefas concluídas</span>
                <span className="font-semibold">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {stats.tasksCompleted} de {stats.tasksTotal} tarefas concluídas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-soft animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tarefas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasksCompleted}/{stats.tasksTotal}</div>
              <p className="text-xs text-muted-foreground">Tarefas concluídas</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Convidados</CardTitle>
              <Users className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.guestsConfirmed}/{stats.guestsTotal}</div>
              <p className="text-xs text-muted-foreground">Confirmados</p>
            </CardContent>
          </Card>

          <Card className="shadow-soft animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orçamento</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(stats.budgetSpent)}
              </div>
              <p className="text-xs text-muted-foreground">
                de {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(stats.budgetTotal)} gastos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex-col gap-2">
              <CheckCircle2 className="h-6 w-6" />
              <span>Tarefas</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>Calendário</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <DollarSign className="h-6 w-6" />
              <span>Orçamento</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Convidados</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
