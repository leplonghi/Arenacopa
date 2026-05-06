import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/integrations/firebase/client";
import { isAppAdminEmail } from "@/lib/access";
import { ensureProfile } from "@/services/profile/profile.service";
import { signOutUser } from "@/services/auth/auth.service";
import { logger } from "@/lib/logger";


export interface User {
  id: string;
  email: string | null;
  user_metadata?: { full_name?: string; avatar_url?: string; name?: string };
}

interface AuthContextType {
  user: User | null;
  session: FirebaseUser | null;
  isAppAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAppAdmin: false,
  loading: true,
  signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<FirebaseUser | null>(null);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
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

    let timeoutId: NodeJS.Timeout;
    let unsubscribe: () => void = () => {};

    try {
      // Force loading to false if Firebase auth hangs for more than 3 seconds
      timeoutId = setTimeout(() => {
        logger.warn("Firebase auth initialization timeout - forcing load state to false");
        setLoading(false);
      }, 3000);

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        clearTimeout(timeoutId);
        if (firebaseUser) {
          setSession(firebaseUser); // Using Firebase user as session object
          const mappedUser = mapUser(firebaseUser);
          setUser(mappedUser);
          setIsAppAdmin(isAppAdminEmail(mappedUser?.email));

          if (mappedUser) {
            ensureProfile({
              id: mappedUser.id,
              email: mappedUser.email,
              user_metadata: mappedUser.user_metadata,
            }).catch((error) => {
              logger.error("Error ensuring profile", { userId: mappedUser.id, error });
            });
          }
        } else {
          setSession(null);
          setUser(null);
          setIsAppAdmin(false);
        }
        setLoading(false);
      });
    } catch (error) {
      logger.error("Error initializing auth listener", { error });
      clearTimeout(timeoutId);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);



  const signOut = async () => {
    await signOutUser();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAppAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
