import React from 'react';
import { Search, X } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  minVisits: number;
  onMinVisitsChange: (value: number) => void;
  minSpent: number;
  onMinSpentChange: (value: number) => void;
  sortBy: 'name' | 'recent' | 'spent';
  onSortChange: (sort: 'name' | 'recent' | 'spent') => void;
}

const VISITS_OPTIONS = [0, 1, 2, 3, 4, 5, 7, 10, 15, 20];
const SPENT_OPTIONS = [0, 25, 50, 100, 150, 200, 500];

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchTerm,
  onSearchChange,
  minVisits,
  onMinVisitsChange,
  minSpent,
  onMinSpentChange,
  sortBy,
  onSortChange
}) => {
  const hasActiveFilters = minVisits > 0 || minSpent > 0;

  const handleClearFilters = () => {
    onMinVisitsChange(0);
    onMinSpentChange(0);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-xl border border-gray-700">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, phone, or email..."
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Min Visits Filter */}
      <select
        value={minVisits}
        onChange={(e) => onMinVisitsChange(Number(e.target.value))}
        className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
      >
        {VISITS_OPTIONS.map(opt => (
          <option key={opt} value={opt}>
            {opt === 0 ? 'All visits' : `${opt}+ visits`}
          </option>
        ))}
      </select>

      {/* Min Spent Filter */}
      <select
        value={minSpent}
        onChange={(e) => onMinSpentChange(Number(e.target.value))}
        className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
      >
        {SPENT_OPTIONS.map(opt => (
          <option key={opt} value={opt}>
            {opt === 0 ? 'All spending' : `${formatCurrency(opt)}+ spent`}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
        className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
      >
        <option value="name">Sort by Name</option>
        <option value="recent">Sort by Recent</option>
        <option value="spent">Sort by Spent</option>
      </select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
};

export default CustomerFilters;