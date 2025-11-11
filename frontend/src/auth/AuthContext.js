import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authLogin, authSignup, authMe, setAuthToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthToken(token);
    authMe()
      .then((u) => setUser(u))
      .catch(() => {
        setAuthToken("");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login({ username, password }) {
    setError("");
    const { token, user } = await authLogin({ username, password });
    setAuthToken(token);
    setUser(user);
    return user;
  }

  async function signup({ username, email, password }) {
    setError("");
    const { token, user } = await authSignup({ username, email, password });
    setAuthToken(token);
    setUser(user);
    return user;
  }

  function logout() {
    setAuthToken("");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, error, login, signup, logout }), [user, loading, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


