import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
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
  faCircleNotch,
  faDollarSign,
  faBell,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import QuickInformation from '../components/QuickInformation';

export default function StorePage() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickAccess = [
    { icon: faTicket, label: 'Ticket Search', color: '#E91E63', path: '/ticket-search' },
    { icon: faBoxesStacked, label: 'Assembly', color: '#673AB7', path: '/assembly' },
    { icon: faWarehouse, label: 'Racking', color: '#FF5722', path: '/racking' },
    { icon: faHandshake, label: 'Pickup Order', color: '#795548', path: '/pickup-order' },
    { icon: faTruckFast, label: 'Deliveries', color: '#607D8B', path: '/deliveries' },
    { icon: faMoneyBillTransfer, label: 'COD Payment', color: '#8BC34A', path: '/cod-payment' }
  ];

  const stats = [
    { 
      label: 'Daily Revenue', 
      value: '$2,845', 
      trend: '+12.5%', 
      icon: faDollarSign, 
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

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8 overflow-y-auto">
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
                  <FontAwesomeIcon icon={stat.icon} className="text-2xl text-white" />
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
          { icon: faTicket, label: 'Tickets', path: '/tickets', primary: true },
          { icon: faBullhorn, label: 'Marketing', path: '/marketing' },
          { icon: faBell, label: 'Notification', path: '/notifications' },
          { icon: faEnvelope, label: 'Messages', path: '/messages' }
        ].map((action, index) => (
          <button 
            key={index}
            onClick={() => handleQuickAction(action.path)}
            className={`${
              action.primary ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-800'
            } rounded-2xl p-5 flex items-center shadow-lg group backdrop-blur-sm bg-opacity-50 border border-transparent hover:border-indigo-500`}
          >
            <div className="bg-black bg-opacity-20 p-3 rounded-xl mr-4">
              <FontAwesomeIcon 
                icon={action.icon} 
                className="text-2xl text-white" 
              />
            </div>
            <span className="text-white font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Access */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-6 gap-4">
          {quickAccess.map((item, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(item.path)}
              className="bg-gray-900 hover:bg-gray-800 p-4 rounded-xl flex flex-col items-center justify-center space-y-2 transition-all duration-300 group border border-gray-700 hover:border-indigo-500 backdrop-blur-sm bg-opacity-50"
            >
              <div 
                className="p-3 rounded-xl group-hover:scale-110 transition-transform" 
                style={{ backgroundColor: `${item.color}20` }}
              >
                <FontAwesomeIcon 
                  icon={item.icon} 
                  className="text-2xl" 
                  style={{ color: item.color }} 
                />
              </div>
              <span className="text-white text-sm text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Information */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Information</h2>
        <QuickInformation />
      </div>
    </div>
  );
}