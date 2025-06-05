import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api, { ApiError } from '../services/api';

interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'receptionist';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isReceptionist: () => boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Verify token with backend
          const response = await api.get('/auth/user/');
          setUser({
            id: response.data.id,
            username: response.data.username,
            email: response.data.email,
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            role: response.data.role
          });
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login/', {
        username,
        password
      });

      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      const userResponse = await api.get('/auth/user/');
      setUser({
        id: userResponse.data.id,
        username: userResponse.data.username,
        email: userResponse.data.email,
        firstName: userResponse.data.first_name,
        lastName: userResponse.data.last_name,
        role: userResponse.data.role
      });
    } catch (err) {
      if (err instanceof ApiError) {
        // Provide a more informative error message for login failures
        if (err.status === 401 || err.status === 400) {
          setError('Username or password didn\'t match. Please try again.');
        } else {
          setError(err.message || 'An error occurred during login');
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isReceptionist = () => user?.role === 'receptionist';

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAdmin, 
      isReceptionist,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};