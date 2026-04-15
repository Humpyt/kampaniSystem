import React from 'react';

interface StepSectionProps {
  title: string;
  icon: string;
  color: string;
  isActive: boolean;
  children: React.ReactNode;
}

export const StepSection: React.FC<StepSectionProps> = ({ title, icon, color, isActive, children }) => {
  if (!isActive) return null;

  return (
    <div className={`bg-gray-800 rounded-xl p-4 border border-gray-700 border-t-4 ${color} flex flex-col h-full`}>
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-semibold text-gray-200">{title}</span>
      </div>
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
};

export default StepSection;
