"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type AuthState = "checking" | "authenticated" | "unauthenticated";

export type CurrentUser = {
  id?: string;
  name: string;
  email: string;
};

type AuthContextValue = {
  authState: AuthState;
  user: CurrentUser | null;
  checking: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  setUser: (user: CurrentUser | null) => void;
  refreshUser: () => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [user, setUser] = useState<CurrentUser | null>(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAuthState("unauthenticated");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("nexora_token");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (typeof window === "undefined") {
      return false;
    }

    const token = window.localStorage.getItem("nexora_token");
    if (!token) {
      clearAuthState();
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        clearAuthState();
        return false;
      }

      if (!response.ok) {
        throw new Error("Unable to validate session.");
      }

      const data = await response.json();
      setUser(data);
      setAuthState("authenticated");
      return true;
    } catch {
      clearAuthState();
      return false;
    }
  }, [clearAuthState]);

  const logout = useCallback(async () => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("nexora_token");
      if (token) {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch {
          // Ignore backend logout errors and continue the client-side cleanup.
        }
      }
      window.localStorage.removeItem("nexora_token");
    }

    setUser(null);
    setAuthState("unauthenticated");
    if (pathname !== "/login" && pathname !== "/register") {
      router.replace("/login");
    }
  }, [pathname, router]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (typeof window === "undefined") {
        return;
      }

      const token = window.localStorage.getItem("nexora_token");
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setAuthState("unauthenticated");
        }
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          if (!cancelled) {
            window.localStorage.removeItem("nexora_token");
            setUser(null);
            setAuthState("unauthenticated");
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Session validation failed.");
        }

        const data = await response.json();
        if (!cancelled) {
          setUser(data);
          setAuthState("authenticated");
        }
      } catch {
        if (!cancelled) {
          window.localStorage.removeItem("nexora_token");
          setUser(null);
          setAuthState("unauthenticated");
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    authState,
    user,
    checking: authState === "checking",
    authenticated: authState === "authenticated",
    unauthenticated: authState === "unauthenticated",
    setUser,
    refreshUser,
    logout,
  }), [authState, logout, refreshUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState === "unauthenticated") {
      router.replace("/login");
    }
  }, [authState, router]);

  if (authState === "checking") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#101411] text-[#edf3ee]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full border border-[#2d382f] bg-[#1a211c]" />
          <span className="text-sm text-[#9aa79f]">Checking session…</span>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}

export function PublicOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState === "authenticated") {
      router.replace("/");
    }
  }, [authState, router]);

  if (authState === "checking") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#101411] text-[#edf3ee]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full border border-[#2d382f] bg-[#1a211c]" />
          <span className="text-sm text-[#9aa79f]">Preparing Nexora…</span>
        </div>
      </div>
    );
  }

  if (authState === "authenticated") {
    return null;
  }

  return <>{children}</>;
}
