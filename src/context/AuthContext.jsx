import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("labourshaala_token") || null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore authenticated session on mount
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem("labourshaala_token");
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await authAPI.getMe();
        if (data && data.user) {
          setCurrentUser(data.user);
          setToken(savedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn("Session restore failed, logging out:", err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(emailOrPhone, password) {
    const data = await authAPI.login(emailOrPhone, password);
    if (data.token && data.user) {
      localStorage.setItem("labourshaala_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      return data.user;
    }
    throw new Error(data.error || "Login failed");
  }

  async function register(payload) {
    const data = await authAPI.register(payload);
    if (data.token && data.user) {
      localStorage.setItem("labourshaala_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      return data.user;
    }
    throw new Error(data.error || "Registration failed");
  }

  async function becomeWorker(workerData) {
    const data = await authAPI.becomeWorker(workerData);
    if (data.user) {
      if (data.token) {
        localStorage.setItem("labourshaala_token", data.token);
        setToken(data.token);
      }
      setCurrentUser(data.user);
      return data.user;
    }
    throw new Error(data.error || "Failed to update worker profile");
  }

  function logout() {
    localStorage.removeItem("labourshaala_token");
    setToken(null);
    setCurrentUser(null);
  }

  const isWorker = Boolean(
    currentUser?.roles?.includes("worker") || currentUser?.workerProfile
  );
  const isCustomer = Boolean(
    currentUser?.roles?.includes("customer") || currentUser?.customerProfile || !isWorker
  );
  const hasBothRoles = isWorker && Boolean(currentUser?.customerProfile || currentUser?.roles?.includes("customer"));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        isWorker,
        isCustomer,
        hasBothRoles,
        login,
        register,
        becomeWorker,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
