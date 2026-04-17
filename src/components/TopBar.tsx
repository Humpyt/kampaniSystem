import React, { useState } from 'react';
import { CustomIcons } from './Icons';
import { useStaffMessages } from '../contexts/StaffMessageContext';
import StaffMessagePanel from './StaffMessagePanel';

export default function TopBar() {
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  const { unreadCount } = useStaffMessages();

  return (
    <>
      <div className="bg-gray-700 p-4 flex justify-between items-center">
        <div className="flex space-x-4">
          <button className="flex items-center space-x-2 bg-gray-600 p-2 rounded hover:bg-gray-500">
            <CustomIcons.Management />
            <span>Management</span>
          </button>
          <button className="flex items-center space-x-2 bg-gray-600 p-2 rounded hover:bg-gray-500">
            <CustomIcons.Help />
            <span>Help</span>
          </button>
        </div>
        <div className="flex space-x-4">
          <button className="bg-gray-600 p-2 rounded hover:bg-gray-500">Schedule</button>
          <button
            onClick={() => setMessagePanelOpen(true)}
            className="bg-gray-600 p-2 rounded hover:bg-gray-500 relative"
          >
            Message
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <StaffMessagePanel isOpen={messagePanelOpen} onClose={() => setMessagePanelOpen(false)} />
    </>
  );
}