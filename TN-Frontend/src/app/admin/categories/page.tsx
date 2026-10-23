'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Plus, Edit2, Trash2, Loader2, X, AlertTriangle, RefreshCcw } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete modal confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await api.get('/equipment-categories');
      setCategories(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải danh mục thiết bị', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/equipment-categories/${editingId}`, { name: name.trim() });
        toast('Cập nhật danh mục thành công', 'success');
      } else {
        await api.post('/equipment-categories', { name: name.trim() });
        toast('Thêm mới danh mục thành công', 'success');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast(err.message || 'Lỗi lưu danh mục', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await api.delete(`/equipment-categories/${deletingId}`);
      toast('Xóa danh mục thành công', 'success');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchCategories();
    } catch (err: any) {
      toast(err.message || 'Không thể xóa danh mục này do có thiết bị đang thuộc danh mục này', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 text-left">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Danh Mục Thiết Bị</h1>
            <p className="text-sm text-studio-muted mt-1">Quản lý các danh mục phân loại thiết bị quay phim, chụp ảnh, âm thanh.</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchCategories}
              className="p-3 rounded-2xl border border-white/5 hover:bg-white/5 text-studio-muted hover:text-white transition-all cursor-pointer"
              title="Làm mới"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center space-x-2 bg-brand-primary hover:bg-brand-primary/95 text-white px-5 py-3 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm danh mục</span>
            </button>
          </div>
        </div>

        {/* List of categories */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <p className="text-studio-muted">Không có danh mục nào được tìm thấy.</p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 shadow-xl bg-black/25 max-w-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-studio-muted font-semibold bg-white/2">
                    <th className="py-4 px-6 text-left">Tên danh mục</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-4 px-6 text-white font-medium">{cat.name}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-all cursor-pointer"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(cat.id)}
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
          </div>
        )}

        {/* Create/Edit Dialog */}
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDialogOpen(false)} />
            
            <div className="glass-panel max-w-md w-full rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="text-lg font-bold text-white">
                  {editingId ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục'}
                </h3>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="p-2 rounded-xl text-studio-muted hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Tên danh mục</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tripod, Gimbal..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={submitting}
                    required
                    autoFocus
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
                    <span>Lưu danh mục</span>
                  )}
                </button>
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
                <h3 className="text-xl font-bold text-white">Xác nhận xóa danh mục?</h3>
                <p className="text-sm text-studio-muted leading-relaxed">
                  Lưu ý: Bạn chỉ có thể xóa danh mục này nếu không còn bất kỳ thiết bị nào đang được gán cho nó.
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
