import React from 'react';
import Barcode from 'react-barcode';

interface TagTemplateProps {
  tagNumber: string;
  services: string[];
  orderNumber?: string;
}

export default function TagTemplate({
  tagNumber,
  services,
  orderNumber
}: TagTemplateProps) {
  const MainTag = () => (
    <div className="w-[150px] h-[120px] p-2 border border-black bg-white">
      <div className="text-sm font-bold mb-1">{tagNumber}</div>
      <div className="mb-2">
        <Barcode 
          value={tagNumber} 
          height={30} 
          width={1} 
          fontSize={8} 
          margin={0}
          displayValue={false}
        />
      </div>
      <div className="flex justify-between mb-1">
        <span className="font-bold">R</span>
        <span className="font-bold">C</span>
      </div>
      <div className="text-xs">
        {services.map((service, index) => (
          <div key={index}>{service}</div>
        ))}
      </div>
    </div>
  );

  const SecondaryTag = () => (
    <div className="w-[150px] h-[120px] p-2 border border-black bg-white">
      <div className="text-sm font-bold mb-1">{tagNumber}</div>
      <div className="mb-2">
        <Barcode 
          value={tagNumber} 
          height={30} 
          width={1} 
          fontSize={8} 
          margin={0}
          displayValue={false}
        />
      </div>
      <div className="text-xs">
        {services.map((service, index) => (
          <div key={index}>{service}</div>
        ))}
      </div>
    </div>
  );

  const BarcodeTag = () => (
    <div className="w-[150px] h-[120px] p-2 border border-black bg-white">
      <div className="text-sm font-bold mb-1">{tagNumber}</div>
      <div className="flex-1 flex items-center justify-center">
        <Barcode 
          value={tagNumber} 
          height={60} 
          width={1.5} 
          fontSize={10} 
          margin={0}
        />
      </div>
      {orderNumber && (
        <div className="text-xs mt-1">#{orderNumber}</div>
      )}
      <div className="flex justify-between mt-1">
        <span className="font-bold">R</span>
        <span className="font-bold">C</span>
        <span className="font-bold">A</span>
      </div>
    </div>
  );

  return (
    <div className="flex gap-2 p-4 bg-white">
      <div className="relative">
        <div className="absolute -top-6 left-2 bg-yellow-200 px-2 font-bold">1</div>
        <MainTag />
      </div>
      <div className="relative">
        <div className="absolute -top-6 left-2 bg-yellow-200 px-2 font-bold">2</div>
        <SecondaryTag />
      </div>
      <div className="relative">
        <div className="absolute -top-6 left-2 bg-yellow-200 px-2 font-bold">3</div>
        <BarcodeTag />
      </div>
    </div>
  );
}
