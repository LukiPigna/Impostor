import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-48 h-auto" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 240 200" 
      className={className}
      aria-label="Impostor Logo"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#7aa2f7', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#bb9af7', stopOpacity:1}} />
        </linearGradient>
      </defs>
      
      {/* Icon Graphic - Recentered for width 240 (Center X = 120) */}
      {/* Original Icon Center ~90. Need shift +30 to hit 120. */}
      <g transform="translate(30, 0)">
        {/* Hat */}
        <path d="M70 20 L110 20 L120 50 L60 50 Z" fill="#7aa2f7" />
        <rect x="50" y="50" width="80" height="10" rx="2" fill="#7aa2f7" />
        
        {/* Glasses */}
        <circle cx="70" cy="80" r="18" fill="#1a1b26" stroke="url(#grad1)" strokeWidth="6" />
        <circle cx="110" cy="80" r="18" fill="#1a1b26" stroke="url(#grad1)" strokeWidth="6" />
        <line x1="88" y1="80" x2="92" y2="80" stroke="url(#grad1)" strokeWidth="4" />
        
        {/* Collar/Suit */}
        <path d="M50 110 Q90 140 130 110 L130 140 L50 140 Z" fill="#24283b" opacity="0.8" />
      </g>

      {/* Text - Centered at 120 */}
      <text 
        x="120" 
        y="185" 
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" 
        fontWeight="900" 
        fontSize="32" 
        fill="url(#grad1)" 
        letterSpacing="2"
        textAnchor="middle"
      >
        IMPOSTOR
      </text>
    </svg>
  );
};

// Function to generate and download PWA icons (Keeps square aspect ratio for icons)
export const downloadAppIcons = () => {
  const sizes = [192, 512];
  
  sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Draw Background (App Theme Color)
    ctx.fillStyle = '#1a1b26';
    ctx.fillRect(0, 0, size, size);

    // Create SVG String for the Icon Only (Centered in square)
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7aa2f7"/>
            <stop offset="100%" stop-color="#bb9af7"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="200" height="200" fill="#1a1b26"/>
        
        <!-- Center graphic manually -->
        <g transform="translate(10, 20)">
           <!-- Hat -->
           <path d="M70 20 L110 20 L120 50 L60 50 Z" fill="#7aa2f7" />
           <rect x="50" y="50" width="80" height="10" rx="2" fill="#7aa2f7" />
           <!-- Glasses -->
           <circle cx="70" cy="80" r="18" fill="#1a1b26" stroke="url(#g)" stroke-width="8" />
           <circle cx="110" cy="80" r="18" fill="#1a1b26" stroke="url(#g)" stroke-width="8" />
           <line x1="88" y1="80" x2="92" y2="80" stroke="url(#g)" stroke-width="6" />
           <!-- Collar -->
           <path d="M50 110 Q90 140 130 110 L130 140 L50 140 Z" fill="#24283b"/>
        </g>
      </svg>
    `;

    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      
      // Convert to PNG and Download
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `icon-${size}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
};