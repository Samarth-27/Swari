import React from 'react';
import { 
  Car, 
  Radio, 
  PlusCircle, 
  Compass, 
  LayoutDashboard, 
  User, 
  ArrowRightLeft,
  Navigation
} from 'lucide-react';

export function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  onOpenLogin,
  onOpenLiveTracking, 
  onOpenPostRide,
  activeTrip
}) {
  const hasActiveRide = Boolean(activeTrip && activeTrip.status !== 'COMPLETED' && activeTrip.status !== 'CANCELLED');

  return (
    <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white">SWARI</span>
              </div>
              <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
                Intercity Carpooling & Ride-Sharing
              </p>
            </div>
          </div>

          {/* Clean Consumer Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5 bg-gray-800/60 p-1 rounded-2xl border border-gray-700/60">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'explore'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Find Rides</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcasts')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'broadcasts'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Passenger Requests</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-400" />
              <span>My Rides</span>
              {hasActiveRide && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 animate-ping"></span>
              )}
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            
            {/* Contextual Live Ride Tracker: Only displays when user actually has an active ride in progress */}
            {hasActiveRide && (
              <button
                onClick={onOpenLiveTracking}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all animate-pulse"
                title="Live satellite GPS tracking for your active ride"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Live Ride Active</span>
              </button>
            )}

            {/* Persona / Account Switcher */}
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700 p-1.5 pr-3 rounded-2xl border border-gray-700 transition-all text-xs"
              title="Switch user account (Passenger or Driver)"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser?.fullName || 'User'}
                className="w-7 h-7 rounded-full object-cover border border-emerald-400"
              />
              <div className="text-left hidden sm:block">
                <span className="font-bold text-white block text-[11px] leading-tight">
                  {currentUser?.fullName?.split(' ')[0] || 'User'}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  currentUser?.role === 'DRIVER' ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  {currentUser?.role === 'DRIVER' ? 'Driver' : 'Passenger'}
                </span>
              </div>
              <ArrowRightLeft className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
            </button>

            {/* Publish a Ride CTA */}
            <button
              onClick={onOpenPostRide}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish a ride</span>
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around bg-gray-950 border-t border-gray-800 py-2.5 px-2 text-xs">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg ${
            activeTab === 'explore' ? 'text-emerald-400 font-bold' : 'text-gray-400'
          }`}
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Find</span>
        </button>
        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg ${
            activeTab === 'broadcasts' ? 'text-emerald-400 font-bold' : 'text-gray-400'
          }`}
        >
          <Radio className="w-5 h-5 mb-0.5" />
          <span>Requests</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg relative ${
            activeTab === 'dashboard' ? 'text-teal-400 font-bold' : 'text-gray-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>My Rides</span>
          {hasActiveRide && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-3"></span>
          )}
        </button>
        <button
          onClick={onOpenLogin}
          className="flex flex-col items-center py-1 px-3 rounded-lg text-gray-400"
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Account</span>
        </button>
      </div>
    </header>
  );
}
