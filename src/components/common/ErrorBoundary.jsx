import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SWARI-FATAL-CRASH] Caught in ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          role="alert" 
          aria-live="assertive"
          className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6"
        >
          <div className="bg-gray-900 border border-rose-500/40 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
              <AlertOctagon className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Application Interface Encountered an Error</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                Swari recovered safely without losing session integrity. You can refresh or try re-rendering the view.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3.5 text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Reload Swari</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
