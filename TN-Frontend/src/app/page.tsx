'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { getHomepageServiceIcon } from '@/lib/homepage-icons';
import { Calendar, ArrowRight, MapPin, Mail, Phone, Clock, Loader2 } from 'lucide-react';

interface ContactInfo {
  address: string;
  email: string;
  phone: string;
  fanpage: string;
}

interface CmsContent {
  heroTitle: string;
  heroDescription: string;
  heroVideoUrl: string;
  heroPosterUrl?: string | null;
  aboutContent: string;
  contactInfo: string;
}

interface HomepageServiceItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  isActive: boolean;
}

interface HomepageGalleryItem {
  id: string;
  imageUrl: string;
  title: string;
  order: number;
  isActive: boolean;
}

interface SectionVisibility {
  showHero: boolean;
  showServices: boolean;
  showGallery: boolean;
  showAbout: boolean;
  showContact: boolean;
}

interface HomepageData {
  content: CmsContent;
  services: HomepageServiceItem[];
  gallery: HomepageGalleryItem[];
  sections: SectionVisibility;
}

const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1600&auto=format&fit=crop&q=80';

export default function HomePage() {
  const [homepage, setHomepage] = useState<HomepageData | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchContent = async () => {
    try {
      const data: HomepageData = await api.get('/homepage');
      setHomepage(data);

      if (data.content?.contactInfo) {
        try {
          setContact(JSON.parse(data.content.contactInfo));
        } catch {
          setContact({
            address: data.content.contactInfo,
            email: 'media@lhu.edu.vn',
            phone: '(+84) 251 3952 778',
            fanpage: 'https://facebook.com',
          });
        }
      }
    } catch (e) {
      console.error('Error fetching homepage CMS:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const content = homepage?.content;
  const services = homepage?.services ?? [];
  const galleryImages = homepage?.gallery ?? [];
  const sections = homepage?.sections;

  const showHero = sections?.showHero !== false;
  const showAbout = sections?.showAbout !== false;
  const showServices = sections?.showServices !== false;
  const showGallery = sections?.showGallery !== false;
  const showContact = sections?.showContact !== false;
  const showAboutOrServices = showAbout || showServices;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-studio-dark text-white">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {showHero && (
        <section className="relative h-[calc(100vh-73px)] min-h-[600px] flex items-center justify-center overflow-hidden">
          {content?.heroVideoUrl && (
            <video
              autoPlay
              loop
              muted
              playsInline
              poster={content.heroPosterUrl || undefined}
              className="absolute inset-0 w-full h-full object-cover brightness-[0.85] hidden md:block"
            >
              <source src={content.heroVideoUrl} type="video/mp4" />
              <source src={content.heroVideoUrl} type="video/webm" />
            </video>
          )}

          {(!content?.heroVideoUrl || content.heroPosterUrl) && (
            <div
              className={`absolute inset-0 bg-cover bg-center bg-no-repeat brightness-[0.85] ${content?.heroVideoUrl ? 'md:hidden' : ''}`}
              style={{
                backgroundImage: `url('${content?.heroPosterUrl || FALLBACK_POSTER}')`,
              }}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-studio-dark via-studio-dark/45 to-transparent" />

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 bg-brand-primary/10 border border-brand-primary/30 px-4 py-1.5 rounded-full text-brand-primary font-bold text-xs uppercase tracking-widest animate-pulse drop-shadow-md">
              <span>Không gian sáng tạo số LHU</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight break-words drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
              {content?.heroTitle || 'LHU MEDIA STUDIO'}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed break-words whitespace-pre-wrap drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
              {content?.heroDescription || 'Hệ thống quản lý đặt lịch và mượn thiết bị studio chuyên nghiệp.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/studio"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5"
              >
                <Calendar className="w-5 h-5" />
                <span>Đặt phòng ngay</span>
              </Link>
              <Link
                href="/equipment"
                className="w-full sm:w-auto flex items-center justify-center space-x-2 glass-panel hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl border border-white/10 transition-all transform hover:-translate-y-0.5"
              >
                <span>Xem thiết bị</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {showAboutOrServices && (
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-16">
          {(showAbout || showServices) && (
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white break-words">Chúng Tôi Cung Cấp Gì?</h2>
              <div className="w-20 h-1 bg-brand-primary mx-auto rounded-full" />
              {showAbout && (
                <p className="text-studio-muted break-words whitespace-pre-wrap">
                  {content?.aboutContent ||
                    'LHU Media Studio cung cấp đầy đủ phòng ốc cách âm và trang thiết bị chuyên dụng phục vụ mọi sản phẩm truyền thông.'}
                </p>
              )}
            </div>
          )}

          {showServices && services.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => {
                const Icon = getHomepageServiceIcon(service.icon);
                return (
                  <div
                    key={service.id}
                    className={`p-8 rounded-3xl border bg-gradient-to-b ${service.color} flex flex-col justify-between h-72 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl`}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-white">{service.title}</h3>
                      <p className="text-sm text-studio-muted leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {showGallery && galleryImages.length > 0 && (
        <section className="py-20 bg-black/30 border-y border-white/5">
          <div className="px-6 md:px-12 max-w-7xl mx-auto w-full space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">Hình Ảnh Studio</h2>
              <div className="w-20 h-1 bg-brand-primary mx-auto rounded-full" />
              <p className="text-studio-muted">
                Khám phá không gian thực tế và các góc bố trí chuyên nghiệp bên trong LHU Media Studio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative h-64 rounded-3xl overflow-hidden border border-white/5 shadow-lg shadow-black/50"
                >
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6" />
                  <div className="absolute bottom-6 left-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <h4 className="text-lg font-bold text-white">{image.title}</h4>
                    <p className="text-xs text-brand-primary font-medium">LHU Media Studio</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#040508] border-t border-white/5 py-16 px-6 md:px-12 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="w-2 h-6 bg-brand-primary rounded-full inline-block" />
              <span>VỀ LHU MEDIA STUDIO</span>
            </h3>
            <p className="text-sm text-studio-muted leading-relaxed">
              Không gian sáng tạo truyền thông hàng đầu thuộc Trường Đại học Lạc Hồng.
              Nơi chắp cánh đam mê cho các nhà sáng tạo nội dung, nhiếp ảnh gia, vlogger trẻ tuổi.
            </p>
          </div>

          {showContact && contact && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-6 bg-brand-primary rounded-full inline-block" />
                <span>LIÊN HỆ</span>
              </h3>
              <div className="space-y-3 text-sm text-studio-muted">
                <p className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                  <span className="break-words whitespace-pre-wrap">{contact.address}</span>
                </p>
                <p className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{contact.email}</span>
                </p>
                <p className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>{contact.phone}</span>
                </p>
                {contact.fanpage && (
                  <p className="flex items-center space-x-3">
                    <svg
                      className="w-4 h-4 text-brand-primary shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                    <a
                      href={contact.fanpage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Facebook Fanpage
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span className="w-2 h-6 bg-brand-primary rounded-full inline-block" />
              <span>GIỜ MỞ CỬA</span>
            </h3>
            <div className="space-y-3 text-sm text-studio-muted">
              <p className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-brand-primary shrink-0" />
                <span>Thứ 2 - Thứ 7: 07:30 - 17:30</span>
              </p>
              <p className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-brand-primary shrink-0" />
                <span>Chủ nhật: Đóng cửa (Hoặc liên hệ riêng)</span>
              </p>
            </div>
          </div>
        </div>

        <hr className="border-white/5 my-12 max-w-7xl mx-auto" />

        <div className="max-w-7xl mx-auto text-center text-xs text-studio-muted">
          <p>
            © {new Date().getFullYear()} LHU Media Studio. All rights reserved. Developed for Lạc Hồng
            University.
          </p>
        </div>
      </footer>
    </div>
  );
}
