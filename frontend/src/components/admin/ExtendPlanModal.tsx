import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export default function ExtendPlanModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  restaurant
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
  restaurant: any;
}) {
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState('30');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!days || isNaN(Number(days))) return toast.error('Enter valid days');
    
    setLoading(true);
    try {
      await api.put(`/admin/restaurants/${restaurant._id}/extend`, { days: Number(days) });
      toast.success(`${restaurant.name} plan extended by ${days} days`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to extend plan');
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Extend Tenant Plan">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <p className="text-sm text-indigo-900 mb-1">Extending plan for:</p>
          <p className="font-bold text-lg text-indigo-900">{restaurant.name}</p>
          {restaurant.expiryDate && (
             <p className="text-xs font-semibold text-indigo-700 mt-1">
               Current Expiry: {new Date(restaurant.expiryDate).toLocaleDateString()}
             </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Days to Extend</label>
          <div className="flex gap-2 mb-4">
             {[7, 30, 90, 365].map(preset => (
               <button 
                 type="button" key={preset}
                 onClick={() => setDays(preset.toString())}
                 className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-colors ${
                   days === preset.toString() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                 }`}
               >
                 {preset}d
               </button>
             ))}
          </div>
          <div className="relative">
             <input type="number" min="1" required value={days} onChange={e => setDays(e.target.value)} className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-lg font-bold text-slate-800" />
             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Days</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            If account is currently expired, this extension will start from <strong>today</strong>. If active, it will push out the existing deadline seamlessly.
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 btn-primary">{loading ? 'Extending...' : 'Confirm Extension'}</button>
        </div>
      </form>
    </Modal>
  );
}
