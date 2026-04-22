import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomIcons } from './Icons';

export default function QuickAccess() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-6 gap-4">
      <button 
        onClick={() => navigate('/ticket-search')}
        className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-gray-600"
      >
        <CustomIcons.TicketSearch />
        <span>Ticket Search</span>
      </button>
      <button 
        onClick={() => navigate('/assembly')}
        className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-gray-600"
      >
        <CustomIcons.Assembly />
        <span>Assembly</span>
      </button>
      <button 
        onClick={() => navigate('/racking')}
        className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-gray-600"
      >
        <CustomIcons.Racking />
        <span>Racking</span>
      </button>
      <button 
        onClick={() => navigate('/pickup-order')}
        className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-gray-600"
      >
        <CustomIcons.DropPickup />
        <span>Pickup Order</span>
      </button>
      <button 
        onClick={() => navigate('/deliveries')}
        className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-gray-600"
      >
        <CustomIcons.OpenDrawer />
        <span>Deliveries</span>
      </button>
      <button 
        onClick={() => navigate('/policy')}
        className="bg-gray-700 p-4 rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-gray-600"
      >
        <CustomIcons.Policy />
        <span>Policy</span>
      </button>
    </div>
  );
}