'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  employeeCode: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  setSession: (accessToken: string, userData: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tokenCookie = Cookies.get('token');
    const userCookie = Cookies.get('user');
    if (userCookie && tokenCookie) {
      try {
        setUser(JSON.parse(userCookie));
      } catch (e) {
        Cookies.remove('user');
        Cookies.remove('token');
      }
      setLoading(false);
      return;
    }
    if (tokenCookie && !userCookie) {
      // Fetch current user profile using token
      api.get('/auth/profile')
        .then((res) => {
          // BE mới wrap: { success, data: user } hoặc trả trực tiếp
          const userData = res?.data || res;
          Cookies.set('user', JSON.stringify(userData), { expires: 7 });
          setUser(userData as User);
        })
        .catch(() => {
          Cookies.remove('token');
        })
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      // BE mới wrap: { success, message, data: { accessToken, user } }
      // BE cũ trả trực tiếp: { accessToken, user }
      const payload = res?.data || res;
      Cookies.set('token', payload.accessToken, { expires: 7 });
      Cookies.set('user', JSON.stringify(payload.user), { expires: 7 });
      setUser(payload.user);
      return payload.user as User;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      // Unwrap nếu cần
      return res?.data || res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  };

  const setSession = (accessToken: string, userData: User) => {
    Cookies.set('token', accessToken, { expires: 7 });
    Cookies.set('user', JSON.stringify(userData), { expires: 7 });
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
