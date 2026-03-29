import React from 'react';
import { Users, Crown, TrendingUp, UserPlus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Customer } from '../../types';

interface CustomerSummaryCardsProps {
  customers: Customer[];
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBgColor
}) => (
  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:scale-[1.02]">
    <div className="flex items-center gap-3">
      <div className={`${iconBgColor} p-3 rounded-xl`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">{title}</p>
        <p className="text-xl font-bold text-white truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const CustomerSummaryCards: React.FC<CustomerSummaryCardsProps> = ({ customers }) => {
  const totalCustomers = customers.length;

  const activeCustomers = customers.filter(c => c.status === 'active').length;

  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const newThisMonth = customers.filter(c =>
    c.lastVisit && c.lastVisit.startsWith(thisMonth)
  ).length;

  const topSpender = customers.reduce((max, c) =>
    c.totalSpent > (max?.totalSpent || 0) ? c : max
  , null as Customer | null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <SummaryCard
        title="Total Customers"
        value={totalCustomers}
        icon={Users}
        iconColor="text-indigo-400"
        iconBgColor="bg-indigo-500/10"
      />
      <SummaryCard
        title="Active Customers"
        value={activeCustomers}
        icon={TrendingUp}
        iconColor="text-emerald-400"
        iconBgColor="bg-emerald-500/10"
      />
      <SummaryCard
        title="New This Month"
        value={newThisMonth}
        icon={UserPlus}
        iconColor="text-amber-400"
        iconBgColor="bg-amber-500/10"
      />
      <SummaryCard
        title="Top Spender"
        value={topSpender ? formatCurrency(topSpender.totalSpent) : '-'}
        subtitle={topSpender?.name}
        icon={Crown}
        iconColor="text-violet-400"
        iconBgColor="bg-violet-500/10"
      />
    </div>
  );
};

export default CustomerSummaryCards;