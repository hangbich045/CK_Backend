'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Upload,
  X,
} from 'lucide-react';

interface HomepageGalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  order: number;
  isActive: boolean;
}

export default function AdminHomepageGalleryPage() {
  const { toast } = useToast();
  const [gallery, setGallery] = useState<HomepageGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const data = await api.get('/homepage-gallery');
      setGallery(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải thư viện ảnh', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setIsActive(true);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: HomepageGalleryItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setImageUrl(item.imageUrl);
    setIsActive(item.isActive);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast('Ảnh vượt quá 10MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/fe-api/upload?type=gallery', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi tải ảnh');
      }
      setImageUrl(data.url);
      toast('Tải ảnh lên thành công', 'success');
    } catch (err: any) {
      toast(err.message || 'Lỗi tải ảnh', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      toast('Vui lòng nhập tiêu đề và tải ảnh', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { title, imageUrl, isActive };
      if (editingId) {
        await api.put(`/homepage-gallery/${editingId}`, payload);
        toast('Cập nhật ảnh thành công', 'success');
      } else {
        await api.post('/homepage-gallery', payload);
        toast('Thêm ảnh thành công', 'success');
      }
      setDialogOpen(false);
      resetForm();
      fetchGallery();
    } catch (err: any) {
      toast(err.message || 'Lỗi lưu ảnh', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/homepage-gallery/${deleteId}`);
      toast('Xóa ảnh thành công', 'success');
      setDeleteId(null);
      fetchGallery();
    } catch (err: any) {
      toast(err.message || 'Lỗi xóa ảnh', 'error');
    }
  };

  const toggleActive = async (item: HomepageGalleryItem) => {
    try {
      await api.put(`/homepage-gallery/${item.id}`, { isActive: !item.isActive });
      fetchGallery();
    } catch (err: any) {
      toast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;

    const reordered = [...gallery];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const items = reordered.map((item, order) => ({ id: item.id, order }));

    try {
      const data = await api.put('/homepage-gallery/reorder', { items });
      setGallery(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi sắp xếp ảnh', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 text-left max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Thư viện ảnh Trang chủ</h1>
            <p className="text-sm text-studio-muted mt-1">
              Quản lý hình ảnh studio hiển thị trong phần gallery.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-5 py-3 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ảnh</span>
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : gallery.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center text-studio-muted">
            Chưa có ảnh nào. Nhấn &quot;Thêm ảnh&quot; để bắt đầu.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gallery.map((item, index) => (
              <div
                key={item.id}
                className={`glass-panel rounded-2xl border overflow-hidden ${
                  item.isActive ? 'border-white/5' : 'border-white/5 opacity-60'
                }`}
              >
                <div className="relative h-48">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-white line-clamp-2">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === gallery.length - 1}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"
                    >
                      {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-2 rounded-lg border border-brand-error/20 text-brand-error hover:bg-brand-error/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Chỉnh sửa ảnh' : 'Thêm ảnh mới'}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-studio-muted uppercase">Tiêu đề ảnh</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-studio-muted uppercase">Hình ảnh (JPG/PNG/WEBP, max 10MB)</label>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                )}
                <label className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-4 py-3 rounded-xl cursor-pointer text-sm">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh lên Cloudinary'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <input
                  type="url"
                  placeholder="Hoặc dán URL ảnh trực tiếp"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded"
                />
                Hiển thị trên trang chủ
              </label>

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-white/10 p-6 space-y-4 text-center">
            <h3 className="text-lg font-bold text-white">Xác nhận xóa ảnh?</h3>
            <p className="text-sm text-studio-muted">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl bg-brand-error text-white font-semibold cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
