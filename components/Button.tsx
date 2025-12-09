import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '',
  ...props 
}) => {
  // Base styles: Glassy feel, smooth transition, proper font weight
  const baseStyles = "relative px-6 py-4 rounded-xl font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden";
  
  const variants = {
    // Primary: Modern Gradient with glow
    primary: "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 border border-white/10",
    // Secondary: Glassmorphism
    secondary: "bg-white/5 backdrop-blur-md text-gray-200 hover:bg-white/10 border border-white/10 shadow-sm",
    // Danger: Red gradient
    danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 border border-white/10",
    // Ghost: Minimal
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {/* Subtle shine effect on hover could go here, but keeping it CSS clean */}
      {children}
    </button>
  );
};