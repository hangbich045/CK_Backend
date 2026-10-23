'use client';


import Image from "next/image";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Vui lòng điền đầy đủ email và mật khẩu', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      toast(`Đăng nhập thành công! Chào mừng ${loggedUser.fullName}`, 'success');
      if (loggedUser.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      if (error.requiresActivation) {
        toast(error.message || 'Tài khoản của bạn cần được xác thực hoặc kích hoạt lại.', 'warning');
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
      } else {
        toast(error.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-studio-dark relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-secondary/10 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full glass-panel p-8 sm:p-10 rounded-[32px] border border-white/5 shadow-2xl relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2 mb-2">
            <div className="w-11 h-11 flex items-center justify-center">
              <Image
                src="/LOGO.png"
                alt="LHU Media"
                width={44}
                height={44}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-white">
              LHU <span className="text-gradient">MEDIA</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-white">Chào mừng quay trở lại!</h2>
          <p className="text-sm text-studio-muted">Đăng nhập tài khoản Studio Media của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-studio-muted">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                placeholder="ten.nv@lhu.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/35 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-studio-muted/70 focus:outline-none focus:border-brand-primary/50 focus:bg-black/50 transition-all"
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-studio-muted">Mật khẩu</label>
              <Link href="/auth/forgot-password" className="text-xs text-brand-primary font-medium hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/35 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm placeholder:text-studio-muted/70 focus:outline-none focus:border-brand-primary/50 focus:bg-black/50 transition-all"
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-brand-primary/10 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-studio-muted">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="text-brand-primary font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
