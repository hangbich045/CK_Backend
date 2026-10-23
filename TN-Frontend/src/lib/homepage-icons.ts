import {
  Camera,
  Video,
  Mic,
  Music,
  Image,
  Monitor,
  Headphones,
  Film,
  type LucideIcon,
} from 'lucide-react';

export const HOMEPAGE_SERVICE_ICONS = [
  'Camera',
  'Video',
  'Mic',
  'Music',
  'Image',
  'Monitor',
  'Headphones',
  'Film',
] as const;

export type HomepageServiceIcon = (typeof HOMEPAGE_SERVICE_ICONS)[number];

const ICON_MAP: Record<HomepageServiceIcon, LucideIcon> = {
  Camera,
  Video,
  Mic,
  Music,
  Image,
  Monitor,
  Headphones,
  Film,
};

export function getHomepageServiceIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName as HomepageServiceIcon] ?? Camera;
}

export const SERVICE_COLOR_PRESETS = [
  'from-brand-accent/20 to-brand-accent/10 text-brand-accent border-brand-accent/30',
  'from-brand-primary/20 to-brand-secondary/20 text-brand-primary border-brand-primary/30',
  'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  'from-cyan-500/20 to-sky-500/20 text-cyan-400 border-sky-500/30',
  'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30',
];
