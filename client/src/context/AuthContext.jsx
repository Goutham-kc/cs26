import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('oaq_token'));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('oaq_token');
    localStorage.removeItem('oaq_user');
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('oaq_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) {
        logout();
      } else {
        const storedUser = localStorage.getItem('oaq_user');
        setUser(storedUser ? JSON.parse(storedUser) : { _id: payload.id, id: payload.id });
        setToken(storedToken);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, jwt) => {
    const sessionToken = jwt || localStorage.getItem('oaq_token');
    setUser(userData);
    setToken(sessionToken);
    if (sessionToken) localStorage.setItem('oaq_token', sessionToken);
    localStorage.setItem('oaq_user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
