'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Key, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const { setSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setEmail(decodeURIComponent(params.get('email') ?? ''));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast('Vui lòng nhập mã OTP', 'warning');
      return;
    }
    if (otp.length !== 6) {
      toast('Mã OTP phải có độ dài 6 chữ số', 'warning');
      return;
    }
    if (!newPassword) {
      toast('Vui lòng nhập mật khẩu mới', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Đặt lại mật khẩu thất bại');

      // Update state in context and store accessToken in cookies
      setSession(data.accessToken, data.user);
      toast('Đặt lại mật khẩu thành công! Đang đăng nhập...', 'success');
      window.location.href = '/';
    } catch (err: any) {
      toast(err.message || 'Lỗi đặt lại mật khẩu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // If mounted and email is missing, go back to forgot-password page
  if (isMounted && !email) {
    router.push('/auth/forgot-password');
    return null;
  }

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-studio-dark relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-secondary/10 blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full glass-panel p-8 sm:p-10 rounded-[32px] border border-white/5 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 mb-2">
            <div className="w-11 h-11 flex items-center justify-center">
              <Image src="/LOGO.png" alt="LHU Media" width={44} height={44} className="object-contain drop-shadow-lg" priority />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              LHU <span className="text-gradient">MEDIA</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h2>
          <p className="text-sm text-studio-muted">
            Nhập mã OTP gửi tới <strong>{email}</strong> và mật khẩu mới của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* OTP */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-studio-muted">
              Mã OTP (6 chữ số)
            </label>
            <div className="relative">
              <ShieldCheck className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="123456"
                value={otp}
                maxLength={6}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-black/35 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-studio-muted/70 focus:outline-none focus:border-brand-primary/50 focus:bg-black/50 transition-all"
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-studio-muted">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Key className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black/35 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-studio-muted/70 focus:outline-none focus:border-brand-primary/50 focus:bg-black/50 transition-all"
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-studio-muted">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Key className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/35 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-studio-muted/70 focus:outline-none focus:border-brand-primary/50 focus:bg-black/50 transition-all"
                disabled={submitting}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-brand-primary/10 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 pt-3"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Xác nhận đặt lại</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm text-studio-muted">
          Quay lại{' '}
          <Link href="/auth/login" className="text-brand-primary font-semibold hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
