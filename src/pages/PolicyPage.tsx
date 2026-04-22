import React, { useEffect, useRef } from 'react';

export default function PolicyPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = '/api/print/policy';
    }
  }, []);

  return (
    <div className="p-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Store Policy</h1>
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
