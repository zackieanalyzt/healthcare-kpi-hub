import type { PropsWithChildren } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import type { AuthenticatedUser } from "@healthcare-kpi-hub/shared-types";
import { fetchCurrentUser } from "../api";

interface AuthState {
  user: AuthenticatedUser | null;
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  setUser(user: AuthenticatedUser | null): void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchCurrentUser();
      if (response.success) {
        setUser(response.data.user);
      } else if (response.error.code === "AUTH_UNAUTHENTICATED") {
        setUser(null);
      } else {
        setError(response.error.message);
      }
    } catch {
      setError("Unable to reach the API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        reload,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
