import { createContext, useState, useCallback, useMemo } from "react";
import { apiPost, saveAuth, clearAuth, getToken, getUser as getStoredUser } from "../api/client.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getStoredUser());

  const login = useCallback(async (email, password) => {
    const data = await apiPost("/auth/login", { email, password });
    saveAuth(data);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await apiPost("/auth/register", { name, email, password });
    saveAuth(data);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const isAdmin = user?.role === "admin";

  const value = useMemo(
    () => ({ token, user, login, register, logout, updateUser, isAdmin }),
    [token, user, login, register, logout, updateUser, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
