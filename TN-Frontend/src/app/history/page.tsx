'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Calendar, Camera, Clock, CheckCircle2, XCircle, RefreshCcw, AlertTriangle } from 'lucide-react';

interface EquipmentItem {
  equipmentId: string;
  quantity: number;
  details: {
    name: string;
    code: string;
    category: string;
    image: string;
  };
}

interface BorrowRequest {
  id: string;
  purpose: string;
  borrowDate: string;
  returnDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  rejectReason?: string;
  adminNote?: string;
  createdAt: string;
  equipments: EquipmentItem[];
}

interface StudioBooking {
  id: string;
  fullName: string;
  participants: number;
  purpose: string;
  technicalSupport: boolean;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  adminNote?: string;
  createdAt: string;
}

export default function UserHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'studio' | 'equipment'>('studio');
  const [borrows, setBorrows] = useState<BorrowRequest[]>([]);
  const [bookings, setBookings] = useState<StudioBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast('Vui lòng đăng nhập để xem lịch sử', 'warning');
      router.push('/auth/login');
    }
  }, [user, authLoading, router, toast]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (activeTab === 'studio') {
        const data = await api.get('/studio-bookings?mine=true');
        setBookings(data);
      } else {
        const data = await api.get('/borrow-requests');
        setBorrows(data);
      }
    } catch (err: any) {
      toast(err.message || 'Lỗi tải lịch sử đăng ký', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-accent/15 text-brand-accent border border-brand-accent/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ duyệt</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-success/15 text-brand-success border border-brand-success/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã duyệt</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-error/15 text-brand-error border border-brand-error/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã từ chối</span>
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-studio-muted border border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã hoàn trả</span>
          </span>
        );
      default:
        return null;
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

      <main className="flex-1 py-12 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8 text-left">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Lịch Sử Hoạt Động</h1>
            <p className="text-sm text-studio-muted mt-1">Theo dõi trạng thái các yêu cầu đặt phòng và mượn thiết bị của bạn.</p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-3 rounded-2xl border border-white/5 hover:bg-white/5 text-studio-muted hover:text-white transition-all cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex space-x-4 border-b border-white/5 pb-0.5">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-2 pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === 'studio'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-studio-muted hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Đặt lịch Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex items-center space-x-2 pb-4 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
              activeTab === 'equipment'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-studio-muted hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Mượn thiết bị</span>
          </button>
        </div>

        {/* Content table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : activeTab === 'studio' ? (
          /* Bookings History list */
          bookings.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
              <p className="text-studio-muted">Bạn chưa gửi yêu cầu đặt phòng Studio nào.</p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 shadow-xl bg-black/25">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-studio-muted font-semibold bg-white/2">
                      <th className="py-4 px-6 text-left">Thời gian sử dụng</th>
                      <th className="py-4 px-6 text-left">Mục đích</th>
                      <th className="py-4 px-6 text-center">Người tham gia</th>
                      <th className="py-4 px-6 text-center">Hỗ trợ kỹ thuật</th>
                      <th className="py-4 px-6 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4 px-6 text-left font-medium text-white">
                          <span className="block">
                            {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                          </span>
                          <span className="text-xs text-studio-muted font-normal block mt-0.5">
                            {format(new Date(booking.startTime), 'dd/MM/yyyy')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-left text-white max-w-xs" title={booking.purpose}>
                          <div className="font-semibold break-words whitespace-pre-wrap">{booking.purpose}</div>
                          {booking.status === 'REJECTED' && booking.rejectReason && (
                            <div className="text-xs text-brand-error mt-1 italic flex items-start space-x-1 font-medium bg-brand-error/5 border border-brand-error/15 py-1 px-2.5 rounded-lg w-fit max-w-full break-words whitespace-pre-wrap">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>Lý do từ chối: {booking.rejectReason}</span>
                            </div>
                          )}
                          {booking.adminNote && (
                            <div className="text-xs text-brand-primary mt-1 italic flex items-start space-x-1 font-medium bg-brand-primary/10 border border-brand-primary/20 py-1 px-2.5 rounded-lg w-fit max-w-full break-words whitespace-pre-wrap">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>Phản hồi của Admin: {booking.adminNote}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center text-white font-bold">{booking.participants}</td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              booking.technicalSupport
                                ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                                : 'bg-white/5 text-studio-muted border border-white/5'
                            }`}
                          >
                            {booking.technicalSupport ? 'Cần hỗ trợ' : 'Không'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">{getStatusBadge(booking.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          /* Equipment Borrow Requests list */
          borrows.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
              <p className="text-studio-muted">Bạn chưa gửi yêu cầu mượn thiết bị nào.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {borrows.map((borrow) => (
                <div
                  key={borrow.id}
                  className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl bg-black/25 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-4 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="text-xs text-studio-muted font-semibold uppercase tracking-wider">
                        Phiếu mượn: #{borrow.id.substring(borrow.id.length - 8)}
                      </span>
                      <span className="text-xs text-studio-muted">|</span>
                      <span className="text-xs text-studio-muted">
                        Mượn: {format(new Date(borrow.borrowDate), 'HH:mm dd/MM/yyyy')}
                      </span>
                      <span className="text-xs text-studio-muted">|</span>
                      <span className="text-xs text-studio-muted">
                        Trả: {format(new Date(borrow.returnDate), 'HH:mm dd/MM/yyyy')}
                      </span>
                    </div>

                    <p className="text-sm text-white font-medium break-words whitespace-pre-wrap">
                      <span className="text-studio-muted font-normal block mb-1">Mục đích:</span>
                      {borrow.purpose}
                    </p>

                    {borrow.status === 'REJECTED' && borrow.rejectReason && (
                      <div className="text-xs text-brand-error mt-2 font-medium bg-brand-error/5 border border-brand-error/15 py-2 px-3 rounded-2xl w-fit max-w-full flex items-start space-x-1.5 break-words whitespace-pre-wrap">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Lý do từ chối: {borrow.rejectReason}</span>
                      </div>
                    )}

                    {borrow.adminNote && (
                      <div className="text-xs text-brand-primary mt-2 font-medium bg-brand-primary/10 border border-brand-primary/20 py-2 px-3 rounded-2xl w-fit max-w-full flex items-start space-x-1.5 break-words whitespace-pre-wrap">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Phản hồi của Admin: {borrow.adminNote}</span>
                      </div>
                    )}

                    {/* Equipments list inside this borrow */}
                    <div className="flex flex-wrap gap-3">
                      {borrow.equipments.map((eq) => (
                        <div
                          key={eq.equipmentId}
                          className="flex items-center space-x-2.5 bg-white/5 border border-white/5 py-1.5 px-3.5 rounded-xl text-xs text-white"
                        >
                          {eq.details?.image && (
                            <img
                              src={eq.details.image}
                              alt={eq.details.name}
                              className="w-6 h-6 rounded-md object-cover"
                            />
                          )}
                          <span className="font-semibold text-white">
                            {eq.details?.name || 'Thiết bị'}
                          </span>
                          <span className="text-brand-primary font-bold bg-brand-primary/10 px-1.5 py-0.2 rounded border border-brand-primary/10">
                            x{eq.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: status badge */}
                  <div className="flex items-center md:justify-end shrink-0">
                    {getStatusBadge(borrow.status)}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
