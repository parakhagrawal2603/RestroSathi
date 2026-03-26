'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/axios';
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  TrendingUp,
  Utensils,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  IndianRupee 
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  trend?: string;
  filter?: React.ReactNode;
}

const StatsCard = ({ title, value, icon: Icon, color, trend, filter }: StatsCardProps) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group/card">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color} shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex flex-col items-end gap-2">
        {trend && (
          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
        {filter}
      </div>
    </div>
    <h3 className="text-slate-500 font-bold text-sm mb-1">{title}</h3>
    <p className="text-3xl font-black text-slate-800">{value}</p>
  </div>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    ordersToday: 0,
    activeOrders: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'yesterday' | '7days' | 'all' | 'custom'>('today');
  const [salesCustomRange, setSalesCustomRange] = useState({ from: '', to: '' });
  const [ordersPeriod, setOrdersPeriod] = useState<'today' | 'yesterday' | '7days' | 'all' | 'custom'>('today');
  const [ordersCustomRange, setOrdersCustomRange] = useState({ from: '', to: '' });

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isSuperAdmin) {
          const [restaurantsRes, ordersRes] = await Promise.all([
            api.get('/restaurants'),
            api.get('/orders')
          ]);

          const restaurants = restaurantsRes.data;
          const orders = ordersRes.data;
          setOrders(orders);

          const today = new Date().toISOString().split('T')[0];
          const todayOrders = orders.filter((o: any) => 
            new Date(o.createdAt).toISOString().split('T')[0] === today
          ).length;

          setStats(prev => ({
            ...prev,
            total: restaurants.length,
            active: restaurants.filter((r: any) => r.status === 'active').length,
            inactive: restaurants.filter((r: any) => r.status !== 'active').length,
            ordersToday: todayOrders,
            totalOrders: orders.length
          }));
        } else {
          // Restaurant Admin
          const [ordersRes, restaurantRes] = await Promise.all([
            api.get('/orders'),
            api.get('/restaurants/me')
          ]);
          
          const orders = ordersRes.data;
          setOrders(orders);
          setRestaurantName(restaurantRes.data?.name || '');
          setRestaurantData(restaurantRes.data);
          
          const todayDate = new Date().toISOString().split('T')[0];
          const todayOrders = orders.filter((o: any) => 
            new Date(o.createdAt).toISOString().split('T')[0] === todayDate
          ).length;
          
          const activeOrders = orders.filter((o: any) => 
            ['pending', 'preparing', 'ready'].includes(o.status) && !o.isCompleted
          ).length;

          setStats(prev => ({
            ...prev,
            ordersToday: todayOrders,
            activeOrders: activeOrders,
            totalOrders: orders.length
          }));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, isSuperAdmin]);

  // Socket Listeners for Real-time Stats
  useEffect(() => {
    if (socket && !isSuperAdmin) {
      socket.on('newOrder', () => {
        setStats(prev => ({
          ...prev,
          ordersToday: prev.ordersToday + 1,
          activeOrders: prev.activeOrders + 1,
          totalOrders: prev.totalOrders + 1
        }));
      });

      socket.on('orderUpdated', (order: any) => {
        // Update local orders list for real-time sales calculation
        setOrders(prev => prev.map(o => o._id === order._id ? order : o));
        
        // If order completed, reduce active orders count
        if (order.isCompleted) {
          setStats(prev => ({
            ...prev,
            activeOrders: Math.max(0, prev.activeOrders - 1)
          }));
        }
      });
    }

    return () => {
      socket?.off('newOrder');
      socket?.off('orderUpdated');
    };
  }, [socket, isSuperAdmin]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let filtered = orders.filter(o => o.isPaid);

    if (salesPeriod === 'today') {
      filtered = filtered.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === todayStr);
    } else if (salesPeriod === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      filtered = filtered.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === yesterdayStr);
    } else if (salesPeriod === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
    } else if (salesPeriod === 'custom' && salesCustomRange.from && salesCustomRange.to) {
      const from = new Date(salesCustomRange.from);
      const to = new Date(salesCustomRange.to);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => {
        const d = new Date(o.createdAt);
        return d >= from && d <= to;
      });
    }

    return filtered.reduce((sum: number, o: any) => 
      sum + o.items.reduce((iSum: number, i: any) => iSum + (i.price * i.quantity), 0), 0);
  }, [orders, salesPeriod, salesCustomRange]);

  const filteredOrdersCount = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let filtered = orders;

    if (ordersPeriod === 'today') {
      filtered = filtered.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === todayStr);
    } else if (ordersPeriod === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      filtered = filtered.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === yesterdayStr);
    } else if (ordersPeriod === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
    } else if (ordersPeriod === 'custom' && ordersCustomRange.from && ordersCustomRange.to) {
      const from = new Date(ordersCustomRange.from);
      const to = new Date(ordersCustomRange.to);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => {
        const d = new Date(o.createdAt);
        return d >= from && d <= to;
      });
    }

    return filtered.length;
  }, [orders, ordersPeriod, ordersCustomRange]);

  const DashboardFilter = ({ period, setPeriod, range, setRange }: any) => (
    <div className="flex flex-col items-end gap-2">
      <select 
        value={period} 
        onChange={(e) => setPeriod(e.target.value as any)}
        className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 outline-none text-slate-400 group-hover/card:border-slate-200 group-hover/card:text-slate-600 transition-all cursor-pointer"
      >
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="7days">7 Days</option>
        <option value="all">All Time</option>
        <option value="custom">Custom</option>
      </select>
      {period === 'custom' && (
        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
          <input 
            type="date" 
            value={range.from}
            onChange={(e) => setRange((prev: any) => ({ ...prev, from: e.target.value }))}
            className="text-[9px] font-bold bg-slate-50 border border-slate-100 rounded px-1 py-0.5 outline-none text-slate-500"
          />
          <span className="text-[9px] font-bold text-slate-300">to</span>
          <input 
            type="date" 
            value={range.to}
            onChange={(e) => setRange((prev: any) => ({ ...prev, to: e.target.value }))}
            className="text-[9px] font-bold bg-slate-50 border border-slate-100 rounded px-1 py-0.5 outline-none text-slate-500"
          />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white h-40 rounded-3xl shadow-sm border border-slate-100"></div>
        ))}
      </div>
    );
  }

  const getPlanStatus = () => {
    if (!restaurantData?.expiryDate) return null;
    const expiry = parseISO(restaurantData.expiryDate);
    const today = new Date();
    const daysLeft = differenceInDays(expiry, today);
    const isExpired = daysLeft < 0;

    if (isExpired) return { label: 'Plan Expired', color: 'bg-rose-50 border-rose-100 text-rose-600', icon: XCircle, days: 0, expired: true };
    if (daysLeft <= 3) return { label: 'Expiring Soon', color: 'bg-amber-50 border-amber-100 text-amber-600', icon: AlertTriangle, days: daysLeft, expired: false };
    return { label: 'Plan Active', color: 'bg-emerald-50 border-emerald-100 text-emerald-600', icon: CheckCircle2, days: daysLeft, expired: false };
  };

  const planStatus = getPlanStatus();

  return (
    <div className="space-y-8">
      {/* Plan Status Banner */}
      {!isSuperAdmin && planStatus && (
        <div className={`p-4 md:p-6 rounded-3xl border ${planStatus.color} shadow-sm animate-in fade-in slide-in-from-top-4 duration-500`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-white shadow-sm`}>
                <planStatus.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight">{planStatus.label}</h3>
                  <span className="text-[10px] font-black uppercase bg-white/50 px-2 py-0.5 rounded-full border border-current/10">
                    ID: {restaurantData._id.slice(-6)}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm font-bold opacity-80 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Expires: {format(parseISO(restaurantData.expiryDate), 'dd MMM yyyy')}
                  </p>
                  <p className="text-sm font-black flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {planStatus.expired ? 'Renew Needed' : `${planStatus.days} days remaining`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-1">
               <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Subscription Support</p>
               <p className="text-sm font-black underline underline-offset-4 decoration-current/30 text-center sm:text-right">
                 Contact support to renew plan
               </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">
          {isSuperAdmin 
            ? 'Platform Overview' 
            : `Welcome, ${restaurantName ? `${restaurantName} ${user?.name || ''}` : (user?.name || 'Admin')}`
          }
        </h2>
        <p className="text-slate-500 font-medium tracking-tight">
          {isSuperAdmin 
            ? 'System performance and restaurant metrics at a glance.' 
            : 'Track your restaurant performance and live orders.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isSuperAdmin ? (
          <>
            <StatsCard 
              title="Total Restaurants" 
              value={stats.total} 
              icon={Store} 
              color="bg-indigo-600" 
              trend="Lifetime"
            />
            <StatsCard 
              title="Active Tenants" 
              value={stats.active} 
              icon={CheckCircle2} 
              color="bg-emerald-500" 
              trend="Healthy"
            />
            <StatsCard 
              title="Inactive Panels" 
              value={stats.inactive} 
              icon={XCircle} 
              color="bg-rose-500" 
              trend="Paused"
            />
          </>
        ) : (
          <>
            <StatsCard 
              title="Total Orders" 
              value={filteredOrdersCount} 
              icon={ShoppingBag} 
              color="bg-indigo-600" 
              trend={ordersPeriod === 'all' ? 'Lifetime' : ordersPeriod === 'custom' ? 'Selected' : ordersPeriod.toUpperCase()}
              filter={<DashboardFilter period={ordersPeriod} setPeriod={setOrdersPeriod} range={ordersCustomRange} setRange={setOrdersCustomRange} />}
            />
            <StatsCard 
              title="Active Orders" 
              value={stats.activeOrders} 
              icon={ArrowRight} 
              color="bg-amber-500" 
              trend="In Progress"
            />
          </>
        )}
        <StatsCard 
          title={isSuperAdmin ? "Total Platform Orders" : "Orders Count"} 
          value={isSuperAdmin ? filteredOrdersCount : filteredOrdersCount} 
          icon={ShoppingBag} 
          color="bg-emerald-500" 
          trend={ordersPeriod === 'all' ? 'Lifetime' : ordersPeriod === 'custom' ? 'Selected' : ordersPeriod.toUpperCase()}
          filter={isSuperAdmin ? <DashboardFilter period={ordersPeriod} setPeriod={setOrdersPeriod} range={ordersCustomRange} setRange={setOrdersCustomRange} /> : undefined}
        />
        <StatsCard 
          title={isSuperAdmin ? "Total Platform Revenue" : "Total Revenue"} 
          value={`₹${filteredSales.toLocaleString()}`} 
          icon={IndianRupee} 
          color="bg-slate-900" 
          trend={salesPeriod === 'all' ? 'Lifetime' : salesPeriod === 'custom' ? 'Selected' : salesPeriod.toUpperCase()}
          filter={<DashboardFilter period={salesPeriod} setPeriod={setSalesPeriod} range={salesCustomRange} setRange={setSalesCustomRange} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isSuperAdmin ? (
              <>
                <Link href="/admin/restaurants" className="group flex items-center justify-between p-6 rounded-2xl bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all duration-300">
                  <div>
                    <p className="font-black text-lg">Review Restaurants</p>
                    <p className="text-sm font-medium opacity-70">Manage status and plans</p>
                  </div>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link href="/admin/orders" className="group flex items-center justify-between p-6 rounded-2xl bg-slate-50 hover:bg-amber-500 hover:text-white transition-all duration-300">
                  <div>
                    <p className="font-black text-lg">System-wide Orders</p>
                    <p className="text-sm font-medium opacity-70">Monitor live transactions</p>
                  </div>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/admin/menu" className="group flex items-center justify-between p-6 rounded-2xl bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all duration-300">
                  <div>
                    <p className="font-black text-lg">Manage Menu</p>
                    <p className="text-sm font-medium opacity-70">Categories and items</p>
                  </div>
                  <Utensils className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link href="/reception" className="group flex items-center justify-between p-6 rounded-2xl bg-slate-50 hover:bg-emerald-500 hover:text-white transition-all duration-300">
                  <div>
                    <p className="font-black text-lg">Reception Panel</p>
                    <p className="text-sm font-medium opacity-70">Live order tracking</p>
                  </div>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-4">{isSuperAdmin ? 'Admin Tip' : 'Pro Tip'}</h3>
            <p className="text-indigo-100 font-medium leading-relaxed mb-6">
              {isSuperAdmin 
                ? 'You can manually extend a restaurant\'s trial or plan from the restaurant detail page.' 
                : 'Keep your menu updated with live availability to improve customer experience and reduce order cancellations.'}
            </p>
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-sm font-bold">
              {isSuperAdmin ? 'Tip #04: Plan Management' : 'Tip #01: Live Menu'}
            </div>
          </div>
          <Store className="absolute -bottom-8 -right-8 w-40 h-40 text-white/5" />
        </div>
      </div>
    </div>
  );
}

