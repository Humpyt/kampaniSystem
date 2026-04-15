import React from 'react';
import { Pencil } from 'lucide-react';

interface CollapsedStepProps {
  icon: string;
  label: string;
  value: string;
  onEdit: () => void;
}

export const CollapsedStep: React.FC<CollapsedStepProps> = ({ icon, label, value, onEdit }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-xl">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-white font-medium text-sm">{value}</div>
      </div>
      <button
        onClick={onEdit}
        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="w-4 h-4 text-gray-400 hover:text-white" />
      </button>
    </div>
  );
};

export default CollapsedStep;
