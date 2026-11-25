import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorMessage({ 
  title = 'Something went wrong', 
  message = 'An unexpected error occurred while processing your request.', 
  onRetry = null, 
  className = '' 
}) {
  return (
    <div 
      role="alert" 
      aria-live="assertive"
      className={`bg-rose-950/40 border border-rose-500/50 rounded-2xl p-5 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${className}`}
    >
      <div className="flex items-start space-x-3.5">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h4 className="font-semibold text-white text-base leading-snug">{title}</h4>
          <p className="text-sm text-rose-300/90 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 flex items-center space-x-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label="Retry failed request"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
