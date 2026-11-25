import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 'default', text = 'Loading...', className = '' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size] || 'w-8 h-8';

  return (
    <div 
      role="status" 
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 space-y-3 text-emerald-400 ${className}`}
    >
      <Loader2 className={`${sizeClasses} animate-spin text-emerald-400`} aria-hidden="true" />
      {text && <span className="text-sm font-medium text-gray-300">{text}</span>}
      <span className="sr-only">{text}</span>
    </div>
  );
}
