-- CaZen Database Schema
-- Tabelas principais para gestão de casamentos

-- Enum para tipos de papel do usuário
CREATE TYPE app_role AS ENUM ('admin', 'user', 'vendor');

-- Enum para status de tarefas
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Enum para categorias de tarefas
CREATE TYPE task_category AS ENUM ('ceremony', 'reception', 'guests', 'vendors', 'financial', 'other');

-- Enum para status de convidados
CREATE TYPE guest_status AS ENUM ('pending', 'confirmed', 'declined');

-- Enum para status de despesas
CREATE TYPE expense_status AS ENUM ('pending', 'paid');

-- Enum para planos de assinatura
CREATE TYPE subscription_plan AS ENUM ('free', 'premium');

-- Tabela de perfis de usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de funções de usuário
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Tabela de organizações (eventos de casamento)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  partner_name TEXT,
  wedding_date DATE,
  venue TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tarefas
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category task_category NOT NULL DEFAULT 'other',
  status task_status NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de fornecedores
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  average_price DECIMAL(10, 2),
  rating DECIMAL(3, 2),
  image_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de eventos do calendário
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de despesas/orçamento
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  estimated_amount DECIMAL(10, 2),
  actual_amount DECIMAL(10, 2),
  status expense_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de convidados
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status guest_status NOT NULL DEFAULT 'pending',
  table_number INTEGER,
  plus_one BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de consentimentos (LGPD)
CREATE TABLE consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_accepted BOOLEAN DEFAULT FALSE,
  ip_address INET,
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_events_organization ON events(organization_id);
CREATE INDEX idx_expenses_organization ON expenses(organization_id);
CREATE INDEX idx_guests_organization ON guests(organization_id);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_city ON vendors(city);

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar papel do usuário (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas RLS para organizations
CREATE POLICY "Users can view their own organizations"
  ON organizations FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own organizations"
  ON organizations FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own organizations"
  ON organizations FOR DELETE
  USING (auth.uid() = owner_id);

-- Políticas RLS para tasks
CREATE POLICY "Users can view tasks in their organizations"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = tasks.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their organizations"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_id
      AND organizations.owner_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update tasks in their organizations"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = tasks.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their organizations"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = tasks.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

-- Políticas RLS para vendors (públicos para leitura, mas criação apenas para vendors)
CREATE POLICY "Anyone can view vendors"
  ON vendors FOR SELECT
  USING (TRUE);

CREATE POLICY "Vendors can create their profiles"
  ON vendors FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'vendor') AND auth.uid() = user_id);

CREATE POLICY "Vendors can update their own profiles"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para events
CREATE POLICY "Users can view events in their organizations"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = events.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events in their organizations"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_id
      AND organizations.owner_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update events in their organizations"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = events.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete events in their organizations"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = events.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

-- Políticas RLS para expenses
CREATE POLICY "Users can view expenses in their organizations"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = expenses.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses in their organizations"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_id
      AND organizations.owner_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update expenses in their organizations"
  ON expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = expenses.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses in their organizations"
  ON expenses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = expenses.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

-- Políticas RLS para guests
CREATE POLICY "Users can view guests in their organizations"
  ON guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = guests.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create guests in their organizations"
  ON guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_id
      AND organizations.owner_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

CREATE POLICY "Users can update guests in their organizations"
  ON guests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = guests.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete guests in their organizations"
  ON guests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = guests.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

-- Políticas RLS para subscriptions
CREATE POLICY "Users can view their own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para consents
CREATE POLICY "Users can view their own consents"
  ON consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consents"
  ON consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente ao cadastrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.subscriptions (user_id, plan)
  VALUES (NEW.id, 'free');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_organizations
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_vendors
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_guests
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();