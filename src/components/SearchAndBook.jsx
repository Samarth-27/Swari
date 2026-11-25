import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ShieldCheck, 
  IndianRupee, 
  Car, 
  Sparkles, 
  Heart, 
  CheckCircle, 
  Filter, 
  Zap, 
  Lock, 
  ArrowRight, 
  Clock, 
  ChevronRight, 
  SlidersHorizontal, 
  Flame, 
  ArrowRightLeft 
} from 'lucide-react';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';

export function SearchAndBook({ 
  rides, 
  onSelectRide, 
  onBookAndTrack, 
  onOpenBroadcastModal, 
  onOpenPostRide,
  hasActiveBooking = false,
  activeTrip = null,
  onOpenLiveTracking = null,
  loading = false,
  error = null,
  onRetry = null
}) {
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [tripType, setTripType] = useState('ONE_WAY'); // 'ONE_WAY' | 'ROUND_TRIP'
  const [returnDate, setReturnDate] = useState('Tomorrow');
  const [activeLeg, setActiveLeg] = useState('OUTBOUND'); // 'OUTBOUND' | 'RETURN'
  const passengerCount = 1; // Strict: Single seat per booking
  const [selectedCorridor, setSelectedCorridor] = useState('ALL');
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);
  const [evOnlyFilter, setEvOnlyFilter] = useState(false);
  const [instantOnlyFilter, setInstantOnlyFilter] = useState(false);
  const [departureTimeFilter, setDepartureTimeFilter] = useState('ALL'); // 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'
  const [sortBy, setSortBy] = useState('CHEAPEST'); // 'CHEAPEST' | 'EARLIEST' | 'RATING'
  const [alertSubscribed, setAlertSubscribed] = useState(false);
  const [alertContact, setAlertContact] = useState('');

  // Helper: calculate driver reputation tier (BlaBlaCar Ambassador parity)
  const getDriverTier = (driver) => {
    const rides = driver?.totalRides || 0;
    const rating = driver?.rating || 5.0;
    if (rides >= 40 && rating >= 4.9) {
      return { label: 'Ambassador', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: '👑' };
    }
    if (rides >= 20 && rating >= 4.8) {
      return { label: 'Expert Driver', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: '⭐' };
    }
    if (rides >= 5) {
      return { label: 'Experienced', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: '🛡️' };
    }
    return { label: 'New Host', color: 'bg-gray-800 text-gray-300 border-gray-700', icon: '🌱' };
  };

  // Quick corridor auto-fill
  const handleSelectCorridor = (corridorId) => {
    setSelectedCorridor(corridorId);
    if (corridorId === 'BLR-MAA') {
      setOriginSearch('Bengaluru');
      setDestSearch('Chennai');
    } else if (corridorId === 'DEL-CHD') {
      setOriginSearch('Delhi');
      setDestSearch('Chandigarh');
    } else if (corridorId === 'MUM-PUN') {
      setOriginSearch('Mumbai');
      setDestSearch('Pune');
    } else {
      setOriginSearch('');
      setDestSearch('');
    }
  };

  // Memoized filter and sort for instant 60fps rendering
  const sortedRides = useMemo(() => {
    const filtered = rides.filter(ride => {
      if (selectedCorridor !== 'ALL' && ride.routeId !== selectedCorridor) return false;
      if (womenOnlyFilter && !ride.womenOnly) return false;
      if (evOnlyFilter && !ride.vehicle?.model?.toLowerCase().includes('ev')) return false;
      if (instantOnlyFilter && ride.bookingMode === 'ON_REQUEST') return false;
      if (ride.seatsAvailable < passengerCount) return false;

      // Departure time filter
      if (departureTimeFilter !== 'ALL') {
        const timeStr = (ride.departureTime || '').toLowerCase();
        const isPM = timeStr.includes('pm');
        const isAM = timeStr.includes('am');
        // Extract hour
        const match = timeStr.match(/(\d{1,2}):/);
        const hour = match ? parseInt(match[1], 10) : 12;
        const normalizedHour = isPM && hour !== 12 ? hour + 12 : (isAM && hour === 12 ? 0 : hour);
        
        if (departureTimeFilter === 'MORNING' && (normalizedHour < 6 || normalizedHour >= 12)) return false;
        if (departureTimeFilter === 'AFTERNOON' && (normalizedHour < 12 || normalizedHour >= 18)) return false;
        if (departureTimeFilter === 'EVENING' && (normalizedHour < 18 || normalizedHour >= 24)) return false;
      }

      if (originSearch.trim() && !(ride.origin || '').toLowerCase().includes(originSearch.toLowerCase())) {
        return false;
      }
      if (destSearch.trim() && !(ride.destination || '').toLowerCase().includes(destSearch.toLowerCase())) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'CHEAPEST') return (a.pricePerSeat || 0) - (b.pricePerSeat || 0);
      if (sortBy === 'RATING') return (b.driver?.rating || 0) - (a.driver?.rating || 0);
      return 0; // Earliest
    });
  }, [rides, selectedCorridor, womenOnlyFilter, evOnlyFilter, instantOnlyFilter, departureTimeFilter, passengerCount, originSearch, destSearch, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. HERO SEARCH CONTAINER (Iconic BlaBlaCar Style) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/70 border border-emerald-500/30 p-6 sm:p-10 shadow-2xl overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Your pick of rides at <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              low, fair fuel prices.
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
            Carpool with verified commuters along major highway corridors. Simple, safe, and transparent.
          </p>
        </div>

        {/* BLA BLA CAR STYLE SEARCH BAR */}
        <div className="relative z-10 mt-8 bg-gray-950/95 border border-gray-800 p-3 sm:p-5 rounded-3xl shadow-2xl space-y-3">
          
          {/* Two-Way (Round Trip) vs One-Way Selector */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setTripType('ONE_WAY');
                setActiveLeg('OUTBOUND');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tripType === 'ONE_WAY'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              ➔ One-Way Ride
            </button>
            <button
              type="button"
              onClick={() => setTripType('ROUND_TRIP')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                tripType === 'ROUND_TRIP'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                  : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>⇄ Two-Way Journey (Round Trip)</span>
            </button>

            {tripType === 'ROUND_TRIP' && (
              <span className="text-[11px] text-teal-300 font-semibold hidden sm:inline-block ml-2">
                (Browse Outbound &amp; Return trips together)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Leaving from */}
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-all">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Leaving from</span>
              </label>
              <input
                type="text"
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                placeholder="City, station or landmark"
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none font-semibold"
              />
            </div>

            {/* Going to */}
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-all">
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Going to</span>
              </label>
              <input
                type="text"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                placeholder="Destination city or dropoff point"
                className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none font-semibold"
              />
            </div>

            {/* Date & Passengers / Return Date */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-2.5">
                <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>Outbound</span>
                </label>
                <div className="text-xs text-white font-semibold pt-0.5">
                  Today
                </div>
              </div>

              {tripType === 'ROUND_TRIP' ? (
                <div className="bg-gray-900/90 border border-teal-500/50 rounded-2xl p-2.5">
                  <label className="block text-[9px] uppercase font-bold text-teal-400 mb-0.5 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-teal-400" />
                    <span>Return Date</span>
                  </label>
                  <select
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-transparent text-xs text-teal-300 font-bold focus:outline-none"
                  >
                    <option value="Tomorrow" className="bg-gray-900">Tomorrow</option>
                    <option value="This Weekend" className="bg-gray-900">This Weekend</option>
                    <option value="Next Week" className="bg-gray-900">Next Week</option>
                  </select>
                </div>
              ) : (
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-2.5">
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5 flex items-center space-x-1">
                    <Users className="w-3 h-3 text-teal-400" />
                    <span>Pax</span>
                  </label>
                  <div className="text-xs text-emerald-400 font-bold pt-0.5 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>1 Seat (Personal)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Search CTA Button */}
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => {}}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95 py-3"
              >
                <Search className="w-4 h-4" />
                <span>Search Rides</span>
              </button>
            </div>

          </div>

          {/* Quick Corridor Buttons */}
          <div className="mt-4 pt-3 border-t border-gray-900 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-400 text-[11px] font-bold uppercase">Popular Corridors:</span>
              {[
                { id: 'ALL', label: 'All India' },
                { id: 'BLR-MAA', label: 'Bengaluru ⇄ Chennai' },
                { id: 'DEL-CHD', label: 'Delhi ⇄ Chandigarh' },
                { id: 'MUM-PUN', label: 'Mumbai ⇄ Pune' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCorridor(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedCorridor === c.id
                      ? 'bg-emerald-500 text-gray-950 font-bold shadow-md'
                      : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Secondary Action: Publish Ride */}
            <button
              onClick={onOpenPostRide}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
            >
              <span>Driving somewhere?</span>
              <span className="underline">Publish empty seats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* ACTIVE BOOKING IN PROGRESS BANNER */}
      {hasActiveBooking && (
        <div className="bg-gradient-to-r from-amber-950/70 via-gray-900 to-amber-950/70 border border-amber-500/40 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-white">Active Ride Booking in Progress</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  SINGLE ACTIVE SLOT OCCUPIED
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                You already have an active ride booked with <strong>{activeTrip?.driver?.name || 'your host'}</strong> ({activeTrip?.pickupPoint?.name || 'Origin'} ➔ {activeTrip?.dropoffPoint?.name || 'Destination'}). Swari limits passengers to 1 active ride at a time.
              </p>
            </div>
          </div>
          {onOpenLiveTracking && (
            <button
              onClick={onOpenLiveTracking}
              className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs shadow-md transition-all shrink-0 active:scale-95"
            >
              View Active Ride
            </button>
          )}
        </div>
      )}

      {/* 2. RESULTS FILTER & SORT BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Verified Carpool Rides</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                {sortedRides.length} available
              </span>
            </h2>

            {/* Two-Way Leg Switcher */}
            {tripType === 'ROUND_TRIP' && (
              <div className="flex items-center p-1 bg-gray-950 rounded-xl border border-teal-500/40 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveLeg('OUTBOUND')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    activeLeg === 'OUTBOUND'
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Leg 1: Outbound
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLeg('RETURN');
                    // Invert origin and destination for return leg
                    const oldO = originSearch;
                    const oldD = destSearch;
                    setOriginSearch(oldD);
                    setDestSearch(oldO);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center space-x-1 ${
                    activeLeg === 'RETURN'
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Leg 2: Return ({returnDate})</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Non-commercial fuel cost-sharing under Indian Motor Vehicles Act 1988 (Section 66/192A).
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Instant Book Only */}
          <button
            onClick={() => setInstantOnlyFilter(!instantOnlyFilter)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
              instantOnlyFilter
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-gray-900 text-emerald-400 border border-emerald-500/30 hover:bg-gray-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant Book Only</span>
          </button>

          {/* Women Only */}
          <button
            onClick={() => setWomenOnlyFilter(!womenOnlyFilter)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
              womenOnlyFilter
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                : 'bg-gray-900 text-pink-300 border border-pink-500/30 hover:bg-gray-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Women Only</span>
          </button>

          {/* Electric Vehicle (EV) */}
          <button
            onClick={() => setEvOnlyFilter(!evOnlyFilter)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
              evOnlyFilter
                ? 'bg-teal-600 text-white shadow-lg'
                : 'bg-gray-900 text-teal-300 border border-teal-500/30 hover:bg-gray-800'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>EV Green</span>
          </button>

          {/* Departure Time Filter */}
          <div className="flex items-center space-x-1 bg-gray-900 border border-gray-800 rounded-xl px-2 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={departureTimeFilter}
              onChange={(e) => setDepartureTimeFilter(e.target.value)}
              className="bg-transparent text-gray-300 font-semibold focus:outline-none"
            >
              <option value="ALL" className="bg-gray-900">Any Time</option>
              <option value="MORNING" className="bg-gray-900">Morning (6AM - 12PM)</option>
              <option value="AFTERNOON" className="bg-gray-900">Afternoon (12PM - 6PM)</option>
              <option value="EVENING" className="bg-gray-900">Evening (6PM - 12AM)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1.5 bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-gray-300 font-semibold focus:outline-none"
            >
              <option value="CHEAPEST" className="bg-gray-900">Lowest Price</option>
              <option value="RATING" className="bg-gray-900">Highest Rated</option>
              <option value="EARLIEST" className="bg-gray-900">Earliest Departure</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. BLA BLA CAR STYLE RIDE CARDS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-12 text-center">
            <LoadingSpinner size="large" text="Searching active highway corridors in real-time..." />
          </div>
        ) : error ? (
          <ErrorMessage 
            title="Unable to load corridor rides" 
            message={error} 
            onRetry={onRetry} 
            className="my-4" 
          />
        ) : sortedRides.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 sm:p-12 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
              <Car className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No rides found matching your search</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No verified host has listed an active trip for this exact filter. You can set a real-time ride alert or broadcast your custom travel budget.
              </p>
            </div>

            {/* BLA BLA CAR RIDE ALERT NOTIFICATION SYSTEM */}
            <div className="max-w-md mx-auto bg-gray-950 p-4 rounded-2xl border border-indigo-500/30 space-y-3 text-left">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Create Ride Alert (Get Notified When a Ride is Posted)</span>
              </div>
              {alertSubscribed ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-semibold flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ride alert active! You'll receive instant notification as soon as a driver publishes on this route.</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={alertContact}
                    onChange={(e) => setAlertContact(e.target.value)}
                    placeholder="Enter phone or email for SMS/Push alert"
                    className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (alertContact.trim()) setAlertSubscribed(true);
                    }}
                    className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                  >
                    Notify Me
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenBroadcastModal}
                className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Broadcast Your Budget Request
              </button>
            </div>
          </div>
        ) : (
          sortedRides.map(ride => {
            const driverTier = getDriverTier(ride.driver);
            const isInstant = ride.bookingMode !== 'ON_REQUEST';

            return (
            <div
              key={ride.id}
              onClick={() => onSelectRide(ride)}
              className="bg-gray-900 border border-gray-800/90 hover:border-emerald-500/60 rounded-3xl p-6 shadow-xl transition-all cursor-pointer group hover:bg-gray-900/90 relative overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Left: Journey Timeline & Route */}
                <div className="space-y-4 flex-1">
                  
                  {/* Departure & Arrival Landmark Timeline */}
                  <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-gray-700 group-hover:before:bg-emerald-500 transition-colors">
                    
                    {/* Origin & Departure Time */}
                    <div className="flex items-start space-x-3.5 relative">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center shrink-0 z-10 bg-gray-900">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm sm:text-base font-black text-white">
                          {ride.departureTime}
                        </span>
                        <span className="text-sm font-semibold text-gray-300">
                          {ride.origin}
                        </span>
                      </div>
                    </div>

                    {/* Destination & Approx Arrival */}
                    <div className="flex items-start space-x-3.5 relative">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shrink-0 z-10 bg-gray-900">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-sm sm:text-base font-black text-emerald-400">
                          Approx 4-5 hrs
                        </span>
                        <span className="text-sm font-semibold text-gray-300">
                          {ride.destination}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Vehicle & Feature Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Instant vs On Request Badge (BlaBlaCar feature parity) */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                      isInstant
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    }`}>
                      {isInstant ? <Zap className="w-3 h-3 text-emerald-400" /> : <ShieldCheck className="w-3 h-3 text-indigo-400" />}
                      <span>{isInstant ? '⚡ Instant Book' : '🛡️ On Request'}</span>
                    </span>

                    <span className="text-[11px] font-mono bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800 text-gray-300 flex items-center space-x-1">
                      <Car className="w-3.5 h-3.5 text-gray-400" />
                      <span>{ride.vehicle.make} {ride.vehicle.model}</span>
                    </span>
                    <span className="text-[10px] font-mono bg-gray-800 text-amber-300 px-2 py-0.5 rounded font-bold">
                      {ride.vehicle.plate}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                      AC Available
                    </span>
                    <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                      Max 2 in Back Seat
                    </span>
                    {ride.womenOnly && (
                      <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/40 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                        <Heart className="w-3 h-3 text-pink-400" />
                        <span>Women Only</span>
                      </span>
                    )}
                  </div>

                </div>

                {/* Middle: Driver Profile Snippet */}
                <div className="flex items-center space-x-3.5 bg-gray-950/70 p-3.5 rounded-2xl border border-gray-800/80 lg:w-72">
                  <div className="relative">
                    <img
                      src={ride.driver.avatar}
                      alt={ride.driver.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                    />
                    {ride.driver.isAadhaarVerified && (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-gray-950 text-white" title="Govt Aadhaar KYC Verified">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {ride.driver.name}
                      </h4>
                      {/* Driver Reputation Tier Badge */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${driverTier.color}`}>
                        {driverTier.icon} {driverTier.label}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                      <span className="text-amber-400 font-bold">★ {ride.driver.rating}</span>
                      <span>•</span>
                      <span>{ride.driver.totalRides} trips</span>
                    </div>
                    <span className="text-[10px] text-gray-400 italic block truncate max-w-[170px]">
                      "{ride.driver.chattiness}"
                    </span>
                  </div>
                </div>

                {/* Right: Fare, Empty Seats & Instant View CTA */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-800 shrink-0 space-y-0 sm:space-y-2">
                  <div className="text-left sm:text-right">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-400 transition-colors">
                        ₹{ride.pricePerSeat}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">/ seat</span>
                    </div>
                    <span className={`text-[11px] font-bold block ${
                      ride.seatsAvailable === 1 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {ride.seatsAvailable} {ride.seatsAvailable === 1 ? 'seat left' : 'seats left'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRide(ride);
                    }}
                    className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5 active:scale-95"
                  >
                    <span>View & Book</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
            );
          })
        )}
      </div>

      {/* 4. PASSENGER BROADCAST RADAR BANNER (The Indian Solution) */}
      <div className="rounded-3xl bg-gradient-to-r from-gray-900 via-indigo-950/60 to-gray-900 border border-indigo-500/30 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            Reverse Marketplace Radar
          </span>
          <h3 className="text-xl font-black text-white">Can't find a ride matching your time or budget?</h3>
          <p className="text-xs text-gray-300">
            Post your travel route with the exact budget in ₹ you want to pay. Verified car owners driving that highway will see your broadcast and send you customized car invites!
          </p>
        </div>

        <button
          onClick={onOpenBroadcastModal}
          className="py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xs shadow-xl shadow-indigo-500/20 transition-all shrink-0 active:scale-95 flex items-center justify-center space-x-2"
        >
          <span>Broadcast Your Budget (₹)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
