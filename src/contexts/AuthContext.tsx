import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";

// Creating a unified User type that mimics the previous structure slightly 
// to avoid breaking all components simultaneously during transition.
export interface User extends Omit<FirebaseUser, "uid"> {
  id: string;
  email: string | null;
  user_metadata?: { full_name?: string; avatar_url?: string };
}

interface AuthContextType {
  user: User | null;
  session: any | null; // Firebase uses idToken instead of explicit sessions
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for demo mode in localStorage first
    const demoMode = localStorage.getItem("demo_mode") === "true";
    if (demoMode) {
      setUser({
        id: "demo-user-id",
        email: "demo@arenacup.com",
        user_metadata: { full_name: "Usuário Demo" },
      } as User);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          ...firebaseUser,
          id: firebaseUser.uid, // Map uid to id for backwards compatibility
          email: firebaseUser.email,
          user_metadata: { full_name: firebaseUser.displayName || "Usuário" },
        } as User);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsDemo = async () => {
    localStorage.setItem("demo_mode", "true");
    const demoUser = {
      id: "demo-user-id",
      email: "demo@arenacup.com",
      user_metadata: { full_name: "Usuário Demo" },
    } as User;
    setUser(demoUser);
  };

  const signOut = async () => {
    if (localStorage.getItem("demo_mode")) {
      localStorage.removeItem("demo_mode");
      setUser(null);
    } else {
      await firebaseSignOut(auth);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session: null, loading, signOut, loginAsDemo }}>
      {children}
    </AuthContext.Provider>
  );
}
