'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ConciergeBell, Banknote, Clock, Calendar, CheckCircle2, Trash2, History, X, IndianRupee, CreditCard, Smartphone, ReceiptText, Filter, RotateCcw, Phone, Utensils, MessageSquare, ChevronDown } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useRouter } from 'next/navigation';

export default function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom'>('today');

  // Date Range States
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState(""); // Fully controlled toDate state
  const [appliedRange, setAppliedRange] = useState<{from: string, to: string} | null>(null);

  // Helper to get local date string YYYY-MM-DD
  const getLocalISODate = (date: Date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { user, isLoading: isAuthLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();

  const navItems = [
    { label: 'Orders', icon: ConciergeBell, href: '/reception' },
    { label: 'Menu', icon: Utensils, href: '/reception/menu' }
  ];

  useEffect(() => {
    if (!isAuthLoading && !['reception', 'admin'].includes(user?.role || '')) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const fetchOrders = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'active' ? '/orders/active' : '/orders/history';
      let params: any = {};

      if (activeTab === 'history') {
        if (dateFilter === 'today') {
          params.from = getLocalISODate();
          params.to = params.from;
        } else if (dateFilter === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          params.from = getLocalISODate(yesterday);
          params.to = params.from;
        } else if (dateFilter === 'custom' && appliedRange) {
          params.from = appliedRange.from;
          params.to = appliedRange.to;
        }
      }

      const { data } = await api.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      const sorted = Array.isArray(data) ? [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
      setOrders(sorted);
    } catch (error: any) {
      console.error("[FRONTEND] FETCH ORDERS ERROR:", error.response?.data || error.message);
      if (error.response?.status === 401) router.push('/login');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFilter, appliedRange, router]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  useEffect(() => {
    if (socket) {
      socket.on('newOrder', (newOrder: any) => {
        // Always add new orders if we are in the active tab
        if (activeTab === 'active') {
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => console.log("Audio play blocked"));
          } catch (e) { }
          setOrders(prev => [newOrder, ...prev]);
          toast(`New Order from Table ${newOrder.tableNumber}`, { icon: '🔔' });
        }
      });
      socket.on('orderUpdated', (updatedOrder: any) => {
        if (activeTab === 'active') {
          if (updatedOrder.isCompleted) {
            setOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
            toast.success(`Order Table ${updatedOrder.tableNumber} completed!`, { icon: '✅' });
          } else {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
          }
        } else if (activeTab === 'history') {
          // If we are in history, and an order is completed today, add it to the top
          if (updatedOrder.isCompleted) {
            const todayStr = new Date().toISOString().split('T')[0];
            const orderDateStr = new Date(updatedOrder.createdAt).toISOString().split('T')[0];

            if (dateFilter === 'today' || (dateFilter === 'custom' && orderDateStr === todayStr)) {
              setOrders(prev => {
                const exists = prev.find(o => o._id === updatedOrder._id);
                if (exists) {
                  return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                }
                return [updatedOrder, ...prev];
              });
            }
          }
        }
      });

      socket.on('orderDeleted', (orderId: string) => {
        console.log("Socket: Received orderDeleted event for ID:", orderId);
        setOrders(prev => prev.filter(o => o._id !== orderId));
      });
    }
    return () => {
      socket?.off('newOrder');
      socket?.off('orderUpdated');
      socket?.off('orderDeleted');
    };
  }, [socket, activeTab, dateFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      await api.put(`/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Order marked as ${status}`);
    } catch (error: any) {
      if (error.response?.status === 401) router.push('/login');
      toast.error('Update failed');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      await api.delete(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order deleted');
      // No need to manually update state as socket will handle it
    } catch (error: any) {
      if (error.response?.status === 401) router.push('/login');
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const onConfirmPayment = async (paymentMethod: string) => {
    if (!selectedOrder) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    try {
      await api.put(`/orders/${selectedOrder._id}/pay`, { paymentMethod }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Payment recorded via ${paymentMethod.toUpperCase()}`);
      setShowPaymentModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      if (error.response?.status === 401) router.push('/login');
      toast.error('Payment failed');
    }
  };

  const handleApplyCustomDate = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates");
      return;
    }
    setAppliedRange({ from: fromDate, to: toDate });
  };

  const handleResetFilters = () => {
    setFromDate("");
    setToDate("");
    setAppliedRange(null);
    setDateFilter('today');
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === 'history') return orders;
    return orders.filter(o => statusFilter === 'all' || o.status === statusFilter);
  }, [orders, activeTab, statusFilter]);

  if (isAuthLoading || !['reception', 'admin'].includes(user?.role || '')) return null;

  return (
    <DashboardLayout title="Reception & Billing" items={navItems}>
      <div className="space-y-6">
        {/* Tabs and Global Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-3 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto">
            <button onClick={() => setActiveTab('active')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Clock className="w-4 h-4" /> Active
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <History className="w-4 h-4" /> History
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {activeTab === 'active' ? (
              ['all', 'pending', 'preparing', 'ready', 'served'].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                  {s}
                </button>
              ))
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Period</span>
                <div className="flex items-center gap-3">
                  {/* Styled Dropdown */}
                  <div className="relative group">
                    <select
                      value={dateFilter}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setDateFilter(val);
                        if (val !== 'custom') {
                          setFromDate("");
                          setToDate("");
                          setAppliedRange(null);
                        }
                      }}
                      className="appearance-none bg-white border border-indigo-100 rounded-[1.25rem] px-6 py-2.5 pr-10 text-sm font-black text-slate-650 outline-none focus:border-indigo-500 transition-all shadow-sm min-w-[200px] cursor-pointer"
                    >
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={handleResetFilters}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-indigo-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-500 transition-all shadow-sm group active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5 group-active:rotate-180 transition-all duration-500" />
                  </button>
                </div>

                {/* Custom Date Inputs (Conditional) */}
                {dateFilter === 'custom' && (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-300 mt-1">
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">From</span>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                      />
                    </div>
                    <div className="hidden sm:block w-px h-4 bg-slate-200"></div>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">To</span>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none"
                      />
                    </div>
                    <button
                      onClick={handleApplyCustomDate}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* History Summary */}
        {activeTab === 'history' && (dateFilter === 'custom' && appliedRange) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-xs font-bold animate-in fade-in slide-in-from-left-4">
            <Calendar className="w-4 h-4" />
            Showing orders from {appliedRange.from} to {appliedRange.to}
          </div>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium tracking-tight">Syncing records...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  isHistory={activeTab === 'history'}
                  onUpdateStatus={handleUpdateStatus}
                  onMarkPaid={(o: any) => { setSelectedOrder(o); setShowPaymentModal(true); }}
                  onViewDetails={(o: any) => { setSelectedOrder(o); setShowBillModal(true); }}
                  onDelete={handleDeleteOrder}
                />
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100 border-dashed">
                <div className="inline-block p-8 bg-slate-50 rounded-3xl mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-12 h-12 text-slate-300" />
                </div>
                <p className="text-slate-500 text-lg font-medium tracking-tight">No orders found for this selection.</p>
                <button onClick={handleResetFilters} className="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">Clear all filters</button>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showBillModal && <BillDetailsModal order={selectedOrder} onClose={() => { setShowBillModal(false); setSelectedOrder(null); }} />}
        {showPaymentModal && <PaymentMethodModal onConfirm={onConfirmPayment} onClose={() => { setShowPaymentModal(false); setSelectedOrder(null); }} />}
      </div>
    </DashboardLayout>
  );
}

// Helper Function for Status Styles
function getStatusStyle(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 border-yellow-400';
    case 'preparing': return 'bg-blue-100 border-blue-400';
    case 'ready': return 'bg-green-100 border-green-400';
    case 'served': return 'bg-gray-100 border-gray-400';
    default: return 'bg-white border-slate-100';
  }
}

function OrderCard({ order, isHistory, onUpdateStatus, onMarkPaid, onViewDetails, onDelete }: any) {
  const items = order.items || [];
  const totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

  return (
    <div
      onClick={() => onViewDetails(order)}
      className={`group flex flex-col rounded-[2rem] border transition-all hover:shadow-xl cursor-pointer ${getStatusStyle(order.status)} ${order.status === 'ready' && !isHistory ? 'animate-pulse border-2 border-green-600 shadow-green-100 scale-[1.02]' : 'border shadow-sm'
        }`}
    >
      <div className="p-5 border-b border-white/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-white/50">
            {order.tableNumber}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500/70 leading-none mb-1">Table</p>
            <p className="text-base font-bold text-slate-800 tracking-tight truncate max-w-[120px]">
              {order.customer?.name || 'Guest'}
            </p>
            {/* Phone Display */}
            {order.customer?.phone ? (
              <a
                href={`tel:${order.customer.phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors mt-0.5"
              >
                <Phone className="w-3 h-3 text-indigo-500" />
                {order.customer.phone}
              </a>
            ) : (
              <p className="text-[10px] font-bold text-slate-300 mt-0.5">Phone: N/A</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 mb-1">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-white/90`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1">
        <ul className="space-y-2 opacity-90">
          {items.slice(0, 3).map((item: any, idx: number) => (
            <li key={idx} className="flex justify-between items-start text-xs font-bold text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 bg-white/50 rounded flex items-center justify-center text-[10px]">{item.quantity}x</span>
                <span className="truncate max-w-[140px]">{item.name || item.menuItem?.name || 'Item'}</span>
              </span>
            </li>
          ))}
        </ul>

        {order.instructions && order.instructions.trim() !== "" && (
          <div className="mt-4 p-2 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 animate-pulse-subtle">
            <MessageSquare className="w-3 h-3 text-rose-500 mt-0.5" />
            <p className="text-[10px] font-bold text-rose-700 leading-tight truncate">
              "{order.instructions}"
            </p>
          </div>
        )}
      </div>

      <div className="p-5 bg-white/30 rounded-b-[2rem] border-t border-white/50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Bill</span>
          <span className="text-2xl font-black text-slate-900 tracking-tight">₹{totalAmount}</span>
        </div>

        {!isHistory && (
          <div className="flex gap-2">
            {order.status === 'ready' ? (
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateStatus(order._id, 'served'); }}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
              >
                <CheckCircle2 className="w-4 h-4" /> Finalize Serve
              </button>
            ) : order.isPaid && order.status === 'served' ? (
              <div className="flex-1 py-3 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-2xl text-center border border-emerald-100">Order Finalized</div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkPaid(order); }}
                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                <Banknote className="w-4 h-4" /> Collect Cash
              </button>
            )}
            {order.status === 'pending' && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(order._id); }}
                className="py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {order.isPaid && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-[10px] font-black uppercase text-emerald-600">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            Paid via {order.paymentMethod || 'cash'}
          </div>
        )}
      </div>
    </div>
  );
}

function BillDetailsModal({ order, onClose }: { order: any, onClose: () => void }) {
  const items = order.items || [];
  const totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Tax Invoice</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Table {order.tableNumber} • {order.customer?.name || 'Guest'}</p>
            {/* Phone Display In Modal */}
            {order.customer?.phone && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-0.5">
                <Phone className="w-3 h-3 text-indigo-400" />
                {order.customer.phone}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-4">
                  <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-600">{item.quantity}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.name || 'Item'}</p>
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Unit Price: ₹{item.price}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 mt-2">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          {order.instructions && order.instructions.trim() !== "" && (
            <div className="mt-8 p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem]">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Customer Notes</span>
              </div>
              <p className="text-sm font-bold text-rose-800 italic leading-relaxed">
                "{order.instructions}"
              </p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-900 text-white rounded-t-[3rem]">
          <div className="space-y-2 mb-8">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
              <span className="text-sm font-bold">₹{totalAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-[0.2em]">Grand Total</span>
              <span className="text-4xl font-black text-indigo-400">₹{totalAmount}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-5 bg-white text-slate-900 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-white/5 active:scale-95">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodModal({ onConfirm, onClose }: { onConfirm: (method: string) => void, onClose: () => void }) {
  const methods = [
    { id: 'cash', label: 'Cash', icon: IndianRupee, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'card', label: 'Card', icon: CreditCard, color: 'text-blue-500 bg-blue-50' },
    { id: 'upi', label: 'UPI / Scan', icon: Smartphone, color: 'text-indigo-500 bg-indigo-50' },
    { id: 'other', label: 'Other', icon: ReceiptText, color: 'text-slate-500 bg-slate-50' },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 animate-in fade-in slide-in-from-bottom-8 duration-300 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Banknote className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-2">Billing</h3>
          <p className="text-sm font-bold text-slate-400 leading-relaxed px-4">Choose the preferred payment gateway to fulfill this order.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => onConfirm(m.id)}
              className="flex flex-col items-center gap-4 p-5 rounded-[3rem] border border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 group transition-all active:scale-95"
            >
              <div className={`w-14 h-14 ${m.color} rounded-2xl flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all`}>
                <m.icon className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-indigo-600">{m.label}</span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest">
          Go Back
        </button>
      </div>
    </div>
  );
}
