import React from 'react';
import { BarChart2, TrendingUp, Users, DollarSign } from 'lucide-react';

const mockData = {
  campaignPerformance: [
    { name: 'Spring Sale', sent: 1200, opened: 850, clicked: 320, converted: 95 },
    { name: 'Summer Promo', sent: 800, opened: 600, clicked: 250, converted: 70 },
    { name: 'Fall Special', sent: 1500, opened: 1100, clicked: 450, converted: 120 }
  ],
  customerGrowth: [
    { month: 'Jan', count: 2100 },
    { month: 'Feb', count: 2250 },
    { month: 'Mar', count: 2400 },
    { month: 'Apr', count: 2547 }
  ],
  topPromotions: [
    { name: 'Shoe Repair 20% Off', uses: 145, revenue: 2900 },
    { name: 'Free Cleaning', uses: 98, revenue: 1960 },
    { name: 'Bundle Discount', uses: 76, revenue: 1520 }
  ]
};

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span>Conversion Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">24.8%</div>
          <div className="text-sm text-gray-400">+2.3% from last month</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Users className="h-5 w-5" />
            <span>Customer Growth</span>
          </div>
          <div className="text-2xl font-bold text-white">+447</div>
          <div className="text-sm text-gray-400">Last 3 months</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <DollarSign className="h-5 w-5" />
            <span>Campaign Revenue</span>
          </div>
          <div className="text-2xl font-bold text-white">$6,380</div>
          <div className="text-sm text-gray-400">From promotions</div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Campaign</th>
                <th className="pb-3">Sent</th>
                <th className="pb-3">Opened</th>
                <th className="pb-3">Clicked</th>
                <th className="pb-3">Converted</th>
                <th className="pb-3">Rate</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {mockData.campaignPerformance.map((campaign, index) => (
                <tr key={index} className="border-b border-gray-700">
                  <td className="py-3">{campaign.name}</td>
                  <td className="py-3">{campaign.sent}</td>
                  <td className="py-3">{campaign.opened}</td>
                  <td className="py-3">{campaign.clicked}</td>
                  <td className="py-3">{campaign.converted}</td>
                  <td className="py-3">
                    {((campaign.converted / campaign.sent) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Growth Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Customer Growth</h3>
        <div className="h-64">
          <div className="flex h-full items-end gap-4">
            {mockData.customerGrowth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-emerald-500 rounded-t"
                  style={{ 
                    height: `${(data.count / 3000) * 100}%`,
                    transition: 'height 0.3s ease-in-out'
                  }}
                />
                <div className="text-gray-400 mt-2">{data.month}</div>
                <div className="text-white text-sm">{data.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Promotions */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Promotions</h3>
        <div className="space-y-4">
          {mockData.topPromotions.map((promo, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <div className="text-white font-medium">{promo.name}</div>
                <div className="text-sm text-gray-400">{promo.uses} uses</div>
              </div>
              <div className="text-emerald-500 font-semibold">
                ${promo.revenue}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
