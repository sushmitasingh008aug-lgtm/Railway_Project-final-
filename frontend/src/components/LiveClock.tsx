import React, { useState, useEffect } from 'react';

export const LiveClock: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const update = () => {
      try {
        setTimeStr(formatter.format(new Date()));
      } catch {
        // Fallback if timezone not supported
        const now = new Date();
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        setTimeStr(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center gap-2 bg-white border border-[#E6E6E6] px-2.5 sm:px-3 py-1.5 rounded-lg shadow-sm select-none"
      aria-label="Current Indian Standard Time"
      title="Indian Standard Time (IST) · 24-Hour Operational Live Clock"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12B76A] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#12B76A]"></span>
      </span>
      <span className="font-mono tabular-nums text-xs sm:text-[12.5px] font-bold text-[#1F2937] tracking-wider">
        {timeStr || '00:00:00'}
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#667085] bg-[#F7F7F5] px-1 py-0.5 rounded border border-[#E6E6E6]">
        IST
      </span>
    </div>
  );
};
