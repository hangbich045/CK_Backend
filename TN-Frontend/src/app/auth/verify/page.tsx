'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const VerifyPage = () => {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();
  const { setSession } = useAuth();
  const router = useRouter();

  // --------- Client‑only code (runs after mount) ----------
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
    setSubmitting(true);
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xác thực thất bại');

      const { accessToken, user } = data;
       // Store session (token + user) via AuthContext helper
       setSession(accessToken, user);
       toast('Xác thực thành công! Đã đăng nhập.', 'success');
       router.push('/');
    } catch (err: any) {
      toast(err.message || 'Lỗi xác thực OTP', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // If we have mounted and the email param is missing → go back to register
  if (isMounted && !email) {
    router.push('/auth/register');
    return null;
  }

  // Prevent SSR hydration mismatch
  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-studio-dark relative overflow-hidden">
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
          <h2 className="text-2xl font-bold text-white">Xác thực Email</h2>
          <p className="text-sm text-studio-muted">
            Nhập mã OTP đã gửi tới <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-studio-muted">
              Mã OTP
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
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

          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-brand-primary/10 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 pt-3"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Xác thực</span><ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="text-center text-sm text-studio-muted">
          Chưa nhận được mã?{' '}
          <button
            type="button"
            className="text-brand-primary font-semibold hover:underline disabled:opacity-50"
            disabled={resending || submitting}
            onClick={async () => {
              setResending(true);
              try {
                const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Không thể gửi lại OTP');
                toast('Mã OTP mới đã được gửi tới email của bạn.', 'success');
              } catch (err: any) {
                toast(err.message || 'Lỗi gửi lại mã OTP', 'error');
              } finally {
                setResending(false);
              }
            }}
          >
            {resending ? 'Đang gửi...' : 'Gửi lại OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
