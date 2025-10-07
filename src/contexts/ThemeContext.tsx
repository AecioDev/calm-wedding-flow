import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserTheme(session.user.id);
      } else {
        // Load from localStorage for non-authenticated users
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        if (savedTheme) {
          applyTheme(savedTheme);
        }
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserTheme(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserTheme = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('theme_preference')
      .eq('user_id', userId)
      .single();

    if (data?.theme_preference) {
      applyTheme(data.theme_preference as Theme);
    }
  };

  const applyTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setTheme = async (newTheme: Theme) => {
    applyTheme(newTheme);

    // Save to database if user is logged in
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('user_id', user.id);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
