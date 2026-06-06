import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

type AuthContextType = {
  token: string | null;
  role: string | null;
  userId: number | null;
  isLoading: boolean;
  login: (token: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPersistedAuth();
  }, []);

  const loadPersistedAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedRole = await AsyncStorage.getItem('role');
      if (storedToken && storedRole) {
        setToken(storedToken);
        setRole(storedRole);
        try {
          const decoded: any = jwtDecode(storedToken);
          setUserId(decoded.id);
        } catch {}
      }
    } catch (e) {
      console.error('Failed to load credentials', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newRole: string) => {
    try {
      await SecureStore.setItemAsync('token', newToken);
      await AsyncStorage.setItem('role', newRole);
      setToken(newToken);
      setRole(newRole);
      try {
        const decoded: any = jwtDecode(newToken);
        setUserId(decoded.id);
      } catch {}
    } catch (e) {
      console.error('Failed to save credentials', e);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('token');
      await AsyncStorage.removeItem('role');
      setToken(null);
      setRole(null);
      setUserId(null);
    } catch (e) {
      console.error('Failed to delete credentials', e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, userId, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
