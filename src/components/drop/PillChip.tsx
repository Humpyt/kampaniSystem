import React from 'react';
import { Pencil } from 'lucide-react';

interface PillChipProps {
  icon: string;
  value: string;
  onEdit: () => void;
}

export const PillChip: React.FC<PillChipProps> = ({ icon, value, onEdit }) => {
  return (
    <button
      onClick={onEdit}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition-colors group"
      title={value}
    >
      <span className="text-base">{icon}</span>
      <span className="text-gray-200 max-w-[120px] truncate">{value}</span>
      <Pencil className="w-3 h-3 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default PillChip;
