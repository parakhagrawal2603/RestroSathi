'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  restaurantId?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (data: User) => {
    setUser(data);
    localStorage.setItem('user', JSON.stringify(data));
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    // Redirect based on role
    if (data.role === 'super_admin') router.push('/admin/dashboard');
    else if (data.role === 'admin') router.push('/admin');
    else if (data.role === 'chef') router.push('/chef');
    else if (data.role === 'reception') router.push('/reception');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
