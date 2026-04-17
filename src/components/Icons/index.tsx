import React from 'react';

interface IconProps {
  color?: string;
}

export const CustomIcons = {
  Management: () => (
    <div className="w-12 h-12 bg-gray-500 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="3" y="3" width="18" height="18" rx="2" fill="#4B5563"/>
        <path d="M7 8h10M7 12h10M7 16h10" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  ),
  

  Help: () => (
    <div className="w-12 h-12 bg-gray-500 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <circle cx="12" cy="12" r="9" fill="#4B5563"/>
        <path d="M12 16v-1m0-3v-3m0 0h.01M12 7h0" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  ),

  DropPickup: ({ color = "#6366F1" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" 
        stroke="currentColor" 
        strokeWidth="2"
      />
    </svg>
  ),

  OpenDrawer: ({ color = "#059669" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M3 10h18M3 14h18M5 18h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
        stroke="currentColor" 
        strokeWidth="2"
      />
    </svg>
  ),

  TimeClock: ({ color = "#D97706" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),

  Exit: ({ color = "#DC2626" }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
      <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
        stroke="currentColor" 
        strokeWidth="2"
      />
    </svg>
  ),

  TicketSearch: () => (
    <div className="w-12 h-12 bg-gray-600 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  ),

  Assembly: () => (
    <div className="w-12 h-12 bg-gray-600 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M4 7h16M4 12h16M4 17h16" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  ),

  Racking: () => (
    <div className="w-12 h-12 bg-gray-600 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <rect x="4" y="4" width="16" height="16" stroke="white" strokeWidth="2"/>
        <path d="M8 8h8M8 12h8M8 16h8" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  ),

  PickupOrder: () => (
    <div className="w-12 h-12 bg-gray-600 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M9 17l-5-5m0 0l5-5m-5 5h12" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  ),

  Deliveries: () => (
    <div className="w-12 h-12 bg-gray-600 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M5 8h14M5 8a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2M12 12h.01" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  ),

  CodPayment: () => (
    <div className="w-12 h-12 bg-gray-600 rounded-lg p-2">
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" stroke="white" strokeWidth="2"/>
      </svg>
    </div>
  )
};