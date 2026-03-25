import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CompactMetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  color: 'emerald' | 'blue' | 'orange' | 'violet' | 'amber' | 'sky' | 'red';
  onClick?: () => void;
}

const colorSchemes = {
  emerald: {
    bg: 'bg-emerald-900/30 hover:bg-emerald-900/50',
    border: 'border-emerald-700/50 hover:border-emerald-600',
    text: 'text-emerald-400',
    glow: 'hover:shadow-emerald-500/20'
  },
  blue: {
    bg: 'bg-blue-900/30 hover:bg-blue-900/50',
    border: 'border-blue-700/50 hover:border-blue-600',
    text: 'text-blue-400',
    glow: 'hover:shadow-blue-500/20'
  },
  orange: {
    bg: 'bg-orange-900/30 hover:bg-orange-900/50',
    border: 'border-orange-700/50 hover:border-orange-600',
    text: 'text-orange-400',
    glow: 'hover:shadow-orange-500/20'
  },
  violet: {
    bg: 'bg-violet-900/30 hover:bg-violet-900/50',
    border: 'border-violet-700/50 hover:border-violet-600',
    text: 'text-violet-400',
    glow: 'hover:shadow-violet-500/20'
  },
  amber: {
    bg: 'bg-amber-900/30 hover:bg-amber-900/50',
    border: 'border-amber-700/50 hover:border-amber-600',
    text: 'text-amber-400',
    glow: 'hover:shadow-amber-500/20'
  },
  sky: {
    bg: 'bg-sky-900/30 hover:bg-sky-900/50',
    border: 'border-sky-700/50 hover:border-sky-600',
    text: 'text-sky-400',
    glow: 'hover:shadow-sky-500/20'
  },
  red: {
    bg: 'bg-red-900/30 hover:bg-red-900/50',
    border: 'border-red-700/50 hover:border-red-600',
    text: 'text-red-400',
    glow: 'hover:shadow-red-500/20'
  }
};

export default function CompactMetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp = true,
  color = 'emerald',
  onClick
}: CompactMetricCardProps) {
  const scheme = colorSchemes[color];

  return (
    <button
      onClick={onClick}
      className={`
        ${scheme.bg} ${scheme.border} ${scheme.glow}
        relative overflow-hidden rounded-lg border
        p-3 min-w-[140px] h-20
        flex items-center gap-3
        transition-all duration-200
        hover:scale-105 hover:shadow-lg
        active:scale-95
        cursor-pointer
        group
      `}
    >
      {/* Icon container */}
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-lg
        ${scheme.bg.replace('30', '20')}
        flex items-center justify-center
        ${scheme.text}
        group-hover:scale-110
        transition-transform duration-200
      `}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Value and Label */}
      <div className="flex-1 min-w-0 text-left">
        <div className="text-lg font-bold text-white leading-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-xs text-gray-400 truncate mt-0.5">
          {label}
        </div>
      </div>

      {/* Trend indicator (if provided) */}
      {trend && (
        <div className={`
          flex-shrink-0 flex items-center gap-1
          text-xs font-medium
          ${trendUp ? 'text-green-400' : 'text-red-400'}
        `}>
          {trendUp ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{trend}</span>
        </div>
      )}

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 transition-transform duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
    </button>
  );
}
