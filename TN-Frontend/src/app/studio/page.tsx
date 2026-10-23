'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Calendar, Users, HelpCircle, Send, X, Clock, HelpCircle as SupportIcon, Plus, Trash2, Edit2, Check } from 'lucide-react';

// Load FullCalendar dynamically to avoid SSR errors
const StudioCalendar = dynamic(() => import('@/components/StudioCalendar'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full glass-panel flex items-center justify-center rounded-3xl border border-white/5 bg-black/25">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
        <p className="text-sm text-studio-muted">Đang tải lịch đặt phòng...</p>
      </div>
    </div>
  ),
});

interface Booking {
  id: string;
  userId: string;
  fullName: string;
  participants: number;
  purpose: string;
  technicalSupport: boolean;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
}

export default function StudioBookingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [isMultiRangeMode, setIsMultiRangeMode] = useState(false);
  const [firstClickDate, setFirstClickDate] = useState<Date | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{ start: Date; end: Date } | null>(null);
  const [confirmedRanges, setConfirmedRanges] = useState<{ start: Date; end: Date }[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [participants, setParticipants] = useState(1);
  const [purpose, setPurpose] = useState('');
  const [technicalSupport, setTechnicalSupport] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal for clicks on calendar events
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);

  // Protect page
  useEffect(() => {
    if (!authLoading && !user) {
      toast('Vui lòng đăng nhập để đặt lịch Studio', 'warning');
      router.push('/auth/login');
    } else if (user) {
      setFullName(user.fullName);
    }
  }, [user, authLoading, router, toast]);

  // Load Bookings
  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.get('/studio-bookings?calendar=true');
      setBookings(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải danh sách đặt phòng', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Convert bookings and selections to FullCalendar events
  const calendarEvents = [
    ...bookings.map((b) => {
      const isApproved = b.status === 'APPROVED';
      const isPending = b.status === 'PENDING';
      
      let border = '#284F9E';
      let bg = 'rgba(40, 79, 158, 0.15)';
      let statusText = '✓ Đã Duyệt';

      if (isPending) {
        border = '#ECC354';
        bg = 'rgba(236, 195, 84, 0.15)';
        statusText = '? Chờ Duyệt';
      } else if (b.status === 'REJECTED') {
        border = '#ef4444';
        bg = 'rgba(239, 68, 68, 0.1)';
        statusText = '✕ Từ Chiếu';
      }

      return {
        id: b.id,
        title: `${statusText} - ${b.fullName}`,
        start: b.startTime,
        end: b.endTime,
        backgroundColor: bg,
        borderColor: border,
        textColor: '#ffffff',
        extendedProps: {
          bookingData: b,
        },
      };
    }),
    ...confirmedRanges.map((range, index) => ({
      id: `confirmed-range-${index}`,
      title: `✓ Khung giờ ${index + 1}`,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      backgroundColor: 'rgba(40, 79, 158, 0.3)', // Brand blue transparent
      borderColor: '#284F9E', // Brand blue
      textColor: '#ffffff',
      extendedProps: {
        isConfirmedRange: true,
        rangeIndex: index,
      },
    })),
    ...(currentSelection ? [{
      id: 'current-selection',
      title: firstClickDate ? '★ Chọn điểm kết thúc...' : '★ Khung giờ đang chọn',
      start: currentSelection.start.toISOString(),
      end: currentSelection.end.toISOString(),
      backgroundColor: firstClickDate ? 'rgba(236, 195, 84, 0.2)' : 'rgba(236, 195, 84, 0.4)',
      borderColor: '#ECC354',
      textColor: '#ffffff',
      extendedProps: {
        isSelectedSlot: true,
      },
    }] : []),
  ];

  const handleSelectSlot = (start: Date, end: Date) => {
    if (start < new Date()) {
      toast('Không thể đặt lịch ở thời gian trong quá khứ', 'warning');
      return;
    }

    const isOverlappingApproved = (s: Date, e: Date) => {
      return bookings.some((b) => {
        if (b.status !== 'APPROVED') return false;
        const existingStart = new Date(b.startTime);
        const existingEnd = new Date(b.endTime);
        return s < existingEnd && e > existingStart;
      });
    };

    if (firstClickDate === null) {
      // First click: set start
      if (isOverlappingApproved(start, end)) {
        toast('Khung giờ này đã được phê duyệt cho người dùng khác.', 'error');
        return;
      }
      setFirstClickDate(start);
      setCurrentSelection({ start, end });
    } else {
      // Second click: set end and form the range
      let finalStart = firstClickDate;
      let finalEnd = end;

      if (start < firstClickDate) {
        finalStart = start;
        finalEnd = new Date(firstClickDate.getTime() + 30 * 60 * 1000);
      }

      // Check overlap for the entire range
      if (isOverlappingApproved(finalStart, finalEnd)) {
        toast('Dải giờ được chọn bị trùng với lịch đã được phê duyệt.', 'error');
        setFirstClickDate(start);
        setCurrentSelection({ start, end });
        return;
      }

      // Check overlap with confirmed ranges
      const overlapsConfirmed = confirmedRanges.some((r) => {
        return finalStart < r.end && finalEnd > r.start;
      });

      if (overlapsConfirmed) {
        toast('Dải giờ được chọn bị trùng với dải giờ đã chọn khác.', 'error');
        setFirstClickDate(start);
        setCurrentSelection({ start, end });
        return;
      }

      setCurrentSelection({ start: finalStart, end: finalEnd });
      setFirstClickDate(null);
    }
  };

  const getRangesToSubmit = () => {
    const list = [...confirmedRanges];
    if (currentSelection) {
      list.push(currentSelection);
    }
    return list.sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ranges = getRangesToSubmit();
    if (ranges.length === 0) {
      toast('Vui lòng chọn ít nhất một khung giờ đặt phòng', 'warning');
      return;
    }

    if (!fullName || !purpose || participants < 1) {
      toast('Vui lòng nhập đầy đủ thông tin yêu cầu', 'warning');
      return;
    }

    if (participants > 40) {
      toast('Studio chỉ chứa tối đa 40 người!', 'warning');
      return;
    }

    if (purpose.length > 500) {
      toast('Mục đích sử dụng không được vượt quá 500 ký tự', 'warning');
      return;
    }

    // Final check for APPROVED overlaps before submitting
    const hasOverlap = ranges.some((range) => {
      return bookings.some((b) => {
        if (b.status !== 'APPROVED') return false;
        const existingStart = new Date(b.startTime);
        const existingEnd = new Date(b.endTime);
        return range.start < existingEnd && range.end > existingStart;
      });
    });

    if (hasOverlap) {
      toast('Một hoặc nhiều khung giờ đã chọn đã được phê duyệt cho người dùng khác. Vui lòng kiểm tra lại.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Submit ranges sequentially via API
      await Promise.all(
        ranges.map((range) => {
          const bookingData = {
            fullName,
            participants,
            purpose,
            technicalSupport,
            startTime: range.start.toISOString(),
            endTime: range.end.toISOString(),
          };
          return api.post('/studio-bookings', bookingData);
        })
      );

      toast('Gửi yêu cầu đặt phòng thành công!', 'success');
      setModalOpen(false);
      setPurpose('');
      setParticipants(1);
      setTechnicalSupport(false);
      setConfirmedRanges([]);
      setCurrentSelection(null);
      setFirstClickDate(null);
      fetchBookings();
    } catch (err: any) {
      toast(err.message || 'Lỗi gửi yêu cầu đặt phòng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-12 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Đặt Phòng Studio</h1>
          <p className="text-sm text-studio-muted mt-1">
            Chọn giờ bắt đầu, sau đó chọn giờ kết thúc. Hệ thống tự động chọn toàn bộ các ô ở giữa.
          </p>
        </div>

        {/* Mode Toggle Switch & Indicators */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/5 w-fit">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isMultiRangeMode}
                onChange={(e) => {
                  setIsMultiRangeMode(e.target.checked);
                  setConfirmedRanges([]);
                  setCurrentSelection(null);
                  setFirstClickDate(null);
                }}
                className="sr-only peer animate-none"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-studio-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary peer-checked:after:bg-white border border-white/5"></div>
              <span className="ml-3 text-sm text-white font-semibold">Chọn nhiều dải giờ cách quãng</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-4 text-xs bg-white/5 px-6 py-3 rounded-2xl border border-white/5 w-fit">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-brand-primary/20 border border-brand-primary inline-block" />
              <span className="text-white font-medium">Đã Duyệt (Khóa lịch)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-brand-accent/20 border border-brand-accent inline-block" />
              <span className="text-white font-medium">Yêu cầu của bạn (Chờ duyệt)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded bg-brand-error/15 border border-brand-error inline-block" />
              <span className="text-white font-medium">Yêu cầu bị từ chối</span>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="relative">
          <StudioCalendar 
            events={calendarEvents} 
            onSelectSlot={handleSelectSlot} 
          />
        </div>

        {/* Summary and Selection Actions */}
        {isMultiRangeMode ? (
          <div className="space-y-4">
            {/* List of Confirmed and Current Selections */}
            {(confirmedRanges.length > 0 || currentSelection) && (
              <div className="glass-panel p-6 rounded-3xl border border-studio-border bg-black/20 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2 uppercase tracking-wide">
                  <Clock className="w-4 h-4 text-brand-accent" />
                  <span>Danh sách khung giờ đã chọn ({getRangesToSubmit().length})</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Confirmed Ranges */}
                  {confirmedRanges.map((range, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-white">
                          {format(range.start, 'HH:mm')} - {format(range.end, 'HH:mm')} ngày {format(range.start, 'dd/MM/yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const target = confirmedRanges[index];
                            setCurrentSelection(target);
                            setFirstClickDate(null);
                            setConfirmedRanges((prev) => prev.filter((_, i) => i !== index));
                          }}
                          className="p-1.5 rounded-lg text-studio-muted hover:text-white hover:bg-white/5 cursor-pointer transition-all"
                          title="Sửa khung giờ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmedRanges((prev) => prev.filter((_, i) => i !== index))}
                          className="p-1.5 rounded-lg text-studio-muted hover:text-brand-error hover:bg-white/5 cursor-pointer transition-all"
                          title="Xóa khung giờ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Current Active Selection (Not yet added to list) */}
                  {currentSelection && (
                    <div className="flex items-center justify-between p-4 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-brand-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                          *
                        </div>
                        <span className="text-sm font-semibold text-brand-accent">
                          {format(currentSelection.start, 'HH:mm')} - {format(currentSelection.end, 'HH:mm')} ({firstClickDate ? 'Đang chọn kết thúc' : 'Chưa thêm'})
                        </span>
                      </div>
                      {!firstClickDate && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmedRanges((prev) => [...prev, currentSelection]);
                            setCurrentSelection(null);
                            setFirstClickDate(null);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-brand-accent text-studio-dark text-xs font-bold hover:opacity-90 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Row Actions for Multiple Mode */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-white/5 pt-4 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedRanges([]);
                      setCurrentSelection(null);
                      setFirstClickDate(null);
                    }}
                    className="py-3 px-5 rounded-2xl border border-white/10 hover:bg-white/5 text-white text-xs font-semibold cursor-pointer transition-all w-fit"
                  >
                    Xóa toàn bộ
                  </button>
                  <button
                    type="button"
                    disabled={getRangesToSubmit().length === 0}
                    onClick={() => setModalOpen(true)}
                    className="py-3 px-6 rounded-2xl bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-semibold shadow-lg shadow-brand-primary/25 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp tục đặt phòng
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Single Mode Actions Bar */
          currentSelection && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-brand-primary/10 border border-brand-primary/20 rounded-3xl animate-in fade-in slide-in-from-bottom duration-250">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Đang chọn: <span className="text-brand-accent font-bold">
                    {format(currentSelection.start, 'HH:mm')} - {format(currentSelection.end, 'HH:mm')} ngày {format(currentSelection.start, 'dd/MM/yyyy')}
                  </span>
                </p>
                <p className="text-xs text-studio-muted">
                  {firstClickDate ? 'Click vào ô tiếp theo để chọn thời gian kết thúc.' : 'Click vào thời gian khác để thay đổi lựa chọn.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSelection(null);
                    setFirstClickDate(null);
                  }}
                  className="py-3 px-5 rounded-2xl border border-white/10 hover:bg-white/5 text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  Xóa lựa chọn
                </button>
                <button
                  type="button"
                  disabled={!!firstClickDate}
                  onClick={() => setModalOpen(true)}
                  className="py-3 px-6 rounded-2xl bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-semibold shadow-lg shadow-brand-primary/25 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp tục đặt phòng
                </button>
              </div>
            </div>
          )
        )}

        {/* Create Booking Modal */}
        {modalOpen && getRangesToSubmit().length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setModalOpen(false)} />

            <div className="glass-panel max-w-lg w-full rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                  <span>Đăng ký Đặt phòng Studio</span>
                </h3>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-studio-muted hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="p-6 space-y-5 text-left">
                <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl space-y-2">
                  <p className="text-[10px] font-bold text-brand-primary uppercase">Khung giờ đặt phòng ({getRangesToSubmit().length})</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {getRangesToSubmit().map((range, idx) => (
                      <div key={idx} className="flex items-center space-x-3 text-sm text-white">
                        <Clock className="w-4 h-4 text-studio-muted shrink-0" />
                        <span>
                          {format(range.start, 'HH:mm')} - {format(range.end, 'HH:mm')} ngày {format(range.start, 'dd/MM/yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Họ và tên người đặt</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Số người tham gia</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={participants}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (val > 40) {
                          toast('Studio chỉ chứa tối đa 40 người!', 'warning');
                          setParticipants(40);
                        } else {
                          setParticipants(val);
                        }
                      }}
                      className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                      disabled={submitting}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1 flex flex-col justify-end">
                    <label className="text-[11px] font-bold text-studio-muted uppercase flex items-center space-x-1 mb-2">
                      <SupportIcon className="w-3.5 h-3.5" />
                      <span>Hỗ trợ kỹ thuật</span>
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={technicalSupport}
                        onChange={(e) => setTechnicalSupport(e.target.checked)}
                        className="sr-only peer animate-none"
                        disabled={submitting}
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-studio-muted after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary peer-checked:after:bg-white border border-white/5"></div>
                      <span className="ml-3 text-xs text-studio-muted font-medium">Cần hỗ trợ kỹ thuật</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-studio-muted uppercase">Mục đích sử dụng phòng</label>
                    <span className={`text-[10px] font-bold ${purpose.length > 450 ? 'text-brand-error' : 'text-studio-muted'}`}>
                      {purpose.length} / 500
                    </span>
                  </div>
                  <textarea
                    placeholder="Nhập chi tiết mục đích..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    maxLength={500}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 h-20 resize-none break-words"
                    disabled={submitting}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gửi yêu cầu đặt phòng</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
