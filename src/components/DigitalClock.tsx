import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DigitalClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Clock className="h-5 w-5" />
      <div className="font-mono text-sm">
        {time}
      </div>
    </>
  );
}
