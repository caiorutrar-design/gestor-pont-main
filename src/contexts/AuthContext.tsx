import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  empresaId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch empresa_id when user is available
  useEffect(() => {
    if (user) {
      fetchEmpresaId(user.id);
    } else {
      setEmpresaId(null);
    }
  }, [user]);

  const fetchEmpresaId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('empresa_id')
        .eq('email', user.email)
        .single();
      
      if (data?.empresa_id) {
        setEmpresaId(data.empresa_id);
      } else {
        // Fallback: get from auth metadata or first empresa
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .limit(1)
          .single();
        if (empresa) {
          setEmpresaId(empresa.id);
        }
      }
    } catch (err) {
      console.error('Error fetching empresa_id:', err);
      // Default empresa for now
      setEmpresaId('8ef318ca-1151-4f23-8a5a-aec993a0b6b2');
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, nome: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmpresaId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, empresaId, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook para filtrar queries por empresa
export function useEmpresaFilter() {
  const { empresaId } = useAuth();
  
  return {
    empresaId,
    filter: empresaId ? { empresa_id: empresaId } : {},
  };
}