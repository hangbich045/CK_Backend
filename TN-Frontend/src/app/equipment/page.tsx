'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Search, SlidersHorizontal, ShoppingCart, Plus, Minus, Trash2, Calendar, Clock, User, FileText, Send, Loader2 } from 'lucide-react';

interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  image: string;
  quantity: number;
  availableQuantity: number;
  status: 'AVAILABLE' | 'BORROWED' | 'MAINTENANCE';
}

interface CartItem {
  equipment: Equipment;
  quantity: number;
}

export default function UserEquipmentPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [purpose, setPurpose] = useState('');
  const [borrowDateOnly, setBorrowDateOnly] = useState('');
  const [borrowTimeOnly, setBorrowTimeOnly] = useState('');
  const [returnDateOnly, setReturnDateOnly] = useState('');
  const [returnTimeOnly, setReturnTimeOnly] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatDateToYYYYMMDD = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatTimeToHHMM = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const handleQuickReturn = (type: string) => {
    let refDate = new Date();
    if (borrowDateOnly && borrowTimeOnly) {
      refDate = new Date(`${borrowDateOnly}T${borrowTimeOnly}`);
    }
    
    if (type === '+2') {
      const newDate = new Date(refDate.getTime() + 2 * 60 * 60 * 1000);
      setReturnDateOnly(formatDateToYYYYMMDD(newDate));
      setReturnTimeOnly(formatTimeToHHMM(newDate));
    } else if (type === '+4') {
      const newDate = new Date(refDate.getTime() + 4 * 60 * 60 * 1000);
      setReturnDateOnly(formatDateToYYYYMMDD(newDate));
      setReturnTimeOnly(formatTimeToHHMM(newDate));
    } else if (type === 'allday') {
      setReturnDateOnly(borrowDateOnly || formatDateToYYYYMMDD(refDate));
      setReturnTimeOnly('21:00');
    }
  };

  // Protect page
  useEffect(() => {
    if (!authLoading && !user) {
      toast('Vui lòng đăng nhập để mượn thiết bị', 'warning');
      router.push('/auth/login');
    } else if (user) {
      setFullName(user.fullName);
      setEmployeeCode(user.employeeCode);
    }
  }, [user, authLoading, router, toast]);

  // Load data
  useEffect(() => {
    if (user) {
      fetchEquipments();
    }
  }, [user, search, selectedCategory]);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      // Build query string
      let query = '?limit=100';
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedCategory) query += `&category=${encodeURIComponent(selectedCategory)}`;

      const data = await api.get(`/equipment${query}`);
      // Filter out MAINTENANCE status as requested
      const activeEquipments = data.items.filter((item: Equipment) => item.status !== 'MAINTENANCE');
      setEquipments(activeEquipments);
      setCategories(data.categories);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải danh sách thiết bị', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: Equipment) => {
    if (item.availableQuantity <= 0) {
      toast(`Thiết bị ${item.name} đã hết hàng khả dụng`, 'warning');
      return;
    }

    const existingIndex = cart.findIndex((cartItem) => cartItem.equipment.id === item.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= item.availableQuantity) {
        toast(`Số lượng mượn không được vượt quá tồn kho khả dụng (${item.availableQuantity})`, 'warning');
        return;
      }
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { equipment: item, quantity: 1 }]);
    }
    toast(`Đã thêm ${item.name} vào giỏ`, 'success');
  };

  const updateCartQuantity = (equipmentId: string, delta: number) => {
    const item = cart.find((i) => i.equipment.id === equipmentId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.equipment.id !== equipmentId));
      return;
    }

    if (newQty > item.equipment.availableQuantity) {
      toast(`Không thể mượn quá số lượng sẵn có (${item.equipment.availableQuantity})`, 'warning');
      return;
    }

    setCart(
      cart.map((i) => (i.equipment.id === equipmentId ? { ...i, quantity: newQty } : i))
    );
  };

  const removeFromCart = (equipmentId: string) => {
    setCart(cart.filter((i) => i.equipment.id !== equipmentId));
    toast('Đã xóa thiết bị khỏi giỏ', 'info');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast('Giỏ mượn thiết bị trống', 'warning');
      return;
    }

    if (!purpose || !borrowDateOnly || !borrowTimeOnly || !returnDateOnly || !returnTimeOnly) {
      toast('Vui lòng nhập đầy đủ thông tin mượn', 'warning');
      return;
    }

    if (purpose.length > 500) {
      toast('Mục đích sử dụng không được vượt quá 500 ký tự', 'warning');
      return;
    }

    const borrowDateTime = `${borrowDateOnly}T${borrowTimeOnly}`;
    const returnDateTime = `${returnDateOnly}T${returnTimeOnly}`;

    if (new Date(borrowDateTime) >= new Date(returnDateTime)) {
      toast('Thời gian trả phải sau thời gian mượn', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        equipments: cart.map((item) => ({
          equipmentId: item.equipment.id,
          quantity: item.quantity,
        })),
        purpose,
        borrowDate: new Date(borrowDateTime).toISOString(),
        returnDate: new Date(returnDateTime).toISOString(),
      };

      await api.post('/borrow-requests', requestData);
      toast('Gửi yêu cầu mượn thiết bị thành công! Chờ Admin phê duyệt.', 'success');
      setCart([]);
      setPurpose('');
      setBorrowDateOnly('');
      setBorrowTimeOnly('');
      setReturnDateOnly('');
      setReturnTimeOnly('');
      setCartOpen(false);
      // Refresh list
      fetchEquipments();
    } catch (err: any) {
      toast(err.message || 'Lỗi gửi yêu cầu mượn thiết bị', 'error');
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

      <main className="flex-1 py-12 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-8 relative">
        {/* Page Title & Cart Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Đăng Ký Mượn Thiết Bị</h1>
            <p className="text-sm text-studio-muted mt-1">Chọn các thiết bị bạn cần quay chụp và lập phiếu đăng ký.</p>
          </div>
          <button
            onClick={() => setCartOpen(!cartOpen)}
            className="flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary/95 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto relative"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Giỏ thiết bị</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-brand-accent text-studio-dark text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          {/* Search input */}
          <div className="relative sm:col-span-2">
            <Search className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm thiết bị theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/25 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-studio-muted/70 focus:outline-none focus:border-brand-primary/50 transition-all"
            />
          </div>

          {/* Category selection */}
          <div className="relative">
            <SlidersHorizontal className="w-4 h-4 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-black/25 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Equipment Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : equipments.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <p className="text-studio-muted text-lg">Không tìm thấy thiết bị phù hợp.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipments.map((item) => (
              <div
                key={item.id}
                className="glass-panel rounded-3xl border border-white/5 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:border-brand-primary/20 shadow-md"
              >
                <div>
                  {/* Image container */}
                  <div className="h-44 relative bg-black/40">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-[10px] text-brand-primary font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-brand-primary/25">
                      {item.category}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-5 space-y-2 text-left">
                    <h3 className="font-bold text-white text-base leading-snug line-clamp-1" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-xs text-studio-muted line-clamp-2 leading-relaxed h-8">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer action */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-white/5">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-studio-muted uppercase leading-none">Khả dụng</p>
                    <span className="text-base font-extrabold text-white leading-none">
                      {item.availableQuantity} <span className="text-xs font-medium text-studio-muted">/ {item.quantity}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.availableQuantity === 0}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      item.availableQuantity > 0
                        ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary hover:text-white'
                        : 'bg-white/5 text-studio-muted border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Chọn mượn</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Drawer / Sidebar */}
        {cartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

            <div className="absolute inset-y-0 right-0 max-w-lg w-full flex">
              <div className="h-full w-full bg-[#0a0c10] border-l border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5 text-brand-primary" />
                    <span>Giỏ mượn thiết bị</span>
                  </h2>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="p-2 rounded-xl border border-white/5 text-studio-muted hover:text-white"
                  >
                    Đóng
                  </button>
                </div>

                {/* Selected List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-20 space-y-2">
                      <ShoppingCart className="w-12 h-12 text-studio-muted mx-auto opacity-45" />
                      <p className="text-studio-muted">Giỏ thiết bị đang trống. Vui lòng chọn thiết bị.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.equipment.id}
                        className="flex items-center space-x-4 p-3 bg-white/5 rounded-2xl border border-white/5"
                      >
                        <img
                          src={item.equipment.image}
                          alt={item.equipment.name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{item.equipment.name}</h4>
                          <span className="text-[10px] text-brand-primary uppercase font-bold tracking-wider">
                            {item.equipment.category}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <button
                              onClick={() => updateCartQuantity(item.equipment.id, -1)}
                              className="p-1 rounded bg-white/5 text-studio-muted hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-extrabold text-white w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.equipment.id, 1)}
                              className="p-1 rounded bg-white/5 text-studio-muted hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.equipment.id)}
                          className="p-2 text-studio-muted hover:text-brand-error rounded-xl hover:bg-brand-error/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Form fields & Checkout */}
                {cart.length > 0 && (
                  <form onSubmit={handleSubmitRequest} className="p-6 border-t border-white/5 bg-black/45 space-y-4 text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thông Tin Phiếu Mượn</h3>
                    
                    {/* User Info Read-only */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-studio-muted uppercase">Họ và Tên</label>
                        <div className="bg-white/5 border border-white/5 px-3 py-2 rounded-xl text-xs text-studio-muted flex items-center space-x-2">
                          <User className="w-3.5 h-3.5" />
                          <span>{fullName}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-studio-muted uppercase">Mã NV / SV</label>
                        <div className="bg-white/5 border border-white/5 px-3 py-2 rounded-xl text-xs text-studio-muted flex items-center space-x-2">
                          <span>{employeeCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-studio-muted uppercase">Mục đích sử dụng</label>
                        <span className={`text-[9px] font-bold ${purpose.length > 450 ? 'text-brand-error' : 'text-studio-muted'}`}>
                          {purpose.length} / 500
                        </span>
                      </div>
                      <div className="relative">
                        <FileText className="w-4 h-4 text-studio-muted absolute left-3 top-2.5" />
                        <textarea
                          placeholder="Nhập chi tiết mục đích (Quay bài tập, Chụp ảnh sự kiện...)"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          maxLength={500}
                          className="w-full bg-black/35 border border-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-brand-primary/50 placeholder:text-studio-muted/50 h-16 resize-none break-words"
                          disabled={submitting}
                          required
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                      {/* Borrow Date & Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-brand-primary" />
                          <span>Ngày giờ mượn</span>
                        </label>
                        <div className="flex gap-2">
                          <div 
                            className="flex-1 flex items-center space-x-2 bg-black/35 border border-white/5 rounded-xl px-3 py-2.5 cursor-pointer focus-within:border-brand-primary/50 transition-all"
                            onClick={(e) => { try { e.currentTarget.querySelector('input')?.showPicker(); } catch (err) {} }}
                          >
                            <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <input
                              type="date"
                              value={borrowDateOnly}
                              onChange={(e) => setBorrowDateOnly(e.target.value)}
                              className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                              disabled={submitting}
                              required
                            />
                          </div>
                          <div 
                            className="w-[42%] flex items-center space-x-2 bg-black/35 border border-white/5 rounded-xl px-3 py-2.5 cursor-pointer focus-within:border-brand-primary/50 transition-all"
                            onClick={(e) => { try { e.currentTarget.querySelector('input')?.showPicker(); } catch (err) {} }}
                          >
                            <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <input
                              type="time"
                              step="1800"
                              value={borrowTimeOnly}
                              onChange={(e) => setBorrowTimeOnly(e.target.value)}
                              className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                              disabled={submitting}
                              required
                            />
                          </div>
                        </div>
                        {/* Quick Time Chips for Borrow */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {['08:00', '13:30', '17:30'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setBorrowTimeOnly(t)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                borrowTimeOnly === t
                                  ? 'bg-brand-primary text-white border border-brand-primary/30'
                                  : 'bg-white/5 hover:bg-white/10 text-studio-muted hover:text-white border border-white/5'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Return Date & Time */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-brand-primary" />
                          <span>Ngày giờ trả</span>
                        </label>
                        <div className="flex gap-2">
                          <div 
                            className="flex-1 flex items-center space-x-2 bg-black/35 border border-white/5 rounded-xl px-3 py-2.5 cursor-pointer focus-within:border-brand-primary/50 transition-all"
                            onClick={(e) => { try { e.currentTarget.querySelector('input')?.showPicker(); } catch (err) {} }}
                          >
                            <Calendar className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <input
                              type="date"
                              value={returnDateOnly}
                              onChange={(e) => setReturnDateOnly(e.target.value)}
                              className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                              disabled={submitting}
                              required
                            />
                          </div>
                          <div 
                            className="w-[42%] flex items-center space-x-2 bg-black/35 border border-white/5 rounded-xl px-3 py-2.5 cursor-pointer focus-within:border-brand-primary/50 transition-all"
                            onClick={(e) => { try { e.currentTarget.querySelector('input')?.showPicker(); } catch (err) {} }}
                          >
                            <Clock className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                            <input
                              type="time"
                              step="1800"
                              value={returnTimeOnly}
                              onChange={(e) => setReturnTimeOnly(e.target.value)}
                              className="bg-transparent text-xs text-white focus:outline-none w-full cursor-pointer [color-scheme:dark]"
                              disabled={submitting}
                              required
                            />
                          </div>
                        </div>
                        {/* Quick Time Chips for Return */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                          {['08:00', '13:30', '17:30'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setReturnTimeOnly(t)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                returnTimeOnly === t
                                  ? 'bg-brand-primary text-white border border-brand-primary/30'
                                  : 'bg-white/5 hover:bg-white/10 text-studio-muted hover:text-white border border-white/5'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                          <span className="w-px h-3.5 bg-white/10 self-center mx-0.5" />
                          <button
                            type="button"
                            onClick={() => handleQuickReturn('+2')}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-studio-muted hover:text-white border border-white/5 transition-all"
                          >
                            +2 Giờ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickReturn('+4')}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-studio-muted hover:text-white border border-white/5 transition-all"
                          >
                            +4 Giờ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickReturn('allday')}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/5 hover:bg-white/10 text-studio-muted hover:text-white border border-white/5 transition-all"
                          >
                            Cả ngày
                          </button>
                        </div>
                      </div>
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
                          <Send className="w-4 h-4" />
                          <span>Gửi yêu cầu mượn</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
