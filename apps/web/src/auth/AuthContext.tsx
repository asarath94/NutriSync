import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@nutrisync/shared";
import { getMe, logout as apiLogout, type ApiStatus } from "../lib/api-client";

type AuthStatus = "loading" | "in" | "out";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  bootStatus: ApiStatus;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [bootStatus, setBootStatus] = useState<ApiStatus>("idle");

  useEffect(() => {
    let cancelled = false;
    getMe((s) => !cancelled && setBootStatus(s))
      .then(({ user }) => {
        if (cancelled) return;
        setUserState(user);
        setStatus("in");
      })
      .catch(() => {
        if (cancelled) return;
        setUserState(null);
        setStatus("out");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    setStatus("in");
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUserState(null);
    setStatus("out");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, bootStatus, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
