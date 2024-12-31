import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faFileInvoiceDollar, 
  faUserCheck, 
  faChartPie, 
  faDownload,
  faArrowUp,
  faArrowDown
} from '@fortawesome/free-solid-svg-icons';
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
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.4
    },
    {
      label: 'Target',
      data: [70, 70, 75, 75, 75, 80, 80],
      fill: false,
      borderColor: 'rgba(255, 99, 132, 0.8)',
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
      'rgba(54, 162, 235, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 206, 86, 0.8)',
      'rgba(153, 102, 255, 0.8)'
    ],
  }]
};

const customerData = {
  labels: ['New', 'Returning', 'VIP', 'Inactive'],
  datasets: [{
    data: [30, 45, 15, 10],
    backgroundColor: [
      'rgba(75, 192, 192, 0.8)',
      'rgba(54, 162, 235, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 99, 132, 0.8)'
    ],
  }]
};

const inventoryData = {
  labels: ['Leather', 'Soles', 'Laces', 'Polish', 'Tools', 'Other'],
  datasets: [{
    label: 'Stock Level',
    data: [85, 60, 90, 70, 40, 55],
    backgroundColor: 'rgba(153, 102, 255, 0.5)',
    borderColor: 'rgb(153, 102, 255)',
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
      icon: faChartLine, 
      color: '#4CAF50',
      chart: <Line data={salesData} options={options} height={200} />,
      metrics: [
        { label: 'Total Sales', value: '$24,500', change: '+12%', up: true },
        { label: 'Average Order', value: '$85', change: '+5%', up: true }
      ]
    },
    { 
      label: 'Financial Report', 
      icon: faFileInvoiceDollar, 
      color: '#2196F3',
      chart: <Pie data={financialData} options={doughnutOptions} height={200} />,
      metrics: [
        { label: 'Revenue', value: '$12,000', change: '+8%', up: true },
        { label: 'Expenses', value: '$4,500', change: '-3%', up: false }
      ]
    },
    { 
      label: 'Customer Report', 
      icon: faUserCheck, 
      color: '#FF5722',
      chart: <Doughnut data={customerData} options={doughnutOptions} height={200} />,
      metrics: [
        { label: 'Total Customers', value: '450', change: '+15%', up: true },
        { label: 'Retention Rate', value: '85%', change: '+2%', up: true }
      ]
    },
    { 
      label: 'Inventory Report', 
      icon: faChartPie, 
      color: '#9C27B0',
      chart: <Bar data={inventoryData} options={options} height={200} />,
      metrics: [
        { label: 'Items in Stock', value: '1,250', change: '-5%', up: false },
        { label: 'Low Stock Items', value: '8', change: '+2', up: false }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Reports Dashboard</h1>
            <p className="text-gray-400">Insights and analytics at a glance</p>
          </div>
          <div className="bg-gray-800 px-8 py-4 rounded-2xl border border-gray-700 shadow-lg backdrop-blur-sm bg-opacity-50">
            <span className="font-mono text-indigo-400 text-3xl digital-clock tracking-wider">
              {currentTime.toLocaleTimeString()}
            </span>
            <div className="text-gray-500 text-sm text-center mt-1">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {reports.map((report, index) => (
            <div 
              key={index} 
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg hover:border-indigo-500 transition-all duration-300 group backdrop-blur-sm bg-opacity-50"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{report.label}</p>
                  <div className="flex gap-4 mt-2">
                    {report.metrics.map((metric, idx) => (
                      <div key={idx} className="bg-gray-900 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">{metric.label}</p>
                        <p className="text-2xl font-bold text-white">{metric.value}</p>
                        <div className={`flex items-center text-sm ${metric.up ? 'text-green-500' : 'text-red-500'}`}>
                          <FontAwesomeIcon icon={metric.up ? faArrowUp : faArrowDown} className="mr-1" />
                          {metric.change}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div 
                  className="bg-opacity-20 rounded-xl p-3 group-hover:scale-110 transition-transform flex items-center justify-center" 
                  style={{ backgroundColor: report.color }}
                >
                  <FontAwesomeIcon icon={report.icon} className="text-2xl text-white" />
                </div>
              </div>
              <div className="h-[200px] mt-4">
                {report.chart}
              </div>
              <div className="mt-4 flex items-center justify-end">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-all">
                  Export <FontAwesomeIcon icon={faDownload} className="ml-2" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}