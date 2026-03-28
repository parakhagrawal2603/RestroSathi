import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

const initialFormState = {
  name: '',
  price: '',
  categoryId: '',
  isVeg: true,
  availabilityMode: 'auto' as 'auto' | 'on' | 'off',
  timeSlotIds: [] as string[],
  image: ''
};

export default function MenuItemForm({ 
  isOpen, 
  onClose, 
  onSuccess,
  categories = [],
  initialData = null
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
  initialData?: any;
}) {
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (isOpen) {
      api.get('/menu/timeslot')
        .then(res => setTimeSlots(res.data))
        .catch((error) => {
          const msg = error.response?.data?.message || error.message || 'Failed to load Time Slots';
          toast.error(msg);
        });
      
      if (initialData) {
        setFormData({
          name: initialData.name,
          price: initialData.price.toString(),
          categoryId: initialData.categoryId,
          isVeg: initialData.isVeg,
          availabilityMode: initialData.availabilityMode || 'auto',
          timeSlotIds: (initialData.timeSlotIds || []).map((slot: any) => 
            typeof slot === 'object' ? slot._id : slot
          ),
          image: initialData.image || ''
        });
      } else {
        setFormData({
          ...initialFormState,
          categoryId: categories[0]?._id || ''
        });
      }
    }
  }, [isOpen, initialData, categories, initialFormState]); 

  // Effect to handle category sync if categories load late
  useEffect(() => {
     if (isOpen && !initialData && !formData.categoryId && categories.length > 0) {
        setFormData(prev => ({ ...prev, categoryId: categories[0]._id }));
     }
  }, [categories, isOpen, initialData, formData.categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (!formData.name.trim()) return toast.error('Item name is required');
    if (!formData.price || Number(formData.price) < 0) return toast.error('Valid price is required');
    if (!formData.categoryId) return toast.error('Please select a category');

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        price: Number(formData.price),
        categoryId: formData.categoryId,
        isVeg: formData.isVeg,
        availabilityMode: formData.availabilityMode,
        timeSlotIds: formData.timeSlotIds.map(id => id.toString()),
        image: formData.image.trim()
      };

      console.log('SUBMITTING MENU ITEM:', payload);

      if (initialData?._id) {
        await api.put(`/menu/item/${initialData._id}`, payload);
        toast.success('Item updated successfully');
      } else {
        await api.post('/menu/item', payload);
        toast.success('Item added successfully');
      }
      
      // Reset form explicitly after success
      setFormData(initialFormState);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (slotId: string) => {
    setFormData(prev => {
      const exists = prev.timeSlotIds.some(id => id === slotId);
      const newSlots = exists 
        ? prev.timeSlotIds.filter(id => id !== slotId) 
        : [...prev.timeSlotIds, slotId];
      return { ...prev, timeSlotIds: Array.from(new Set(newSlots)) };
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Menu Item" : "Add New Menu Item"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
          <input 
            type="text" required 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50" 
            placeholder="e.g., Paneer Tikka" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
            <input 
              type="number" required min="0" step="0.01"
              value={formData.price} 
              onChange={(e) => setFormData({...formData, price: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50" 
              placeholder="e.g., 250" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select 
              required 
              value={formData.categoryId} 
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})} 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            >
              <option value="" disabled>Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
          <input 
            type="url" 
            value={formData.image} 
            onChange={(e) => setFormData({...formData, image: e.target.value})} 
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50" 
            placeholder="e.g., https://example.com/image.jpg" 
          />
        </div>

        <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
             <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.isVeg} 
                onChange={(e) => setFormData({...formData, isVeg: e.target.checked})} 
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600" 
              />
              <span className="text-sm font-bold text-slate-700">Vegetarian</span>
            </label>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Availability Mode</span>
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-200 rounded-lg">
            {[
              { id: 'auto', label: 'Auto', icon: Clock, color: 'text-amber-600 bg-white' },
              { id: 'on', label: 'Manual ON', icon: CheckCircle2, color: 'text-emerald-600 bg-white' },
              { id: 'off', label: 'Manual OFF', icon: XCircle, color: 'text-rose-600 bg-white' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setFormData({...formData, availabilityMode: mode.id as any})}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-black transition-all ${
                  formData.availabilityMode === mode.id 
                    ? `${mode.color} shadow-sm border border-slate-300` 
                    : 'text-slate-500 hover:bg-slate-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {timeSlots.length > 0 && (
          <div className="pt-2">
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-tight">Time Slot Scheduling</label>
            
            {/* Selected Slots Chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.timeSlotIds.length > 0 ? (
                formData.timeSlotIds.map(id => {
                  const slot = timeSlots.find(s => s._id === id);
                  if (!slot) return null;
                  return (
                    <div 
                      key={id} 
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                      <span>{slot.name}</span>
                      <button 
                        type="button" 
                        onClick={() => toggleTimeSlot(id)}
                        className="p-0.5 hover:bg-indigo-500 rounded-full transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] font-bold text-slate-400 italic">No slots selected (Available All Day)</p>
              )}
            </div>

            {/* Available Slots Picker */}
            <div className="flex flex-wrap gap-2 p-3 bg-slate-100 rounded-2xl border border-slate-200">
              {timeSlots.filter(s => !formData.timeSlotIds.includes(s._id)).map(slot => (
                <button
                  key={slot._id} type="button"
                  onClick={() => toggleTimeSlot(slot._id)}
                  className="px-3 py-1.5 text-[10px] font-black text-slate-600 bg-white rounded-xl border border-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                >
                  + {slot.name}
                </button>
              ))}
              {timeSlots.filter(s => !formData.timeSlotIds.includes(s._id)).length === 0 && (
                <p className="text-[10px] font-bold text-slate-400">All slots selected</p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium font-bold">Cancel</button>
          <button type="submit" disabled={loading} className="flex-1 btn-primary font-bold">
            {loading ? (initialData ? 'Updating...' : 'Adding...') : (initialData ? 'Save Changes' : 'Add Item')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
