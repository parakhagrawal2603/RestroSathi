'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { 
  Search, 
  ExternalLink, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Store,
  UserPlus,
  Check,
  X,
  History
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AddRestaurantModal from '@/components/admin/AddRestaurantModal';
import ExtendPlanModal from '@/components/admin/ExtendPlanModal';

export default function RestaurantsList() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'approved' | 'pending'>('approved');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<any | null>(null);
  const [selectedDelete, setSelectedDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<{ id: string, name: string, date: string } | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, [activeTab]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const [restRes, orderRes] = await Promise.all([
        api.get(`/restaurants?approvalStatus=${activeTab}`),
        api.get('/orders')
      ]);
      setRestaurants(restRes.data);
      setOrders(orderRes.data);
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const { data } = await api.put(`/restaurants/${id}/toggle-status`);
      setRestaurants(prev => prev.map(r => r._id === id ? data : r));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const markPaid = async (id: string) => {
    try {
      const { data } = await api.put(`/restaurants/${id}/mark-paid`, { paymentMode: 'UPI' });
      setRestaurants(prev => prev.map(r => r._id === id ? data : r));
      toast.success('Marked as paid');
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  // Plan extension is now handled by the ExtendPlanModal component
  const onExtensionSuccess = () => {
    fetchRestaurants();
  };

  const deleteRestaurant = async () => {
    if (!selectedDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/restaurants/${selectedDelete.id}`);
      setRestaurants(prev => prev.filter(r => r._id !== selectedDelete.id));
      toast.success(`Restaurant "${selectedDelete.name}" deleted`);
      setSelectedDelete(null);
    } catch (error) {
      toast.error('Failed to delete restaurant');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const updateExpiryDate = async () => {
    if (!selectedExpiry || !newExpiryDate) return;
    try {
      const { data } = await api.put(`/restaurants/${selectedExpiry.id}/update-expiry`, { expiryDate: newExpiryDate });
      setRestaurants(prev => prev.map(r => r._id === selectedExpiry.id ? data : r));
      toast.success(`Expiry date updated for ${selectedExpiry.name}`);
      setSelectedExpiry(null);
    } catch (error) {
      toast.error('Failed to update expiry date');
    }
  };

  const approveRestaurant = async (id: string, name: string) => {
    try {
      await api.put(`/restaurants/${id}/approve`);
      toast.success(`${name} approved successfully`);
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to approve restaurant');
    }
  };

  const rejectRestaurant = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to reject and remove ${name}?`)) return;
    try {
      await api.put(`/restaurants/${id}/reject`);
      toast.success(`${name} rejected`);
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to reject restaurant');
    }
  };

  const getStatusInfo = (status: string, expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'pending') return { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: AlertCircle };
    if (status !== 'active') return { label: 'Inactive', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle };
    if (diffDays <= 7) return { label: 'Expiring Soon', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: AlertCircle };
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: CheckCircle2 };
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'approved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Restaurants
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pending Approvals
            {activeTab === 'approved' && restaurants.filter(r => r.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Onboard Tenant
          </button>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none font-bold text-sm transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Restaurant</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-medium">No restaurants found.</td>
                </tr>
              ) : filteredRestaurants.map((r) => {
                const statusInfo = getStatusInfo(r.status, r.expiryDate);
                const orderCount = orders.filter(o => o.restaurantId?._id === r._id).length;
                const Icon = statusInfo.icon;
                
                return (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-extrabold">{r.name}</span>
                        <span className="text-xs text-slate-400 font-bold">{r.ownerName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{r.email}</span>
                        {r.phone && <span className="text-[10px] text-indigo-600 font-bold">{r.phone}</span>}
                      </div>
                    </td>
                    {activeTab === 'approved' ? (
                      <>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${statusInfo.color}`}>
                            <Icon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                             <span className={`text-xs ${r.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-500'}`}>
                               {r.paymentStatus === 'paid' ? 'Completed' : 'Pending'}
                             </span>
                             {r.paymentStatus !== 'paid' && (
                               <button 
                                 onClick={() => markPaid(r._id)}
                                 className="text-[10px] text-indigo-600 hover:underline text-left uppercase tracking-tighter"
                               >
                                 Mark Paid
                               </button>
                             )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-600 text-sm group/expiry">
                            <Calendar className="w-4 h-4 opacity-40" />
                            <span>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : 'N/A'}</span>
                            <button 
                              onClick={() => {
                                setSelectedExpiry({ id: r._id, name: r.name, date: r.expiryDate || new Date().toISOString() });
                                setNewExpiryDate(r.expiryDate ? new Date(r.expiryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                              }}
                              className="opacity-0 group-hover/expiry:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                              title="Edit Expiry"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm">
                            {orderCount}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedExtension(r)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Extend Plan"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => toggleStatus(r._id)}
                              className={`p-2 rounded-xl transition-all ${r.status === 'active' ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                              title={r.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {r.status === 'active' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                            </button>
                            <Link 
                              href={`/admin/restaurants/${r._id}`}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </Link>
                            <button 
                              onClick={() => setSelectedDelete({ id: r._id, name: r.name })}
                              className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete Restaurant"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-2 text-slate-500 text-xs">
                             <History className="w-3 h-3 opacity-40" />
                             {new Date(r.createdAt).toLocaleDateString()}
                           </div>
                        </td>
                        <td colSpan={3} className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-3">
                             <button 
                               onClick={() => rejectRestaurant(r._id, r.name)}
                               className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-1.5"
                             >
                               <X className="w-3 h-3" />
                               Reject
                             </button>
                             <button 
                               onClick={() => approveRestaurant(r._id, r.name)}
                               className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                             >
                               <Check className="w-3 h-3" />
                               Approve
                             </button>
                           </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddRestaurantModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchRestaurants} 
      />

      <ExtendPlanModal 
        isOpen={!!selectedExtension} 
        onClose={() => setSelectedExtension(null)} 
        onSuccess={onExtensionSuccess} 
        restaurant={selectedExtension} 
      />

      {/* Delete Confirmation Modal */}
      {selectedDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">Delete Restaurant?</h3>
            <p className="text-slate-500 font-medium text-center text-sm mb-8 leading-relaxed">
              Are you sure you want to delete <span className="text-slate-800 font-bold">"{selectedDelete.name}"</span>? This action cannot be undone and will remove all associated data.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={deleteRestaurant}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Update Modal */}
      {selectedExpiry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-2">Update Expiry</h3>
            <p className="text-slate-500 font-medium text-sm mb-6">
              Restaurant: <span className="text-slate-800 font-bold">{selectedExpiry.name}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">New Expiry Date</label>
                <input 
                  type="date" 
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setSelectedExpiry(null)}
                  className="flex-1 py-3 px-4 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={updateExpiryDate}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  Save Date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
