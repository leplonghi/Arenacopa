import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase/client";
import { ensureProfile } from "@/services/profile/profile.service";
import { signOutUser } from "@/services/auth/auth.service";

export interface User {
  id: string;
  email: string | null;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
}

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

  useEffect(() => {
    const demoMode = localStorage.getItem("demo_mode") === "true";
    if (demoMode) {
      setUser({
        id: "demo-user-id",
        email: "demo@arenacup.com",
        user_metadata: { full_name: "Usuário Demo" },
      });
      setLoading(false);
      return;
    }

    const mapUser = (authUser: SupabaseUser | null) => {
      if (!authUser) return null;
      return {
        id: authUser.id,
        email: authUser.email ?? null,
        user_metadata: {
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            undefined,
          avatar_url: authUser.user_metadata?.avatar_url || undefined,
          name: authUser.user_metadata?.name || undefined,
        },
      } satisfies User;
    };

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(mapUser(data.session?.user ?? null));

      if (data.session?.user) {
        ensureProfile({
          id: data.session.user.id,
          email: data.session.user.email ?? null,
          user_metadata: {
            full_name: data.session.user.user_metadata?.full_name,
            name: data.session.user.user_metadata?.name,
            avatar_url: data.session.user.user_metadata?.avatar_url,
          },
        }).catch((error) => {
          console.error("Error ensuring profile:", error);
        });
      }

      setLoading(false);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(mapUser(nextSession?.user ?? null));
      setLoading(false);

      if (nextSession?.user) {
        ensureProfile({
          id: nextSession.user.id,
          email: nextSession.user.email ?? null,
          user_metadata: {
            full_name: nextSession.user.user_metadata?.full_name,
            name: nextSession.user.user_metadata?.name,
            avatar_url: nextSession.user.user_metadata?.avatar_url,
          },
        }).catch((error) => {
          console.error("Error ensuring profile:", error);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemo = async () => {
    localStorage.setItem("demo_mode", "true");
    setSession(null);
    setUser({
      id: "demo-user-id",
      email: "demo@arenacup.com",
      user_metadata: { full_name: "Usuário Demo" },
    });
  };

  const signOut = async () => {
    if (localStorage.getItem("demo_mode")) {
      localStorage.removeItem("demo_mode");
      setUser(null);
      setSession(null);
    } else {
      await signOutUser();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}
