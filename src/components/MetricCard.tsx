import React from 'react';

export type MetricType = 'revenue' | 'tickets' | 'actions' | 'default';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  type?: MetricType;
}

const colorSchemes: Record<MetricType, { from: string; to: string; glow: string; shadow: string }> = {
  revenue: { from: '#10B981', to: '#34D399', glow: 'rgba(16, 185, 129, 0.5)', shadow: 'rgba(16, 185, 129, 0.2)' },
  tickets: { from: '#3B82F6', to: '#60A5FA', glow: 'rgba(59, 130, 246, 0.5)', shadow: 'rgba(59, 130, 246, 0.2)' },
  actions: { from: '#F97316', to: '#FB923C', glow: 'rgba(249, 115, 22, 0.5)', shadow: 'rgba(249, 115, 22, 0.2)' },
  default: { from: '#6366F1', to: '#818CF8', glow: 'rgba(99, 102, 241, 0.5)', shadow: 'rgba(99, 102, 241, 0.2)' }
};

export default function MetricCard({
  title,
  value,
  trend,
  trendUp,
  icon,
  onClick,
  loading = false,
  type = 'default'
}: MetricCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const colors = colorSchemes[type];

  return (
    <button
      onClick={onClick}
      className={`
        bg-gray-800 rounded-2xl p-8 border-2 border-gray-700
        transition-all duration-500 ease-out
        group cursor-pointer relative overflow-hidden
        ${onClick ? 'active:scale-[0.98]' : ''}
      `}
      style={{
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.from;
        e.currentTarget.style.boxShadow = `0 0 40px ${colors.glow}, 0 20px 40px ${colors.shadow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#374151';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.1), ${colors.from}, transparent)`,
            backgroundSize: '200% 100%'
          }}
        />
      </div>

      {/* Gradient Overlay on Hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
        }}
      />

      <div className="flex flex-col items-center text-center space-y-4 relative z-10">
        {/* Icon with Gradient Background */}
        {icon && (
          <div className="relative mb-2">
            <div
              className="p-4 rounded-2xl inline-block transition-all duration-500 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                boxShadow: `0 8px 24px ${colors.glow}`
              }}
            >
              <div className="relative z-10 text-white">
                {icon}
              </div>
            </div>
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                filter: 'blur(12px)'
              }}
            />
          </div>
        )}

        {/* Title with Gradient Text */}
        <p
          className="text-sm font-medium uppercase tracking-wide transition-all duration-500"
          style={{
            color: '#9CA3AF',
            backgroundImage: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundImage = 'none';
            e.currentTarget.style.color = colors.from;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundImage = `linear-gradient(135deg, ${colors.from}, ${colors.to})`;
            e.currentTarget.style.WebkitBackgroundClip = 'text';
            e.currentTarget.style.WebkitTextFillColor = 'transparent';
          }}
        >
          {title}
        </p>

        {/* Value with Gradient on Hover */}
        {loading ? (
          <div className="h-12 w-32 bg-gray-700 rounded animate-pulse" />
        ) : (
          <h3
            className="text-4xl font-bold transition-all duration-500 group-hover:scale-110"
            style={{
              color: '#FFFFFF',
              backgroundImage: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {formatValue(value)}
          </h3>
        )}

        {/* Trend */}
        {trend && !loading && (
          <div className={`flex items-center space-x-2 text-sm font-bold transition-all duration-300`}
            style={{
              color: trendUp ? colors.from : '#EF4444'
            }}
          >
            <span className={`transform transition-transform duration-300 group-hover:scale-125`}>
              {trendUp ? '↑' : '↓'}
            </span>
            <span>{trend}</span>
          </div>
        )}

        {/* Click hint with color */}
        {onClick && (
          <div className="text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 font-medium"
            style={{
              color: colors.from
            }}
          >
            Click for details
          </div>
        )}
      </div>
    </button>
  );
}
