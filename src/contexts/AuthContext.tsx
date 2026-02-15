import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => { },
  loginAsDemo: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check for demo mode in localStorage first
    const demoMode = localStorage.getItem("demo_mode") === "true";
    if (demoMode) {
      setIsDemo(true);
      setUser({
        id: "demo-user-id",
        email: "demo@arenacopa.com",
        app_metadata: { provider: "email" },
        user_metadata: { full_name: "Usuário Demo" },
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User);
      setSession({
        access_token: "demo-token",
        refresh_token: "demo-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: "demo-user-id",
          email: "demo@arenacopa.com",
          app_metadata: { provider: "email" },
          user_metadata: { full_name: "Usuário Demo" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as User,
      });
      setLoading(false);
      return; // Skip Supabase subscription if in demo mode
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!localStorage.getItem("demo_mode")) { // Only set if not in demo mode (double check)
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemo = async () => {
    localStorage.setItem("demo_mode", "true");
    setIsDemo(true);
    const demoUser = {
      id: "demo-user-id",
      email: "demo@arenacopa.com",
      app_metadata: { provider: "email" },
      user_metadata: { full_name: "Usuário Demo" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User;

    setUser(demoUser);
    setSession({
      access_token: "demo-token",
      refresh_token: "demo-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: demoUser,
    });
  };

  const signOut = async () => {
    if (localStorage.getItem("demo_mode")) {
      localStorage.removeItem("demo_mode");
      setIsDemo(false);
      setUser(null);
      setSession(null);
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}
