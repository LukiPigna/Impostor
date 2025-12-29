import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ShieldCheck, Lock } from 'lucide-react';

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
    // Physics: Resistance and max pull
    let newOffset = Math.max(-380, Math.min(0, currentY.current + deltaY));
    setOffsetY(newOffset);

    // Haptic feedback when threshold crossed
    if (newOffset < -140 && !hasVibrated.current) {
        if (navigator.vibrate) navigator.vibrate([15]);
        hasVibrated.current = true;
        if (onReveal) onReveal();
    }
    
    if (newOffset > -120) {
        hasVibrated.current = false;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    // Smooth snap back is handled by CSS transition
    setOffsetY(0);
  };

  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientY);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientY);
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientY);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientY);

  const dragPercentage = Math.min(1, Math.abs(offsetY) / 300);

  return (
    <div 
      className="relative w-80 h-[460px] mx-auto select-none perspective-1000"
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onMouseMove={onMouseMove}
      onTouchEnd={handleEnd}
      onTouchMove={onTouchMove}
    >
        {/* --- BACK LAYER (The Data) --- */}
        <div className="absolute inset-0 w-full h-full bg-[#0a0f1e] rounded-[2.5rem] border border-white/5 flex items-center justify-center p-8 text-center z-0 shadow-2xl overflow-hidden">
             {/* Dynamic background effect for the secret word */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.08),transparent_70%)]" />
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
             
             <div className="relative z-10 w-full flex flex-col items-center">
                {backContent}
             </div>
        </div>

        {/* --- FRONT LAYER (The Shield) --- */}
        <div 
            className={`absolute inset-0 w-full h-full rounded-[2.5rem] z-10 flex flex-col items-center justify-between p-8 cursor-grab active:cursor-grabbing shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] bg-slate-900 touch-none border border-white/10 overflow-hidden ${!isDragging ? 'transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)' : ''}`}
            style={{ 
                transform: `translateY(${offsetY}px)`,
                backgroundColor: `rgb(${15 + dragPercentage * 10}, ${23 + dragPercentage * 10}, ${42 + dragPercentage * 10})`
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* Glossy Texture Layer */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />
            
            {/* Top Security Badge Style */}
            <div className="w-full flex justify-between items-start opacity-40">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                </div>
                <div className="px-2 py-0.5 rounded-md border border-white/20 text-[8px] font-black tracking-widest text-white/40 uppercase">Encrypted</div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                 <div className="relative mb-8 transform transition-transform duration-700" style={{ transform: `scale(${1 + dragPercentage * 0.05})` }}>
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse-slow"></div>
                    {frontContent}
                 </div>
                 
                 {/* Biometric Scanline */}
                 <div className="absolute inset-x-0 h-[1px] bg-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-scan blur-[0.5px] pointer-events-none"></div>
            </div>

            {/* Bottom Interaction Area */}
            <div className="flex flex-col items-center gap-4 w-full">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="flex flex-col items-center gap-2 text-white/60">
                    <ChevronUp size={24} className={`transition-transform duration-300 ${isDragging ? 'translate-y--2 opacity-100' : 'opacity-40 animate-bounce'}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">{hintText}</span>
                </div>
            </div>

            {/* Corner Decorative Elements */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/5 m-4 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/5 m-4 rounded-br-xl" />
        </div>
    </div>
  );
};
