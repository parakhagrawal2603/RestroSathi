'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { 
  ShoppingBag, 
  Store,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Filter,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  X,
  Phone,
  User,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import OrderCard from '@/components/admin/OrderCard';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

export default function OrdersPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState('');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (socket && !isSuperAdmin) {
      socket.on('newOrder', (newOrder: any) => {
        setData(prev => [newOrder, ...prev]);
        toast(`New Order: Table ${newOrder.tableNumber}`, { icon: '🛍️' });
      });

      socket.on('orderUpdated', (updatedOrder: any) => {
        setData(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      });

      socket.on('orderDeleted', (orderId: string) => {
        console.log("Socket: Received orderDeleted event for ID:", orderId);
        setData(prev => prev.filter(o => o._id !== orderId));
      });
    }

    return () => {
      socket?.off('newOrder');
      socket?.off('orderUpdated');
      socket?.off('orderDeleted');
    };
  }, [socket, isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const endpoint = isSuperAdmin ? '/restaurants/orders-summary' : '/orders';
      const { data } = await api.get(endpoint);
      setData(data);
    } catch (error) {
      toast.error('Failed to load orders');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (order: any) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Orders Summary</h2>
          <p className="text-slate-500 font-medium tracking-tight">Aggregated performance metrics across all restaurants.</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Restaurant Name</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Total Orders</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Orders Today</th>
                  <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-32"></div></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-16 mx-auto"></div></td>
                      <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded-full w-16 mx-auto"></div></td>
                      <td className="px-6 py-6 text-right"><div className="h-4 bg-slate-100 rounded-full w-24 ml-auto"></div></td>
                    </tr>
                  ))
                ) : data.map((item) => {
                  const isHighPerformer = item.ordersToday >= 10 || item.totalOrders >= 50;
                  return (
                    <tr key={item.restaurantId} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                            <Store className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                          </div>
                          <span className="text-slate-800 font-extrabold">{item.restaurantName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-2xl text-sm font-black">
                          {item.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-2xl text-sm font-black ${
                          item.ordersToday > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {item.ordersToday}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {isHighPerformer ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-tight">
                            <TrendingUp className="w-3 h-3" /> High Performer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-tight">
                            <BarChart3 className="w-3 h-3" /> Standard
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2">Total System Load</h3>
              <p className="text-indigo-100 font-medium mb-4 opacity-80">Total orders processed across all active panels.</p>
              <p className="text-4xl font-black">{data.reduce((acc, curr) => acc + curr.totalOrders, 0)}</p>
            </div>
            <ShoppingBag className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10" />
          </div>
          <div className="bg-emerald-500 rounded-3xl p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-2">Real-time Momentum</h3>
              <p className="text-emerald-50 text-emerald-100 font-medium mb-4 opacity-80">New transactions recorded since midnight.</p>
              <p className="text-4xl font-black">{data.reduce((acc, curr) => acc + curr.ordersToday, 0)}</p>
            </div>
            <TrendingUp className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10" />
          </div>
        </div>
      </div>
    );
  }

  const filteredData = data.filter(order => {
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    if (selectedDateFilter === 'all') return matchesStatus;

    const orderDate = new Date(order.createdAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDateNormalized = new Date(orderDate);
    orderDateNormalized.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (selectedDateFilter === 'today') {
      matchesDate = orderDateNormalized.getTime() === today.getTime();
    } else if (selectedDateFilter === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      matchesDate = orderDateNormalized.getTime() === yesterday.getTime();
    } else if (selectedDateFilter === 'last7') {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      matchesDate = orderDateNormalized >= last7;
    } else if (selectedDateFilter === 'custom' && customDate) {
      const custom = new Date(customDate);
      custom.setHours(0, 0, 0, 0);
      matchesDate = orderDateNormalized.getTime() === custom.getTime();
    }

    return matchesStatus && matchesDate;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Orders Dashboard</h2>
          <p className="text-slate-500 font-medium tracking-tight">Real-time tracking and multi-dimensional filtering.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="flex flex-col gap-1.5 flex-1 md:flex-initial">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Status</label>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-w-[140px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="served">Served</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 md:flex-initial">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Period</label>
            <select 
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-w-[140px]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>

          {selectedDateFilter === 'custom' && (
            <div className="flex flex-col gap-1.5 flex-1 md:flex-initial animate-in slide-in-from-left-2 duration-200">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
              <input 
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          )}

          <div className="flex items-end h-full pt-5">
            <button 
              onClick={() => { setSelectedStatus('all'); setSelectedDateFilter('all'); setCustomDate(''); }}
              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              title="Clear All Filters"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
            {filteredData.length} Orders Found
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 animate-pulse h-64 shadow-sm"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((order) => (
                <OrderCard key={order._id} order={order} onView={handleView} />
              ))
            }
          </div>

          {filteredData.length === 0 && (
            <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-bold tracking-tight text-lg uppercase">
                No orders match your filters
              </p>
              <button 
                onClick={() => { setSelectedStatus('all'); setSelectedDateFilter('all'); setCustomDate(''); }}
                className="mt-6 px-6 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => { setShowModal(false); setSelectedOrder(null); }} />
      )}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: any, onClose: () => void }) {
  const items = order.items || [];
  const totalAmount = items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Order Audit</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
              Table {order.tableNumber} • ID: {order._id.slice(-8)}
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Customer Info */}
          <div className="flex gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <User className="w-4 h-4 text-indigo-500" />
                {order.customer?.name || 'Guest'}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
              <div className="flex items-center gap-2 text-slate-800 font-bold underline decoration-indigo-200 underline-offset-4">
                <Phone className="w-4 h-4 text-indigo-500" />
                {order.customer?.phone || 'N/A'}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fulfillment</p>
              <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-md">{order.status}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  order.status === 'pending' ? 'w-1/4 bg-yellow-400' :
                  order.status === 'preparing' ? 'w-2/4 bg-blue-400' :
                  order.status === 'ready' ? 'w-3/4 bg-green-500' : 'w-full bg-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Itemized List */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Itemized Breakdown</p>
            <div className="space-y-3">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="flex gap-4">
                    <span className="w-8 h-8 bg-white shadow-sm border border-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-600">{item.quantity}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{item.name || 'Product'}</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">₹{item.price} / unit</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Amount Paid</p>
            <p className="text-3xl font-black text-white">₹{totalAmount}</p>
          </div>
          <button onClick={onClose} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-white/10">
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
