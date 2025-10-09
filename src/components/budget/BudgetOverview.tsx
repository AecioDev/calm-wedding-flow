import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Expense {
  id: string;
  category: string;
  estimated_amount: number | null;
  actual_amount: number | null;
  status: 'pending' | 'paid' | 'overdue';
}

interface BudgetOverviewProps {
  expenses: Expense[];
  totalBudget?: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function BudgetOverview({ expenses, totalBudget }: BudgetOverviewProps) {
  const totalEstimated = expenses.reduce((sum, exp) => sum + (exp.estimated_amount || 0), 0);
  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.actual_amount || 0), 0);
  const remaining = totalBudget ? totalBudget - totalSpent : totalEstimated - totalSpent;
  const percentageSpent = totalBudget ? (totalSpent / totalBudget) * 100 : (totalSpent / totalEstimated) * 100;

  // Group expenses by category
  const categoryData = expenses.reduce((acc, exp) => {
    const existing = acc.find(item => item.name === exp.category);
    const amount = exp.actual_amount || exp.estimated_amount || 0;
    
    if (existing) {
      existing.value += amount;
    } else {
      acc.push({ name: exp.category, value: amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Gasto</span>
              <span className="font-medium">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Orçamento Total</span>
              <span className="font-medium">R$ {(totalBudget || totalEstimated).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Restante</span>
              <span className={remaining < 0 ? 'text-destructive' : 'text-primary'}>
                R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {remaining < 0 && ' (acima do orçamento)'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{percentageSpent.toFixed(1)}%</span>
            </div>
            <Progress value={percentageSpent} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              Nenhuma despesa cadastrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
