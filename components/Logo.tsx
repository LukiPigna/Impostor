import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-32 h-32" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className} group`}>
      {/* Resplandor de fondo difuso */}
      <div className="absolute inset-0 bg-indigo-500/10 blur-[40px] rounded-full scale-150 animate-pulse duration-[4000ms]" />
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-[0_0_20px_rgba(122,162,247,0.4)] animate-bounce duration-[6000ms] ease-in-out"
        style={{ animationIterationCount: 'infinite' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#7aa2f7', stopOpacity:0.9}} />
            <stop offset="100%" style={{stopColor:'#bb9af7', stopOpacity:0.8}} />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#1a1b26', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#24283b', stopOpacity:1}} />
          </linearGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        <g transform="translate(0, 5)">
          {/* Sombrero - Bordes suavizados con gradiente */}
          <path 
            d="M32 35 L68 35 L76 55 L24 55 Z" 
            fill="url(#hatGrad)" 
            className="filter-[url(#softGlow)]"
          />
          <rect x="18" y="55" width="64" height="6" rx="3" fill="url(#hatGrad)" />
          
          {/* Gafas - Círculos oscuros con borde brillante muy fino */}
          <circle cx="36" cy="78" r="14" fill="url(#glassGrad)" stroke="#7aa2f7" strokeWidth="0.5" strokeOpacity="0.3" />
          <circle cx="64" cy="78" r="14" fill="url(#glassGrad)" stroke="#7aa2f7" strokeWidth="0.5" strokeOpacity="0.3" />
          
          {/* Puente de las gafas */}
          <path d="M50 78 Q50 78 50 78" stroke="#7aa2f7" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
          <line x1="47" y1="78" x2="53" y2="78" stroke="#7aa2f7" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
        </g>
      </svg>

      {/* Efecto de escaneo láser suave que pasa sobre el logo */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none opacity-20">
        <div className="absolute h-[2px] w-full bg-indigo-400 shadow-[0_0_15px_#7aa2f7] animate-scan top-0" />
      </div>
    </div>
  );
};