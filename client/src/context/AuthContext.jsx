import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('customer');

  // Hydrate state from sessionStorage on initial load
  useEffect(() => {
    const email = sessionStorage.getItem('userEmail');
    if (email) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setIsAdmin(sessionStorage.getItem('isAdmin') === 'true');
      setUserRole(sessionStorage.getItem('userRole') || 'customer');
    }
  }, []);

  const login = (userData) => {
    sessionStorage.setItem('isAdmin', userData.isAdmin);
    sessionStorage.setItem('userEmail', userData.email);
    sessionStorage.setItem('userRole', userData.role);
    
    setIsAuthenticated(true);
    setUserEmail(userData.email);
    setIsAdmin(userData.isAdmin);
    setUserRole(userData.role);
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.error(e);
    }
    
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUserEmail(null);
    setIsAdmin(false);
    setUserRole('customer');
    toast.success("Logged out successfully");
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, isAdmin, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);