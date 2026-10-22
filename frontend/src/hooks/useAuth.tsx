import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { User, AuthResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.me();
      setUser(data);
      setError(null);
    } catch {
      setUser(null);
      setError('Not authenticated');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async () => {
    try {
      const data = await api.login();
      window.location.href = data.authorization_url;
    } catch (err) {
      setError('Login failed');
      throw err;
    }
  };

  const handleCallback = async (params: URLSearchParams) => {
    try {
      const data = await api.callback(params) as AuthResponse;
      setUser(data.user);
      setError(null);
      return data;
    } catch (err) {
      setError('Authentication failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return { user, loading, error, login, handleCallback, logout, checkAuth };
}