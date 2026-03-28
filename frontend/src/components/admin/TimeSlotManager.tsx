import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export default function TimeSlotManager({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', startTime: '', endTime: '' });

  const fetchSlots = async () => {
    try {
      const { data } = await api.get('/menu/timeslot');
      setSlots(data);
    } catch (error: any) { 
      const msg = error.response?.data?.message || error.message || 'Failed to load Time Slots';
      toast.error(msg); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isOpen) fetchSlots();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/menu/timeslot', formData);
      toast.success('Time Slot created');
      setFormData({ name: '', startTime: '', endTime: '' });
      fetchSlots();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this Time Slot?')) return;
    try {
      await api.delete(`/menu/timeslot/${id}`);
      toast.success('Time Slot deleted');
      fetchSlots();
    } catch (error) { toast.error('Failed to delete slot'); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Time Slots">
      <div className="mb-6 space-y-2 max-h-48 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">No time slots configured.</p>
        ) : (
          slots.map(slot => (
            <div key={slot._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">{slot.name}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">{slot.startTime} to {slot.endTime}</p>
              </div>
              <button 
                onClick={() => handleDelete(slot._id)}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Create New Slot</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Slot Name</label>
            <input
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              placeholder="e.g., Breakfast, Happy Hour"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Start Time</label>
              <input
                type="time" required
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">End Time</label>
              <input
                type="time" required
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full btn-primary py-2 mt-2">
            {submitting ? 'Creating...' : 'Add Slot'}
          </button>
        </form>
      </div>
    </Modal>
  );
}
