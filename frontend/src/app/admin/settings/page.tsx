'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, Store, Phone, MapPin, Check, Mail, QrCode, Download, Lock, ShieldCheck } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function RestaurantSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  // Profile Info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Restaurant Info (Admins only)
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Password Update
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const fetchSettings = async () => {
      // For Super Admin, we use current user context
      if (isSuperAdmin) {
        setName(user?.name || 'Super Admin');
        setEmail(user?.email || '');
        setLoading(false);
        return;
      }

      if (!user?.restaurantId) return;
      try {
        const { data } = await api.get(`/restaurants/${user.restaurantId}`);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
      } catch (error) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user, isSuperAdmin]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update User Profile
      await api.put('/auth/profile', { name, email });
      
      // Update Restaurant details if not Super Admin
      if (!isSuperAdmin) {
        await api.put("/restaurants/update", { name, email, phone, address });
      }
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setUpdatingPassword(true);
    try {
      await api.put('/auth/profile', { password });
      toast.success("Password updated successfully");
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (!canvas) return;
    
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${name.replace(/\s+/g, '-').toLowerCase()}-menu-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/r/${user?.restaurantId}` 
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Account Settings</h2>
        <p className="text-slate-500 font-medium tracking-tight">Manage your profile, security, and configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Profile & Business Info */}
          <form onSubmit={handleProfileUpdate} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-xl">
                 {isSuperAdmin ? <ShieldCheck className="w-5 h-5 text-indigo-600" /> : <Store className="w-5 h-5 text-indigo-600" />}
              </div>
              <h3 className="text-xl font-black text-slate-800">{isSuperAdmin ? 'Profile Information' : 'Restaurant Profile'}</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {isSuperAdmin ? 'Full Name' : 'Restaurant Name'}
                </label>
                <input 
                  type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email Address
                </label>
                <input 
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                />
              </div>

              {!isSuperAdmin && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Contact Phone
                    </label>
                    <input 
                      type="text" required value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Full Address
                    </label>
                    <textarea 
                      rows={3} required value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>

          {/* Security Section (Password Change) */}
          <form onSubmit={handlePasswordUpdate} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-50 rounded-xl">
                 <Lock className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Security</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  New Password
                </label>
                <input 
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-800"
                  placeholder="Min. 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Confirm Password
                </label>
                <input 
                  type="password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={updatingPassword || !password}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black shadow-lg shadow-slate-900/30 hover:bg-black transition-all flex items-center gap-2 disabled:opacity-70"
              >
                <Lock className="w-5 h-5" />
                {updatingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
            <div className="relative z-10">
              <div className="p-3 bg-white/10 rounded-2xl w-fit mb-4">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black mb-2">Account Status</h3>
              <p className="text-slate-400 font-medium mb-6">
                Logged in as <span className="text-white font-bold">{user?.role?.replace('_', ' ')}</span>
              </p>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Environment Secure
              </div>
            </div>
          </div>

          {!isSuperAdmin && (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Menu QR Code</h3>
                  <p className="text-xs font-medium text-slate-500">Scan to view your digital menu</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                  <QRCodeCanvas 
                    id="qr-code"
                    value={menuUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <button
                  onClick={downloadQR}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  <Download className="w-4 h-4" />
                  Download QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
