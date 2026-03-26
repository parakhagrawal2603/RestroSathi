'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingBag, 
  Menu, 
  X,
  ChefHat,
  LogOut,
  Utensils,
  Users,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';

interface SidebarItemProps {
  href: string;
  icon: any;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ href, icon: Icon, label, active, onClick }: SidebarItemProps) => (
  <Link 
    href={href} 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'group-hover:text-indigo-600'}`} />
    <span className="font-bold">{label}</span>
  </Link>
);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [restaurantStatus, setRestaurantStatus] = useState<string | null>(null);

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

  const isSuperAdmin = user?.role === 'super_admin';
  const isInactive = restaurantStatus === 'inactive' && !isSuperAdmin;

  const menuItems = isSuperAdmin ? [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/restaurants', icon: Store, label: 'Restaurants' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ] : [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/menu', icon: Utensils, label: 'Menu' },
    { href: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/admin/staff', icon: Users, label: 'Staff' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">RestroSathi</span>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.href}
                {...item}
                active={pathname === item.href || pathname.startsWith(item.href + '/')}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-100 pt-6 px-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border-2 border-white shadow-sm">
                {user?.name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                  {isSuperAdmin ? 'Super Admin' : 'Restaurant Admin'}
                </p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 font-bold hover:bg-rose-50 rounded-xl transition-colors group"
            >
              <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-extrabold text-slate-800">
              {menuItems.find(item => pathname.startsWith(item.href))?.label || 'RestroSathi Admin'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">System Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-black text-slate-700">Healthy</span>
              </div>
            </div>
          </div>
        </header>

        {/* Status Banner */}
        {isInactive && (
          <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Restaurant is Inactive</p>
                <p className="text-xs font-medium opacity-80">Your dashboard features are restricted. Please contact support to activate your account.</p>
              </div>
            </div>
            <Link 
              href="/admin/settings"
              className="px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all uppercase tracking-widest"
            >
              Check Billing
            </Link>
          </div>
        )}

        {/* Content Area */}
        <main className={`flex-1 p-6 overflow-x-hidden ${isInactive ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
