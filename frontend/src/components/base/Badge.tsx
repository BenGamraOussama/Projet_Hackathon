import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-teal-100 text-teal-800 border-teal-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };
  
  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}