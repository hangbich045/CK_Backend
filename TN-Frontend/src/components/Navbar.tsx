'use client';

import Image from "next/image";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, LogOut, LayoutDashboard, Calendar, Camera, History, Home, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/equipment', label: 'Thiết bị', icon: Camera },
    { href: '/studio', label: 'Đặt phòng Studio', icon: Calendar },
    ...(user ? [{ href: '/history', label: 'Lịch sử của tôi', icon: History }] : []),
  ];

  const adminLink = user?.role === 'ADMIN' ? { href: '/admin/dashboard', label: 'Quản trị', icon: LayoutDashboard } : null;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300">
      {/* Brand logo */}
      <Link href="/" className="flex items-center space-x-2">
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
        <span className="font-extrabold text-xl tracking-tight text-white hidden sm:inline-block">
          LHU <span className="text-gradient">MEDIA</span>
        </span>
      </Link>

      {/* Desktop navigation */}
      <div className="hidden md:flex items-center space-x-8">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-white ${isActive(link.href) ? 'text-brand-primary' : 'text-studio-muted'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
        {adminLink && (
          <Link
            href={adminLink.href}
            className={`flex items-center space-x-2 text-sm font-semibold transition-colors hover:text-white px-3 py-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 ${isActive(adminLink.href) ? 'text-white border-brand-primary bg-brand-primary/20' : 'text-brand-primary'
              }`}
          >
            <adminLink.icon className="w-4 h-4" />
            <span>{adminLink.label}</span>
          </Link>
        )}
      </div>

      {/* Desktop auth buttons / user panel */}
      <div className="hidden md:flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-all group cursor-pointer"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-lg object-cover border border-brand-secondary/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-brand-secondary/20 border border-brand-secondary/30 flex items-center justify-center font-bold text-brand-secondary text-sm group-hover:bg-brand-secondary/30 transition-colors">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-none mb-0.5 group-hover:text-brand-primary transition-colors">{user.fullName}</p>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded leading-none ${user.role === 'ADMIN' ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30' : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                  }`}>
                  {user.role}
                </span>
              </div>
            </Link>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl border border-white/5 text-studio-muted hover:text-brand-error hover:bg-brand-error/10 hover:border-brand-error/20 transition-all cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-studio-text hover:text-white transition-colors px-4 py-2 rounded-xl"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-medium bg-brand-primary hover:bg-brand-primary/80 text-white transition-all px-5 py-2.5 rounded-xl shadow-lg shadow-brand-primary/20"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-xl border border-white/5 text-studio-text hover:bg-white/5 transition-all"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[73px] left-0 w-full glass-panel border-b border-white/5 flex flex-col p-6 space-y-4 md:hidden animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 text-base font-medium py-2 px-3 rounded-lg ${isActive(link.href) ? 'bg-brand-primary/15 text-brand-primary' : 'text-studio-muted hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          {adminLink && (
            <Link
              href={adminLink.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 text-base font-semibold py-2 px-3 rounded-lg border border-brand-primary/20 bg-brand-primary/5 ${isActive(adminLink.href) ? 'bg-brand-primary/20 text-white' : 'text-brand-primary'
                }`}
            >
              <adminLink.icon className="w-5 h-5" />
              <span>{adminLink.label}</span>
            </Link>
          )}
          <hr className="border-white/5" />
          {user ? (
            <div className="flex flex-col space-y-4 pt-2">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-lg object-cover border border-brand-secondary/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-brand-secondary/20 flex items-center justify-center font-bold text-brand-secondary">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white leading-none mb-1">{user.fullName}</p>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded leading-none ${user.role === 'ADMIN' ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30' : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                    }`}>
                    {user.role}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl border border-brand-error/20 bg-brand-error/5 text-brand-error font-medium hover:bg-brand-error/10 transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-3 pt-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 px-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 px-4 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primary/80 shadow-lg shadow-brand-primary/20"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
