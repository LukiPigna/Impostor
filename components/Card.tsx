import React from 'react';

interface CardProps {
  isFlipped: boolean;
  onFlip: () => void;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  locked?: boolean;
}

export const Card: React.FC<CardProps> = ({ isFlipped, onFlip, frontContent, backContent, locked = false }) => {
  return (
    <div 
      className="relative w-72 h-96 cursor-pointer group perspective-1000 mx-auto"
      onClick={() => !locked && onFlip()}
    >
      <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front Face (Hidden/Face Down) */}
        <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-game-primary to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white/10">
          <div className="text-white text-center p-6">
             {frontContent}
          </div>
        </div>

        {/* Back Face (Revealed/Face Up) */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
           <div className="absolute inset-0 bg-game-card opacity-5 pointer-events-none"></div>
           <div className="text-center p-6 w-full">
            {backContent}
           </div>
        </div>

      </div>
    </div>
  );
};