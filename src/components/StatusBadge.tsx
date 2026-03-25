import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';

export interface StatusBadgeProps {
  type: 'warning' | 'alert' | 'info';
  count?: number;
  label: string;
  onDismiss?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

const colorSchemes = {
  warning: {
    from: '#F59E0B',
    to: '#FBBF24',
    glow: 'rgba(245, 158, 11, 0.5)',
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: 'bg-gradient-to-br from-yellow-400 to-amber-500'
  },
  alert: {
    from: '#EF4444',
    to: '#F87171',
    glow: 'rgba(239, 68, 68, 0.5)',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.4)',
    icon: 'bg-gradient-to-br from-red-400 to-rose-500'
  },
  info: {
    from: '#3B82F6',
    to: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.5)',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.4)',
    icon: 'bg-gradient-to-br from-blue-400 to-indigo-500'
  }
};

const icons = {
  warning: AlertTriangle,
  alert: AlertCircle,
  info: Info
};

export default function StatusBadge({
  type,
  count,
  label,
  onDismiss,
  onClick,
  compact = false
}: StatusBadgeProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (dismissed) return null;

  const colors = colorSchemes[type];
  const Icon = icons[type];

  // Compact mode for footer
  if (compact) {
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsPulsing(false)}
        onMouseLeave={() => setIsPulsing(true)}
        className={`
          relative group flex items-center gap-2 px-3 py-1.5 rounded-lg border
          transition-all duration-200 overflow-hidden
          ${onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
        `}
        style={{
          background: colors.bg,
          borderColor: colors.border,
        }}
      >
        {/* Icon */}
        <div className={`relative z-10 p-1 rounded ${colors.icon}`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Count and Label */}
        <span className="relative z-10 text-xs font-semibold whitespace-nowrap" style={{ color: colors.from }}>
          {count !== undefined ? `${count} ${label}` : label}
        </span>

        {/* Dismiss button */}
        {onDismiss && (
          <div
            className="relative z-10 p-0.5 rounded hover:bg-white/20 transition-all duration-200"
            onClick={handleDismiss}
          >
            <X className="w-3 h-3 transition-transform duration-200 hover:rotate-90" style={{ color: colors.from }} />
          </div>
        )}
      </button>
    );
  }

  // Full-size mode
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsPulsing(false)}
      onMouseLeave={() => setIsPulsing(true)}
      className={`
        relative group flex items-center space-x-3 px-5 py-2.5 rounded-full border-2
        transition-all duration-300 overflow-hidden
        ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'}
      `}
      style={{
        background: colors.bg,
        borderColor: colors.border,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 30px ${colors.glow}`;
        e.currentTarget.style.borderColor = colors.from;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = colors.border;
      }}
    >
      {/* Animated gradient background on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          backgroundSize: '200% 200%'
        }}
      />

      {/* Pulsing glow ring */}
      {isPulsing && type === 'alert' && (
        <div
          className="absolute inset-0 rounded-full animate-ping pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            opacity: 0.3
          }}
        />
      )}

      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), ${colors.from}, transparent)`,
            backgroundSize: '200% 100%'
          }}
        />
      </div>

      {/* Icon with gradient */}
      <div className={`relative z-10 p-1.5 rounded-lg ${colors.icon} shadow-lg`}>
        <Icon className="w-4 h-4 text-white" />
      </div>

      {/* Count with animated scale */}
      {count !== undefined && (
        <span
          className="relative z-10 font-bold text-white text-base min-w-[2rem] text-center"
          style={{
            textShadow: `0 2px 8px ${colors.glow}`,
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {count}
        </span>
      )}

      {/* Label */}
      <span
        className="relative z-10 text-sm font-semibold whitespace-nowrap"
        style={{
          color: colors.from,
          textShadow: `0 1px 2px rgba(0,0,0,0.3)`
        }}
      >
        {label}
      </span>

      {/* Sparkle decoration */}
      <Sparkles
        className={`relative z-10 w-3.5 h-3.5 transition-all duration-300 ${isPulsing ? 'animate-spin-slow' : ''}`}
        style={{
          color: colors.to,
          opacity: 0.8
        }}
      />

      {/* Dismiss button */}
      {onDismiss && (
        <div
          className="relative z-10 p-1 rounded-full hover:bg-white/20 transition-all duration-200"
          onClick={handleDismiss}
        >
          <X
            className="w-3.5 h-3.5 transition-transform duration-200 hover:rotate-90"
            style={{ color: colors.from }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </button>
  );
}
