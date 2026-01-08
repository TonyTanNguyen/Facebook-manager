import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to get user data');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login with Facebook (legacy)
  const loginWithFacebook = () => {
    window.location.href = authAPI.getLoginUrl();
  };

  // Login with password (internal use)
  const loginWithPassword = async (password) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.login(password);
      if (response.success && response.data?.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback token
  const handleAuthCallback = useCallback(async (token) => {
    try {
      localStorage.setItem('token', token);
      await checkAuth();
      return true;
    } catch (err) {
      console.error('Auth callback failed:', err);
      localStorage.removeItem('token');
      setError(err.message);
      return false;
    }
  }, [checkAuth]);

  // Logout
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      if (response.success && response.data?.token) {
        localStorage.setItem('token', response.data.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    loginWithFacebook,
    loginWithPassword,
    handleAuthCallback,
    logout,
    refreshToken,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

