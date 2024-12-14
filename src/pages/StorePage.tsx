import React from 'react';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserTie,
  faBullhorn,
  faCircleQuestion,
  faCalendarCheck,
  faMessage,
  faHandHoldingHand,
  faRotateLeft,
  faCreditCard,
  faMoneyBillTrendUp,
  faClockRotateLeft,
  faTruckFast,
  faTicket,
  faChartLine,
  faCartShopping,
  faCogs,
  faMagnifyingGlass,
  faBoxesStacked,
  faWarehouse,
  faBoxOpen,
  faMoneyBillTransfer,
  faHandshake,
  faArrowTrendUp,
  faUsers
} from '@fortawesome/free-solid-svg-icons';

export default function StorePage() {
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
    { label: 'Daily Revenue', value: '$2,845', trend: '+12.5%', icon: faArrowTrendUp, color: '#4CAF50' },
    { label: 'Active Orders', value: '47', trend: '+8.1%', icon: faBoxOpen, color: '#2196F3' },
    { label: 'Customers Today', value: '24', trend: '+15.3%', icon: faUsers, color: '#FF5722' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Top Bar with Stats */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Store Dashboard</h1>
          <div className="bg-gray-800 px-6 py-3 rounded-xl border border-gray-700 shadow-lg">
            <span className="font-mono text-indigo-400 text-2xl digital-clock">
              {format(new Date(), 'hh:mm a MM/dd/yy')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg hover:border-indigo-500 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
                </div>
                <div className="bg-opacity-20 rounded-lg p-2" style={{ backgroundColor: stat.color }}>
                  <FontAwesomeIcon icon={stat.icon} className="text-2xl" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-400 mr-2">{stat.trend}</span>
                <span className="text-gray-400">vs last week</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl p-4 flex items-center transition-all duration-300 shadow-lg group">
          <FontAwesomeIcon icon={faUserTie} className="text-2xl text-white mr-3 group-hover:scale-110 transition-transform" />
          <span className="text-white">Management</span>
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex items-center transition-all duration-300 shadow-lg group border border-gray-700 hover:border-indigo-500">
          <FontAwesomeIcon icon={faBullhorn} className="text-2xl text-[#FF5722] mr-3 group-hover:scale-110 transition-transform" />
          <span className="text-white">Marketing</span>
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex items-center transition-all duration-300 shadow-lg group border border-gray-700 hover:border-indigo-500">
          <FontAwesomeIcon icon={faCalendarCheck} className="text-2xl text-[#4CAF50] mr-3 group-hover:scale-110 transition-transform" />
          <span className="text-white">Schedule</span>
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 flex items-center transition-all duration-300 shadow-lg group border border-gray-700 hover:border-indigo-500">
          <FontAwesomeIcon icon={faMessage} className="text-2xl text-[#2196F3] mr-3 group-hover:scale-110 transition-transform" />
          <span className="text-white">Message</span>
        </button>
      </div>

      {/* Quick Information */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
          <span className="bg-indigo-600 p-2 rounded-lg mr-3">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-white" />
          </span>
          Quick Information
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {quickInfo.map((item, index) => (
            <button
              key={index}
              className="bg-gray-900 hover:bg-gray-800 p-4 rounded-xl text-left transition-all duration-300 group border border-gray-700 hover:border-indigo-500"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg mr-3" style={{ backgroundColor: `${item.color}20` }}>
                    <FontAwesomeIcon icon={item.icon} className="text-xl group-hover:scale-110 transition-transform" style={{ color: item.color }} />
                  </div>
                  <span className="text-white">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm group-hover:bg-indigo-500">
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center">
          <span className="bg-indigo-600 p-2 rounded-lg mr-3">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-white" />
          </span>
          Quick Access
        </h2>
        <div className="grid grid-cols-6 gap-6">
          {quickAccess.map((item, index) => (
            <button
              key={index}
              className="bg-gray-900 hover:bg-gray-800 p-6 rounded-xl flex flex-col items-center justify-center space-y-3 transition-all duration-300 group border border-gray-700 hover:border-indigo-500"
            >
              <div className="p-4 rounded-xl group-hover:scale-110 transition-transform" style={{ backgroundColor: `${item.color}20` }}>
                <FontAwesomeIcon icon={item.icon} className="text-2xl" style={{ color: item.color }} />
              </div>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}