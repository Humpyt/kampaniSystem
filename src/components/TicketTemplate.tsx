import React from 'react';
import { format } from 'date-fns';
import Barcode from 'react-barcode';

interface TicketTemplateProps {
  ticketNumber: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    description?: string;
  }>;
  readyDate: Date;
  storeInfo: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function TicketTemplate({
  ticketNumber,
  customerName,
  customerAddress,
  customerPhone,
  items,
  readyDate,
  storeInfo,
}: TicketTemplateProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.02; // 2% tax
  const total = subtotal + tax;

  const storeHours = [
    { day: 'Mon - Fri', hours: '07:00 AM - 07:00 PM' },
    { day: 'Sat', hours: '08:00 AM - 05:00 PM' },
    { day: 'Sun', hours: '08:00 AM - 05:00 PM' },
  ];

  const TicketCopy = ({ type }: { type: 'Store' | 'Customer' }) => (
    <div className="w-[300px] p-4 border border-black text-sm">
      <div className="text-lg font-bold border-b border-black pb-2 flex justify-between">
        <div>{ticketNumber}-{type} Copy</div>
      </div>
      
      <div className="mt-2">
        <Barcode value={ticketNumber} height={40} width={1.5} fontSize={12} />
      </div>

      <div className="mt-2 font-bold">
        {storeInfo.name}
        <div className="text-sm font-normal">
          {storeInfo.address}
          <br />
          {storeInfo.phone}
        </div>
      </div>

      <div className="mt-4 border-t border-dashed pt-2">
        <div className="flex justify-between">
          <div className="font-bold">{customerName}</div>
          <div>{format(new Date(), 'MMM dd, yyyy hh:mm a')}</div>
        </div>
        <div>{customerAddress}</div>
        <div>Acct:{customerPhone}</div>
      </div>

      <div className="mt-4">
        {items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <div>
              {item.quantity} {item.name} ({item.quantity})
              {item.description && (
                <div className="text-xs italic">{item.description}</div>
              )}
            </div>
            <div>${item.price.toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-dashed pt-2">
        <div className="font-bold">{items.length} PIECES</div>
        <div className="flex justify-between">
          <span>SubTotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>2% Cre:</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        {type === 'Customer' && (
          <>
            <div className="flex justify-between">
              <span>Paid Amount:</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between">
              <span>Balance:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        <div>Ready: {format(readyDate, 'EEE MM/dd/yyyy hh:mm a')}</div>
      </div>

      <div className="mt-2">
        <Barcode value={ticketNumber} height={40} width={1.5} fontSize={12} />
      </div>

      <div className="mt-2 border-t border-black pt-2">
        <div className="font-bold">CHARGE/DELIVERY</div>
        {storeHours.map((schedule, index) => (
          <div key={index} className="text-xs">
            {schedule.day} : {schedule.hours}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 p-4 bg-white">
      <TicketCopy type="Store" />
      <TicketCopy type="Customer" />
    </div>
  );
}
