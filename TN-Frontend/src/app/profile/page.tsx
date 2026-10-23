'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { User, Mail, CreditCard, Shield, Camera, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast('Vui lòng đăng nhập để xem hồ sơ', 'warning');
      router.push('/auth/login');
    } else if (user) {
      setFullName(user.fullName);
      setEmployeeCode(user.employeeCode);
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user, authLoading, router, toast]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/fe-api/upload?type=avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi tải ảnh đại diện');
      }
      setAvatarUrl(data.avatarUrl);
      
      // Update local cookie user
      if (user) {
        const updatedUser = { ...user, avatarUrl: data.avatarUrl };
        Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
        // Reload to sync state across the app
        window.location.reload();
      }
      toast('Cập nhật ảnh đại diện thành công', 'success');
    } catch (err: any) {
      toast(err.message || 'Lỗi tải ảnh đại diện', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !employeeCode) {
      toast('Họ tên và Mã nhân viên không được để trống', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api.put('/auth/profile', { fullName, employeeCode });
      
      // Update local cookie user
      if (user) {
        const updatedUser = { ...user, fullName: updated.fullName, employeeCode: updated.employeeCode };
        Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
      }
      
      toast('Cập nhật thông tin cá nhân thành công', 'success');
      router.refresh();
    } catch (err: any) {
      toast(err.message || 'Lỗi cập nhật thông tin', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-studio-dark">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-12 px-6 md:px-12 max-w-4xl mx-auto w-full space-y-8 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Hồ Sơ Cá Nhân</h1>
          <p className="text-sm text-studio-muted mt-1">Cập nhật thông tin cá nhân và quản lý tài khoản của bạn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Avatar Panel */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/25 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-brand-primary/30 group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-primary/10 flex items-center justify-center font-bold text-brand-primary text-4xl">
                  {user?.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 mb-1" />
                    <span>Thay ảnh</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="text-center">
              <h3 className="font-bold text-white text-lg">{user?.fullName}</h3>
              <p className="text-xs text-studio-muted mt-0.5">{user?.email}</p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              user?.role === 'ADMIN' ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30' : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
            }`}>
              Vai trò: {user?.role}
            </span>
          </div>

          {/* Details Form */}
          <div className="md:col-span-2 glass-panel p-8 rounded-3xl border border-white/5 bg-black/25">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Chi tiết tài khoản</h3>

              {/* Readonly Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Địa chỉ Email</span>
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 text-sm text-studio-muted cursor-not-allowed"
                  disabled
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                  <User className="w-3.5 h-3.5" />
                  <span>Họ và tên</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Employee Code */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Mã nhân viên / Mã sinh viên</span>
                </label>
                <input
                  type="text"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
