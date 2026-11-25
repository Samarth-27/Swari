import React, { useState } from 'react';
import { 
  X, 
  Car, 
  MapPin, 
  Calendar, 
  IndianRupee, 
  Users, 
  ShieldCheck, 
  Heart, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Sliders,
  Briefcase,
  Zap,
  Info,
  ArrowRightLeft
} from 'lucide-react';

export function PostRideModal({ currentUser, onClose, onPublishRide, activePublishedTrip = null, onCancelTrip = null }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Route, 2: Schedule & Seats, 3: Pricing & Legal, 4: Rules & Publish

  // Form State
  const [routeCorridor, setRouteCorridor] = useState('BLR-MAA');
  const [origin, setOrigin] = useState('Bengaluru (Electronic City Toll Gate)');
  const [destination, setDestination] = useState('Chennai (Koyambedu CMBT Metro)');
  const [departureDate, setDepartureDate] = useState('Today');
  const [departureTime, setDepartureTime] = useState('05:30 PM');
  
  // Two-Way / Round-Trip Publishing
  const [isTwoWayTrip, setIsTwoWayTrip] = useState(false);
  const [returnDate, setReturnDate] = useState('Tomorrow');
  const [returnTime, setReturnTime] = useState('06:00 PM');
  
  // Vehicle & Seats
  const [carModel, setCarModel] = useState(() => currentUser?.vehicleModel ? `${currentUser.vehicleMake || ''} ${currentUser.vehicleModel}` : 'Tata Nexon EV');
  const [plate, setPlate] = useState(() => currentUser?.vehiclePlate || `DL 01 AB ${Date.now().toString().slice(-4)}`);
  const [seatsAvailable, setSeatsAvailable] = useState(2);
  const [maxTwoBack, setMaxTwoBack] = useState(true);

  // Pricing & Motor Vehicles Act
  const [pricePerSeat, setPricePerSeat] = useState(580);
  const statutoryCeiling = 680; // Calculated statutory maximum for this corridor
  const recommendedFare = 550;
  
  // Trip Amenities & Safety
  const [acEnabled, setAcEnabled] = useState(true);
  const [luggageSize, setLuggageSize] = useState('MEDIUM'); // 'SMALL' | 'MEDIUM' | 'LARGE'
  const [womenOnly, setWomenOnly] = useState(false);
  const [chattiness, setChattiness] = useState('Friendly & Conversational');

  // Booking Mode (BlaBlaCar parity)
  const [bookingMode, setBookingMode] = useState('INSTANT'); // 'INSTANT' | 'ON_REQUEST'

  const [isSuccess, setIsSuccess] = useState(false);

  // AI Price Suggestion based on corridor distance
  const CORRIDOR_KM = { 'BLR-MAA': 345, 'DEL-CHD': 245, 'MUM-PUN': 148 };
  const getAiSuggestedPrice = () => {
    const km = CORRIDOR_KM[routeCorridor] || 300;
    const seats = Math.max(1, seatsAvailable);
    return Math.round((km * 1.85) / seats / 10) * 10;
  };

  const handleCorridorChange = (corridorId) => {
    setRouteCorridor(corridorId);
    if (corridorId === 'BLR-MAA') {
      setOrigin('Bengaluru (Silk Board / Electronic City)');
      setDestination('Chennai (Koyambedu / Guindy)');
      setPricePerSeat(580);
    } else if (corridorId === 'DEL-CHD') {
      setOrigin('Delhi NCR (Kashmere Gate / Mukarba Chowk)');
      setDestination('Chandigarh (Tribune Chowk / Sector 17)');
      setPricePerSeat(480);
    } else if (corridorId === 'MUM-PUN') {
      setOrigin('Navi Mumbai (Vashi / Kalamboli)');
      setDestination('Pune (Wakad / Hinjewadi Bridge)');
      setPricePerSeat(350);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newRide = {
      id: `RIDE-${Date.now().toString().slice(-4)}`,
      routeId: routeCorridor,
      driverId: currentUser?.id,
      driver: {
        id: currentUser?.id,
        name: currentUser?.fullName || 'Host Driver',
        rating: currentUser?.rating || 5.0,
        totalRides: currentUser?.totalHostedRides || 1,
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        isAadhaarVerified: true,
        isDlVerified: true,
        isPoliceVerified: true,
        chattiness,
        phoneMasked: currentUser?.phone ? currentUser.phone.replace(/(\d{5})\d{5}/, '$1-XXXXX') : '+91 98XXX-X0011'
      },
      vehicle: {
        make: carModel.split(' ')[0] || 'Car',
        model: carModel,
        plate: plate.toUpperCase(),
        color: 'Daytona Grey',
        ac: acEnabled,
        music: 'Curated Highway Playlist',
        maxTwoInBack: maxTwoBack
      },
      origin,
      destination,
      departureTime: `${departureDate}, ${departureTime}`,
      seatsAvailable: Number(seatsAvailable),
      totalSeats: 3,
      pricePerSeat: Number(pricePerSeat),
      luggageSize,
      allowSmoking: false,
      allowPets: false,
      womenOnly,
      bookingMode,
      isTwoWayTrip,
      returnLeg: isTwoWayTrip ? {
        origin: destination,
        destination: origin,
        departureTime: `${returnDate}, ${returnTime}`,
        seatsAvailable: Number(seatsAvailable),
        pricePerSeat: Number(pricePerSeat)
      } : null,
      status: 'ACTIVE_AVAILABLE'
    };

    onPublishRide(newRide);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Publish a Carpool Ride</h3>
              <p className="text-xs text-gray-400">Step {currentStep} of 4 • Offset fuel costs legally</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 pt-4 pb-2 shrink-0">
          {[
            { num: 1, label: 'Route' },
            { num: 2, label: 'Schedule' },
            { num: 3, label: 'Price (₹)' },
            { num: 4, label: 'Publish' }
          ].map(s => (
            <div key={s.num} className="space-y-1">
              <div className={`h-1.5 rounded-full transition-all ${
                currentStep >= s.num ? 'bg-emerald-500' : 'bg-gray-800'
              }`} />
              <span className={`text-[10px] block text-center font-bold uppercase tracking-wider ${
                currentStep === s.num ? 'text-emerald-400' : 'text-gray-500'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Modal Body / Steps */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          
          {/* Active Trip Blocking Notice */}
          {activePublishedTrip && activePublishedTrip.status !== 'COMPLETED' && activePublishedTrip.status !== 'CANCELLED' ? (
            <div className="bg-gradient-to-r from-amber-950/80 via-gray-900 to-amber-950/80 border border-amber-500/50 rounded-2xl p-6 text-xs space-y-4 my-auto">
              <div className="flex items-center space-x-3 text-amber-400 font-bold text-sm">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Active Car Trip Already Published</h3>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Single Active Car Trip Rule (1 at a time)</span>
                </div>
              </div>

              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Route:</span>
                  <span className="font-bold text-white">{activePublishedTrip.origin} ➔ {activePublishedTrip.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Departure:</span>
                  <span className="font-semibold text-emerald-400">{activePublishedTrip.departureTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Seats Available:</span>
                  <span className="font-bold text-white">{activePublishedTrip.seatsAvailable} Empty Seat(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fare:</span>
                  <span className="font-bold text-emerald-400">₹{activePublishedTrip.pricePerSeat} / seat</span>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed">
                Under statutory safety and carpooling compliance, a driver can only host <strong>one car trip at a time</strong>. You cannot publish multiple concurrent trips. Complete or cancel your existing trip to publish a new one.
              </p>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-all"
                >
                  Keep Active Trip
                </button>
                {onCancelTrip && (
                  <button
                    type="button"
                    onClick={() => {
                      onCancelTrip(activePublishedTrip.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
                  >
                    Cancel Existing Trip
                  </button>
                )}
              </div>
            </div>
          ) : isSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                <Sparkles className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-white">Trip Published to Live Radar!</h4>
              <p className="text-xs text-gray-300 max-w-sm mx-auto">
                Your ride on route <strong>{origin} ➔ {destination}</strong> is now live for passengers to book.
              </p>
            </div>
          ) : (
            <>
              {/* STEP 1: ROUTE & CORRIDOR */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 font-bold mb-1.5 uppercase text-[10px]">
                      Select National Highway Corridor
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'BLR-MAA', name: 'Bengaluru ⇄ Chennai', highway: 'NH 44 / NH 48' },
                        { id: 'DEL-CHD', name: 'Delhi ⇄ Chandigarh', highway: 'NH 44' },
                        { id: 'MUM-PUN', name: 'Mumbai ⇄ Pune', highway: 'Expressway' }
                      ].map(corridor => (
                        <button
                          type="button"
                          key={corridor.id}
                          onClick={() => handleCorridorChange(corridor.id)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            routeCorridor === corridor.id
                              ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                              : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          <span className="font-bold text-xs block text-white">{corridor.name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">{corridor.highway}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Origin */}
                  <div>
                    <label className="block text-gray-300 font-bold mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Departure Landmark / Pickup Spot</span>
                    </label>
                    <input
                      type="text"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      placeholder="e.g. Silk Board Flyover / Electronic City Toll"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      required
                    />
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="block text-gray-300 font-bold mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>Arrival Landmark / Dropoff Spot</span>
                    </label>
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Koyambedu CMBT Metro Station / Guindy"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      required
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: SCHEDULE, CAR & SEATS */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  
                  {/* Two-Way Trip / Round-Trip Switcher */}
                  <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Journey Direction Mode
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTwoWayTrip(false)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                          !isTwoWayTrip
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        ➔ One-Way Ride
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTwoWayTrip(true)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                          isTwoWayTrip
                            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                            : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>⇄ Two-Way (Round Trip)</span>
                      </button>
                    </div>
                  </div>

                  {/* Outbound Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-bold mb-1 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isTwoWayTrip ? 'Outbound Date' : 'Date'}</span>
                      </label>
                      <select
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option value="Today">Today</option>
                        <option value="Tomorrow">Tomorrow</option>
                        <option value="This Weekend">This Weekend</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        <span>{isTwoWayTrip ? 'Outbound Departure' : 'Departure Time'}</span>
                      </label>
                      <input
                        type="text"
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        placeholder="e.g. 05:30 PM"
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Return Date & Time (Conditional for Two-Way Trips) */}
                  {isTwoWayTrip && (
                    <div className="bg-teal-950/40 border border-teal-500/40 p-3.5 rounded-2xl space-y-2">
                      <div className="flex items-center space-x-1.5 text-teal-400 font-bold text-xs">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Return Journey Leg ({destination.split(' ')[0]} ➔ {origin.split(' ')[0]})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-300 text-[10px] font-bold mb-1">Return Date</label>
                          <select
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                          >
                            <option value="Tomorrow">Tomorrow</option>
                            <option value="This Weekend">This Weekend</option>
                            <option value="Sunday Evening">Sunday Evening</option>
                            <option value="Next Week">Next Week</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-300 text-[10px] font-bold mb-1">Return Departure Time</label>
                          <input
                            type="text"
                            value={returnTime}
                            onChange={(e) => setReturnTime(e.target.value)}
                            placeholder="e.g. 06:00 PM"
                            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Car Model & Plate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-bold mb-1 flex items-center space-x-1">
                        <Car className="w-3.5 h-3.5 text-gray-400" />
                        <span>Your Vehicle</span>
                      </label>
                      <input
                        type="text"
                        value={carModel}
                        onChange={(e) => setCarModel(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Vehicle Plate (RC)</label>
                      <input
                        type="text"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Empty Seats Selector */}
                  <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs block">Number of Empty Passenger Seats</span>
                        <span className="text-[10px] text-gray-400">Keep 1 seat empty for maximum passenger comfort</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3].map(count => (
                          <button
                            type="button"
                            key={count}
                            onClick={() => setSeatsAvailable(count)}
                            className={`w-9 h-9 rounded-xl font-black text-xs transition-all ${
                              seatsAvailable === count
                                ? 'bg-emerald-500 text-gray-950 shadow-md'
                                : 'bg-gray-900 text-gray-300 border border-gray-800 hover:bg-gray-800'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-900 flex items-center justify-between">
                      <span className="text-gray-300 text-xs">Guarantee "Max 2 in the Back Seat"</span>
                      <input
                        type="checkbox"
                        checked={maxTwoBack}
                        onChange={(e) => setMaxTwoBack(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 3: STATUTORY NON-COMMERCIAL PRICING (MV ACT 1988) */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Motor Vehicles Act 1988 Price Shield</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      To protect you from commercial taxi union challans or permit violations, Swari calculates the non-commercial fuel & toll cost ceiling for this corridor.
                    </p>
                  </div>

                  {/* Interactive Price Slider */}
                  <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Your Offered Fare</span>
                        <div className="flex items-baseline space-x-1 mt-0.5">
                          <span className="text-3xl font-black text-emerald-400">₹{pricePerSeat}</span>
                          <span className="text-xs text-gray-400">/ seat</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Legal Ceiling</span>
                        <span className="text-base font-bold text-gray-300 block font-mono">₹{statutoryCeiling}</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="250"
                      max={statutoryCeiling}
                      step="10"
                      value={pricePerSeat}
                      onChange={(e) => setPricePerSeat(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Min: ₹250</span>
                      <button
                        type="button"
                        onClick={() => setPricePerSeat(getAiSuggestedPrice())}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 font-bold transition-all"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>AI Suggest ₹{getAiSuggestedPrice()}</span>
                      </button>
                      <span>Legal Max: ₹{statutoryCeiling}</span>
                    </div>
                  </div>

                  <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 text-[11px] space-y-1 text-gray-400">
                    <div className="flex justify-between">
                      <span>Total Trip Revenue (from {seatsAvailable} passengers):</span>
                      <strong className="text-white">₹{pricePerSeat * seatsAvailable}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Fuel & Toll Cost Offset:</span>
                      <strong className="text-emerald-400">~85% of solo driving expense</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: AMENITIES, RULES & CONFIRMATION */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Ride Amenities & Preferences</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAcEnabled(!acEnabled)}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          acEnabled
                            ? 'bg-emerald-950/50 border-emerald-500 text-white font-bold'
                            : 'bg-gray-900 border-gray-800 text-gray-400'
                        }`}
                      >
                        <span>Air Conditioning</span>
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setWomenOnly(!womenOnly)}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          womenOnly
                            ? 'bg-pink-950/60 border-pink-500 text-white font-bold'
                            : 'bg-gray-900 border-gray-800 text-gray-400'
                        }`}
                      >
                        <span>Women Only</span>
                        <Heart className="w-3.5 h-3.5 text-pink-400" />
                      </button>
                    </div>

                    {/* Booking Mode — BlaBlaCar parity */}
                    <div className="pt-3 border-t border-gray-900">
                      <label className="block text-gray-400 text-[10px] uppercase font-bold mb-2">Booking Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBookingMode('INSTANT')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            bookingMode === 'INSTANT'
                              ? 'bg-emerald-950/60 border-emerald-500 text-white'
                              : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-black text-xs">Instant Book</span>
                          </div>
                          <p className="text-[10px] text-gray-400">Passengers confirmed immediately</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingMode('ON_REQUEST')}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            bookingMode === 'ON_REQUEST'
                              ? 'bg-indigo-950/60 border-indigo-500 text-white'
                              : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="font-black text-xs">On Request</span>
                          </div>
                          <p className="text-[10px] text-gray-400">You review &amp; approve each booking</p>
                        </button>
                      </div>
                    </div>

                    {/* Luggage Allowance */}
                    <div className="pt-2 border-t border-gray-900">
                      <label className="block text-gray-400 text-[10px] uppercase font-bold mb-1.5">
                        Luggage Trunk Space Allowed
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'SMALL', label: 'Small (Backpack)' },
                          { id: 'MEDIUM', label: 'Medium (Cabin Trolley)' },
                          { id: 'LARGE', label: 'Large (Full Suitcase)' }
                        ].map(luggage => (
                          <button
                            type="button"
                            key={luggage.id}
                            onClick={() => setLuggageSize(luggage.id)}
                            className={`p-2 rounded-xl text-center border transition-all text-[11px] ${
                              luggageSize === luggage.id
                                ? 'bg-teal-950 border-teal-500 text-white font-bold'
                                : 'bg-gray-900 border-gray-800 text-gray-400'
                            }`}
                          >
                            {luggage.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary Review Card */}
                  <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Route:</span>
                      <span className="font-semibold text-white">{origin} ➔ {destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Departure:</span>
                      <span className="font-semibold text-white">{departureDate}, {departureTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Seats & Price:</span>
                      <span className="font-bold text-emerald-400">{seatsAvailable} Seats @ ₹{pricePerSeat} / seat</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer Controls */}
        {!isSuccess && (!activePublishedTrip || activePublishedTrip.status === 'COMPLETED' || activePublishedTrip.status === 'CANCELLED') && (
          <div className="pt-4 border-t border-gray-800 flex items-center justify-between shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-all flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-all"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1.5 active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center space-x-2 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish Trip Live</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
