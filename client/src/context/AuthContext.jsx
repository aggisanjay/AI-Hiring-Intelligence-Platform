import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/axios.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => {
    const stored = localStorage.getItem('hireiq_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token,   setToken]   = useState(() => localStorage.getItem('hireiq_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await authAPI.getMe();
        setUser(res.data.user);
        localStorage.setItem('hireiq_user', JSON.stringify(res.data.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('hireiq_user',  JSON.stringify(userData));
    localStorage.setItem('hireiq_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hireiq_user');
    localStorage.removeItem('hireiq_token');
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem('hireiq_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};