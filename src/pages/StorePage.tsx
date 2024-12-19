import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserTie, 
  faBullhorn, 
  faCalendar, 
  faMessage, 
  faMagnifyingGlass,
  faBoxesStacked,
  faHandHoldingHand,
  faRotateLeft,
  faBoxOpen,
  faTruckFast,
  faCreditCard,
  faTicket,
  faWarehouse,
  faHandshake,
  faMoneyBillTransfer,
  faMoneyBillTrendUp,
  faClockRotateLeft,
  faChartLine,
  faCartShopping,
  faCogs,
  faArrowTrendUp,
  faUsers,
  faCircleNotch
} from '@fortawesome/free-solid-svg-icons';

export default function StorePage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickInfo = [
    { label: 'Hold & Quick drop', count: 3, icon: faHandHoldingHand, color: '#4CAF50' },
    { label: 'No charge & Do over', count: 1, icon: faRotateLeft, color: '#2196F3' },
    { label: 'Credit', count: 2, icon: faCreditCard, color: '#9C27B0' },
    { label: 'Adjusted payment', count: 0, icon: faMoneyBillTrendUp, color: '#FF9800' },
    { label: 'Overdue', count: 5, icon: faClockRotateLeft, color: '#F44336' },
    { label: 'Ready by today', count: 8, icon: faBoxOpen, color: '#00BCD4' },
    { label: 'Delivery', count: 4, icon: faTruckFast, color: '#3F51B5' }
  ];

  const quickAccess = [
    { icon: faTicket, label: 'Ticket Search', color: '#E91E63' },
    { icon: faBoxesStacked, label: 'Assembly', color: '#673AB7' },
    { icon: faWarehouse, label: 'Racking', color: '#FF5722' },
    { icon: faHandshake, label: 'Pickup Order', color: '#795548' },
    { icon: faTruckFast, label: 'Deliveries', color: '#607D8B' },
    { icon: faMoneyBillTransfer, label: 'COD Payment', color: '#8BC34A' }
  ];

  const stats = [
    { 
      label: 'Daily Revenue', 
      value: '$2,845', 
      trend: '+12.5%', 
      icon: faArrowTrendUp, 
      color: '#4CAF50',
      details: 'Based on today\'s transactions'
    },
    { 
      label: 'Active Orders', 
      value: '47', 
      trend: '+8.1%', 
      icon: faBoxOpen, 
      color: '#2196F3',
      details: 'Orders in progress'
    },
    { 
      label: 'Customers Today', 
      value: '24', 
      trend: '+15.3%', 
      icon: faUsers, 
      color: '#FF5722',
      details: 'Unique customers served'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      {/* Top Bar with Stats */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Store Dashboard</h1>
            <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="bg-gray-800 px-8 py-4 rounded-2xl border border-gray-700 shadow-lg backdrop-blur-sm bg-opacity-50">
            <span className="font-mono text-indigo-400 text-3xl digital-clock tracking-wider">
              {format(currentTime, 'hh:mm:ss a')}
            </span>
            <div className="text-gray-500 text-sm text-center mt-1">
              {format(currentTime, 'MMMM dd, yyyy')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg hover:border-indigo-500 transition-all duration-300 group backdrop-blur-sm bg-opacity-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                  <p className="text-gray-500 text-xs mt-2">{stat.details}</p>
                </div>
                <div 
                  className="bg-opacity-20 rounded-xl p-3 group-hover:scale-110 transition-transform" 
                  style={{ backgroundColor: stat.color }}
                >
                  <FontAwesomeIcon icon={stat.icon} className="text-2xl" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400 mr-2 font-medium">{stat.trend}</span>
                <span className="text-gray-400">vs last week</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: faUserTie, label: 'Management', primary: true },
          { icon: faBullhorn, label: 'Marketing' },
          { icon: faCalendar, label: 'Schedule' },
          { icon: faMessage, label: 'Message' }
        ].map((action, index) => (
          <button 
            key={index}
            className={`${
              action.primary ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-700'
            } rounded-2xl p-5 flex items-center transition-all duration-300 shadow-lg group backdrop-blur-sm bg-opacity-50 border border-transparent hover:border-indigo-500`}
          >
            <div className="bg-black bg-opacity-20 p-3 rounded-xl mr-4">
              <FontAwesomeIcon 
                icon={action.icon} 
                className="text-2xl text-white group-hover:scale-110 transition-transform" 
              />
            </div>
            <span className="text-white font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Information */}
      <div className="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700 shadow-lg backdrop-blur-sm bg-opacity-50">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
          <span className="bg-indigo-600 p-3 rounded-xl mr-4">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white" />
          </span>
          Quick Information
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {quickInfo.map((item, index) => (
            <button
              key={index}
              className="bg-gray-900 hover:bg-gray-800 p-5 rounded-xl text-left transition-all duration-300 group border border-gray-700 hover:border-indigo-500 backdrop-blur-sm bg-opacity-50"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform" 
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className="text-xl" 
                      style={{ color: item.color }} 
                    />
                  </div>
                  <div>
                    <span className="text-white font-medium block">{item.label}</span>
                    <span className="text-gray-500 text-sm">View details</span>
                  </div>
                </div>
                {item.count > 0 && (
                  <span 
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium group-hover:bg-indigo-500 transition-colors"
                  >
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg backdrop-blur-sm bg-opacity-50">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
          <span className="bg-indigo-600 p-3 rounded-xl mr-4">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-white" />
          </span>
          Quick Access
        </h2>
        <div className="grid grid-cols-6 gap-6">
          {quickAccess.map((item, index) => (
            <button
              key={index}
              className="bg-gray-900 hover:bg-gray-800 p-6 rounded-xl flex flex-col items-center justify-center space-y-4 transition-all duration-300 group border border-gray-700 hover:border-indigo-500 backdrop-blur-sm bg-opacity-50"
            >
              <div 
                className="p-5 rounded-xl group-hover:scale-110 transition-transform" 
                style={{ backgroundColor: `${item.color}20` }}
              >
                <FontAwesomeIcon 
                  icon={item.icon} 
                  className="text-2xl" 
                  style={{ color: item.color }} 
                />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors font-medium">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}