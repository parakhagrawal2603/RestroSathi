'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { 
  ArrowLeft, 
  Store,
  Calendar, 
  Phone, 
  Mail, 
  User, 
  MapPin, 
  CreditCard,
  ShoppingBag,
  Clock,
  Save,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Trash2,
  QrCode,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

export default function RestaurantDetail() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [extensionDays, setExtensionDays] = useState('30');

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [restRes, orderRes] = await Promise.all([
        api.get(`/restaurants/${params.id}`),
        api.get(`/orders?restaurantId=${params.id}`)
      ]);
      setRestaurant(restRes.data);
      setNotes(restRes.data.notes || '');
      setOrders(orderRes.data);
    } catch (error) {
      toast.error('Failed to load restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await api.patch(`/restaurants/${params.id}`, { notes });
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    try {
      const { data } = await api.put(`/restaurants/${params.id}/toggle-status`);
      setRestaurant(data);
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const extendPlan = async () => {
    try {
      const { data } = await api.put(`/restaurants/${params.id}/extend`, { days: extensionDays });
      setRestaurant(data);
      toast.success('Plan extended');
    } catch (error) {
      toast.error('Failed to extend plan');
    }
  };

  const markPaid = async () => {
    try {
      const { data } = await api.put(`/restaurants/${params.id}/mark-paid`);
      setRestaurant(data);
      toast.success('Marked as paid');
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const deleteRestaurant = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/restaurants/${params.id}`);
      toast.success('Restaurant deleted successfully');
      router.push('/admin/restaurants');
    } catch (error) {
      toast.error('Failed to delete restaurant');
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-admin') as HTMLCanvasElement;
    if (!canvas) return;
    
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${restaurant.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMenuLink = () => {
    const url = `${window.location.origin}/r/${restaurant._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Menu link copied to clipboard');
  };

  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/r/${restaurant?._id}` 
    : '';

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!restaurant) return <div>Restaurant not found</div>;

  const today = new Date().toISOString().split('T')[0];
  const ordersToday = orders.filter(o => new Date(o.createdAt).toISOString().split('T')[0] === today).length;
  const lastOrder = orders[0];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-all group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </div>
          Back to List
        </button>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border ${
            restaurant.status === 'active' 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
              : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}>
            {restaurant.status}
          </span>
          <button 
            onClick={toggleStatus}
            className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              restaurant.status === 'active'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            }`}
          >
            {restaurant.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Basic Info */}
          <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                <Store className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Business Profile</h3>
                <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Basic Information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Store className="w-3 h-3" /> Restaurant Name
                </span>
                <p className="text-lg font-black text-slate-800">{restaurant.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3" /> Owner Name
                </span>
                <p className="text-lg font-black text-slate-800">{restaurant.ownerName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Contact Phone
                </span>
                <p className="text-lg font-black text-slate-800">{restaurant.phone}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email Address
                </span>
                <p className="text-lg font-black text-slate-800">{restaurant.email}</p>
              </div>
            </div>
            {restaurant.address && (
              <div className="mt-8 space-y-1 border-t border-slate-50 pt-8">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Address
                </span>
                <p className="text-slate-600 font-bold">{restaurant.address}</p>
              </div>
            )}
          </section>

          {/* Grid for Administrative Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Section 5: Notes */}
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden group h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Admin Notes</h3>
                <button 
                  onClick={saveNotes}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                >
                  {saving ? '...' : <Save className="w-3.5 h-3.5" />}
                  {saving ? '' : 'Save'}
                </button>
              </div>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about this restaurant..."
                className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 outline-none focus:bg-white focus:border-indigo-600 transition-all font-bold text-slate-800 resize-none text-xs"
              />
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 -mr-12 -mt-12 rounded-full opacity-50 pointer-events-none transition-transform group-hover:scale-110" />
            </section>

            {/* Section: Menu QR Code for Admin */}
            <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6 h-full flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 leading-tight">Menu QR</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Entry</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-100">
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                  <QRCodeCanvas 
                      id="qr-code-admin"
                      value={menuUrl}
                      size={120}
                      level="H"
                      includeMargin={true}
                  />
                </div>

                <div className="w-full space-y-2">
                  <button 
                    onClick={downloadQR}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-900/10"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyMenuLink}
                      className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <a 
                      href={menuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right Column - Status and Stats */}
        <div className="space-y-8">
          {/* Section 2: Payment/Plan */}
          <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 mb-8">Plan & Payment</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                <span className={`font-black text-sm uppercase px-3 py-1 rounded-lg ${restaurant.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {restaurant.paymentStatus}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                     <Calendar className="w-4 h-4 text-indigo-600" />
                   </div>
                   <div className="flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expires On</p>
                     <p className="text-sm font-black text-slate-800">{new Date(restaurant.expiryDate).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                     <CreditCard className="w-4 h-4 text-indigo-600" />
                   </div>
                   <div className="flex-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Paid</p>
                     <p className="text-sm font-black text-slate-800">{restaurant.lastPaymentDate ? new Date(restaurant.lastPaymentDate).toLocaleDateString() : 'N/A'}</p>
                   </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                 <button 
                   onClick={markPaid}
                   className="w-full py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all active:scale-95"
                 >
                   Manual Mark Paid
                 </button>
                 <div className="p-4 bg-slate-900 rounded-3xl space-y-4">
                    <p className="text-white text-xs font-black uppercase tracking-widest text-center opacity-60">Extend Plan</p>
                    <div className="flex gap-2">
                       <input 
                         type="number" 
                         value={extensionDays}
                         onChange={(e) => setExtensionDays(e.target.value)}
                         className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-white font-bold outline-none focus:bg-white/20 transition-all text-sm"
                       />
                       <button 
                         onClick={extendPlan}
                         className="bg-white text-slate-900 rounded-xl px-4 font-black text-xs uppercase"
                       >
                         Apply
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </section>

          {/* Section 3: Usage Stats */}
          <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-8">System Usage</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <ShoppingBag className="w-5 h-5 text-indigo-400 mb-3" />
                  <p className="text-2xl font-black text-slate-800">{orders.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Orders</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-indigo-900 bg-indigo-50/50">
                  <TrendingUp className="w-5 h-5 text-indigo-600 mb-3" />
                  <p className="text-2xl font-black text-indigo-600">{ordersToday}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders Today</p>
               </div>
            </div>
            {lastOrder && (
              <div className="mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Transaction</p>
                    <p className="text-sm font-black text-slate-800 truncate">{new Date(lastOrder.createdAt).toLocaleString()}</p>
                  </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Deletion Section */}
      <div className="pt-10 border-t border-slate-200">
        <div className="bg-rose-50 rounded-3xl p-8 border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-800">Danger Zone</h4>
              <p className="text-sm font-medium text-slate-500">Permanently remove this restaurant and all its associated data.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-500/30 transition-all active:scale-95 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Restaurant
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">Are you sure?</h3>
            <p className="text-slate-500 font-medium text-center text-sm mb-8 leading-relaxed">
              You are about to delete <span className="text-slate-800 font-bold">"{restaurant.name}"</span>. This action cannot be undone and will remove all menu items, orders, and staff records.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
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
    </div>
  );
}
