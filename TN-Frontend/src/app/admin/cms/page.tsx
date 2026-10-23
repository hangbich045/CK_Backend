'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/api';
import { Save, Loader2, Video, FileText, Compass, PhoneCall, Upload, Image, ToggleLeft } from 'lucide-react';

interface SectionVisibility {
  showHero: boolean;
  showServices: boolean;
  showGallery: boolean;
  showAbout: boolean;
  showContact: boolean;
}

export default function AdminCmsPage() {
  const { toast } = useToast();

  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroVideoUrl, setHeroVideoUrl] = useState('');
  const [heroPosterUrl, setHeroPosterUrl] = useState('');
  const [aboutContent, setAboutContent] = useState('');

  // Contact Info fields (serialized to JSON)
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fanpage, setFanpage] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [sections, setSections] = useState<SectionVisibility>({
    showHero: true,
    showServices: true,
    showGallery: true,
    showAbout: true,
    showContact: true,
  });

  useEffect(() => {
    fetchCmsContent();
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const data = await api.get('/homepage-sections');
      setSections({
        showHero: data.showHero,
        showServices: data.showServices,
        showGallery: data.showGallery,
        showAbout: data.showAbout,
        showContact: data.showContact,
      });
    } catch (err: any) {
      console.error('Error fetching section visibility:', err);
    }
  };

  const fetchCmsContent = async () => {
    setLoading(true);
    try {
      const data = await api.get('/homepage-content');
      setHeroTitle(data.heroTitle);
      setHeroDescription(data.heroDescription);
      setHeroVideoUrl(data.heroVideoUrl);
      setHeroPosterUrl(data.heroPosterUrl || '');
      setAboutContent(data.aboutContent);

      if (data.contactInfo) {
        try {
          const contact = JSON.parse(data.contactInfo);
          setAddress(contact.address || '');
          setEmail(contact.email || '');
          setPhone(contact.phone || '');
          setFanpage(contact.fanpage || '');
        } catch (e) {
          // Fallback if not JSON
          setAddress(data.contactInfo);
        }
      }
    } catch (err: any) {
      toast(err.message || 'Lỗi tải nội dung quản trị trang chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (<50MB)
    const maxVideoSize = 50 * 1024 * 1024;
    if (file.size > maxVideoSize) {
      toast('Tệp video vượt quá dung lượng tối đa cho phép (50MB)', 'error');
      return;
    }

    // Validate format (mp4/webm)
    const allowedVideoTypes = ['video/mp4', 'video/webm'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedVideoTypes.includes(file.type) && extension !== '.mp4' && extension !== '.webm') {
      toast('Chỉ chấp nhận tệp video định dạng MP4 hoặc WebM', 'error');
      return;
    }

    // Validate duration (<60s)
    try {
      const duration = await checkVideoDuration(file);
      if (duration > 60) {
        toast('Độ dài video nền không được vượt quá 60 giây (Hiện tại: ' + Math.round(duration) + ' giây)', 'error');
        return;
      }
    } catch (err) {
      console.error('Lỗi kiểm tra độ dài video:', err);
    }

    // Perform upload
    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/fe-api/upload?type=video', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi tải video lên máy chủ');
      }
      setHeroVideoUrl(data.url);
      toast('Tải video nền lên thành công!', 'success');
    } catch (err: any) {
      toast(err.message || 'Lỗi tải video lên máy chủ', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (<10MB)
    const maxPosterSize = 10 * 1024 * 1024;
    if (file.size > maxPosterSize) {
      toast('Tệp ảnh vượt quá dung lượng tối đa cho phép (10MB)', 'error');
      return;
    }

    // Validate format (jpg/jpeg/png/webp)
    const allowedPosterTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isImageExtension = ['.jpg', '.jpeg', '.png', '.webp'].includes(extension);
    if (!allowedPosterTypes.includes(file.type) && !isImageExtension) {
      toast('Chỉ chấp nhận tệp hình ảnh định dạng JPG, JPEG, PNG hoặc WEBP', 'error');
      return;
    }

    // Perform upload
    setUploadingPoster(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/fe-api/upload?type=poster', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi tải ảnh poster lên máy chủ');
      }
      setHeroPosterUrl(data.url);
      toast('Tải ảnh poster thành công!', 'success');
    } catch (err: any) {
      toast(err.message || 'Lỗi tải ảnh poster lên máy chủ', 'error');
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!heroTitle || !heroDescription || !heroVideoUrl || !aboutContent || !address || !email || !phone) {
      toast('Vui lòng điền đầy đủ các thông tin bắt buộc', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const contactObj = { address, email, phone, fanpage };
      const payload = {
        heroTitle,
        heroDescription,
        heroVideoUrl,
        heroPosterUrl: heroPosterUrl || null,
        aboutContent,
        contactInfo: JSON.stringify(contactObj),
      };

      await api.put('/homepage-content', payload);
      await api.put('/homepage-sections', sections);
      toast('Cập nhật nội dung trang chủ thành công', 'success');
      fetchCmsContent();
    } catch (err: any) {
      toast(err.message || 'Lỗi lưu cấu hình trang chủ', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 text-left max-w-4xl">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Quản Lý Nội Dung Trang Chủ</h1>
          <p className="text-sm text-studio-muted mt-1">
            Chỉnh sửa các đoạn văn bản giới thiệu, video nền và thông tin liên hệ hiển thị ngoài trang chủ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Hero Banner */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/25 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center space-x-2">
              <Compass className="w-5 h-5 text-brand-primary" />
              <span>Phần biểu ngữ chính (Hero Banner)</span>
            </h3>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase">Tiêu đề chính (Title)</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase">Mô tả ngắn (Description)</label>
                <textarea
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 h-24 resize-none"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Video URL & Upload */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                  <Video className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Video nền Hero (MP4/WebM, tối đa 50MB, &lt;60s)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Nhập URL video trực tiếp (https://...)"
                    value={heroVideoUrl}
                    onChange={(e) => setHeroVideoUrl(e.target.value)}
                    className="flex-1 bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={submitting || uploadingVideo}
                    required
                  />
                  <label className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-4 rounded-xl cursor-pointer transition-colors text-xs shrink-0 select-none disabled:opacity-50">
                    {uploadingVideo ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Tải video lên</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={submitting || uploadingVideo}
                    />
                  </label>
                </div>
              </div>

              {/* Poster URL & Upload */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-studio-muted uppercase flex items-center space-x-1">
                  <Image className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Ảnh chờ Hero / Poster Mobile (JPG/PNG/WEBP, tối đa 10MB)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Nhập URL hình ảnh trực tiếp (https://...)"
                    value={heroPosterUrl}
                    onChange={(e) => setHeroPosterUrl(e.target.value)}
                    className="flex-1 bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                    disabled={submitting || uploadingPoster}
                  />
                  <label className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-4 rounded-xl cursor-pointer transition-colors text-xs shrink-0 select-none disabled:opacity-50">
                    {uploadingPoster ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePosterUpload}
                      className="hidden"
                      disabled={submitting || uploadingPoster}
                    />
                  </label>
                </div>
              </div>

              {/* Preview Box */}
              {(heroVideoUrl || heroPosterUrl) && (
                <div className="mt-6 p-4 bg-black/45 border border-white/5 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-brand-primary uppercase tracking-wider block">Xem trước (Preview)</span>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-studio-dark/50 border border-white/5 flex items-center justify-center max-w-md mx-auto">
                    {heroVideoUrl ? (
                      <video
                        key={`${heroVideoUrl}-${heroPosterUrl}`}
                        controls
                        poster={heroPosterUrl || undefined}
                        className="w-full h-full object-cover"
                      >
                        <source src={heroVideoUrl} type="video/mp4" />
                        <source src={heroVideoUrl} type="video/webm" />
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                      </video>
                    ) : heroPosterUrl ? (
                      <img
                        src={heroPosterUrl}
                        alt="Poster Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-studio-muted">Chưa có video hoặc ảnh preview</span>
                    )}

                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-semibold">
                      {heroVideoUrl ? 'Desktop Video & Poster' : 'Mobile Poster Only'}
                    </div>
                  </div>
                  <span className="text-[10px] text-studio-muted text-center block font-medium">
                    Lưu ý: Trên giao diện trang chủ thực tế, video sẽ chạy tự động (autoplay), lặp lại (loop), tắt tiếng (muted) và ẩn trên điện thoại di động (thay bằng ảnh poster).
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: About Us */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/25 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-brand-primary" />
              <span>Phần Giới Thiệu (About Us)</span>
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-studio-muted uppercase">Nội dung giới thiệu Studio</label>
              <textarea
                value={aboutContent}
                onChange={(e) => setAboutContent(e.target.value)}
                className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50 h-32 resize-none"
                disabled={submitting}
                required
              />
            </div>
          </div>

          {/* Section 3: Contact Info */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/25 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center space-x-2">
              <PhoneCall className="w-5 h-5 text-brand-primary" />
              <span>Thông Tin Liên Hệ (Footer)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase">Địa chỉ Studio</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase">Email liên hệ</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Fanpage */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-studio-muted uppercase">Địa chỉ Fanpage Facebook</label>
                <input
                  type="url"
                  placeholder="https://facebook.com/example"
                  value={fanpage}
                  onChange={(e) => setFanpage(e.target.value)}
                  className="w-full bg-black/35 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-brand-primary/50"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Section Visibility */}
          <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-black/25 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center space-x-2">
              <ToggleLeft className="w-5 h-5 text-brand-primary" />
              <span>Hiển thị các phần trên Trang chủ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'showHero' as const, label: 'Phần Hero (Banner chính)' },
                { key: 'showAbout' as const, label: 'Phần Giới thiệu' },
                { key: 'showServices' as const, label: 'Phần Dịch vụ' },
                { key: 'showGallery' as const, label: 'Phần Thư viện ảnh' },
                { key: 'showContact' as const, label: 'Phần Liên hệ (Footer)' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-3 bg-black/30 border border-white/5 rounded-xl px-4 py-3 cursor-pointer"
                >
                  <span className="text-sm text-white font-medium">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={sections[item.key]}
                    onChange={(e) =>
                      setSections((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="w-4 h-4 rounded"
                    disabled={submitting}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Lưu tất cả thay đổi</span>
              </>
            )}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
