'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Camera, Calendar, CheckCircle2, AlertTriangle, AlertCircle, Users, ClipboardList, Loader2, CalendarRange, Trophy, Percent, X } from 'lucide-react';
import Cookies from 'js-cookie';

interface DashboardStats {
  equipment: {
    total: number;
    available: number;
    borrowed: number;
    maintenance: number;
  };
  requests: {
    pendingBorrows: number;
    pendingBookings: number;
  };
  users: {
    total: number;
  };
}

interface TopUsedEquipment {
  id: string;
  count: number;
  name: string;
  code: string;
  category: string;
  image: string;
}

interface ChartItem {
  date: string;
  borrows: number;
  bookings: number;
}

interface ReportData {
  borrowsCount: number;
  bookingsCount: number;
  topEquipment: TopUsedEquipment[];
  utilizationRate: number;
  chartData: ChartItem[];
}
export default function AdminDashboardPage() {
  const { toast } = useToast();
  
  // Total stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Time filter states
  const [range, setRange] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Excel Export Dialog states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportRange, setExportRange] = useState<'month' | 'year' | 'month-year' | 'custom'>('month');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  // Report data states
  const [reports, setReports] = useState<ReportData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [range, startDate, endDate]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải thống kê tổng quát', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReports = async () => {
    if (range === 'custom' && (!startDate || !endDate)) return; // Wait until both are filled
    setReportsLoading(true);
    try {
      let query = `?range=${range}`;
      if (range === 'custom') {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const data = await api.get(`/dashboard/reports${query}`);
      setReports(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải báo cáo thống kê', 'error');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleExportExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    try {
      let query = `?range=${exportRange}`;
      if (exportRange === 'custom') {
        if (!exportStartDate || !exportEndDate) {
          toast('Vui lòng chọn khoảng ngày bắt đầu và kết thúc', 'warning');
          setExporting(false);
          return;
        }
        query += `&startDate=${exportStartDate}&endDate=${exportEndDate}`;
      } else if (exportRange === 'month-year') {
        query += `&month=${exportMonth}&year=${exportYear}`;
      }

      const token = Cookies.get('token');
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${BASE_URL}/reports/export-excel${query}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải file báo cáo. Vui lòng thử lại.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bao-cao-tong-hop-${exportRange}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast('Xuất báo cáo Excel thành công!', 'success');
      setExportDialogOpen(false);
    } catch (err: any) {
      toast(err.message || 'Lỗi xuất báo cáo Excel', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleRangeChange = (newRange: 'week' | 'month' | 'year' | 'custom') => {
    setRange(newRange);
    if (newRange !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Helper to find the maximum value in chart data for drawing relative heights
  const getMaxChartValue = () => {
    if (!reports || reports.chartData.length === 0) return 1;
    const maxVal = Math.max(
      ...reports.chartData.map((d) => Math.max(d.borrows, d.bookings))
    );
    return maxVal === 0 ? 1 : maxVal;
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-brand-success/20 text-brand-success">Sẵn sàng</span>;
      case 'BORROWED':
        return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-brand-primary/20 text-brand-primary">Đang mượn</span>;
      case 'MAINTENANCE':
        return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-brand-error/20 text-brand-error">Bảo trì</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 text-left">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Thống Kê & Báo Cáo</h1>
            <p className="text-sm text-studio-muted mt-1">
              Tổng quan số liệu thiết bị và báo cáo chi tiết theo các mốc thời gian tùy chọn.
            </p>
          </div>
          <button
            onClick={() => setExportDialogOpen(true)}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all transform hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto text-sm"
          >
            <ClipboardList className="w-5 h-5" />
            <span>Xuất Báo Cáo Excel</span>
          </button>
        </div>

        {/* 1. TOP METRIC TOTAL CARDS (SUM aggregates) */}
        {statsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total equipment */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between h-28">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block">Tổng số thiết bị</span>
                <span className="text-3xl font-extrabold text-white block">{stats.equipment.total}</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-studio-muted">
                <Camera className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Available sum */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between h-28">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block">Thiết bị khả dụng</span>
                <span className="text-3xl font-extrabold text-brand-success block">{stats.equipment.available}</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-success/10 flex items-center justify-center text-brand-success">
                <CheckCircle2 className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Borrowed */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between h-28">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block">Đang cho mượn</span>
                <span className="text-3xl font-extrabold text-brand-primary block">{stats.equipment.borrowed}</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                <AlertCircle className="w-5.5 h-5.5" />
              </div>
            </div>

            {/* Maintenance */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 flex items-center justify-between h-28">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider block">Đang bảo trì</span>
                <span className="text-3xl font-extrabold text-brand-error block">{stats.equipment.maintenance}</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-brand-error/10 flex items-center justify-center text-brand-error">
                <AlertTriangle className="w-5.5 h-5.5" />
              </div>
            </div>
          </div>
        )}

        {/* 2. TIME FILTER TOOLBAR */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-black/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleRangeChange('week')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                range === 'week' ? 'bg-brand-primary text-white' : 'bg-white/5 text-studio-muted hover:text-white'
              }`}
            >
              Tuần này
            </button>
            <button
              onClick={() => handleRangeChange('month')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                range === 'month' ? 'bg-brand-primary text-white' : 'bg-white/5 text-studio-muted hover:text-white'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => handleRangeChange('year')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                range === 'year' ? 'bg-brand-primary text-white' : 'bg-white/5 text-studio-muted hover:text-white'
              }`}
            >
              Năm này
            </button>
            <button
              onClick={() => handleRangeChange('custom')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                range === 'custom' ? 'bg-brand-primary text-white' : 'bg-white/5 text-studio-muted hover:text-white'
              }`}
            >
              Khoảng tự chọn
            </button>
          </div>

          {range === 'custom' && (
            <div className="flex items-center space-x-2 self-start md:self-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-black/45 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary/50"
              />
              <span className="text-xs text-studio-muted">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-black/45 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary/50"
              />
            </div>
          )}
        </div>

        {/* 3. REPORT DATA GRID */}
        {reportsLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : reports && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Numeric rates grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Borrows count */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/15 text-left space-y-2">
                  <div className="flex items-center justify-between text-brand-primary">
                    <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider">Số lượt mượn thiết bị</span>
                    <Camera className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-2xl font-black text-white block">{reports.borrowsCount} <span className="text-xs font-semibold text-studio-muted">lượt</span></span>
                </div>

                {/* Bookings count */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/15 text-left space-y-2">
                  <div className="flex items-center justify-between text-brand-accent">
                    <span className="text-[10px] font-bold text-studio-muted uppercase tracking-wider">Số lượt đặt Studio</span>
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-2xl font-black text-white block">{reports.bookingsCount} <span className="text-xs font-semibold text-studio-muted">lượt</span></span>
                </div>
              </div>

              {/* Time Series double-bar visualizer */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/25 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                    <CalendarRange className="w-4 h-4 text-brand-primary" />
                    <span>Lượt hoạt động theo thời gian</span>
                  </h3>
                  {/* Legend */}
                  <div className="flex items-center space-x-3 text-[10px] font-bold uppercase">
                    <div className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-brand-primary inline-block" />
                      <span className="text-studio-muted">Mượn máy</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2.5 h-2.5 rounded-sm bg-brand-accent inline-block" />
                      <span className="text-studio-muted">Đặt phòng</span>
                    </div>
                  </div>
                </div>

                {reports.chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-xs text-studio-muted">
                    Không có số liệu biểu đồ.
                  </div>
                ) : (
                  /* Custom scrollable bar wrapper for mobile responsiveness */
                  <div className="overflow-x-auto pt-4">
                    <div className="h-56 flex items-end space-x-4 min-w-[500px] pb-4 px-2">
                      {reports.chartData.map((d, idx) => {
                        const maxVal = getMaxChartValue();
                        const borrowHeight = (d.borrows / maxVal) * 100;
                        const bookingHeight = (d.bookings / maxVal) * 100;
                        
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group space-y-2">
                            {/* Visual bars */}
                            <div className="flex items-end space-x-1 h-full w-full justify-center">
                              {/* Borrows bar */}
                              <div
                                style={{ height: `${Math.max(4, borrowHeight)}%` }}
                                className={`w-3.5 rounded-t-md bg-brand-primary transition-all duration-300 group-hover:brightness-125 relative`}
                                title={`Mượn thiết bị: ${d.borrows} lượt`}
                              >
                                {d.borrows > 0 && (
                                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-white bg-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d.borrows}
                                  </span>
                                )}
                              </div>
                              {/* Bookings bar */}
                              <div
                                style={{ height: `${Math.max(4, bookingHeight)}%` }}
                                className={`w-3.5 rounded-t-md bg-brand-accent transition-all duration-300 group-hover:brightness-125 relative`}
                                title={`Đặt Studio: ${d.bookings} lượt`}
                              >
                                {d.bookings > 0 && (
                                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-white bg-black px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d.bookings}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Date Label */}
                            <span className="text-[10px] text-studio-muted font-bold tracking-tight shrink-0">
                              {d.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Top 5 devices used */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/25 space-y-6 flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 border-b border-white/5 pb-3 shrink-0">
                <Trophy className="w-4 h-4 text-brand-accent" />
                <span>Thiết bị mượn nhiều nhất</span>
              </h3>

              {reports.topEquipment.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-studio-muted py-12">
                  Chưa có số liệu mượn thiết bị.
                </div>
              ) : (
                <div className="space-y-5 flex-1 overflow-y-auto">
                  {reports.topEquipment.map((eq, index) => {
                    const maxUsage = reports.topEquipment[0]?.count || 1;
                    const percentWidth = (eq.count / maxUsage) * 100;

                    return (
                      <div key={eq.id} className="space-y-1.5 text-left">
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-black text-brand-primary w-4">
                            #{index + 1}
                          </span>
                          {eq.image && (
                            <img src={eq.image} alt={eq.name} className="w-8 h-8 rounded-lg object-cover border border-white/5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate" title={eq.name}>
                              {eq.name}
                            </h4>
                            <span className="text-[9px] text-studio-muted font-semibold block mt-0.5">
                              {eq.category} • {eq.count} lượt mượn
                            </span>
                          </div>
                        </div>
                        {/* Progress bar visual */}
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentWidth}%` }}
                            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Excel Dialog */}
        {exportDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setExportDialogOpen(false)} />
            
            <div className="glass-panel max-w-md w-full rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <ClipboardList className="w-5 h-5 text-emerald-500" />
                  <span>Xuất Báo Cáo Excel</span>
                </h3>
                <button
                  onClick={() => setExportDialogOpen(false)}
                  className="p-2 rounded-xl text-studio-muted hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExportExcel} className="p-6 space-y-4 text-left">
                {/* Range Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Mốc thời gian báo cáo</label>
                  <select
                    value={exportRange}
                    onChange={(e: any) => setExportRange(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 cursor-pointer"
                    disabled={exporting}
                  >
                    <option value="month">Tháng này</option>
                    <option value="year">Năm này</option>
                    <option value="month-year">Chọn cụ thể Tháng/Năm</option>
                    <option value="custom">Khoảng thời gian tùy chọn</option>
                  </select>
                </div>

                {/* Specific Month/Year inputs */}
                {exportRange === 'month-year' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-studio-muted uppercase">Tháng</label>
                      <select
                        value={exportMonth}
                        onChange={(e) => setExportMonth(Number(e.target.value))}
                        className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                        disabled={exporting}
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Tháng {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-studio-muted uppercase">Năm</label>
                      <select
                        value={exportYear}
                        onChange={(e) => setExportYear(Number(e.target.value))}
                        className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none"
                        disabled={exporting}
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const yr = new Date().getFullYear() - 2 + i;
                          return (
                            <option key={yr} value={yr}>
                              {yr}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}

                {/* Custom date range inputs */}
                {exportRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-studio-muted uppercase">Từ ngày</label>
                      <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="w-full bg-black/35 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                        disabled={exporting}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-studio-muted uppercase">Đến ngày</label>
                      <input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="w-full bg-black/35 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                        disabled={exporting}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setExportDialogOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all cursor-pointer text-sm"
                    disabled={exporting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={exporting}
                    className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95 text-white font-bold py-3 rounded-xl shadow-lg transition-all cursor-pointer text-sm"
                  >
                    {exporting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>Xuất Excel</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
