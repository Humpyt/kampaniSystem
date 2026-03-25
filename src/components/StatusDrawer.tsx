import React, { useEffect } from 'react';
import { X, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function StatusDrawer({ isOpen, onClose, title, children }: StatusDrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-800 border-l border-gray-700 shadow-2xl z-50 transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
              aria-label="Close drawer"
            >
              <X className="w-6 h-6 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper components for drawer content
export function MetricDetail({
  label,
  value,
  trend,
  trendUp,
  icon
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-gray-700/50 rounded-xl p-6 mb-4 border border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          {icon && <div className="text-indigo-400">{icon}</div>}
          <span className="text-gray-300 font-medium">{label}</span>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${
            trendUp ? 'text-green-400' : 'text-red-400'
          }`}>
            {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

export function DetailList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex justify-between items-center py-3 border-b border-gray-700 last:border-0"
        >
          <span className="text-gray-400">{item.label}</span>
          <span className="text-white font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
