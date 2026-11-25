import React, { useState } from 'react';
import { 
  User, 
  Car, 
  Navigation, 
  Radio, 
  ShieldCheck, 
  IndianRupee, 
  Clock, 
  MapPin, 
  FileText, 
  Briefcase, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  PlusCircle, 
  Sparkles, 
  MessageCircle, 
  PhoneCall, 
  ChevronRight,
  Filter,
  Check,
  Zap,
  ArrowRight,
  Star,
  RotateCw
} from 'lucide-react';
import { DriverInviteModal } from './DriverInviteModal';

// Helper function to check if a passenger's public request comes in-between the driver's published car route
export function checkInBetweenRouteMatch(passengerReq, driverTrip) {
  if (!driverTrip) {
    return {
      isMatch: false,
      reason: 'You have not published an active car trip yet.'
    };
  }

  // 1. Direct Corridor Code Match
  if (passengerReq.routeId === driverTrip.routeId) {
    return {
      isMatch: true,
      corridor: driverTrip.routeId,
      reason: `Directly on your ${driverTrip.routeId} highway corridor!`,
      inBetweenNote: `Pickup & drop are along your ${driverTrip.origin.split(' ')[0]} ➔ ${driverTrip.destination.split(' ')[0]} route.`
    };
  }

  // 2. Keyword Geographical Waypoint Check
  const pOrigin = (passengerReq.origin || '').toLowerCase();
  const pDest = (passengerReq.destination || '').toLowerCase();
  const dOrigin = (driverTrip.origin || '').toLowerCase();
  const dDest = (driverTrip.destination || '').toLowerCase();

  // Route: Bengaluru <-> Chennai
  if ((dOrigin.includes('bengaluru') || dOrigin.includes('bangalore')) && dDest.includes('chennai')) {
    const blrWaypoints = ['bengaluru', 'bangalore', 'silk board', 'electronic city', 'attibele', 'hosur', 'krishnagiri', 'vaniyambadi', 'vellore', 'ranipet', 'sriperumbudur', 'chennai', 'guindy', 'koyambedu'];
    const pOriginMatch = blrWaypoints.some(w => pOrigin.includes(w));
    const pDestMatch = blrWaypoints.some(w => pDest.includes(w));
    if (pOriginMatch && pDestMatch) {
      return {
        isMatch: true,
        corridor: 'BLR-MAA (NH 44)',
        reason: 'Passenger stops come directly in-between your Bengaluru ➔ Chennai highway route!',
        inBetweenNote: 'Convenient flyover / bypass pickup with zero detour.'
      };
    }
  }

  // Route: Delhi <-> Chandigarh
  if (dOrigin.includes('delhi') && dDest.includes('chandigarh')) {
    const delWaypoints = ['delhi', 'kashmere gate', 'mukarbe chowk', 'murthal', 'panipat', 'karnal', 'kurukshetra', 'ambala', 'chandigarh', 'mohali'];
    const pOriginMatch = delWaypoints.some(w => pOrigin.includes(w));
    const pDestMatch = delWaypoints.some(w => pDest.includes(w));
    if (pOriginMatch && pDestMatch) {
      return {
        isMatch: true,
        corridor: 'DEL-CHD (NH 44)',
        reason: 'Passenger stops come directly in-between your Delhi ➔ Chandigarh GT Road route!',
        inBetweenNote: 'GT Road highway corridor pickup.'
      };
    }
  }

  // Route: Mumbai <-> Pune
  if (dOrigin.includes('mumbai') && dDest.includes('pune')) {
    const mumWaypoints = ['mumbai', 'vashi', 'navi mumbai', 'kharghar', 'kalamboli', 'khalapur', 'lonavala', 'khandala', 'talegaon', 'wakad', 'hinjewadi', 'pune'];
    const pOriginMatch = mumWaypoints.some(w => pOrigin.includes(w));
    const pDestMatch = mumWaypoints.some(w => pDest.includes(w));
    if (pOriginMatch && pDestMatch) {
      return {
        isMatch: true,
        corridor: 'MUM-PUN (Expressway)',
        reason: 'Passenger stops come directly in-between your Mumbai-Pune Expressway route!',
        inBetweenNote: 'Expressway toll / exit pickup point.'
      };
    }
  }

  return {
    isMatch: false,
    reason: `Passenger route (${passengerReq.origin} ➔ ${passengerReq.destination}) is on a different corridor and does not come in-between your published car trip.`
  };
}

