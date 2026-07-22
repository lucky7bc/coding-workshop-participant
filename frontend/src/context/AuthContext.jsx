import { createContext, useCallback, useContext, useState } from 'react';
import api, { getStoredAuth, setStoredAuth } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredAuth()?.user ?? null);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    setStoredAuth({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const auth = getStoredAuth();
    if (auth?.refresh_token) {
      try {
        await api.post('/api/auth/logout', { refresh_token: auth.refresh_token });
      } catch {
        // Clear local state regardless of whether the server call
        // succeeds — a failed logout request shouldn't trap the user
        // in a signed-in-looking state they can't get out of.
      }
    }
    setStoredAuth(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
