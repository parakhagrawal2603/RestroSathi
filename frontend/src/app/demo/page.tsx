'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function DemoLogin() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const loginAsSuperAdmin = async () => {
      try {
        const { data } = await api.post('/auth/demo');
        login(data);
        toast.success('Demo Super Admin login successful!');
      } catch (err: any) {
        toast.error(`Error: ${err.message || 'Unknown network error'}`);
        console.error("Login Error payload:", err);
        router.push('/login');
      }
    };
    loginAsSuperAdmin();
  }, [login, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Logging you in...</h2>
        <p className="text-slate-500 mt-2">Bypassing authentication for Demo Access</p>
      </div>
    </div>
  );
}
