"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { clearSession, getStoredEmail, getToken, storeSession } from "./api";

type AuthStatus = "loading" | "authed" | "guest";

interface AuthContextValue {
  status: AuthStatus;
  email: string | null;
  signIn: (token: string, email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (getToken()) {
        setStatus("authed");
        setEmail(getStoredEmail());
      } else {
        setStatus("guest");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback((token: string, userEmail: string) => {
    storeSession(token, userEmail);
    setEmail(userEmail);
    setStatus("authed");
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setEmail(null);
    setStatus("guest");
  }, []);

  return (
    <AuthContext.Provider value={{ status, email, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
