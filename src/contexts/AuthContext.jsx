import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const userData = await authService.verify();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        // Store token in localStorage for dashboard compatibility
        if (userData.access_token) {
          localStorage.setItem('admin_token', userData.access_token);
          localStorage.setItem('admin_info', JSON.stringify(userData));
        }
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      // Clear stored tokens on auth failure
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentId, birthDate) => {
    try {
      const userData = await authService.login(studentId, birthDate);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store token in localStorage for dashboard compatibility
      if (userData.access_token) {
        localStorage.setItem('admin_token', userData.access_token);
        localStorage.setItem('admin_info', JSON.stringify(userData));
      }
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if server call fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Clear stored tokens
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
