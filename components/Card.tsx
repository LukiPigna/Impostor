import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, Fingerprint } from 'lucide-react';

interface CardProps {
  onReveal?: () => void;
  frontContent: React.ReactNode; 
  backContent: React.ReactNode;  
  isResetting?: boolean;
  hintText?: string;
}

export const Card: React.FC<CardProps> = ({ onReveal, frontContent, backContent, isResetting, hintText = "SLIDE TO REVEAL" }) => {
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const hasVibrated = useRef(false);
  
  useEffect(() => {
    if (isResetting) {
      setOffsetY(0);
      setIsDragging(false);
      hasVibrated.current = false;
    }
  }, [isResetting]);

  const handleStart = (y: number) => {
    setIsDragging(true);
    startY.current = y;
    currentY.current = offsetY; 
  };

  const handleMove = (y: number) => {
    if (!isDragging) return;
    const deltaY = y - startY.current;
    // Controlled resistance for a more professional feel
    let newOffset = Math.max(-300, Math.min(0, currentY.current + deltaY));
    setOffsetY(newOffset);

    if (newOffset < -120 && !hasVibrated.current) {
        if (navigator.vibrate) navigator.vibrate([10]);
        hasVibrated.current = true;
        if (onReveal) onReveal();
    }
    
    if (newOffset > -100) {
        hasVibrated.current = false;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setOffsetY(0);
  };

  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY);
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientY);

  const dragPercentage = Math.min(1, Math.abs(offsetY) / 250);

  return (
    <div 
      className="relative w-64 h-[380px] mx-auto select-none perspective-1000"
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onMouseMove={onMouseMove}
      onTouchEnd={handleEnd}
      onTouchMove={onTouchMove}
    >
        {/* --- BACK LAYER --- */}
        <div className="absolute inset-0 w-full h-full bg-[#0d111a] rounded-[2rem] border border-white/5 flex items-center justify-center p-6 text-center z-0 shadow-inner overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.05),transparent_70%)]" />
             <div className="relative z-10 w-full flex flex-col items-center">
                {backContent}
             </div>
        </div>

        {/* --- FRONT LAYER --- */}
        <div 
            className={`absolute inset-0 w-full h-full rounded-[2rem] z-10 flex flex-col items-center justify-between p-6 cursor-grab active:cursor-grabbing shadow-2xl bg-[#161b2a] touch-none border border-white/10 overflow-hidden ${!isDragging ? 'transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)' : ''}`}
            style={{ 
                transform: `translateY(${offsetY}px)`,
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
            
            <div className="w-full flex justify-between items-start opacity-30">
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-indigo-500" />
                    <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                </div>
                <div className="text-[7px] font-black tracking-widest text-white/40 uppercase">Encrypted</div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                 <div className="transform transition-transform duration-700" style={{ transform: `scale(${1 + dragPercentage * 0.05})` }}>
                    {frontContent}
                 </div>
                 <div className="absolute inset-x-0 h-[1px] bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.4)] animate-scan blur-[0.5px]"></div>
            </div>

            <div className="flex flex-col items-center gap-2 w-full">
                <div className="h-px w-6 bg-white/10 mb-2"></div>
                <ChevronUp size={20} className={`transition-transform duration-300 ${isDragging ? 'translate-y--1 opacity-100' : 'opacity-30 animate-bounce'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40">{hintText}</span>
            </div>

            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/5 m-3 rounded-tl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/5 m-3 rounded-br-lg" />
        </div>
    </div>
  );
};
