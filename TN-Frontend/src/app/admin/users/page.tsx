'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, ArrowUp, ArrowDown, Trash2, ShieldAlert, RefreshCcw, AlertTriangle, Plus, X } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  employeeCode: string;
  role: 'ADMIN' | 'USER' | 'COLLABORATOR';
  avatarUrl?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create User Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleInput, setRoleInput] = useState<'ADMIN' | 'USER' | 'COLLABORATOR'>('USER');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/dashboard/users');
      setUsers(data);
    } catch (err: any) {
      toast(err.message || 'Lỗi tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetUserId: string, currentRole: 'ADMIN' | 'USER' | 'COLLABORATOR') => {
    if (currentUser?.id === targetUserId) {
      toast('Bạn không thể tự thay đổi quyền hạn của chính mình', 'warning');
      return;
    }

    let newRole: 'ADMIN' | 'USER' | 'COLLABORATOR' = 'USER';
    if (currentRole === 'USER') {
      newRole = 'COLLABORATOR';
    } else if (currentRole === 'COLLABORATOR') {
      newRole = 'ADMIN';
    } else {
      newRole = 'USER';
    }

    setActioningId(targetUserId);
    try {
      await api.put(`/dashboard/users/${targetUserId}/role`, { role: newRole });
      toast('Cập nhật quyền hạn thành công', 'success');
      fetchUsers();
    } catch (err: any) {
      toast(err.message || 'Lỗi cập nhật quyền hạn', 'error');
    } finally {
      setActioningId(null);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast('Vui lòng điền đầy đủ các thông tin bắt buộc', 'warning');
      return;
    }

    setCreatingUser(true);
    try {
      await api.post('/admin/users', {
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: roleInput,
      });
      toast('Tạo tài khoản mới thành công!', 'success');
      setCreateModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRoleInput('USER');
      fetchUsers();
    } catch (err: any) {
      toast(err.message || 'Lỗi tạo tài khoản mới', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenDeleteConfirm = (id: string) => {
    if (currentUser?.id === id) {
      toast('Bạn không thể tự xóa tài khoản của chính mình', 'warning');
      return;
    }
    setDeletingId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await api.delete(`/dashboard/users/${deletingId}`);
      toast('Xóa tài khoản thành công', 'success');
      setDeleteConfirmOpen(false);
      setDeletingId(null);
      fetchUsers();
    } catch (err: any) {
      toast(err.message || 'Lỗi xóa tài khoản. Người dùng có thể đang có phiếu mượn chưa trả.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 text-left">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Quản Lý Thành Viên</h1>
            <p className="text-sm text-studio-muted mt-1">Phân quyền quản trị (ADMIN) và quản lý tài khoản người dùng hệ thống.</p>
          </div>
          <div className="flex items-center space-x-3 self-start sm:self-auto">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary/95 text-white px-5 py-3 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo tài khoản</span>
            </button>
            <button
              onClick={fetchUsers}
              className="p-3 rounded-2xl border border-white/5 hover:bg-white/5 text-studio-muted hover:text-white transition-all cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
            <p className="text-studio-muted">Không có người dùng nào đăng ký.</p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 shadow-xl bg-black/25">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-studio-muted font-semibold bg-white/2">
                    <th className="py-4 px-6 text-left">Thành viên</th>
                    <th className="py-4 px-6 text-left">Mã nhân viên / SV</th>
                    <th className="py-4 px-6 text-center">Vai trò</th>
                    <th className="py-4 px-6 text-center">Ngày đăng ký</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((item) => {
                    const isSelf = currentUser?.id === item.id;
                    return (
                      <tr key={item.id} className="hover:bg-white/2 transition-colors">
                        {/* Detail name & email */}
                        <td className="py-4 px-6 text-left">
                          <div className="flex items-center space-x-3">
                            {item.avatarUrl ? (
                              <img
                                src={item.avatarUrl}
                                alt={item.fullName}
                                className="w-8 h-8 rounded-lg object-cover border border-brand-secondary/30 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-studio-muted text-sm border border-white/5 shrink-0">
                                {item.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white flex items-center space-x-2">
                                <span>{item.fullName}</span>
                                {isSelf && (
                                  <span className="text-[9px] bg-brand-primary/20 text-brand-primary font-bold px-1.5 py-0.2 rounded border border-brand-primary/20">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-studio-muted mt-0.5">{item.email}</div>
                            </div>
                          </div>
                        </td>
                        {/* Employee Code */}
                        <td className="py-4 px-6 text-left font-medium text-white">{item.employeeCode}</td>
                        {/* Role badge */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                              item.role === 'ADMIN'
                                ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30'
                                : item.role === 'COLLABORATOR'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                            }`}
                          >
                            {item.role === 'COLLABORATOR' ? 'CTV' : item.role}
                          </span>
                        </td>
                        {/* Registered date */}
                        <td className="py-4 px-6 text-center text-studio-muted">
                          {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                        </td>
                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center space-x-2">
                            {/* Promote / Demote */}
                            <button
                              onClick={() => handleUpdateRole(item.id, item.role)}
                              disabled={isSelf || actioningId !== null}
                              className={`p-2 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                                item.role === 'USER'
                                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white'
                                  : item.role === 'COLLABORATOR'
                                  ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent hover:bg-brand-accent hover:text-studio-dark'
                                  : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white'
                              }`}
                              title={
                                item.role === 'USER'
                                  ? 'Cấp quyền Cộng tác viên'
                                  : item.role === 'COLLABORATOR'
                                  ? 'Cấp quyền Admin'
                                  : 'Hạ quyền xuống User'
                              }
                            >
                              {item.role === 'ADMIN' ? (
                                <ArrowDown className="w-4 h-4" />
                              ) : (
                                <ArrowUp className="w-4 h-4" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleOpenDeleteConfirm(item.id)}
                              disabled={isSelf || actioningId !== null}
                              className="p-2 rounded-xl bg-brand-error/10 border border-brand-error/20 text-brand-error hover:bg-brand-error hover:text-white transition-all cursor-pointer disabled:opacity-40"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
            
            <div className="glass-panel max-w-md w-full rounded-3xl border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 p-6 text-center space-y-6">
              <div className="w-14 h-14 rounded-full bg-brand-error/15 border border-brand-error/30 text-brand-error flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Xóa tài khoản thành viên?</h3>
                <p className="text-sm text-studio-muted leading-relaxed">
                  Hành động này sẽ xóa vĩnh viễn tài khoản người dùng khỏi hệ thống. Chỉ có thể thực hiện nếu người dùng này không có lịch mượn thiết bị đang hoạt động.
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

        {/* Create User Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)} />
            
            <div className="glass-panel max-w-md w-full rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h3 className="text-lg font-bold text-white">Tạo tài khoản mới</h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="p-2 rounded-xl text-studio-muted hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4 text-left">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={creatingUser}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Email</label>
                  <input
                    type="email"
                    placeholder="nguyenvana@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={creatingUser}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Mật khẩu</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={creatingUser}
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-studio-muted uppercase">Vai trò</label>
                  <select
                    value={roleInput}
                    onChange={(e: any) => setRoleInput(e.target.value)}
                    className="w-full bg-black/35 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 cursor-pointer"
                    disabled={creatingUser}
                    required
                  >
                    <option value="USER">Người dùng (USER)</option>
                    <option value="COLLABORATOR">Cộng tác viên (CTV)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer disabled:opacity-50 pt-2"
                >
                  {creatingUser ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Tạo tài khoản</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
