import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-64 h-auto" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 160" 
      className={className}
      aria-label="Impostor Logo"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{stopColor:'#7aa2f7', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#bb9af7', stopOpacity:1}} />
        </linearGradient>
      </defs>
      
      {/* Icon Graphic */}
      <g transform="translate(20, 10)">
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

      {/* Text */}
      <text 
        x="160" 
        y="105" 
        fontFamily="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" 
        fontWeight="900" 
        fontSize="85" 
        fill="url(#grad1)" 
        letterSpacing="-2"
      >
        IMPOSTOR
      </text>
    </svg>
  );
};

// Function to generate and download PWA icons from the logo design
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

    // Create SVG String for the Icon Only (Square format)
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7aa2f7"/>
            <stop offset="100%" stop-color="#bb9af7"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="200" height="200" fill="#1a1b26"/>
        <g transform="translate(50, 50) scale(0.5)">
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
      // Draw centered and scaled
      const scale = size / 200;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      
      // We render a simplified version for the icon
      const iconPath = new Path2D("M70 40 L110 40 L120 70 L60 70 Z M50 70 L130 70 L130 80 L50 80 Z"); // Hat
      
      ctx.fillStyle = '#1a1b26'; 
      ctx.fillRect(0,0, 200, 200); // BG again to be sure

      // Draw vector art manually on canvas to ensure sharpness or use the loaded SVG image
      ctx.drawImage(img, 0, 0, 200, 200);
      
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