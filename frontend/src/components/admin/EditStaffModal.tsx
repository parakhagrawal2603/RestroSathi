'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Shield, AlertCircle } from 'lucide-react';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  staff: any;
}

export default function EditStaffModal({ isOpen, onClose, onSave, staff }: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        role: staff.role || '',
        password: ''
      });
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading('Updating staff member...');
    try {
      const { password, ...otherData } = formData;
      const payload: any = { ...otherData };
      
      if (password) {
        if (password.length < 6) {
          toast.dismiss(loadingToast);
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        payload.password = password;
      }

      await api.put(`/auth/users/${staff._id}`, payload);
      toast.success('Staff member updated successfully', { id: loadingToast });
      onSave();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = staff?.role === 'admin';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Staff Member">
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {isAdmin && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Administrative Account</p>
              <p className="text-[11px] text-amber-600 font-medium">The Primary Admin role cannot be modified to prevent system lockouts.</p>
            </div>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. John Doe"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
            {isAdmin ? 'Restaurant Admin Email' : 'Email Address'}
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="email" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. john@example.com"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number (Optional)</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="text" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="e.g. +91 98765 43210"
            />
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">System Role</label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <select 
              value={formData.role}
              disabled={isAdmin}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className={`w-full pl-11 pr-4 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 transition-all appearance-none ${
                isAdmin 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                : 'bg-slate-50 text-slate-700 border-slate-200 focus:ring-indigo-500/20'
              }`}
            >
              <option value="chef">Chef (Kitchen Panel)</option>
              <option value="reception">Reception (Billing Panel)</option>
              {isAdmin && <option value="admin">Primary Admin</option>}
            </select>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
            <span>New Password</span>
            <span className="text-indigo-400 capitalize">Optional</span>
          </label>
          <div className="relative">
            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
              placeholder="Leave blank to keep current"
            />
          </div>
          <p className="mt-1.5 ml-1 text-[10px] text-slate-400 font-medium">Leave blank to keep the current password.</p>
        </div>

        <div className="pt-6 flex gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
