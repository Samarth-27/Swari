import React, { useState } from 'react';
import { 
  Car, 
  Gauge, 
  Radio, 
  ShieldCheck, 
  IndianRupee, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle, 
  Send, 
  Sliders, 
  Zap, 
  BatteryCharging,
  Navigation,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { socketService } from '../services/socket';
import { DriverInviteModal } from './DriverInviteModal';

export function DriverDashboard({ 
  user, 
  activeTrip, 
  broadcasts, 
  onOpenLiveTracking, 
  onOpenManifest, 
  onOpenPostRide,
  onSendOffer 
}) {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'telemetry' | 'vehicle'
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState(null);
  
  // Driver Telemetry Cockpit Controls
  const [driverSpeed, setDriverSpeed] = useState(84);
  const [batteryLevel, setBatteryLevel] = useState(78);
  const [isPingSent, setIsPingSent] = useState(false);

  const vehicle = user.vehicle || {
    make: 'Tata',
    model: 'Nexon EV Empowered',
    plate: 'KA 05 MN 2819',
    color: 'Daytona Grey',
    fuelType: 'ELECTRIC_EV',
    fastagBalance: 1420,
    insuranceValidTill: '2027-10-15'
  };

  const handleBroadcastTelemetryPing = () => {
    socketService.sendTelemetryPing({
      tripId: activeTrip.tripId,
      lat: activeTrip.currentTelemetry.lat + 0.0002,
      lng: activeTrip.currentTelemetry.lng + 0.0003,
      speedKmph: Number(driverSpeed),
      batteryPercent: Number(batteryLevel),
      timestamp: Date.now()
    });
    setIsPingSent(true);
    setTimeout(() => setIsPingSent(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Driver Profile Header & Metrics */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-950/70 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1 border-2 border-gray-900 text-white" title="Parivahan DL Verified">
                <Car className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{user.fullName}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CAR OWNER COCKPIT
                </span>
                {user.womenOnlyHost && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    WOMEN ONLY HOST
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                {vehicle.make} {vehicle.model} • <strong className="text-amber-300 font-mono">{vehicle.plate}</strong>
              </p>
              <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                <span className="text-amber-400 font-bold">★ {user.rating} Driver Rating</span>
                <span>•</span>
                <span>{user.totalHostedRides || 84} Rides Hosted</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">Parivahan DL & RC Verified</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="bg-gray-950/80 p-3 rounded-2xl border border-gray-800 text-right">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Fuel Cost Offset</span>
              <span className="text-lg font-black text-emerald-400">₹{user.fuelOffsetTotalInr || 54800}</span>
            </div>
            <button
              onClick={onOpenPostRide}
              className="flex items-center space-x-1.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Publish Trip (₹)</span>
            </button>
          </div>

        </div>

        {/* Cockpit Sub-Tabs */}
        <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center space-x-2 text-xs">
          {[
            { id: 'radar', label: `Corridor Passenger Radar (${broadcasts.length})`, icon: Radio },
            { id: 'telemetry', label: 'Live Telemetry Cockpit', icon: Gauge },
            { id: 'vehicle', label: 'Vehicle & Legal Manifest', icon: Car }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white font-bold shadow-md'
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

      {/* 2. TAB: PASSENGER RADAR & SEND BIDS */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Passengers Waiting Along Your Highway Corridor</h3>
              <p className="text-xs text-gray-400">Passengers have proposed their personal budgets in ₹. Send them a car invite matching or countering their rate.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {broadcasts.map(req => (
              <div key={req.id} className="bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={req.passenger.avatar}
                        alt={req.passenger.name}
                        className="w-11 h-11 rounded-full object-cover border border-teal-500"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-sm font-bold text-white">{req.passenger.name}</h4>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span className="text-xs text-gray-400">{req.passenger.company} • ★ {req.passenger.rating}</span>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3 py-1.5 text-right">
                      <span className="text-[10px] font-bold uppercase text-amber-300 block">Proposed Budget</span>
                      <span className="text-base font-black text-amber-400">₹{req.budgetInRupees}</span>
                    </div>
                  </div>

                  <div className="mt-3 bg-gray-950 p-3 rounded-2xl border border-gray-800 text-xs space-y-1.5">
                    <div className="font-semibold text-white">{req.origin} ➔ {req.destination}</div>
                    <div className="text-gray-400 text-[11px]">{req.desiredTime} • {req.seatsNeeded} seat • {req.luggage}</div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-gray-800">
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {req.driverOffers?.length || 0} existing offers
                  </span>

                  <button
                    onClick={() => setSelectedRequestForOffer(req)}
                    className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Car Invite (₹)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB: LIVE TELEMETRY COCKPIT */}
      {activeTab === 'telemetry' && (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Gauge className="w-5 h-5 text-emerald-400" />
                <span>Live Vehicle Telemetry Cockpit</span>
              </h3>
              <p className="text-xs text-gray-400">Control and stream live satellite GPS telemetry to your booked passengers</p>
            </div>

            <button
              onClick={onOpenLiveTracking}
              className="py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold border border-gray-700 flex items-center space-x-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Passenger Map View</span>
            </button>
          </div>

          {/* Interactive Driver Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-950 p-5 rounded-3xl border border-gray-800">
            {/* Speed Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-semibold">Current Cruising Speed:</span>
                <span className="text-base font-black text-emerald-400">{driverSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                value={driverSpeed}
                onChange={(e) => setDriverSpeed(e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 block">Cruising speed is smoothed with Kalman Filtering for passengers</span>
            </div>

            {/* Battery / Fuel */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-semibold">EV Battery Level:</span>
                <span className="text-base font-black text-teal-400">{batteryLevel}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(e.target.value)}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 block">Estimated remaining range: ~280 km</span>
            </div>
          </div>

          {/* Telemetry Ping Dispatch Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400">
              Active Trip: <strong>{activeTrip.tripId}</strong> (Passing Krishnagiri NH 44)
            </span>

            <button
              onClick={handleBroadcastTelemetryPing}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>{isPingSent ? 'GPS Ping Broadcasted!' : 'Push Real-Time GPS Ping'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. TAB: VEHICLE & LEGAL MANIFEST */}
      {activeTab === 'vehicle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>Registered Vehicle Credentials</span>
            </h4>
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Vehicle Model:</span>
                <span className="font-bold text-white">{vehicle.make} {vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registration Plate:</span>
                <span className="font-mono text-amber-300 font-bold">{vehicle.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Insurance Status:</span>
                <span className="text-emerald-400 font-semibold">Active till {vehicle.insuranceValidTill}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">FASTag Balance:</span>
                <span className="text-white font-bold">₹{vehicle.fastagBalance}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Statutory Travel Manifest (MV Act 1988)</span>
            </h4>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Carry your official digital expense-sharing manifest certifying this trip is non-commercial cost-sharing under Section 66/192A.
            </p>
            <button
              onClick={onOpenManifest}
              className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-emerald-300 border border-gray-700 font-bold text-xs transition-all flex items-center justify-center space-x-2"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>View & Print Legal Manifest</span>
            </button>
          </div>
        </div>
      )}

      {/* Driver Invite Modal */}
      {selectedRequestForOffer && (
        <DriverInviteModal
          request={selectedRequestForOffer}
          onClose={() => setSelectedRequestForOffer(null)}
          onSendOffer={onSendOffer}
        />
      )}

    </div>
  );
}
