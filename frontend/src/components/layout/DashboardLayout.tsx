'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { LogOut, UtensilsCrossed, Bell, Menu, X, AlertTriangle } from 'lucide-react';
import api from '@/lib/axios';

interface SidebarItem {
  label: string;
  icon: any;
  href: string;
}

export default function DashboardLayout({ 
  children, 
  title, 
  items 
}: { 
  children: ReactNode; 
  title: string;
  items: SidebarItem[];
}) {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const checkStatus = async () => {
      if (user?.restaurantId) {
        try {
          const { data } = await api.get(`/restaurants/${user.restaurantId}`);
          setRestaurantStatus(data.status);
        } catch (error) {
          console.error('Failed to fetch restaurant status');
        }
      }
    };
    checkStatus();
  }, [user]);

  const isInactive = restaurantStatus === 'inactive' && user?.role !== 'super_admin';

  const SidebarContent = () => (
    <>
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="w-8 h-8 text-indigo-400" />
          RestroSathi
        </h2>
        <button className="md:hidden text-slate-300" onClick={() => setIsMobileOpen(false)}>
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <a 
              key={i} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="font-bold tracking-tight">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="mb-4 px-4">
          <p className="text-sm font-medium">{user?.name || 'Loading...'}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</p>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-col hidden md:flex shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="w-72 max-w-sm bg-slate-900 text-white flex flex-col relative z-50 h-full shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden container-query">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsMobileOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg md:text-xl font-semibold text-slate-800 truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-8 relative">
          {isInactive && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 text-center">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
              <div className="relative bg-white border border-rose-100 p-8 rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Panel Restricted</h3>
                <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8">
                  This restaurant is currently <span className="text-rose-600">Inactive</span>. 
                  Staff operations are temporarily restricted. Please contact your administrator.
                </p>
                <div className="pt-6 border-t border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">RestroSathi Security</p>
                </div>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
