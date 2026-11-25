import React, { useState } from 'react';
import { 
  UserCheck, 
  Navigation, 
  Radio, 
  ShieldCheck, 
  IndianRupee, 
  Clock, 
  MapPin, 
  Phone, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Car, 
  Send, 
  Briefcase,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export function PassengerDashboard({ 
  user, 
  activeTrip, 
  broadcasts, 
  onOpenLiveTracking, 
  onOpenManifest, 
  onOpenBroadcastModal,
  onAcceptOffer,
  onOpenLuggageTag 
}) {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'broadcasts' | 'shield'

  // User's own broadcast requests
  const myBroadcasts = broadcasts.filter(b => 
    b.passenger.name.includes(user.fullName.split(' ')[0]) || b.passenger.name.includes('You') || b.id === 'REQ-201'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Passenger Profile Overview Card */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-teal-950/70 border border-teal-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-400 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1 border-2 border-gray-900 text-white" title="Govt ID Verified">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.fullName}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PASSENGER DASHBOARD
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {user.company || 'Verified Traveler'} • {user.phone} • {user.email}
              </p>
              <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                <span className="text-amber-400 font-bold">★ {user.rating} Passenger Rating</span>
                <span>•</span>
                <span>{user.totalTrips} Completed Rides</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Aadhaar: {user.aadhaarMasked || 'XXXX-XXXX-4412'}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-gray-950/80 p-3 rounded-2xl border border-gray-800 text-right">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">SafePay Escrow</span>
              <span className="text-lg font-black text-emerald-400">₹{user.safePayBalanceInr || 1250}</span>
            </div>
            <button
              onClick={onOpenBroadcastModal}
              className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Need (₹)</span>
            </button>
          </div>

        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center space-x-2 text-xs">
          {[
            { id: 'bookings', label: 'Active Ride & Live Track', icon: Navigation },
            { id: 'broadcasts', label: `My Requests & Driver Bids (${myBroadcasts.length})`, icon: Radio },
            { id: 'shield', label: 'Swari Shield & Safety', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white font-bold shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TAB: ACTIVE RIDE & LIVE TRACK */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          
          {/* Active Live Ride HUD Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Route & Vehicle Details */}
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Trip In-Progress • Live Satellite Feed
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-300 font-mono px-2 py-0.5 rounded">
                    {activeTrip.tripId}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {activeTrip.pickupPoint.name} ➔ {activeTrip.dropoffPoint.name}
                </h3>

                {/* Driver & Vehicle Snippet */}
                <div className="flex items-center space-x-4 bg-gray-950 p-3.5 rounded-2xl border border-gray-800 text-xs">
                  <img
                    src={activeTrip.driver.avatar}
                    alt={activeTrip.driver.name}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                  />
                  <div>
                    <span className="font-bold text-white block">{activeTrip.driver.name}</span>
                    <span className="text-gray-400">{activeTrip.vehicle.make} {activeTrip.vehicle.model} • <strong className="text-amber-300">{activeTrip.vehicle.plate}</strong></span>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-gray-400 block text-[10px]">Fare Escrow</span>
                    <span className="text-sm font-black text-emerald-400">₹{activeTrip.fareTotal}</span>
                  </div>
                </div>
              </div>

              {/* Right Telemetry Snapshot & Action CTAs */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-950 p-3 rounded-2xl border border-gray-800">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Cruising Speed</span>
                    <span className="text-base font-black text-white">{activeTrip.currentTelemetry.speedKmph} km/h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Remaining</span>
                    <span className="text-base font-black text-white">{activeTrip.currentTelemetry.distanceRemainingKm} km</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={onOpenLiveTracking}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Open Live Map</span>
                  </button>

                  <button
                    onClick={onOpenManifest}
                    className="py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-emerald-300 border border-gray-700 text-xs font-semibold transition-all flex items-center space-x-1"
                    title="Statutory Legal Manifest under MV Act 1988"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Manifest</span>
                  </button>

                  <button
                    onClick={onOpenLuggageTag}
                    className="py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-teal-300 border border-gray-700 text-xs font-semibold transition-all flex items-center space-x-1"
                    title="Anti-theft luggage registration"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Luggage</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* 3. TAB: MY REQUESTS & DRIVER BIDS */}
      {activeTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Your Travel Broadcasts & Bids Received</h3>
            <button
              onClick={onOpenBroadcastModal}
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center space-x-1"
            >
              <span>+ Create New Broadcast</span>
            </button>
          </div>

          {myBroadcasts.map(req => (
            <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                    Active Broadcast ({req.id})
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">{req.origin} ➔ {req.destination}</h4>
                  <p className="text-xs text-gray-400">{req.desiredTime} • {req.seatsNeeded} Seat • Luggage: {req.luggage}</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3 py-1.5 text-right">
                  <span className="text-[10px] font-bold uppercase text-amber-300 block">Your Budget</span>
                  <span className="text-lg font-black text-amber-400">₹{req.budgetInRupees}</span>
                </div>
              </div>

              {/* Driver Offers Section */}
              <div className="pt-3 border-t border-gray-800 space-y-2">
                <span className="text-xs font-bold text-gray-300 flex items-center space-x-1">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Incoming Car Offers ({req.driverOffers?.length || 0})</span>
                </span>

                {req.driverOffers && req.driverOffers.length > 0 ? (
                  req.driverOffers.map((offer, idx) => (
                    <div key={idx} className="bg-gray-950 p-3.5 rounded-2xl border border-emerald-500/40 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{offer.driverName}</span>
                          <span className="text-emerald-400 font-semibold">• {offer.car}</span>
                        </div>
                        <span className="text-gray-400 text-[11px]">
                          Estimated Pickup: {offer.pickupEstimate} • Note: "{offer.note || 'Ready to pick you up'}"
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-base font-black text-emerald-400">₹{offer.offeredFare}</span>
                        <button
                          onClick={() => onAcceptOffer(req, offer)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                        >
                          Accept & Lock Seat
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic bg-gray-950 p-3 rounded-xl border border-gray-800">
                    Broadcasting live along corridor. Drivers passing your route will be alerted with your ₹{req.budgetInRupees} budget.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. TAB: SHIELD & EMERGENCY CONTACTS */}
      {activeTab === 'shield' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DigiLocker Identity Status</span>
            </h4>
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-400">Aadhaar Token:</span>
                <span className="font-mono text-emerald-400 font-bold">{user.aadhaarMasked || 'XXXX-XXXX-4412'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Facial Liveness Match:</span>
                <span className="text-white font-semibold">98.4% (Passed)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Work Email Verification:</span>
                <span className="text-blue-400 font-semibold">{user.company}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <Phone className="w-4 h-4 text-red-400" />
              <span>Emergency SOS Contacts</span>
            </h4>
            <div className="space-y-2">
              {(user.emergencyContacts || [
                { name: 'Sanjay Sharma (Father)', phone: '+91 98450-XXXXX' },
                { name: 'Priya Sharma (Sister)', phone: '+91 94480-XXXXX' }
              ]).map((c, i) => (
                <div key={i} className="flex justify-between p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                  <span className="text-white font-semibold">{c.name}</span>
                  <span className="text-gray-400 font-mono">{c.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
