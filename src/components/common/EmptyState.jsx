import React from 'react';
import { Compass } from 'lucide-react';

export function EmptyState({ 
  icon: Icon = Compass, 
  title = 'No records found', 
  description = 'There are no active items matching your criteria at this moment.', 
  actionText = null, 
  onAction = null,
  className = '' 
}) {
  return (
    <div 
      className={`flex flex-col items-center justify-center text-center p-12 bg-gray-900/60 border border-gray-800 rounded-3xl ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="w-16 h-16 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-emerald-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
