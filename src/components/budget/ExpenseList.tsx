import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertCircle } from 'lucide-react';
import { ExpenseDialog } from './ExpenseDialog';

interface Expense {
  id: string;
  category: string;
  description: string | null;
  estimated_amount: number | null;
  actual_amount: number | null;
  status: 'pending' | 'paid' | 'overdue';
  paid_at: string | null;
}

interface ExpenseListProps {
  organizationId: string;
  expenses: Expense[];
  onExpensesChange: () => void;
}

const statusLabels = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export function ExpenseList({ organizationId, expenses, onExpensesChange }: ExpenseListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpense(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Despesas</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      <div className="grid gap-4">
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma despesa cadastrada ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEdit(expense)}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{expense.category}</h3>
                    <Badge className={statusColors[expense.status]}>
                      {statusLabels[expense.status]}
                    </Badge>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  {expense.actual_amount !== null ? (
                    <div className="font-semibold">
                      R$ {expense.actual_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Est. R$ {(expense.estimated_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        organizationId={organizationId}
        expense={editingExpense}
        onSuccess={() => {
          handleCloseDialog();
          onExpensesChange();
        }}
      />
    </div>
  );
}
