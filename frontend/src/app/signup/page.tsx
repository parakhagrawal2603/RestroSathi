'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { ChefHat, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', formData);
      toast.success(data.message || 'Account created. Waiting for activation', { duration: 5000 });
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <Link href="/login" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Link>
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <h2 className="text-3xl font-black text-center text-slate-800 mb-2">Join RestroSathi</h2>
          <p className="text-center text-slate-500 mb-8 font-medium">Register your restaurant to get started</p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Restaurant Name</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white focus:ring-0 px-4 py-3 rounded-2xl text-base font-bold text-slate-800 transition-all outline-none" 
                placeholder="Delicious Diner"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Owner Name</label>
              <input 
                type="text" 
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white focus:ring-0 px-4 py-3 rounded-2xl text-base font-bold text-slate-800 transition-all outline-none" 
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Phone</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white focus:ring-0 px-4 py-3 rounded-2xl text-base font-bold text-slate-800 transition-all outline-none" 
                  placeholder="9876543210"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white focus:ring-0 px-4 py-3 rounded-2xl text-base font-bold text-slate-800 transition-all outline-none" 
                  placeholder="admin@restro.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 focus:bg-white focus:ring-0 px-4 py-3 rounded-2xl text-base font-bold text-slate-800 transition-all outline-none" 
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl text-lg font-black shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 active:scale-95 flex justify-center items-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : 'Register Restaurant'}
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500 font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
