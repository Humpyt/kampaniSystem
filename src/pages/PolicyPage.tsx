import React, { useEffect, useRef } from 'react';

export default function PolicyPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = '/api/printer/print/policy';
    }
  }, []);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Kampanis Shoes & Bags Clinic</h1>
        <p className="text-sm text-gray-400">Company Policies</p>
      </div>
      <div className="flex-1 bg-white rounded-lg overflow-hidden" style={{ minHeight: 0 }}>
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Store Policy"
        />
      </div>
    </div>
  );
}
