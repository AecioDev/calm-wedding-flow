import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskDialog } from './TaskDialog';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  category: 'ceremony' | 'reception' | 'vendors' | 'guests' | 'financial' | 'other';
  priority: number;
  due_date: string | null;
  completed_at: string | null;
}

interface TaskListProps {
  organizationId: string;
  tasks: Task[];
  onTasksChange: () => void;
}

const categoryLabels = {
  ceremony: 'Cerimônia',
  reception: 'Recepção',
  vendors: 'Fornecedores',
  guests: 'Convidados',
  financial: 'Financeiro',
  other: 'Outros'
};

const categoryColors = {
  ceremony: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  reception: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  vendors: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  guests: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  financial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

export function TaskList({ organizationId, tasks, onTasksChange }: TaskListProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    
    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', task.id);

    if (error) {
      toast.error('Erro ao atualizar tarefa');
      return;
    }

    toast.success(newStatus === 'completed' ? 'Tarefa concluída!' : 'Tarefa reaberta');
    onTasksChange();
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Tarefas</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="grid gap-4">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma tarefa cadastrada ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {pendingTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-start gap-4 p-4">
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleToggleComplete(task)}
                  />
                  <div className="flex-1 space-y-2 cursor-pointer" onClick={() => handleEdit(task)}>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <Badge className={categoryColors[task.category]}>
                        {categoryLabels[task.category]}
                      </Badge>
                      {task.priority > 0 && (
                        <Badge variant="destructive">Alta prioridade</Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(task.due_date), "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-muted-foreground">Concluídas</h3>
                {completedTasks.map((task) => (
                  <Card key={task.id} className="opacity-60">
                    <CardContent className="flex items-start gap-4 p-4">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleToggleComplete(task)}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-through">{task.title}</h3>
                          <Badge className={categoryColors[task.category]}>
                            {categoryLabels[task.category]}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        organizationId={organizationId}
        task={editingTask}
        onSuccess={() => {
          handleCloseDialog();
          onTasksChange();
        }}
      />
    </div>
  );
}
