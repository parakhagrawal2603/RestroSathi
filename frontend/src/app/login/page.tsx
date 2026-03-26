'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { ChefHat } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <ChefHat className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">RestroSathi</h2>
          <p className="text-center text-slate-500 mb-8">Your Restaurant&apos;s Digital Sathi</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="label-text">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" 
                placeholder="admin@restaurant.com"
                required
              />
            </div>
            <div>
              <label className="label-text">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" 
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary h-12 text-lg font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500 font-medium">
            New restaurant?{' '}
            <Link href="/signup" className="text-indigo-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
