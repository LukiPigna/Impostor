import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface CardProps {
  onReveal?: () => void;
  frontContent: React.ReactNode; 
  backContent: React.ReactNode;  
  isResetting?: boolean;
}

export const Card: React.FC<CardProps> = ({ onReveal, frontContent, backContent, isResetting }) => {
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  
  useEffect(() => {
    if (isResetting) {
      setOffsetY(0);
      setIsDragging(false);
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
    // Limit drag logic
    let newOffset = Math.max(-350, Math.min(0, currentY.current + deltaY));
    setOffsetY(newOffset);

    if (newOffset < -120 && onReveal) {
        onReveal();
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
      className="relative w-72 h-96 mx-auto select-none perspective-1000"
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onMouseMove={onMouseMove}
      onTouchEnd={handleEnd}
      onTouchMove={onTouchMove}
    >
        {/* --- BACK LAYER (The Secret) --- */}
        <div className="absolute inset-0 w-full h-full bg-slate-800 rounded-3xl border border-white/5 flex items-center justify-center p-6 text-center z-0 shadow-inner">
             {backContent}
        </div>

        {/* --- FRONT LAYER (The Cover) --- */}
        <div 
            className={`absolute inset-0 w-full h-full rounded-3xl z-10 flex flex-col items-center justify-between p-6 cursor-grab active:cursor-grabbing shadow-2xl bg-gradient-to-br from-indigo-600 to-blue-600 touch-none ${!isDragging ? 'transition-transform duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)' : ''}`}
            style={{ 
                transform: `translateY(${offsetY}px)`,
            }}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            {/* Minimalist Top Notch */}
            <div className="w-12 h-1 bg-black/20 rounded-full mt-2"></div>

            {/* Content Container (Name & Icon) */}
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                 {frontContent}
            </div>

            {/* Simple Bottom Indicator */}
            <div className="flex flex-col items-center gap-1 text-white/60 mb-2 animate-bounce">
                <ChevronUp size={28} />
            </div>

            {/* Subtle shadow overlay when lifting */}
            <div 
                className="absolute inset-0 bg-black pointer-events-none rounded-3xl transition-opacity"
                style={{ opacity: dragPercentage * 0.2 }} 
            />
        </div>
    </div>
  );
};