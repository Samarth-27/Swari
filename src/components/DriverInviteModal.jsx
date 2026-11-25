
import React, { useState } from 'react';
import { X, Car, IndianRupee, Clock, Send, ShieldCheck, MapPin } from 'lucide-react';

export function DriverInviteModal({ request, onClose, onSendOffer, currentUser }) {
  const defaultCar = currentUser?.vehicle 
    ? `${currentUser.vehicle.make} ${currentUser.vehicle.model} (${currentUser.vehicle.plate})`
    : 'Tata Nexon EV (KA 05 MN 2819)';

  const [carModel, setCarModel] = useState(defaultCar);
  const [departureTime, setDepartureTime] = useState('Today, 04:45 PM');
  const [offeredFare, setOfferedFare] = useState(request ? request.budgetInRupees : 550);
  const [pickupNote, setPickupNote] = useState('Can pick you up right at the highway toll gate / metro parking.');
  const [isSent, setIsSent] = useState(false);

  if (!request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendOffer(request.id, {
      driverName: currentUser?.fullName || 'Verified Host Driver',
      driverAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      driverPhone: currentUser?.phone || '+91 98XXX-X0011',
      car: carModel,
      offeredFare: Number(offeredFare),
      pickupEstimate: departureTime,
      note: pickupNote,
      status: 'PENDING'
    });
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-white">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Send Ride Invitation</h3>
              <p className="text-xs text-gray-400">Invite {request.passenger.name} to travel with you</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSent ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <Send className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Invitation Sent!</h4>
            <p className="text-xs text-gray-300">
              {request.passenger.name} will be notified with your car offer of <strong>₹{offeredFare}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">

            {/* Passenger Route & Proposed Budget Summary */}
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Passenger Route:</span>
                <span className="font-semibold text-emerald-300">{request.origin} ➔ {request.destination}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-900">
                <span className="text-gray-400">Passenger's Proposed Budget:</span>
                <span className="text-sm font-black text-amber-400">₹{request.budgetInRupees} / seat</span>
              </div>
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Your Registered Vehicle
              </label>
              <select
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Tata Nexon EV (KA 05 MN 2819)">Tata Nexon EV (KA 05 MN 2819) • 2 Seats Left</option>
                <option value="Hyundai Creta (TN 07 BQ 6190)">Hyundai Creta (TN 07 BQ 6190) • 3 Seats Left</option>
                <option value="Mahindra XUV700 (CH 01 BW 7700)">Mahindra XUV700 (CH 01 BW 7700) • 1 Seat Left</option>
              </select>
            </div>

            {/* Departure / Pickup Time Estimate */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>Your Estimated Pickup Time</span>
              </label>
              <input
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="e.g. Today around 04:30 PM"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            {/* Fare Offer (Driver can accept or counter budget) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                <span className="flex items-center space-x-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fare You Offer (in ₹)</span>
                </span>
                <span className="text-[10px] text-gray-400">Cost-sharing under legal fuel caps</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  value={offeredFare}
                  onChange={(e) => setOfferedFare(e.target.value)}
                  min="100"
                  max="3000"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Pickup Location Note */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>Pickup / Coordination Note</span>
              </label>
              <textarea
                rows={2}
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="Mention where you can meet along the highway or flyover..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Legal Notice */}
            <p className="text-[10px] text-gray-500 leading-tight">
              By sending this invite, you certify that this trip is a non-commercial fuel & toll cost-sharing arrangement under the Motor Vehicles Act 1988.
            </p>

            {/* Buttons */}
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
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Car Offer</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