export function UserUnifiedDashboard({
  user,
  activeTrip,
  driverRides = [],
  broadcasts = [],
  onOpenLiveTracking,
  onOpenManifest,
  onOpenLuggageTag,
  onOpenBroadcastModal,
  onOpenPostRide,
  onAcceptOffer,
  onSendOffer,
  onOpenChat,
  onCancelTrip,
  onCompleteTrip,
  onCancelBooking,
  onOpenRating,
  onPublishReturnRide,
  onApproveBooking,
  onDeclineBooking
}) {
  // Top Level Mode: 'PASSENGER' (Section 1) vs 'DRIVER' (Section 2)
  const [activeSection, setActiveSection] = useState('PASSENGER');
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState(null);

  // Find user's published car trips (only active ones)
  const userPublishedTrips = driverRides.filter(r => {
    const dName = (r.driver?.name || '').toLowerCase().trim();
    const uName = (user.fullName || '').toLowerCase().trim();
    const uFirst = uName.split(' ')[0];
    const isUserDriver = dName === uName || (uFirst.length > 2 && dName.includes(uFirst));
    const isActive = r.status !== 'COMPLETED' && r.status !== 'CANCELLED';
    return isUserDriver && isActive;
  });

  const activePublishedTrip = userPublishedTrips[0] || null;

  // User's own public travel requests
  const myPublicRequests = broadcasts.filter(b => {
    const pName = (b.passenger?.name || '').toLowerCase().trim();
    const uName = (user.fullName || '').toLowerCase().trim();
    const uFirst = uName.split(' ')[0];
    return pName === uName || (uFirst.length > 2 && pName.includes(uFirst));
  });

  // User's pending booking requests across all trips awaiting driver approval
  const myPendingBookings = driverRides.filter(r => {
    if (r.status === 'COMPLETED' || r.status === 'CANCELLED') return false;
    const uName = (user.fullName || '').toLowerCase().trim();
    const uFirst = uName.split(' ')[0];
    return r.pendingRequests && r.pendingRequests.some(p => {
      const pName = typeof p === 'string' ? p : (p?.name || '');
      const pLower = pName.toLowerCase().trim();
      return pLower === uName || (uFirst.length > 2 && pLower.includes(uFirst));
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. UNIFIED USER PROFILE & SECTION SWITCHER HEADER */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-indigo-950/70 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          {/* User Profile Snippet */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1 border-2 border-gray-950 text-white" title="Govt Aadhaar KYC Verified">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.fullName}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  VERIFIED MEMBER
                </span>
                {user.womenOnlyHost && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                    WOMEN ONLY HOST
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {user.company || 'Verified Professional'} • {user.phone} • Aadhaar: {user.aadhaarMasked || 'XXXX-XXXX-4412'}
              </p>
              <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                <span className="text-amber-400 font-bold">★ {user.rating} Rating</span>
                <span>•</span>
                <span>SafePay Escrow: <strong className="text-emerald-400 font-mono">₹{user.safePayBalanceInr || 1250}</strong></span>
              </div>
            </div>
          </div>

          {/* Dual Action CTAs */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenBroadcastModal}
              className="px-4 py-2.5 rounded-2xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-teal-300 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Need (₹)</span>
            </button>
            <button
              onClick={onOpenPostRide}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Publish Car Trip</span>
            </button>
          </div>

        </div>

        {/* SECTION 1 vs SECTION 2 vs SECTION 3 MAIN TABS */}
        <div className="mt-8 pt-4 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 p-1.5 bg-gray-950/80 border border-gray-800 rounded-2xl w-full sm:w-auto gap-1">
            
            {/* Tab 1: Passenger Mode */}
            <button
              onClick={() => setActiveSection('PASSENGER')}
              className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                activeSection === 'PASSENGER'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Bookings (Passenger)</span>
            </button>

            {/* Tab 2: Driver Mode */}
            <button
              onClick={() => setActiveSection('DRIVER')}
              className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                activeSection === 'DRIVER'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>My Car Trip (Driver)</span>
            </button>

            {/* Tab 3: Two-Way Reviews & Reputation */}
            <button
              onClick={() => setActiveSection('REVIEWS')}
              className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                activeSection === 'REVIEWS'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Two-Way Reviews</span>
            </button>

          </div>

          <span className="text-[11px] text-gray-400">
            {activeSection === 'PASSENGER' 
              ? 'Viewing your reserved seats, public travel requests, and incoming driver offers.'
              : activeSection === 'DRIVER'
              ? 'Viewing your published car trips and public passenger requests coming in-between your route.'
              : 'Viewing reciprocal two-way ratings: reviews given & reviews received as host driver and co-passenger.'
            }
          </span>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PASSENGER MODE (Booked Seats, Public Requests, Driver Invites) */}
      {/* ========================================================================= */}
      {activeSection === 'PASSENGER' && (
        <div className="space-y-6">

          {/* PENDING RIDE BOOKINGS (AWAITING HOST DRIVER CONFIRMATION) */}
          {myPendingBookings.length > 0 && (
            <div className="bg-gradient-to-r from-amber-950/70 via-gray-900 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-black text-amber-300 uppercase tracking-wide">
                        Pending Booking Request{myPendingBookings.length > 1 ? 's' : ''} ({myPendingBookings.length})
                      </h4>
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full animate-pulse">
                        Awaiting Driver Confirmation
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Your seat request has been delivered to the host driver. You will receive real-time confirmation as soon as they accept.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {myPendingBookings.map((trip) => (
                  <div key={trip.id} className="bg-gray-950/90 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                          {trip.id}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-300 font-semibold">{trip.departureTime || 'Today'}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-black text-emerald-400">₹{trip.pricePerSeat}/seat</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-[11px] text-amber-400 font-mono font-bold">1 Seat Requested</span>
                      </div>
                      <h5 className="text-lg font-black text-white">
                        {trip.origin} <span className="text-teal-400">➔</span> {trip.destination}
                      </h5>

                      {/* Driver info */}
                      <div className="flex items-center space-x-3 pt-1">
                        <img
                          src={trip.driver?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                          alt={trip.driver?.name}
                          className="w-8 h-8 rounded-full object-cover border border-amber-400"
                        />
                        <div className="text-xs">
                          <span className="text-white font-bold">{trip.driver?.name}</span>
                          <span className="text-gray-400 ml-2">★ {trip.driver?.rating || 5.0} • {trip.vehicle?.make} {trip.vehicle?.model} ({trip.vehicle?.plate})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {onOpenChat && (
                        <button
                          type="button"
                          onClick={() => onOpenChat(trip.driver, trip)}
                          className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-teal-300 border border-teal-500/40 font-bold text-xs transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
                        >
                          <MessageCircle className="w-4 h-4 text-teal-400" />
                          <span>Chat with Driver</span>
                        </button>
                      )}
                      {onCancelBooking && (
                        <button
                          type="button"
                          onClick={() => onCancelBooking(trip.id)}
                          className="py-2.5 px-3.5 rounded-xl bg-gray-900 hover:bg-red-950/60 text-red-400 border border-red-500/30 font-bold text-xs transition-all active:scale-95"
                          title="Withdraw your pending seat request"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Booked Trip HUD (Where I booked a seat in someone's car) */}
          {activeTrip && activeTrip.status !== 'COMPLETED' && activeTrip.status !== 'CANCELLED' ? (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      My Active Booked Ride • Single Booking Slot Active (1/1)
                    </span>
                    <span className="text-xs bg-gray-800 text-gray-300 font-mono px-2 py-0.5 rounded">
                      {activeTrip.tripId}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    {activeTrip.pickupPoint?.name || 'Pickup'} ➔ {activeTrip.dropoffPoint?.name || 'Dropoff'}
                  </h3>

                  {/* Driver & Car Snippet */}
                  <div className="flex flex-wrap items-center gap-4 bg-gray-950 p-4 rounded-2xl border border-gray-800 text-xs">
                    {activeTrip.driver && (
                      <div className="flex items-center space-x-3">
                        <img
                          src={activeTrip.driver.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                          alt={activeTrip.driver.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                        />
                        <div>
                          <span className="font-bold text-white block">{activeTrip.driver.name}</span>
                          <span className="text-[11px] text-gray-400">Host Driver • ★ {activeTrip.driver.rating || 5.0}</span>
                        </div>
                      </div>
                    )}

                    {activeTrip.vehicle && (
                      <div className="border-l border-gray-800 pl-4">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Vehicle</span>
                        <span className="font-bold text-white">{activeTrip.vehicle.make} {activeTrip.vehicle.model}</span>
                        <span className="text-amber-300 font-mono text-[11px] block">{activeTrip.vehicle.plate}</span>
                      </div>
                    )}

                    <div className="border-l border-gray-800 pl-4">
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Status</span>
                      <span className="font-bold text-emerald-400 text-sm font-mono">{activeTrip.status || 'CONFIRMED'}</span>
                      <span className="text-[10px] text-gray-400 block">1 Seat Reserved</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-2">
                    <button
                      onClick={onOpenLiveTracking}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5 active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Watch Car Live on Satellite Map</span>
                    </button>

                    <button
                      onClick={() => onOpenChat && onOpenChat(activeTrip.driver, activeTrip)}
                      className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-emerald-300 font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message Host</span>
                    </button>

                    <button
                      onClick={onOpenManifest}
                      className="py-2.5 px-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-blue-300 font-semibold text-xs transition-all flex items-center space-x-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Receipt / Manifest</span>
                    </button>

                    {/* Complete & Cancel Booking Actions */}
                    {onCompleteTrip && (
                      <button
                        onClick={() => onCompleteTrip(activeTrip.tripId)}
                        className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95 shadow-md"
                        title="Mark ride arrived & completed"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Arrived & Complete</span>
                      </button>
                    )}

                    {/* Two-Way Verified Rating */}
                    {onOpenRating && (
                      <button
                        onClick={() => onOpenRating(activeTrip)}
                        className="py-2.5 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95"
                        title="Rate your host and leave verified feedback"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Rate Host</span>
                      </button>
                    )}

                    {onCancelBooking && (
                      <button
                        onClick={() => onCancelBooking(activeTrip.tripId)}
                        className="py-2.5 px-3.5 rounded-xl bg-gray-800 hover:bg-red-950/50 text-red-400 border border-red-500/30 font-bold text-xs transition-all active:scale-95"
                        title="Cancel seat reservation and free your booking slot"
                      >
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* SafePay Escrow Card */}
                <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 text-center lg:w-72 space-y-2 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">SafePay Escrow Status</span>
                  <span className="text-2xl font-black text-emerald-400 block font-mono">₹{activeTrip.fareTotal || 580}</span>
                  <span className="text-[11px] text-gray-300 block font-medium">Locked safely in escrow</span>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Funds will automatically release to {activeTrip.driver?.name || 'host'} upon verified arrival.
                  </p>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30">
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {myPendingBookings.length > 0 ? 'Seat Request Pending Driver Approval' : 'No Active Ride Booked'}
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  {myPendingBookings.length > 0
                    ? `You have ${myPendingBookings.length} booking request pending driver acceptance above. Once confirmed by the driver, your Statutory Travel Pass and live tracking will activate here.`
                    : 'You currently have 1 ride booking slot available. Browse verified carpools on the Find Rides page or broadcast your travel request with your custom budget below.'
                  }
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  onClick={onOpenBroadcastModal}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Broadcast Your Budget (₹)
                </button>
              </div>
            </div>
          )}

          {/* My Public Broadcast Requests & Incoming Driver Invites */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>My Public Travel Requests & Incoming Car Offers</span>
                  <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-bold">
                    {myPublicRequests.length} Active
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Requests broadcasted to the public. Car owners driving this corridor see your budget and send you car invites.
                </p>
              </div>

              <button
                onClick={onOpenBroadcastModal}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center space-x-1"
              >
                <span>+ Create New Public Request</span>
              </button>
            </div>

            {myPublicRequests.map(req => (
              <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
                
                {/* Request Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="text-sm font-bold text-white">{req.origin} ➔ {req.destination}</span>
                    </div>
                    <span className="text-xs text-gray-400 block">
                      Preferred Time: {req.desiredTime} • Luggage: {req.luggage}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Your Stated Budget</span>
                    <span className="text-xl font-black text-amber-400">₹{req.budgetInRupees} / seat</span>
                  </div>
                </div>

                {/* Incoming Car Invites from Drivers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Car Invites Received From Drivers ({(req.driverOffers || []).length})</span>
                  </h4>

                  {(req.driverOffers || []).length === 0 ? (
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800/80 text-center text-xs text-gray-400">
                      Drivers driving along this corridor will see your public request and send you a car offer shortly.
                    </div>
                  ) : (
                    req.driverOffers.map((offer, idx) => (
                      <div key={idx} className="bg-gray-950 p-4 rounded-xl border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-xs">{offer.driverName}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded font-semibold">
                              {offer.car}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">
                            "You can go with us! Pickup estimate: <strong>{offer.pickupEstimate}</strong>. {offer.note || ''}"
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 block">Offered Fare</span>
                            <span className="text-base font-black text-emerald-400">₹{offer.offeredFare}</span>
                          </div>

                          <button
                            onClick={() => onAcceptOffer(req, offer)}
                            className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept & Reserve</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DRIVER MODE (My Car Trips & In-Between Passenger Request Matcher) */}
      {/* ========================================================================= */}
      {activeSection === 'DRIVER' && (
        <div className="space-y-8">
          
          {/* Driver's Published Car Trip Card */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-950/70 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  My Published Car Trip
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {activePublishedTrip ? `${activePublishedTrip.origin} ➔ ${activePublishedTrip.destination}` : 'No Car Trip Published Yet'}
                </h3>
                {activePublishedTrip && (
                  <p className="text-xs text-gray-300 mt-0.5">
                    Departure: {activePublishedTrip.departureTime} • Vehicle: {activePublishedTrip.vehicle?.make} {activePublishedTrip.vehicle?.model} ({activePublishedTrip.vehicle?.plate})
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {activePublishedTrip ? (
                  <>
                    <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800 text-right">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Your Fare / Seat</span>
                      <span className="text-lg font-black text-emerald-400">₹{activePublishedTrip.pricePerSeat}</span>
                      <span className="text-[10px] text-emerald-400 block font-semibold">{activePublishedTrip.seatsAvailable} seats available</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {onPublishReturnRide && (
                        <button
                          onClick={() => onPublishReturnRide(activePublishedTrip)}
                          className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1"
                          title="Quick reverse route & publish return trip"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Return Trip</span>
                        </button>
                      )}
                      {onCompleteTrip && (
                        <button
                          onClick={() => onCompleteTrip(activePublishedTrip.id)}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1"
                          title="Mark trip completed and free your driver slot"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Complete Trip</span>
                        </button>
                      )}
                      {onCancelTrip && (
                        <button
                          onClick={() => onCancelTrip(activePublishedTrip.id)}
                          className="py-2.5 px-3.5 rounded-xl bg-gray-800 hover:bg-red-950/50 text-red-400 border border-red-500/30 font-bold text-xs transition-all active:scale-95"
                          title="Cancel trip and free your driver slot"
                        >
                          <span>Cancel Trip</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={onOpenPostRide}
                    className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Publish My Car Trip (1 Slot Available)</span>
                  </button>
                )}
              </div>
            </div>

            {/* INCOMING PENDING PASSENGER BOOKING REQUESTS (ON-REQUEST APPROVAL FLOW) */}
            {activePublishedTrip && (activePublishedTrip.pendingRequests || []).length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/60 via-gray-950 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                      <Clock className="w-4 h-4 animate-spin" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                        Pending Booking Requests ({activePublishedTrip.pendingRequests.length})
                      </h4>
                      <p className="text-xs text-gray-300">
                        Review passenger profiles and approve or decline their seat reservation requests.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                    Awaiting Your Approval
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePublishedTrip.pendingRequests.map((req, idx) => (
                    <div key={idx} className="bg-gray-900 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={req.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                            alt={req.name}
                            className="w-11 h-11 rounded-full object-cover border-2 border-amber-400"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h5 className="text-sm font-bold text-white">{req.name}</h5>
                              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                                ★ {req.rating || 5.0}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">{req.company || 'Verified Professional'}</p>
                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{req.phone || '+91 98XXX-X0011'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block uppercase font-bold">Seats</span>
                          <span className="text-sm font-black text-amber-300">{req.seats || 1} Seat</span>
                        </div>
                      </div>

                      <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 text-[11px] text-gray-300 flex items-center justify-between">
                        <span>Pickup: <strong>{req.notes || `${activePublishedTrip.origin} ➔ ${activePublishedTrip.destination}`}</strong></span>
                        <span className="text-emerald-400 font-bold">₹{activePublishedTrip.pricePerSeat}</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        {onOpenChat && (
                          <button
                            type="button"
                            onClick={() => onOpenChat({ name: req.name, avatar: req.avatar, phone: req.phone }, activePublishedTrip)}
                            className="py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 font-bold text-xs transition-all flex items-center space-x-1"
                            title="Chat with passenger"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-teal-400" />
                            <span>Chat</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeclineBooking && onDeclineBooking(activePublishedTrip.id, req.name)}
                          className="py-2 px-3 rounded-xl bg-gray-800 hover:bg-red-950/60 text-red-400 border border-red-500/30 font-bold text-xs transition-all active:scale-95"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => onApproveBooking && onApproveBooking(activePublishedTrip.id, req.name)}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Yes, I Accept / Confirm Ride</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. SEAT OCCUPANCY & REMAINING BREAKDOWN */}
            {activePublishedTrip && (() => {
              const totalSeats = activePublishedTrip.totalSeats || 3;
              const remainingSeats = activePublishedTrip.seatsAvailable !== undefined ? activePublishedTrip.seatsAvailable : 2;
              const bookedCount = Math.max(0, totalSeats - remainingSeats);
              const bookedList = activePublishedTrip.bookedPassengers && activePublishedTrip.bookedPassengers.length > 0
                ? activePublishedTrip.bookedPassengers
                : (activePublishedTrip.passengers || []).map((pName, idx) => ({
                    bookingId: `BK-10${idx + 1}`,
                    name: typeof pName === 'string' ? pName : (pName.name || 'Verified Passenger'),
                    phone: '+91 98XXX-X4921',
                    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
                    bookedAt: 'Today',
                    seats: 1,
                    fare: activePublishedTrip.pricePerSeat,
                    escrowStatus: 'SECURED_ESCROW'
                  }));

              return (
                <div className="space-y-4">
                  {/* Visual Seat Capacity Dashboard */}
                  <div className="bg-gray-950 p-4 sm:p-5 rounded-2xl border border-gray-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-900 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Vehicle Capacity &amp; Live Seat Manifest
                        </span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-base font-black text-white">{totalSeats} Total Passenger Seats</span>
                          <span>•</span>
                          <span className="text-xs font-bold text-amber-400">{bookedCount} Booked</span>
                          <span>•</span>
                          <span className="text-xs font-black text-emerald-400">{remainingSeats} Remaining Empty</span>
                        </div>
                      </div>

                      {/* Visual Seat Badges */}
                      <div className="flex items-center space-x-2">
                        {/* Driver Seat */}
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 text-xs font-bold" title="Driver (You)">
                          <Car className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Driver</span>
                        </div>

                        {/* Passenger Seats */}
                        {[...Array(totalSeats)].map((_, i) => {
                          const isOccupied = i < bookedCount;
                          const passenger = isOccupied ? bookedList[i] : null;

                          return (
                            <div
                              key={i}
                              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                                isOccupied
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              }`}
                              title={isOccupied ? `Seat #${i + 1}: Booked by ${passenger?.name || 'Passenger'}` : `Seat #${i + 1}: Empty Available Seat`}
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>{isOccupied ? `Seat ${i + 1}: ${passenger?.name?.split(' ')[0] || 'Booked'}` : `Seat ${i + 1}: Empty`}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. WHO BOOKED MY CAR: PASSENGERS ROSTER */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Passengers Who Booked Your Car ({bookedList.length})</span>
                        </h4>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {remainingSeats} seats still open for booking
                        </span>
                      </div>

                      {bookedList.length === 0 ? (
                        <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 text-center space-y-1">
                          <p className="text-xs text-gray-300 font-semibold">
                            No passengers have booked yet
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Your car is live on the passenger radar with <strong className="text-emerald-400">{remainingSeats} empty seats available</strong>. As passengers book, they will immediately appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {bookedList.map((passenger, idx) => (
                            <div key={idx} className="bg-gray-900/90 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <img
                                    src={passenger.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                                    alt={passenger.name}
                                    className="w-10 h-10 rounded-full object-cover border border-emerald-400"
                                  />
                                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-gray-950 text-white">
                                    <ShieldCheck className="w-3 h-3" />
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h5 className="text-xs font-bold text-white">{passenger.name}</h5>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                      CONFIRMED
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-gray-400 block font-mono">
                                    {passenger.phone || '+91 98XXX-X4921'}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-semibold block">
                                    SafePay: ₹{passenger.fare || activePublishedTrip.pricePerSeat} Escrow Secured
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col items-end space-y-1">
                                {onOpenChat && (
                                  <button
                                    onClick={() => onOpenChat({ name: passenger.name, avatar: passenger.avatar, phone: passenger.phone }, activePublishedTrip)}
                                    className="py-1.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-emerald-300 font-bold text-xs transition-all flex items-center space-x-1 active:scale-95"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>Chat</span>
                                  </button>
                                )}
                                <span className="text-[9px] text-gray-500 font-mono">Seat #{idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Explain the Core Feature Logic */}
            <div className="bg-gray-950/80 p-4 rounded-2xl border border-gray-800 text-xs text-gray-300 flex items-start space-x-3">
              <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Automatic Highway In-Between Route Matcher</span>
                <span className="text-[11px] text-gray-400 leading-relaxed block mt-0.5">
                  Passengers create their travel requests publicly with their budget. 
                  Below, our corridor engine inspects all public passenger requests and only unlocks the <strong>"You Can Go With Us"</strong> invite button for passengers whose pickup and drop points <strong>come in-between your published car journey</strong>!
                </span>
              </div>
            </div>

          </div>

          {/* PUBLIC PASSENGER REQUESTS RADAR (WITH IN-BETWEEN ROUTE CHECK) */}
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Public Passenger Requests Along Your Route</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    {broadcasts.length} Total Public Needs
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  {activePublishedTrip 
                    ? `Filtered against your published journey: ${activePublishedTrip.origin.split(' ')[0]} ➔ ${activePublishedTrip.destination.split(' ')[0]}`
                    : 'Publish your car route above to check which passengers come in-between.'
                  }
                </p>
              </div>
            </div>

            {/* IF NO PUBLISHED TRIP: Educational Lockout Banner */}
            {!activePublishedTrip ? (
              <div className="bg-gray-900 border border-amber-500/30 rounded-3xl p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
                  <Lock className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white">Publish Your Car Trip to Unlock In-Between Passenger Invites</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  You can only send car invites to public passengers when you have published your car and its route. Once published, the system will highlight all passengers whose pickup/drop comes in-between your journey!
                </p>
                <button
                  onClick={onOpenPostRide}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
                >
                  Publish Car Trip Now
                </button>
              </div>
            ) : (
              /* IF PUBLISHED TRIP EXISTS: Render Passenger Cards with In-Between Route Badges */
              <div className="space-y-4">
                {broadcasts.map(req => {
                  const matchResult = checkInBetweenRouteMatch(req, activePublishedTrip);

                  return (
                    <div
                      key={req.id}
                      className={`rounded-3xl p-6 border transition-all ${
                        matchResult.isMatch
                          ? 'bg-gray-900 border-emerald-500/50 shadow-xl shadow-emerald-500/5 relative overflow-hidden'
                          : 'bg-gray-900/50 border-gray-800 opacity-60'
                      }`}
                    >
                      {/* Glow for matching in-between routes */}
                      {matchResult.isMatch && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                      )}

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        
                        {/* Passenger Details & Requested Route */}
                        <div className="space-y-3 flex-1">
                          
                          {/* Route Match Badge */}
                          <div className="flex items-center space-x-2">
                            {matchResult.isMatch ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1.5 animate-pulse">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Comes In-Between Your Published Route!</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3 text-gray-500" />
                                <span>Out of your highway corridor</span>
                              </span>
                            )}
                            <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2 py-0.5 rounded border border-gray-800">
                              {req.id}
                            </span>
                          </div>

                          {/* Origin to Destination */}
                          <div>
                            <h4 className="text-base font-bold text-white flex items-center space-x-2">
                              <span>{req.origin}</span>
                              <ArrowRight className="w-4 h-4 text-emerald-400" />
                              <span>{req.destination}</span>
                            </h4>
                            <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                              {matchResult.inBetweenNote || matchResult.reason}
                            </p>
                          </div>

                          {/* Passenger Profile Snippet */}
                          <div className="flex items-center space-x-4 text-xs text-gray-300">
                            <div className="flex items-center space-x-2">
                              <img
                                src={req.passenger.avatar}
                                alt={req.passenger.name}
                                className="w-7 h-7 rounded-full object-cover border border-emerald-400"
                              />
                              <span className="font-semibold text-white">{req.passenger.name}</span>
                              <span className="text-amber-400 font-bold">★ {req.passenger.rating}</span>
                            </div>
                            <span>•</span>
                            <span>Time: <strong className="text-white">{req.desiredTime}</strong></span>
                            <span>•</span>
                            <span>Luggage: {req.luggage}</span>
                          </div>

                        </div>

                        {/* Right: Passenger Budget & "You Can Go With Us" CTA */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-800 shrink-0 space-y-0 sm:space-y-2">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-gray-400 uppercase font-bold block">Passenger's Budget</span>
                            <span className="text-2xl font-black text-amber-400">₹{req.budgetInRupees}</span>
                            <span className="text-[10px] text-gray-400 block">Proposed fare</span>
                          </div>

                          {matchResult.isMatch ? (
                            <button
                              onClick={() => setSelectedRequestForOffer(req)}
                              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5 active:scale-95"
                            >
                              <Car className="w-3.5 h-3.5" />
                              <span>Send Request: You Can Go With Us</span>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="py-2 px-4 rounded-xl bg-gray-800/60 text-gray-500 text-xs font-semibold cursor-not-allowed border border-gray-800"
                              title="Cannot send invite: Passenger journey is not on your published corridor"
                            >
                              Route Does Not Match
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: TWO-WAY REVIEWS & COMMUNITY REPUTATION (BlaBlaCar Mutual Trust) */}
      {/* ========================================================================= */}
      {activeSection === 'REVIEWS' && (
        <div className="space-y-6">
          
          {/* Reputation Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Two-Way Rating Average</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-amber-400">★ {user.rating || '4.95'}</span>
                <span className="text-xs text-gray-400">/ 5.0</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                👑 Ambassador Community Tier
              </span>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Mutual Review Verification</span>
              <div className="text-2xl font-black text-white">100% Sealed</div>
              <span className="text-[11px] text-gray-300 block">
                Both parties must review each other for reciprocal reputation unlock
              </span>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Top Compliments Earned</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Safe Driving (24)
                </span>
                <span className="text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-bold">
                  Punctual (31)
                </span>
                <span className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                  Clean Vehicle (18)
                </span>
              </div>
            </div>

          </div>

          {/* List of Verified Two-Way Reviews */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>Verified Two-Way Community Reviews</span>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-bold">
                    Reciprocal
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Reviews submitted after verified trip arrivals. Both hosts and passengers receive feedback.
                </p>
              </div>

              {activeTrip && onOpenRating && (
                <button
                  onClick={() => onOpenRating(activeTrip)}
                  className="py-2 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all flex items-center space-x-1.5"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Rate Recent Trip</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {[
                {
                  id: 'REV-01',
                  reviewerName: 'Dr. Ananya Subramanian',
                  reviewerRole: 'Host Driver',
                  rating: 5,
                  tags: ['Punctual at Pickup', 'Polite & Respectful'],
                  date: '2 days ago',
                  route: 'Bengaluru ➔ Chennai',
                  comment: 'Rahul was on time at the Electronic City toll gate. Very polite and quiet passenger. Highly recommend!'
                },
                {
                  id: 'REV-02',
                  reviewerName: 'Vikramaditya Rao',
                  reviewerRole: 'Host Driver',
                  rating: 5,
                  tags: ['Respectful of Vehicle Rules', 'Prompt SafePay'],
                  date: 'Last week',
                  route: 'Bengaluru ➔ Chennai',
                  comment: 'Pleasant co-traveler. Followed all car guidelines and SafePay was cleared instantly upon arrival.'
                },
                {
                  id: 'REV-03',
                  reviewerName: 'Sneha Kulkarni',
                  reviewerRole: 'Passenger',
                  rating: 5,
                  tags: ['Smooth & Safe Driving', 'Great Music Playlist'],
                  date: '2 weeks ago',
                  route: 'Mumbai ➔ Pune',
                  comment: 'Cruised at sedate speeds on the expressway. Very safe driving and maintained comfortable AC throughout.'
                }
              ].map(rev => (
                <div key={rev.id} className="bg-gray-950 p-4 rounded-2xl border border-gray-800/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {rev.reviewerName[0]}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-white">{rev.reviewerName}</h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-400">
                            {rev.reviewerRole}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500">{rev.route} • {rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 italic">
                    "{rev.comment}"
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-medium">
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* Driver Invite Modal (When driver clicks "Send Request: You can go with us") */}
      {selectedRequestForOffer && (
        <DriverInviteModal
          request={selectedRequestForOffer}
          currentUser={user}
          onClose={() => setSelectedRequestForOffer(null)}
          onSendOffer={(reqId, offerData) => {
            onSendOffer(reqId, offerData);
            setSelectedRequestForOffer(null);
          }}
        />
      )}

    </div>
  );
}
