'use client';

import { useEffect, useState, useRef } from 'react';
import { Utensils, Upload, Plus, Clock, Trash2, Edit3, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';

import CategoryManager from '@/components/admin/CategoryManager';
import MenuItemForm from '@/components/admin/MenuItemForm';
import TimeSlotManager from '@/components/admin/TimeSlotManager';
import MenuItemCard from '@/components/admin/MenuItemCard';

export default function MenuManagement() {
  const [menuData, setMenuData] = useState<{ categories: any[], items: any[] }>({ categories: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal States
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isItemOpen, setIsItemOpen] = useState(false);
  const [isTimeSlotOpen, setIsTimeSlotOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { user, isLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (socket) {
      socket.on('menuUpdated', (updatedItem: any) => {
        setMenuData(prev => ({
          ...prev,
          items: prev.items.map(item => item._id === updatedItem._id ? updatedItem : item)
        }));
        if (updatedItem.availabilityMode === 'off') {
          toast(`${updatedItem.name} is now OUT OF STOCK`, { icon: '🚫' });
        } else if (updatedItem.availabilityMode === 'on') {
          toast(`${updatedItem.name} is back in stock!`, { icon: '✅' });
        }
      });
    }
    return () => {
      socket?.off('menuUpdated');
    };
  }, [socket]);

  useEffect(() => {
    if (!isLoading && user?.role !== 'admin') {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchMenu = async () => {
    try {
      setError(null);
      const { data } = await api.get('/menu');
      setMenuData(data);
    } catch (err: any) {
      console.error('Menu fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load menu data. Please try again.');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (user?.role === 'admin') {
      fetchMenu(); 
    } else if (!isLoading) {
      setLoading(false);
    }
  }, [user?.role, isLoading]);

  const updateAvailabilityMode = async (id: string, mode: 'auto' | 'on' | 'off') => {
    try {
      await api.put(`/menu/item/${id}/availability`, { availabilityMode: mode });
      toast.success(`Availability set to ${mode}`);
      fetchMenu();
    } catch (error) {
      toast.error('Update failed');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/menu/item/${id}`);
      toast.success('Item deleted');
      fetchMenu();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    const loadingToast = toast.loading('Uploading menu...');
    try {
      const { data } = await api.post('/menu/bulk-upload', formData);
      toast.success(`Complete: ${data.successCount} success, ${data.failedCount} failed.`, { id: loadingToast });
      fetchMenu();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed', { id: loadingToast });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading || loading || user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium tracking-tight">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle className="w-12 h-12 text-rose-500 mb-4" />
        <p className="text-rose-600 font-bold mb-4">{error}</p>
        <button onClick={fetchMenu} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Menu Management</h2>
          <p className="text-slate-500 font-medium tracking-tight">Design and schedule your restaurant offerings.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleBulkUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" /> Bulk CSV
          </button>
          <button 
            onClick={() => setIsCategoryOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Category
          </button>
          <button 
            onClick={() => { setSelectedItem(null); setIsItemOpen(true); }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm text-center min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
          <p className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-widest mb-1">Categories</p>
          <p className="text-xl sm:text-3xl font-black text-slate-800">{menuData.categories.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm text-center min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
          <p className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-widest mb-1">Total Items</p>
          <p className="text-xl sm:text-3xl font-black text-slate-800">{menuData.items.length}</p>
        </div>
        <button 
          onClick={() => setIsTimeSlotOpen(true)}
          className="bg-slate-900 p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm text-center group hover:bg-indigo-600 transition-all flex flex-col items-center justify-center min-h-[80px] sm:min-h-[100px] col-span-2 sm:col-span-1"
        >
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 mb-1 sm:mb-2 group-hover:text-white" />
          <p className="text-white font-black text-sm sm:text-base">Time Slots</p>
        </button>
      </div>

      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
            selectedCategory === 'all' 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' 
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Items
        </button>
        {menuData.categories.map((cat: any) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(cat._id)}
            className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${
              selectedCategory === cat._id 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {menuData.items
            .filter(item => selectedCategory === 'all' || item.categoryId === selectedCategory)
            .map((item: any) => (
              <MenuItemCard 
                key={item._id}
                item={item}
                categoryName={menuData.categories.find((c: any) => c._id === item.categoryId)?.name || 'General'}
                onToggle={updateAvailabilityMode}
                onEdit={(item) => { setSelectedItem(item); setIsItemOpen(true); }}
                onDelete={deleteItem}
              />
            ))
          }
        </div>

        {menuData.items.filter(item => selectedCategory === 'all' || item.categoryId === selectedCategory).length === 0 && !loading && !error && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center flex flex-col items-center">
            <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold tracking-tight text-lg uppercase">
              {selectedCategory === 'all' ? 'No items found' : 'No items in this category'}
            </p>
            <p className="text-slate-400 text-sm mb-6">
              {selectedCategory === 'all' ? 'Start by adding your first menu item or using bulk upload.' : 'Try selecting a different category or add a new item here.'}
            </p>
            {(selectedCategory === 'all' || true) && (
              <button 
                onClick={() => { setSelectedItem(null); setIsItemOpen(true); }}
                className="px-6 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            )}
          </div>
        )}
      </div>

      <CategoryManager isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} onSuccess={fetchMenu} />
      <MenuItemForm 
        isOpen={isItemOpen} 
        onClose={() => { setIsItemOpen(false); setSelectedItem(null); }} 
        onSuccess={fetchMenu} 
        categories={menuData.categories}
        initialData={selectedItem}
      />
      <TimeSlotManager isOpen={isTimeSlotOpen} onClose={() => setIsTimeSlotOpen(false)} />
    </div>
  );
}
