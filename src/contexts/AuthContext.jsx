/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

// Cookie helper functions for secure storage
function setCookie(name, value, days = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
}

function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// Clear all sensitive localStorage data
function clearSensitiveLocalStorage() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_info');
  // Clear any other sensitive keys
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.includes('admin') || key.includes('auth') || key.includes('token')) {
      localStorage.removeItem(key);
    }
  });
}

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
      
      // Check cookie first, then try to verify with server
      const cookieToken = getCookie('admin_token');
      const cookieUserInfo = getCookie('admin_info');
      
      if (cookieToken && cookieUserInfo) {
        try {
          const userData = JSON.parse(cookieUserInfo);
          setUser(userData);
          setIsAuthenticated(true);
          // Clear any remaining localStorage data
          clearSensitiveLocalStorage();
          return;
        } catch {
          // Invalid cookie data, clear it
          deleteCookie('admin_token');
          deleteCookie('admin_info');
        }
      }
      
      // If no valid cookie, try server verification
      const userData = await authService.verify();
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        // Store in secure cookies
        if (userData.access_token) {
          setCookie('admin_token', userData.access_token, 7);
          setCookie('admin_info', JSON.stringify(userData), 7);
        }
        // Clear localStorage
        clearSensitiveLocalStorage();
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      // Clear all auth data
      deleteCookie('admin_token');
      deleteCookie('admin_info');
      clearSensitiveLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const login = async (studentId, birthDate) => {
    const userData = await authService.login(studentId, birthDate);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Store in secure cookies instead of localStorage
    if (userData.access_token) {
      setCookie('admin_token', userData.access_token, 7); // 7 days
      setCookie('admin_info', JSON.stringify(userData), 7);
    }
    
    // Clear any existing localStorage data
    clearSensitiveLocalStorage();
    
    return userData;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with logout even if server call fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Clear all auth data securely
      deleteCookie('admin_token');
      deleteCookie('admin_info');
      clearSensitiveLocalStorage();
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
