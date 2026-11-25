import React, { useState } from 'react';
import { 
  Radio, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Send, 
  CheckCircle, 
  Car, 
  MessageSquare,
  Sparkles,
  Filter,
  ArrowRight
} from 'lucide-react';
import { DriverInviteModal } from './DriverInviteModal';

export function PassengerBroadcastBoard({ 
  requests, 
  userMode, 
  currentUser,
  onSendDriverOffer, 
  onAcceptOfferAndTrack,
  onOpenBroadcastModal 
}) {
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState(null);
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [budgetSort, setBudgetSort] = useState('DEFAULT');

  // Filter requests
  const filteredRequests = requests.filter(req => {
    if (routeFilter === 'ALL') return true;
    return req.routeId === routeFilter;
  }).sort((a, b) => {
    if (budgetSort === 'HIGH') return b.budgetInRupees - a.budgetInRupees;
    if (budgetSort === 'LOW') return a.budgetInRupees - b.budgetInRupees;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Banner / Feature Callout */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-gray-900 border border-emerald-500/30 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Passenger Travel Requests
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Live Corridor Radar
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Passengers share their travel routes and budget (₹). Drivers heading on that corridor can review and send a car ride invite directly.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenBroadcastModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Post Travel Request (₹)</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-6 pt-4 border-t border-gray-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 font-semibold mr-1 flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1 text-gray-500" /> Filter Corridors:
          </span>
          {[
            { id: 'ALL', label: 'All Corridors' },
            { id: 'BLR-MAA', label: 'Bengaluru ⇄ Chennai (NH 44)' },
            { id: 'DEL-CHD', label: 'Delhi ⇄ Chandigarh (NH 44)' },
            { id: 'MUM-PUN', label: 'Mumbai ⇄ Pune (Expressway)' }
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setRouteFilter(pill.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                routeFilter === pill.id
                  ? 'bg-emerald-500 text-gray-950 font-bold shadow-sm'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80 border border-gray-700/50'
              }`}
            >
              {pill.label}
            </button>
          ))}

          <div className="ml-auto flex items-center space-x-2">
            <span className="text-gray-400">Sort Budget:</span>
            <select
              value={budgetSort}
              onChange={(e) => setBudgetSort(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-xs rounded-lg px-2.5 py-1 text-gray-200 focus:outline-none"
            >
              <option value="DEFAULT">Recommended</option>
              <option value="HIGH">Highest Budget (₹)</option>
              <option value="LOW">Lowest Budget (₹)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Broadcast Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRequests.map(req => (
          <div
            key={req.id}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between relative group"
          >
            {/* Top Row: Passenger Profile & Proposed Budget */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={req.passenger.avatar}
                      alt={req.passenger.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/80"
                    />
                    {req.passenger.isAadhaarVerified && (
                      <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-0.5 border-2 border-gray-900 text-white shadow-sm" title="Govt ID Verified">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-sm font-bold text-white">{req.passenger.name}</h3>
                      {req.passenger.isCorporateVerified && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                          {req.passenger.company}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
                      <span className="text-amber-400 font-bold">★ {req.passenger.rating}</span>
                      <span>•</span>
                      <span>{req.passenger.completedTrips} trips</span>
                    </div>
                  </div>
                </div>

                {/* Prominent Budget Badge (User requirement #2) */}
                <div className="text-right bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block tracking-wider">
                    Passenger Budget
                  </span>
                  <div className="flex items-center justify-end text-lg font-black text-amber-400">
                    <span>₹{req.budgetInRupees}</span>
                    <span className="text-[11px] font-normal text-gray-400 ml-1">/ seat</span>
                  </div>
                </div>
              </div>

              {/* Route & Travel Windows */}
              <div className="mt-4 bg-gray-950/70 p-3.5 rounded-xl border border-gray-800/80 space-y-2">
                <div className="flex items-center space-x-2 text-xs text-gray-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></div>
                  <span className="font-semibold">{req.origin}</span>
                </div>
                <div className="pl-1 text-gray-600 text-xs">│</div>
                <div className="flex items-center space-x-2 text-xs text-gray-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></div>
                  <span className="font-semibold">{req.destination}</span>
                </div>

                <div className="pt-2 border-t border-gray-900 grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{req.desiredTime}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <span>{req.seatsNeeded} seat requested</span>
                  </div>
                </div>
              </div>

              {/* Luggage & Notes */}
              <div className="mt-3 flex items-start space-x-2 text-xs text-gray-300">
                <Briefcase className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                <span className="text-[11px] text-gray-400">
                  <strong>Luggage:</strong> {req.luggage}
                </span>
              </div>
              {req.notes && (
                <p className="mt-1.5 text-[11px] text-gray-400 italic bg-gray-950/40 p-2 rounded-lg border border-gray-800/50">
                  "{req.notes}"
                </p>
              )}

              {/* Existing Driver Offers on this Request */}
              {req.driverOffers && req.driverOffers.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                    <Car className="w-3.5 h-3.5" />
                    <span>Active Driver Offers ({req.driverOffers.length})</span>
                  </span>
                  
                  {req.driverOffers.map((offer, idx) => (
                    <div 
                      key={idx}
                      className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <span>{offer.driverName}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">• {offer.car}</span>
                        </div>
                        <span className="text-[11px] text-gray-400">
                          Pickup around {offer.pickupEstimate} • Offered: <strong className="text-emerald-300">₹{offer.offeredFare}</strong>
                        </span>
                      </div>

                      {/* Passenger Accept Action */}
                      <button
                        onClick={() => onAcceptOfferAndTrack(req, offer)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                      >
                        Accept & Track
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="mt-5 pt-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mr-1" />
                Verified Community Shield
              </span>

              {/* Send Car Request / Offer Ride Button */}
              <button
                onClick={() => setSelectedRequestForOffer(req)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Send Car Request (₹)</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Driver Invite Modal */}
      {selectedRequestForOffer && (
        <DriverInviteModal
          request={selectedRequestForOffer}
          currentUser={currentUser}
          onClose={() => setSelectedRequestForOffer(null)}
          onSendOffer={onSendDriverOffer}
        />
      )}

    </div>
  );
}
