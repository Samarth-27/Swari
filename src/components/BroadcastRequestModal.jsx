import React, { useState } from 'react';
import { X, Send, IndianRupee, MapPin, Calendar, Users, Briefcase, ShieldCheck } from 'lucide-react';

export function BroadcastRequestModal({ onClose, onPublishRequest }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [desiredTime, setDesiredTime] = useState('Tomorrow morning, 07:30 AM');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [budgetInRupees, setBudgetInRupees] = useState(550);
  const [luggage, setLuggage] = useState('1 Backpack + 1 Small Cabin Bag');
  const [notes, setNotes] = useState('Sedate driving preferred. Can meet anywhere near highway flyover.');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    const newReq = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      routeId: 'BLR-MAA',
      passenger: {
        name: 'You (Verified Traveler)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        rating: 5.0,
        completedTrips: 1,
        isAadhaarVerified: true,
        isCorporateVerified: true,
        company: 'Swari Verified Community'
      },
      origin,
      destination,
      desiredTime,
      seatsNeeded: Number(seatsNeeded),
      budgetInRupees: Number(budgetInRupees),
      luggage,
      notes,
      driverOffers: []
    };

    onPublishRequest(newReq);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Broadcast Ride Request</h3>
              <p className="text-xs text-gray-400">Car owners heading your way will send you ride offers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center mx-auto animate-bounce">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Request Broadcasted Live!</h4>
            <p className="text-xs text-gray-300">
              Your route and budget of <strong>₹{budgetInRupees}</strong> is now live on the car owner radar.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pickup City / Spot</span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Bengaluru (Electronic City)"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>Drop-off City / Area</span>
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Chennai (Koyambedu)"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            {/* Travel Time & Seats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Target Travel Window</span>
                </label>
                <input
                  type="text"
                  value={desiredTime}
                  onChange={(e) => setDesiredTime(e.target.value)}
                  placeholder="e.g. Tomorrow, 7:00 AM - 9:00 AM"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span>Seats Needed</span>
                </label>
                <select
                  value={seatsNeeded}
                  onChange={(e) => setSeatsNeeded(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value={1}>1 Passenger Seat</option>
                  <option value={2}>2 Passenger Seats</option>
                  <option value={3}>3 Passenger Seats</option>
                </select>
              </div>
            </div>

            {/* Your Proposed Budget (In Rupees) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white">Your Proposed Budget (in ₹)</span>
                </span>
                <span className="text-[10px] text-amber-300 font-semibold">Drivers will see this budget</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  value={budgetInRupees}
                  onChange={(e) => setBudgetInRupees(e.target.value)}
                  min="100"
                  max="5000"
                  step="50"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-8 pr-3 py-2.5 text-base font-black text-amber-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Suggested fair price for standard sedans: ~₹1.6 – ₹2.0 per km.
              </p>
            </div>

            {/* Luggage & Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span>Luggage Details & Special Requests</span>
              </label>
              <input
                type="text"
                value={luggage}
                onChange={(e) => setLuggage(e.target.value)}
                placeholder="e.g. 1 Laptop backpack, 1 medium trolley"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast to Car Owners</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
