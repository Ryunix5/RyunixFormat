import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import type { BanStatus } from '@/data/banlist';

interface BanlistCardProps {
  cardName: string;
  banStatus: BanStatus;
  onDelete?: () => void;
}

export function BanlistCard({ cardName, banStatus, onDelete }: BanlistCardProps) {
  const getBadgeStyles = () => {
    switch (banStatus) {
      case 'forbidden':
        return 'badge-forbidden';
      case 'limited':
        return 'badge-limited';
      case 'semi-limited':
        return 'badge-semi-limited';
      default:
        return '';
    }
  };

  const getStatusLabel = () => {
    switch (banStatus) {
      case 'forbidden':
        return 'FORBIDDEN';
      case 'limited':
        return '3 COPIES';
      case 'semi-limited':
        return '2 COPIES';
      default:
        return 'UNLIMITED';
    }
  };

  const getStatusColor = () => {
    switch (banStatus) {
      case 'forbidden':
        return 'bg-red-900/20 border-red-500/30';
      case 'limited':
        return 'bg-orange-900/20 border-orange-500/30';
      case 'semi-limited':
        return 'bg-yellow-900/20 border-yellow-500/30';
      default:
        return 'bg-blue-900/20 border-blue-500/30';
    }
  };

  return (
    <div className={`card-yugioh ${getStatusColor()} p-4 rounded-lg border transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20`}>
      <div className="flex items-start justify-between gap-3">
        {/* Left side - Card info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <h3 className="text-sm font-bold text-white truncate hover:text-yellow-400 transition-colors">
              {cardName}
            </h3>
          </div>
          
          {/* Badge */}
          <div className="inline-block">
            <span className={getBadgeStyles()}>
              {getStatusLabel()}
            </span>
          </div>
        </div>

        {/* Right side - Delete button */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 p-2 hover:bg-red-900/20 rounded-md"
            title="Remove from banlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
