import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo-no-bg.png';

export default function OrganizationSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partnerName: '',
    weddingDate: '',
    venue: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('organizations')
        .insert({
          owner_id: user.id,
          partner_name: formData.partnerName,
          wedding_date: formData.weddingDate,
          venue: formData.venue,
        });

      if (error) throw error;

      toast.success('Casamento criado com sucesso! 💍');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar casamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-soft">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="CaZen" className="h-16 mx-auto" />
          <div>
            <CardTitle className="text-3xl mb-2">Bem-vindo ao CaZen! 💫</CardTitle>
            <CardDescription className="text-base">
              Vamos começar configurando os detalhes do seu casamento
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="partnerName" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Nome do(a) parceiro(a)
              </Label>
              <Input
                id="partnerName"
                type="text"
                placeholder="Ex: Maria Silva"
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weddingDate">Data do casamento</Label>
              <Input
                id="weddingDate"
                type="date"
                value={formData.weddingDate}
                onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Local da cerimônia (opcional)</Label>
              <Input
                id="venue"
                type="text"
                placeholder="Ex: Igreja São José"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando...
                </>
              ) : (
                'Começar a planejar 💍'
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Você poderá editar essas informações depois nas configurações
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
