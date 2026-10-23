'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Search, Plus, Edit2, Trash2, Loader2, Upload, X, AlertTriangle } from 'lucide-react';

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

interface Category {
  id: string;
  name: string;
}

export default function AdminEquipmentPage() {
  const { toast } = useToast();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search & Pagination States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [statusInput, setStatusInput] = useState<'AVAILABLE' | 'BORROWED' | 'MAINTENANCE'>('AVAILABLE');
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Quick Category creation Dialog state
  const [quickCatOpen, setQuickCatOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [quickCatSubmitting, setQuickCatSubmitting] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipments();
    fetchCategories();
  }, [search, category, status, page]);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      let query = `?page=${page}&limit=${limit}`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (category) query += `&category=${encodeURIComponent(category)}`;
      if (status) query += `&status=${encodeURIComponent(status)}`;

      const data = await api.get(`/equipment${query}`);
      setEquipments(data.items);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải danh sách thiết bị', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/equipment-categories');
      setCategoriesList(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setCategoryInput('');
    setDescription('');
    setImage('');
    setQuantity(1);
    setStatusInput('AVAILABLE');
    setOriginalStatus(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Equipment) => {
    setEditingId(item.id);
    setCode(item.code);
    setName(item.name);
    setCategoryInput(item.category);
    setDescription(item.description);
    setImage(item.image);
    setQuantity(item.quantity);
    setStatusInput(item.status);
    setOriginalStatus(item.status);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/fe-api/upload?type=equipment', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi tải ảnh lên');
      }
      setImage(data.url);
      toast('Tải ảnh lên thành công', 'success');
    } catch (err: any) {
      toast(err.message || 'Lỗi tải ảnh lên', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleQuickCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;

    setQuickCatSubmitting(true);
    try {
      const newCat = await api.post('/equipment-categories', { name: quickCatName.trim() });
      toast('Đã tạo danh mục mới', 'success');
      
      // Refresh list
      const updatedCats = await api.get('/equipment-categories');
      setCategoriesList(updatedCats);

      // Auto select new category
      setCategoryInput(newCat.name);
      setQuickCatName('');
      setQuickCatOpen(false);
    } catch (err: any) {
      toast(err.message || 'Lỗi tạo danh mục', 'error');
    } finally {
      setQuickCatSubmitting(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !categoryInput || !description || !image || quantity < 0) {
      toast('Vui lòng điền đầy đủ thông tin thiết bị', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      let finalCode = code;
      if (!editingId) {
        // Auto-generate unique code for new device
        finalCode = `EQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      }

      const payload = {
        code: finalCode,
        name,
        category: categoryInput,
        description,
        image,
        quantity: Number(quantity),
        status: statusInput,
      };

      if (editingId) {
        await api.put(`/equipment/${editingId}`, payload);
        toast('Cập nhật thiết bị thành công', 'success');
      } else {
        await api.post('/equipment', payload);
        toast('Thêm mới thiết bị thành công', 'success');
      }

      setDialogOpen(false);
      fetchEquipments();
    } catch (err: any) {
      toast(err.message || 'Lỗi lưu thông tin thiết bị', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await api.delete(`/equipment/${deletingId}`);
      toast('Xóa thiết bị thành công', 'success');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchEquipments();
    } catch (err: any) {
      toast(err.message || 'Lỗi xóa thiết bị. Kiểm tra thiết bị có đang được mượn không.', 'error');
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-success/20 text-brand-success border border-brand-success/30">Sẵn sàng</span>;
      case 'BORROWED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary/20 text-brand-primary border border-brand-primary/30">Đang mượn</span>;
      case 'MAINTENANCE':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-error/20 text-brand-error border border-brand-error/30">Bảo trì</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 text-left">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Quản Lý Thiết Bị</h1>
            <p className="text-sm text-studio-muted mt-1">Danh sách thiết bị studio, cập nhật số lượng và kiểm tra bảo trì.</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary/95 text-white px-5 py-3 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm thiết bị</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="relative sm:col-span-2">
            <Search className="w-5 h-5 text-studio-muted absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên thiết bị..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/25 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white text-sm placeholder:text-studio-muted/70 focus:outline-none focus:border-brand-primary/50 transition-all"
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-black/25 border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-primary/50 cursor-pointer appearance-none"
            >
              <option value="">Tất cả danh mục</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-black/25 border border-white/5 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-brand-primary/50 cursor-pointer appearance-none"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="AVAILABLE">Sẵn sàng</option>
              <option value="BORROWED">Đang mượn</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
          </div>
        </div>

        {/* Equipment Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : equipments.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <p className="text-studio-muted">Không tìm thấy thiết bị nào.</p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 shadow-xl bg-black/25">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-studio-muted font-semibold bg-white/2">
                    <th className="py-4 px-6 text-left">Hình ảnh</th>
                    <th className="py-4 px-6 text-left">Tên thiết bị</th>
                    <th className="py-4 px-6 text-left">Danh mục</th>
                    <th className="py-4 px-6 text-center">Số lượng khả dụng</th>
                    <th className="py-4 px-6 text-center">Trạng thái</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {equipments.map((item) => (
                    <tr key={item.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-6">
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-white/5" />
                      </td>
                      <td className="py-4 px-6 text-white font-medium max-w-xs truncate" title={item.name}>{item.name}</td>
                      <td className="py-4 px-6 text-studio-muted">{item.category}</td>
                      <td className="py-4 px-6 text-center text-white font-bold">
                        {item.availableQuantity} <span className="text-xs text-studio-muted font-medium">/ {item.quantity}</span>
                      </td>
                      <td className="py-4 px-6 text-center">{getStatusBadge(item.status)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all cursor-pointer"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteConfirm(item.id)}
                            className="p-2 rounded-xl bg-brand-error/10 border border-brand-error/20 text-brand-error hover:bg-brand-error hover:text-white transition-all cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="py-4 px-6 border-t border-white/5 bg-white/2 flex items-center justify-between">
                <span className="text-xs text-studio-muted">
                  Trang {page} trên {totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3.5 py-1.5 rounded-lg border border-white/5 text-xs text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-3.5 py-1.5 rounded-lg border border-white/5 text-xs text-white bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create / Edit Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDialogOpen(false)} />
            
            <div className="glass-panel max-w-xl w-full rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="text-lg font-bold text-white">
                  {editingId ? 'Chỉnh sửa thiết bị' : 'Thêm mới thiết bị'}
                </h3>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="p-2 rounded-xl text-studio-muted hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-left overflow-y-auto max-h-[75vh]">
                <div>
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-studio-muted uppercase">Tên thiết bị</label>
                    <input
                      type="text"
                      placeholder="Sony Alpha A7S III"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Category Dropdown (V2 rules) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[11px] font-bold text-studio-muted uppercase">Danh mục</label>
                      <button
                        type="button"
                        onClick={() => setQuickCatOpen(true)}
                        className="text-[10px] text-brand-primary font-bold hover:underline cursor-pointer"
                      >
                        + Thêm mới
                      </button>
                    </div>
                    <select
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 cursor-pointer"
                      disabled={submitting}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      {categoriesList.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1 pt-4.5">
                    <input
                      type="number"
                      min={0}
                      placeholder="Số lượng"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                      disabled={submitting}
                      required
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1 pt-4.5">
                    <select
                      value={statusInput}
                      onChange={(e: any) => setStatusInput(e.target.value)}
                      className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={submitting || originalStatus === 'BORROWED'}
                    >
                      {originalStatus === 'BORROWED' ? (
                        <option value="BORROWED">Đang mượn</option>
                      ) : (
                        <>
                          <option value="AVAILABLE">Sẵn sàng</option>
                          <option value="MAINTENANCE">Bảo trì</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Mô tả chi tiết</label>
                  <textarea
                    placeholder="Mô tả các thông số kỹ thuật chính của thiết bị..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 h-20 resize-none"
                    disabled={submitting}
                    required
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Hình ảnh thiết bị</label>
                  
                  <div className="flex items-center space-x-4">
                    {image ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/5 shrink-0">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImage('')}
                          className="absolute top-1 right-1 p-0.5 rounded bg-black/75 text-white hover:text-brand-error"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-xl border border-dashed border-white/10 hover:border-brand-primary/50 flex flex-col items-center justify-center text-studio-muted hover:text-white cursor-pointer shrink-0 transition-colors">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[8px] font-bold uppercase">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading || submitting}
                        />
                      </label>
                    )}

                    <input
                      type="text"
                      placeholder="Hoặc điền liên kết ảnh trực tiếp..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50 pt-2"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Lưu thiết bị</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Quick Add Category Dialog */}
        {quickCatOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setQuickCatOpen(false)} />
            
            <div className="glass-panel max-w-sm w-full rounded-[24px] border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h4 className="text-sm font-bold text-white">Thêm nhanh danh mục</h4>
                <button
                  type="button"
                  onClick={() => setQuickCatOpen(false)}
                  className="p-1 rounded text-studio-muted hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickCategorySubmit} className="p-5 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-studio-muted uppercase">Tên danh mục mới</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Gimbal, Phông nền..."
                    value={quickCatName}
                    onChange={(e) => setQuickCatName(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={quickCatSubmitting}
                    required
                    autoFocus
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickCatOpen(false)}
                    className="flex-1 py-2 px-3 rounded-lg border border-white/5 bg-white/5 text-white text-xs font-semibold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={quickCatSubmitting || !quickCatName.trim()}
                    className="flex-1 py-2 px-3 rounded-lg bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 cursor-pointer disabled:opacity-40"
                  >
                    {quickCatSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      <span>Tạo mới</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
            
            <div className="glass-panel max-w-md w-full rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-brand-error/15 border border-brand-error/30 text-brand-error flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Xác nhận xóa thiết bị?</h3>
                <p className="text-sm text-studio-muted leading-relaxed">
                  Hành động này không thể hoàn tác. Thiết bị sẽ bị xóa vĩnh viễn khỏi danh mục hệ thống.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="py-3 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleDelete}
                  className="py-3 px-4 rounded-xl bg-brand-error hover:bg-brand-error/90 text-white font-semibold transition-all cursor-pointer"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
