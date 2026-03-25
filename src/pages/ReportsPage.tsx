import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  PieChart,
  Download,
  ArrowUp,
  ArrowDown,
  Clock
} from 'lucide-react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  LineElement, 
  PointElement, 
  LinearScale, 
  Title, 
  Tooltip, 
  Legend, 
  CategoryScale,
  BarElement,
  ArcElement
} from 'chart.js';

ChartJS.register(
  LineElement, 
  PointElement, 
  LinearScale, 
  Title, 
  Tooltip, 
  Legend, 
  CategoryScale,
  BarElement,
  ArcElement
);

const salesData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Sales',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: true,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgb(99, 102, 241)',
      tension: 0.4
    },
    {
      label: 'Target',
      data: [70, 70, 75, 75, 75, 80, 80],
      fill: false,
      borderColor: 'rgba(168, 85, 247, 0.8)',
      borderDash: [5, 5],
      tension: 0.4
    }
  ],
};

const financialData = {
  labels: ['Revenue', 'Expenses', 'Profit', 'Tax', 'Net Profit'],
  datasets: [{
    data: [12000, 4500, 7500, 1500, 6000],
    backgroundColor: [
      'rgba(99, 102, 241, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(251, 191, 36, 0.8)',
      'rgba(168, 85, 247, 0.8)'
    ],
  }]
};

const customerData = {
  labels: ['New', 'Returning', 'VIP', 'Inactive'],
  datasets: [{
    data: [30, 45, 15, 10],
    backgroundColor: [
      'rgba(34, 197, 94, 0.8)',
      'rgba(99, 102, 241, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(107, 114, 128, 0.8)'
    ],
  }]
};

const inventoryData = {
  labels: ['Leather', 'Soles', 'Laces', 'Polish', 'Tools', 'Other'],
  datasets: [{
    label: 'Stock Level',
    data: [85, 60, 90, 70, 40, 55],
    backgroundColor: 'rgba(99, 102, 241, 0.5)',
    borderColor: 'rgb(99, 102, 241)',
  }]
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'white'
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return `${context.dataset.label || ''}: ${context.raw}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'white'
      }
    },
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'white'
      }
    }
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'white'
      }
    }
  }
};

export default function ReportsPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const reports = [
    {
      label: 'Sales Report',
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600',
      chart: <Line data={salesData} options={options} height={200} />,
      metrics: [
        { label: 'Total Sales', value: 'UGX 12,500,000', change: '+12%', up: true },
        { label: 'Average Order', value: 'UGX 45,000', change: '+5%', up: true }
      ]
    },
    {
      label: 'Financial Report',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      chart: <Pie data={financialData} options={doughnutOptions} height={200} />,
      metrics: [
        { label: 'Revenue', value: 'UGX 6,000,000', change: '+8%', up: true },
        { label: 'Expenses', value: 'UGX 2,250,000', change: '-3%', up: false }
      ]
    },
    {
      label: 'Customer Report',
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      chart: <Doughnut data={customerData} options={doughnutOptions} height={200} />,
      metrics: [
        { label: 'Total Customers', value: '450', change: '+15%', up: true },
        { label: 'Retention Rate', value: '85%', change: '+2%', up: true }
      ]
    },
    {
      label: 'Inventory Report',
      icon: PieChart,
      color: 'from-orange-500 to-orange-600',
      chart: <Bar data={inventoryData} options={options} height={200} />,
      metrics: [
        { label: 'Items in Stock', value: '1,250', change: '-5%', up: false },
        { label: 'Low Stock Items', value: '8', change: '+2', up: false }
      ]
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reports Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Insights and analytics at a glance</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 card-bevel px-6 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" />
              <span className="font-mono text-indigo-400 text-lg">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-gray-500 text-xs mt-1">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report, index) => {
            const IconComponent = report.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 card-bevel rounded-lg p-6 hover:from-gray-750 hover:to-gray-850 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-3">{report.label}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {report.metrics.map((metric, idx) => (
                        <div key={idx} className="bg-gray-900/50 rounded-lg p-3">
                          <p className="text-gray-400 text-xs mb-1">{metric.label}</p>
                          <p className="text-xl font-bold text-white">{metric.value}</p>
                          <div className={`flex items-center text-sm mt-1 ${metric.up ? 'text-green-500' : 'text-red-500'}`}>
                            {metric.up ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                            {metric.change}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`bg-gradient-to-br ${report.color} rounded-lg p-3 ml-4`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="h-[200px] mt-4">
                  {report.chart}
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}