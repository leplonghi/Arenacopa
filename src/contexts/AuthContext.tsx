import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { ensureProfile } from "@/services/profile/profile.service";
import { signOutUser } from "@/services/auth/auth.service";
import { DEMO_USER_ID, DEMO_MODE_STORAGE_KEY } from "@/lib/constants";

export interface User {
  id: string;
  email: string | null;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
}

interface AuthContextType {
  user: User | null;
  session: FirebaseUser | null;
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
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo mode is only allowed in development builds.
    // In production, localStorage can be manipulated by anyone via DevTools,
    // so we gate this behind the Vite DEV flag to prevent auth bypass in prod.
    const isDev = import.meta.env.DEV;
    const demoMode = isDev && localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true";
    if (demoMode) {
      setUser({
        id: DEMO_USER_ID,
        email: "demo@arenacup.com",
        user_metadata: { full_name: "Usuário Demo" },
      });
      setLoading(false);
      return;
    }

    const mapUser = (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) return null;
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email ?? null,
        user_metadata: {
          full_name: firebaseUser.displayName || undefined,
          avatar_url: firebaseUser.photoURL || undefined,
          name: firebaseUser.displayName || undefined,
        },
      } satisfies User;
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setSession(firebaseUser); // Using Firebase user as session object
        const mappedUser = mapUser(firebaseUser);
        setUser(mappedUser);

        if (mappedUser) {
          ensureProfile({
            id: mappedUser.id,
            email: mappedUser.email,
            user_metadata: mappedUser.user_metadata,
          }).catch((error) => {
            console.error("Error ensuring profile:", error);
          });
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsDemo = async () => {
    if (!import.meta.env.DEV) {
      console.warn("Demo mode is not available in production builds.");
      return;
    }
    localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
    setSession(null);
    setUser({
      id: DEMO_USER_ID,
      email: "demo@arenacup.com",
      user_metadata: { full_name: "Usuário Demo" },
    });
  };

  const signOut = async () => {
    if (localStorage.getItem(DEMO_MODE_STORAGE_KEY)) {
      localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
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
