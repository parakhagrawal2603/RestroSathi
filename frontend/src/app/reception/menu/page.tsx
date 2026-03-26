'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ConciergeBell, Utensils, RotateCcw, XCircle, Clock } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';
import MenuItemCard from '@/components/admin/MenuItemCard';

export default function ReceptionMenuPage() {
  const [menuData, setMenuData] = useState<{ categories: any[], items: any[] }>({ categories: [], items: [] });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (socket) {
      socket.on('menuUpdated', (updatedItem: any) => {
        setMenuData(prev => ({
          ...prev,
          items: prev.items.map(item => item._id === updatedItem._id ? updatedItem : item)
        }));
      });
    }
    return () => {
      socket?.off('menuUpdated');
    };
  }, [socket]);

  const navItems = [
    { label: 'Orders', icon: ConciergeBell, href: '/reception' },
    { label: 'Menu', icon: Utensils, href: '/reception/menu' }
  ];

  useEffect(() => {
    if (!isAuthLoading && !['reception', 'admin'].includes(user?.role || '')) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/menu');
      setMenuData(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAvailabilityMode = async (id: string, mode: 'auto' | 'on' | 'off') => {
    try {
      await api.put(`/menu/item/${id}/availability`, { availabilityMode: mode });
      toast.success(`Availability set to ${mode.toUpperCase()}`);
      fetchMenu();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  useEffect(() => {
    if (user) fetchMenu();
  }, [user, fetchMenu]);

  if (isAuthLoading || !['reception', 'admin'].includes(user?.role || '')) return null;

  return (
    <DashboardLayout title="Menu Management" items={navItems}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Restaurant Menu</h2>
            <p className="text-slate-500 font-medium tracking-tight">Monitor availability and handle item stock-outs.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-[10px] font-black uppercase tracking-widest">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Restricted Access
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
              selectedCategory === 'all' 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Items
          </button>
          {menuData.categories.map((cat: any) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
                selectedCategory === cat._id 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium tracking-tight">Fetching menu...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-rose-100 border-dashed">
             <XCircle className="w-12 h-12 text-rose-500 mb-4" />
             <p className="text-rose-600 font-bold mb-4">{error}</p>
             <button onClick={fetchMenu} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {menuData.items
              .filter(item => selectedCategory === 'all' || item.categoryId === selectedCategory)
              .map((item: any) => (
                <MenuItemCard 
                  key={item._id}
                  item={item}
                  categoryName={menuData.categories.find((c: any) => c._id === item.categoryId)?.name || 'General'}
                  onToggle={updateAvailabilityMode}
                  hideActions={true}
                />
              ))
            }
          </div>
        )}

        {menuData.items.filter(item => selectedCategory === 'all' || item.categoryId === selectedCategory).length === 0 && !loading && !error && (
          <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-20 text-center flex flex-col items-center">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold tracking-tight text-lg uppercase">
              No items in this category
            </p>
            <p className="text-slate-400 text-sm mb-6">Try selecting a different category or refreshing.</p>
            <button onClick={fetchMenu} className="px-6 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
