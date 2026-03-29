import React from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Customer } from '../../types';

interface CustomerListRowProps {
  customer: Customer;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-blue-500',
];

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const CustomerListRow: React.FC<CustomerListRowProps> = ({
  customer,
  isSelected,
  onClick,
  onEdit,
  onDelete
}) => {
  const avatarColor = getAvatarColor(customer.name);
  const initials = getInitials(customer.name);

  const lastVisitDisplay = customer.lastVisit
    ? format(new Date(customer.lastVisit), 'MMM d, yyyy')
    : 'No visits yet';

  return (
    <div
      onClick={onClick}
      className={`
        group flex items-center justify-between p-3 cursor-pointer
        transition-colors duration-150
        ${isSelected ? 'bg-indigo-600/20' : 'hover:bg-gray-750'}
      `}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <div className={`${avatarColor} w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
          {initials}
        </div>

        {/* Name & Email */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{customer.name}</p>
          <p className="text-xs text-gray-500 truncate">{customer.email || 'No email'}</p>
        </div>

        {/* Phone */}
        <div className="hidden sm:block w-28 flex-shrink-0">
          <p className="text-sm text-gray-300">{customer.phone}</p>
        </div>

        {/* Last Visit */}
        <div className="hidden md:block w-28 flex-shrink-0">
          <p className="text-sm text-gray-300">{lastVisitDisplay}</p>
        </div>

        {/* Visits */}
        <div className="hidden sm:block w-16 flex-shrink-0 text-center">
          <p className="text-sm font-medium text-gray-300">{customer.totalOrders}</p>
          <p className="text-[10px] text-gray-500">visits</p>
        </div>

        {/* Spent */}
        <div className="w-24 flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-indigo-400">{formatCurrency(customer.totalSpent)}</p>
        </div>
      </div>

      {/* Action buttons - appear on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
          title="Edit customer"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 hover:bg-red-600 rounded-lg transition-colors text-gray-400 hover:text-red-400"
          title="Delete customer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default CustomerListRow;