'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import {
  getHomepageServiceIcon,
  HOMEPAGE_SERVICE_ICONS,
  SERVICE_COLOR_PRESETS,
} from '@/lib/homepage-icons';
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

interface HomepageServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
}

export default function AdminHomepageServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<HomepageServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>('Camera');
  const [color, setColor] = useState(SERVICE_COLOR_PRESETS[0]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await api.get('/homepage-services');
      setServices(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải danh sách dịch vụ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setIcon('Camera');
    setColor(SERVICE_COLOR_PRESETS[0]);
    setIsActive(true);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: HomepageServiceItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setIcon(item.icon);
    setColor(item.color);
    setIsActive(item.isActive);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast('Vui lòng điền đầy đủ thông tin dịch vụ', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { title, description, icon, color, isActive };
      if (editingId) {
        await api.put(`/homepage-services/${editingId}`, payload);
        toast('Cập nhật dịch vụ thành công', 'success');
      } else {
        await api.post('/homepage-services', payload);
        toast('Thêm dịch vụ thành công', 'success');
      }
      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (err: any) {
      toast(err.message || 'Lỗi lưu dịch vụ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/homepage-services/${deleteId}`);
      toast('Xóa dịch vụ thành công', 'success');
      setDeleteId(null);
      fetchServices();
    } catch (err: any) {
      toast(err.message || 'Lỗi xóa dịch vụ', 'error');
    }
  };

  const toggleActive = async (item: HomepageServiceItem) => {
    try {
      await api.put(`/homepage-services/${item.id}`, { isActive: !item.isActive });
      fetchServices();
    } catch (err: any) {
      toast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const reordered = [...services];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const items = reordered.map((item, order) => ({ id: item.id, order }));

    try {
      const data = await api.put('/homepage-services/reorder', { items });
      setServices(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi sắp xếp dịch vụ', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 text-left max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Dịch vụ Trang chủ</h1>
            <p className="text-sm text-studio-muted mt-1">
              Quản lý các thẻ dịch vụ hiển thị trên trang chủ.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-5 py-3 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dịch vụ</span>
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-white/5 text-center text-studio-muted">
            Chưa có dịch vụ nào. Nhấn &quot;Thêm dịch vụ&quot; để bắt đầu.
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((item, index) => {
              const Icon = getHomepageServiceIcon(item.icon);
              return (
                <div
                  key={item.id}
                  className={`glass-panel p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-4 ${
                    item.isActive ? 'border-white/5' : 'border-white/5 opacity-60'
                  }`}
                >
                  <div className={`p-4 rounded-2xl border bg-gradient-to-b ${item.color} shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-studio-muted mt-1 line-clamp-2">{item.description}</p>
                    <p className="text-[10px] text-studio-muted mt-2 uppercase tracking-wider">
                      Icon: {item.icon} · Thứ tự: {item.order}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                      title="Di chuyển lên"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === services.length - 1}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                      title="Di chuyển xuống"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(item)}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"
                      title={item.isActive ? 'Ẩn dịch vụ' : 'Hiện dịch vụ'}
                    >
                      {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-2 rounded-lg border border-brand-error/20 text-brand-error hover:bg-brand-error/10 cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h2>
              <button onClick={() => setDialogOpen(false)} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-studio-muted uppercase">Tiêu đề</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-studio-muted uppercase">Mô tả</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white h-24 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-studio-muted uppercase">Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white"
                  >
                    {HOMEPAGE_SERVICE_ICONS.map((iconName) => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-studio-muted uppercase">Màu sắc</label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white"
                  >
                    {SERVICE_COLOR_PRESETS.map((preset, idx) => (
                      <option key={preset} value={preset}>
                        Bảng màu {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>
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
                disabled={submitting}
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
            <h3 className="text-lg font-bold text-white">Xác nhận xóa dịch vụ?</h3>
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
