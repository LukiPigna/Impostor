import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-24 h-24" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Resplandor de fondo muy sutil y estático */}
      <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full scale-125 -z-10" />
      
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        className="w-full h-full drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#818cf8', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:'#c084fc', stopOpacity:1}} />
          </linearGradient>
        </defs>
        <g transform="translate(0, 10)">
          {/* Sombrero - Diseño sólido y limpio */}
          <path 
            d="M32 30 C 32 25, 68 25, 68 30 L 75 48 L 25 48 Z" 
            fill="url(#hatGrad)" 
          />
          <rect x="18" y="48" width="64" height="4" rx="2" fill="url(#hatGrad)" />
          
          {/* Anteojos */}
          <circle cx="37" cy="68" r="14" fill="#1a1b26" stroke="url(#hatGrad)" strokeWidth="1.5" />
          <circle cx="63" cy="68" r="14" fill="#1a1b26" stroke="url(#hatGrad)" strokeWidth="1.5" />
          
          {/* Puente de los anteojos */}
          <rect x="47" y="66" width="6" height="2" rx="1" fill="url(#hatGrad)" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
};