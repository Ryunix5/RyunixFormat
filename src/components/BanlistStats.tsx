import React from 'react';
import { BarChart3, AlertCircle, Copy, Clock } from 'lucide-react';

interface BanlistStatsProps {
  forbidden: number;
  limited: number;
  semiLimited: number;
  lastUpdated?: Date;
}

export function BanlistStats({ forbidden, limited, semiLimited, lastUpdated }: BanlistStatsProps) {
  const total = forbidden + limited + semiLimited;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Cards */}
      <div className="card-yugioh p-6 rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-purple-300 uppercase tracking-wider">
            Total Banned
          </span>
          <BarChart3 className="w-5 h-5 text-purple-400" />
        </div>
        <p className="text-3xl font-bold text-white">{total}</p>
        <p className="text-xs text-gray-400 mt-2">cards in current banlist</p>
      </div>

      {/* Forbidden */}
      <div className="card-yugioh p-6 rounded-lg border border-red-500/30 bg-gradient-to-br from-red-900/20 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-red-300 uppercase tracking-wider">
            Forbidden
          </span>
          <AlertCircle className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-3xl font-bold text-red-400">{forbidden}</p>
        <p className="text-xs text-gray-400 mt-2">not allowed in decks</p>
      </div>

      {/* Limited */}
      <div className="card-yugioh p-6 rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-orange-300 uppercase tracking-wider">
            Limited
          </span>
          <Copy className="w-5 h-5 text-orange-400" />
        </div>
        <p className="text-3xl font-bold text-orange-400">{limited}</p>
        <p className="text-xs text-gray-400 mt-2">1 copy maximum</p>
      </div>

      {/* Semi-Limited */}
      <div className="card-yugioh p-6 rounded-lg border border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-yellow-300 uppercase tracking-wider">
            Semi-Limited
          </span>
          <Copy className="w-5 h-5 text-yellow-400" />
        </div>
        <p className="text-3xl font-bold text-yellow-400">{semiLimited}</p>
        <p className="text-xs text-gray-400 mt-2">2 copies maximum</p>
      </div>

      {/* Last Updated */}
      <div className="card-yugioh p-6 rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-300 uppercase tracking-wider">
            Updated
          </span>
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-xs text-blue-300 font-mono mt-2">
          {lastUpdated ? formatTime(lastUpdated) : 'Never'}
        </p>
      </div>
    </div>
  );
}
