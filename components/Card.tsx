import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, Fingerprint } from 'lucide-react';

interface CardProps {
  onReveal?: () => void;
  frontContent: React.ReactNode; 
  backContent: React.ReactNode;  
  isResetting?: boolean;
  hintText?: string;
}

export const Card: React.FC<CardProps> = ({ onReveal, frontContent, backContent, isResetting, hintText = "SLIDE UP" }) => {
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

  const triggerHaptic = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleStart = (y: number) => {
    setIsDragging(true);
    startY.current = y;
    currentY.current = offsetY; 
  };

  const handleMove = (y: number) => {
    if (!isDragging) return;
    const deltaY = y - startY.current;
    // Physics: Resistance
    let newOffset = Math.max(-350, Math.min(0, currentY.current + deltaY));
    setOffsetY(newOffset);

    // Haptic feedback when "unlocked"
    if (newOffset < -120 && !hasVibrated.current) {
        if (navigator.vibrate) navigator.vibrate(20);
        hasVibrated.current = true;
        if (onReveal) onReveal();
    }
    
    // Reset haptic trigger if user slides back down
    if (newOffset > -100) {
        hasVibrated.current = false;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setOffsetY(0);
  };

  // Events
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY);
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientY);

  const dragPercentage = Math.min(1, Math.abs(offsetY) / 200);

  return (
    <div 
      className="relative w-72 h-[420px] mx-auto select-none perspective-1000"
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onMouseMove={onMouseMove}
      onTouchEnd={handleEnd}
      onTouchMove={onTouchMove}
    >
        {/* --- BACK LAYER (The Secret) --- */}
        <div className="absolute inset-0 w-full h-full bg-slate-900/90 backdrop-blur-xl rounded-[2rem] border border-white/10 flex items-center justify-center p-6 text-center z-0 shadow-inner overflow-hidden">
             {/* Subtle background pattern inside secret card */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50" />
             <div className="relative z-10 w-full">
                {backContent}
             </div>
        </div>

        {/* --- FRONT LAYER (The Cover) --- */}
        <div 
            className={`absolute inset-0 w-full h-full rounded-[2rem] z-10 flex flex-col items-center justify-between p-6 cursor-grab active:cursor-grabbing shadow-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 touch-none border border-white/10 ${!isDragging ? 'transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)' : ''}`}
            style={{ 
                transform: `translateY(${offsetY}px)`,
                boxShadow: `0 20px 50px -12px rgba(79, 70, 229, ${0.5 - dragPercentage * 0.4})`
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* Minimalist Top Notch */}
            <div className="w-16 h-1.5 bg-black/20 rounded-full mt-1 backdrop-blur-sm"></div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                 {frontContent}
                 
                 {/* Biometric Scan Effect */}
                 <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden rounded-xl">
                    <div className="w-full h-1 bg-blue-400/50 shadow-[0_0_15px_rgba(96,165,250,0.8)] animate-scan blur-[1px]"></div>
                 </div>
            </div>

            {/* Simple Bottom Indicator */}
            <div className="flex flex-col items-center gap-2 text-white/80 mb-4 animate-bounce">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">{hintText}</span>
                <ChevronUp size={24} className="opacity-80" />
            </div>

            {/* Shine reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-[2rem]" />
        </div>
    </div>
  );
};