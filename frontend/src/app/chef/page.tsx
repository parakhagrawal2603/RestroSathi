'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ChefHat, CheckCircle2, Clock, Play, UtensilsCrossed, LogOut, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';

export default function ChefDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'preparing' | 'ready'>('pending');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  // Auth Guard
  useEffect(() => {
    if (!isAuthLoading && !['chef', 'admin'].includes(user?.role || '')) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  // Update "Time Ago" every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/active');
      console.log("Chef Orders:", data);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load kitchen orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success(`Order moved to ${status.toUpperCase()}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Order deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => o.status === activeTab)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, activeTab]);

  // Audio Alert
  const playNotification = useCallback(() => {
    try {
      // 1. Play Bell Sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.currentTime = 0;
      audio.play().catch(() => {});

      // 2. Voice Announcement ("New order received")
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("New order received");
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("Audio error:", e);
    }
  }, []);

  // Socket Listeners
  useEffect(() => {
    if (socket) {
      socket.on('newOrder', (newOrder: any) => {
        playNotification();
        setOrders(prev => [newOrder, ...prev]);
        toast(`New Order: Table ${newOrder.tableNumber}`, { icon: '🔥', duration: 3000 });
      });

      socket.on('orderUpdated', (updatedOrder: any) => {
        if (updatedOrder.isCompleted) {
          setOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
        } else {
          setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        }
      });

      socket.on('orderDeleted', (orderId: string) => {
        setOrders(prev => prev.filter(o => o._id !== orderId));
      });
    }
    return () => {
      socket?.off('newOrder');
      socket?.off('orderUpdated');
      socket?.off('orderDeleted');
    };
  }, [socket, playNotification]);

  if (isAuthLoading || !['chef', 'admin'].includes(user?.role || '')) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 shadow-sm z-20">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Kitchen Display</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {(['pending', 'preparing', 'ready'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex flex-col items-center gap-1 ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                {tab === 'pending' && <Clock className="w-3 h-3" />}
                {tab === 'preparing' && <Play className="w-3 h-3" />}
                {tab === 'ready' && <CheckCircle2 className="w-3 h-3" />}
                {tab}
              </span>
              <span className={`text-xs font-black ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>
                {orders.filter(o => o.status === tab).length}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-slate-400" />
            <p className="font-black uppercase tracking-widest text-[10px] text-slate-400">Syncing Kitchen...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
               <UtensilsCrossed className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">No {activeTab} Orders</h3>
            <p className="text-slate-400 text-sm font-medium italic">All caught up! The kitchen is running smoothly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => (
              <ChefOrderCard 
                key={order._id} 
                order={order} 
                onUpdateStatus={handleUpdateStatus} 
                onDelete={handleDelete}
                currentTime={currentTime}
              />
            ))}
          </div>
        )}
      </main>


      {/* Global CSS for scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .container-query {
          container-type: inline-size;
        }
      `}</style>
    </div>
  );
}

function ChefOrderCard({ order, onUpdateStatus, onDelete, currentTime }: { order: any, onUpdateStatus: (id: string, status: string) => void, onDelete: (id: string) => void, currentTime: number }) {
  const minutesAgo = Math.floor((currentTime - new Date(order.createdAt).getTime()) / 60000);
  
  const getStatusColor = () => {
    if (order.instructions && order.instructions.trim() !== "") {
      return 'border-red-400 bg-white/95 ring-2 ring-red-100/50';
    }
    switch (order.status) {
      case 'pending': return 'border-amber-400 bg-amber-50';
      case 'preparing': return 'border-blue-400 bg-blue-50';
      case 'ready': return 'border-green-400 bg-green-50';
      case 'served': return 'border-slate-400 bg-slate-100';
      default: return 'border-slate-200 bg-white';
    }
  };

  const getButtonConfig = () => {
    if (order.status === 'pending') return { label: 'Start Preparing', status: 'preparing', color: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' };
    if (order.status === 'preparing') return { label: 'Mark Ready', status: 'ready', color: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' };
    if (order.status === 'ready') return { label: 'Mark Served', status: 'served', color: 'bg-slate-500 hover:bg-slate-600 shadow-slate-200' };
    return null;
  };

  const button = getButtonConfig();

  const handleStatusUpdate = () => {
    if (!button) return;
    if (button.status === 'served') {
      if (window.confirm('Mark order as served?')) {
        onUpdateStatus(order._id, button.status);
      }
    } else {
      onUpdateStatus(order._id, button.status);
    }
  };

  return (
    <div className={`p-5 rounded-[2.5rem] border-2 transition-all flex flex-col min-h-[180px] shadow-sm hover:shadow-xl ${getStatusColor()}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-white/50">
            {order.tableNumber}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Order Time</p>
            <p className="text-sm font-black text-slate-800">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${
            minutesAgo > 15 ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-white/80 text-slate-500 border border-slate-100'
          }`}>
            <Clock className={`w-3 h-3 ${minutesAgo > 15 ? 'animate-pulse' : ''}`} />
            {minutesAgo}m ago
          </div>
        </div>
      </div>

      <div className="flex-1 mb-6">
        <ul className="space-y-2">
          {order.items.map((item: any, idx: number) => (
            <li key={idx} className="flex justify-between items-center bg-white/60 p-3 rounded-2xl border border-indigo-50">
              <span className="flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">{item.quantity}</span>
                <span className="font-bold text-slate-800 text-sm tracking-tight truncate max-w-[140px]">
                  {item.name || item.menuItem?.name || 'Item'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {order.instructions && order.instructions.trim() !== "" && (
        <div className="mb-6 bg-red-50 border border-red-200 p-3 rounded-[1.5rem] shadow-sm animate-pulse-subtle">
          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>📝 Instructions:</span>
          </p>
          <p className="text-sm text-red-700 font-bold italic leading-tight">
            &quot;{order.instructions}&quot;
          </p>
        </div>
      )}

      <div className="space-y-2">
        {button && (
          <button
            onClick={handleStatusUpdate}
            className={`w-full py-5 ${button.color} text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3`}
          >
            {button.status === 'preparing' && <Play className="w-4 h-4 fill-current" />}
            {(button.status === 'ready' || button.status === 'served') && <CheckCircle2 className="w-4 h-4" />}
            {button.label}
          </button>
        )}

        {order.status === 'pending' && (
          <button
            onClick={() => onDelete(order._id)}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Reject Order
          </button>
        )}
      </div>

      {!button && order.status === 'served' ? (
        <div className="w-full py-5 bg-slate-200 text-slate-600 border border-slate-300 rounded-[1.5rem] text-center font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
           <CheckCircle2 className="w-4 h-4" />
           Order Served
        </div>
      ) : !button && order.status === 'ready' ? (
        <div className="w-full py-5 bg-green-100 text-green-700 border border-green-200 rounded-[1.5rem] text-center font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
           Awaiting Service
        </div>
      ) : null}
    </div>
  );
}
