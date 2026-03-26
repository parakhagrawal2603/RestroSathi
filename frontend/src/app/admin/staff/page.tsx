'use client';

import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Mail, Shield, User as UserIcon, Search, Filter, Calendar } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/Modal';
import EditStaffModal from '@/components/admin/EditStaffModal';
import { Edit } from 'lucide-react';

export default function StaffManagement() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'chef'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const fetchStaff = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setStaff(data);
    } catch (error) {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Creating account...');
    try {
      await api.post('/auth/create-user', {
        ...formData,
        restaurantId: user?.restaurantId
      });
      toast.success('Staff account created', { id: loadingToast });
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'chef' });
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account', { id: loadingToast });
    }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('Staff member removed');
      fetchStaff();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Staff Management</h2>
          <p className="text-slate-500 font-medium tracking-tight">Manage your kitchen and reception team with role-based precision.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <Filter className="hidden md:block w-4 h-4 text-slate-400 ml-2" />
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {['all', 'admin', 'chef', 'reception'].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shadow-sm ${
                    roleFilter === role 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {staff.filter(s => (roleFilter === 'all' || s.role === roleFilter) && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))).length} Members
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white h-48 rounded-3xl border border-slate-100 shadow-sm animate-pulse"></div>
          ))
        ) : staff.filter(s => (roleFilter === 'all' || s.role === roleFilter) && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 ? (
          <div className="col-span-full bg-white py-20 rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold tracking-tight text-lg uppercase">
              No matching staff found
            </p>
            <p className="text-slate-400 text-sm">
              Try adjusting your filters or search terms.
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}
              className="mt-6 px-4 py-2 text-indigo-600 font-bold hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : staff
            .filter(s => (roleFilter === 'all' || s.role === roleFilter) && (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase())))
            .map((member) => (
          <div key={member._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group overflow-hidden relative">
            {member.role === 'admin' && (
              <div className="absolute top-0 right-0">
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest shadow-sm">
                  Primary Admin
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl shadow-sm ${
                member.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 
                member.role === 'chef' ? 'bg-amber-100 text-amber-600' : 
                'bg-emerald-100 text-emerald-600'
              }`}>
                {member.role === 'admin' ? <Shield className="w-7 h-7" /> : 
                 member.role === 'chef' ? <Users className="w-7 h-7" /> : 
                 <UserIcon className="w-7 h-7" />}
              </div>
              
              {member.role !== 'admin' && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setSelectedStaff(member); setIsEditModalOpen(true); }}
                    className="p-2.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Edit Staff"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => deleteStaff(member._id)}
                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    title="Remove Staff"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              {member.role === 'admin' && (
                <button 
                  onClick={() => { setSelectedStaff(member); setIsEditModalOpen(true); }}
                  className="p-2.5 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                  title="Edit Admin Details"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="mb-4">
              <h3 className="text-xl font-black text-slate-800 mb-1 flex items-center gap-2">
                {member.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  member.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 
                  member.role === 'chef' ? 'bg-amber-50 text-amber-600' : 
                  'bg-emerald-50 text-emerald-600'
                }`}>
                  {member.role}
                </span>
                {member.phone && (
                   <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight border border-slate-100">
                     {member.phone}
                   </span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-slate-500 font-bold text-xs truncate">
                <Mail className="w-4 h-4 text-slate-300 shrink-0" />
                {member.email}
              </div>
              <div className="flex items-center gap-3 text-slate-400 font-medium text-[10px] uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-slate-300 shrink-0" />
                Joined: {new Date(member.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Staff Member">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" required value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" required value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Default Password</label>
            <input 
              type="password" required value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">System Role</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-4 py-2 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="chef">Chef (Kitchen Panel)</option>
              <option value="reception">Reception (Billing Panel)</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20">
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      <EditStaffModal 
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedStaff(null); }}
        onSave={() => fetchStaff()}
        staff={selectedStaff}
      />
    </div>
  );
}
