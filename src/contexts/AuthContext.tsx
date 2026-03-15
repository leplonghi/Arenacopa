import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { ensureProfile } from "@/services/profile/profile.service";
import { signOutUser } from "@/services/auth/auth.service";

export interface User {
  id: string;
  email: string | null;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
}

interface AuthContextType {
  user: User | null;
  session: any | null; // Keep session for compatibility, though Firebase handles it differently
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
  const [session, setSession] = useState<any | null>(null);
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
