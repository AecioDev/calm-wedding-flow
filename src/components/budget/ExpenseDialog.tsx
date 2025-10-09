import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Expense {
  id: string;
  category: string;
  description: string | null;
  estimated_amount: number | null;
  actual_amount: number | null;
  status: 'pending' | 'paid' | 'overdue';
  paid_at: string | null;
}

interface ExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  expense?: Expense | null;
  onSuccess: () => void;
}

export function ExpenseDialog({ open, onOpenChange, organizationId, expense, onSuccess }: ExpenseDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [status, setStatus] = useState<'pending' | 'paid' | 'overdue'>('pending');

  useEffect(() => {
    if (expense) {
      setCategory(expense.category);
      setDescription(expense.description || '');
      setEstimatedAmount(expense.estimated_amount?.toString() || '');
      setActualAmount(expense.actual_amount?.toString() || '');
      setStatus(expense.status);
    } else {
      setCategory('');
      setDescription('');
      setEstimatedAmount('');
      setActualAmount('');
      setStatus('pending');
    }
  }, [expense, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const expenseData = {
      category,
      description: description || null,
      estimated_amount: estimatedAmount ? parseFloat(estimatedAmount) : null,
      actual_amount: actualAmount ? parseFloat(actualAmount) : null,
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      organization_id: organizationId,
      user_id: user.id,
    };

    const { error } = expense
      ? await supabase.from('expenses').update(expenseData).eq('id', expense.id)
      : await supabase.from('expenses').insert([expenseData]);

    setLoading(false);

    if (error) {
      toast.error('Erro ao salvar despesa');
      return;
    }

    toast.success(expense ? 'Despesa atualizada!' : 'Despesa criada!');
    onSuccess();
  };

  const handleDelete = async () => {
    if (!expense) return;

    const { error } = await supabase.from('expenses').delete().eq('id', expense.id);

    if (error) {
      toast.error('Erro ao excluir despesa');
      return;
    }

    toast.success('Despesa excluída!');
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{expense ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              placeholder="Ex: Local, Buffet, Decoração..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated">Valor Estimado (R$)</Label>
              <Input
                id="estimated"
                type="number"
                step="0.01"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actual">Valor Real (R$)</Label>
              <Input
                id="actual"
                type="number"
                step="0.01"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-between pt-4">
            {expense && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
