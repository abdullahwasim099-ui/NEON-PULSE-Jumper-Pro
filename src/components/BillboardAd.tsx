import { useEffect, useRef } from 'react';

interface BillboardAdProps {
  variant?: 'menu' | 'game';
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function BillboardAd({ variant = 'menu' }: BillboardAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;

    const tryPush = () => {
      try {
        if (typeof window.adsbygoogle !== 'undefined') {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } else {
          setTimeout(tryPush, 500);
        }
      } catch {
        // AdSense not loaded yet or blocked
      }
    };
    tryPush();
  }, []);

  const borderColor = variant === 'menu' ? 'rgba(255,0,127,0.4)' : 'rgba(255,51,0,0.35)';
  const shadowColor = variant === 'menu' ? 'rgba(255,0,127,0.2)' : 'rgba(255,51,0,0.15)';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center pb-3 pointer-events-none">
      <div
        className="pointer-events-auto rounded-lg overflow-hidden border bg-[#0a031499]/95 backdrop-blur-sm transition-opacity"
        style={{
          borderColor,
          boxShadow: `0 0 12px ${shadowColor}, inset 0 0 8px ${shadowColor}`,
          width: 'min(320px, 90vw)',
        }}
      >
        <div className="flex items-center justify-center px-1 py-0.5 text-[7px] tracking-[2px] text-[#8a7fa6] uppercase border-b border-white/5">
          Advertisement
        </div>
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          style={{ display: 'block', width: '100%', height: '50px' }}
          data-ad-client="ca-pub-3243435715777840"
          data-ad-slot="1234567890"
          data-ad-format="horizontal"
          data-full-width-responsive="false"
        />
      </div>
    </div>
  );
}
