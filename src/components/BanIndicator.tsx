import React from 'react';
import type { BanStatus } from '@/data/banlist';
import { BAN_STATUS_INFO } from '@/data/banlist';

interface BanIndicatorProps {
  banStatus: BanStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BanIndicator({ banStatus, size = 'md', className = '' }: BanIndicatorProps) {
  const info = BAN_STATUS_INFO[banStatus];

  if (banStatus === 'unlimited') {
    return null; // Don't show anything for unlimited cards
  }

  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }[size];

  const imagePath = {
    forbidden: '/banlist/forbidden.png',
    limited: '/banlist/limited.png',
    'semi-limited': '/banlist/semi-limited.png',
  }[banStatus];

  return (
    <div className={`${sizeClass} ${className} flex items-center justify-center`} title={info.label}>
      <img
        src={imagePath}
        alt={info.label}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

interface BanBadgeProps {
  banStatus: BanStatus;
  className?: string;
}

export function BanBadge({ banStatus, className = '' }: BanBadgeProps) {
  const info = BAN_STATUS_INFO[banStatus];

  if (banStatus === 'unlimited') {
    return null;
  }

  const bgColor = {
    forbidden: 'bg-red-950',
    limited: 'bg-red-900',
    'semi-limited': 'bg-orange-900',
  }[banStatus];

  const borderColor = {
    forbidden: 'border-red-600',
    limited: 'border-red-500',
    'semi-limited': 'border-orange-500',
  }[banStatus];

  return (
    <div
      className={`${className} ${bgColor} ${borderColor} border px-3 py-1 rounded-full text-xs font-bold text-white`}
    >
      {info.label}
    </div>
  );
}

interface CardBanStatusProps {
  cardName: string;
  banStatus: BanStatus;
  showLabel?: boolean;
}

export function CardBanStatus({ cardName, banStatus, showLabel = true }: CardBanStatusProps) {
  if (banStatus === 'unlimited') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <BanIndicator banStatus={banStatus} size="sm" />
      {showLabel && <span className="text-sm font-semibold text-red-400">{BAN_STATUS_INFO[banStatus].label}</span>}
    </div>
  );
}
