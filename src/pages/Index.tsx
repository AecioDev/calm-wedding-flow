import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Calendar, DollarSign, Users, Heart, Sparkles } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: CheckCircle2,
      title: 'Gestão de Tarefas',
      description: 'Organize todas as etapas do seu casamento de forma intuitiva',
    },
    {
      icon: Calendar,
      title: 'Calendário Inteligente',
      description: 'Nunca perca um prazo importante com lembretes automáticos',
    },
    {
      icon: DollarSign,
      title: 'Controle Financeiro',
      description: 'Acompanhe seu orçamento com clareza e tranquilidade',
    },
    {
      icon: Users,
      title: 'Lista de Convidados',
      description: 'Gerencie confirmações e organize mesas com facilidade',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-zen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <img src={logo} alt="CaZen" className="h-32 mx-auto" />
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Organize seu casamento com serenidade
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            O CaZen é sua plataforma completa para planejar cada detalhe do seu grande dia
            com calma, clareza e muito amor.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 shadow-glow"
            >
              <Heart className="mr-2 h-5 w-5" />
              Começar Agora
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
            >
              Já tenho conta
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
            <Sparkles className="h-4 w-4" />
            <span>Gratuito para começar • Sem cartão de crédito</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tudo que você precisa em um só lugar
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="shadow-soft animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="pt-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-3xl mx-auto shadow-glow bg-gradient-warm text-primary-foreground">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Pronto para começar?
            </h2>
            <p className="text-lg opacity-90">
              Seu casamento dos sonhos começa aqui, com organização e paz de espírito.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="text-lg px-8"
            >
              Criar Conta Gratuita
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 CaZen. Organize seu casamento com serenidade. 💍</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
