import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  Calendar, 
  Car, 
  ShieldCheck, 
  IndianRupee, 
  Users, 
  CheckCircle, 
  Navigation, 
  AlertTriangle, 
  Heart, 
  Sparkles, 
  FileText,
  Phone,
  MessageCircle,
  Briefcase,
  Check,
  ChevronRight,
  Zap,
  ArrowRight,
  Printer,
  QrCode,
  Lock,
  RotateCw,
  XCircle
} from 'lucide-react';
import { socketService } from '../services/socket';
import { approveBooking as apiApproveBooking } from '../services/api';

export function RideDetailsModal({ 
  ride, 
  currentUser, 
  onClose, 
  onConfirmBooking, 
  onRequestBooking,
  onOpenLiveTracking,
  onOpenLuggageTag,
  onOpenManifest,
  onOpenChat,
  hasActiveBooking = false,
  activeBookingTrip = null
}) {
  const selectedSeats = 1; // Strict: 1 person books 1 seat at a time
  const [paymentStep, setPaymentStep] = useState('DETAILS'); // 'DETAILS' | 'PAYMENT' | 'CONFIRMED' | 'PENDING_APPROVAL' | 'DECLINED'
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'SAFEPAY_ESCROW' | 'CARD'
  const [selectedUpiApp, setSelectedUpiApp] = useState('GPAY'); // 'GPAY' | 'PHONEPE' | 'PAYTM' | 'BHIM'
  const [customUpiId, setCustomUpiId] = useState(currentUser?.upiId || '');
  const [bookingRef, setBookingRef] = useState('');
  const [passSerial, setPassSerial] = useState('');
  const [isSimulatingApprove, setIsSimulatingApprove] = useState(false);

  if (!ride) return null;

  const totalAmount = ride.pricePerSeat;
  const fuelShare = Math.round(totalAmount * 0.78);
  const tollShare = totalAmount - fuelShare;
  const currentTripId = ride.tripId || ride.id;
  const isOnRequest = ride.bookingMode === 'ON_REQUEST';
  const isInstant = ride.bookingMode !== 'ON_REQUEST';

  // Real-Time Socket Listener: Automatically confirms when Host approves
  useEffect(() => {
    const unsubApprove = socketService.onBookingApproved((payload) => {
      if (payload && payload.tripId === currentTripId) {
        const myName = (currentUser?.fullName || '').toLowerCase().trim();
        const pName = (payload.passengerName || '').toLowerCase().trim();
        const myFirst = myName.split(' ')[0];

        if (!payload.passengerName || pName.includes(myFirst) || myName.includes(pName.split(' ')[0])) {
          const passId = `SWARI-PASS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
          setPassSerial(passId);
          setPaymentStep('CONFIRMED');

          onConfirmBooking?.({
            ...ride,
            bookedSeats: selectedSeats,
            bookingRef: bookingRef || `SWARI-BK-${Date.now().toString().slice(-6)}`,
            passSerial: passId,
            totalPaid: totalAmount,
            passenger: currentUser
          });
        }
      }
    });

    const unsubDecline = socketService.onBookingDeclined((payload) => {
      if (payload && payload.tripId === currentTripId) {
        setPaymentStep('DECLINED');
      }
    });

    return () => {
      unsubApprove?.();
      unsubDecline?.();
    };
  }, [currentTripId, currentUser, bookingRef, selectedSeats, totalAmount, onConfirmBooking, ride]);

  const handleProceedToPayment = () => {
    if (hasActiveBooking) return;
    setPaymentStep('PAYMENT');
  };

  const handleFinalBooking = async () => {
    const refId = `SWARI-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRef(refId);

    // Two-Way Booking Request submitted to the Database in Real Time
    if (onRequestBooking) {
      await onRequestBooking(ride, currentUser);
    }

    setPaymentStep('PENDING_APPROVAL');
  };

  // Quick simulation helper for single-tab testing
  const handleQuickSimulateApproval = async () => {
    setIsSimulatingApprove(true);
    await apiApproveBooking(currentTripId, currentUser?.fullName || 'Verified Traveler');
    setIsSimulatingApprove(false);
  };

  const handlePrintPass = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-gray-800/80 hover:bg-gray-700 transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* STEP 1: RIDE DETAILS & ITINERARY */}
        {/* ========================================================================= */}
        {paymentStep === 'DETAILS' && (
          <div className="space-y-6">
            
            {/* Header Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Intercity Carpool</span>
              </span>
              {isOnRequest ? (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>On-Request (Host Review Required)</span>
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center space-x-1">
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  <span>Instant Booking Enabled</span>
                </span>
              )}
              {ride.womenOnly && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 flex items-center space-x-1">
                  <Heart className="w-3.5 h-3.5 text-pink-400" />
                  <span>Women Only Ride</span>
                </span>
              )}
              <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                Departure: {ride.departureTime}
              </span>
            </div>

            {/* Itinerary Timeline */}
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 relative">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Trip Route & Landmark Pickup Points
              </h4>

              <div className="space-y-6 relative before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 via-teal-500 to-emerald-500">
                
                {/* Origin */}
                <div className="flex items-start space-x-4 relative">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center shrink-0 z-10 bg-gray-950">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                  </div>
                  <div>
                    <span className="text-xs text-blue-400 font-bold block">DEPARTURE</span>
                    <span className="text-sm font-bold text-white">{ride.origin}</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Driver picks you up at the designated flyover toll gate / metro entry.
                    </p>
                  </div>
                </div>

                {/* Destination */}
                <div className="flex items-start space-x-4 relative">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shrink-0 z-10 bg-gray-950">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <div>
                    <span className="text-xs text-emerald-400 font-bold block">ARRIVAL POINT</span>
                    <span className="text-sm font-bold text-white">{ride.destination}</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Direct drop along highway bypass or central transit hub.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Driver Profile Card */}
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={ride.driver.avatar}
                    alt={ride.driver.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                  />
                  {ride.driver.isAadhaarVerified && (
                    <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1 border-2 border-gray-900 text-white" title="DigiLocker Aadhaar KYC Verified">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">{ride.driver.name}</h3>
                    {ride.driver.isDlVerified && (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                        DL Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
                    <span className="text-amber-400 font-bold">★ {ride.driver.rating}</span>
                    <span>•</span>
                    <span>{ride.driver.totalRides || 12} rides hosted</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 italic">
                    "{ride.driver.chattiness || 'Enjoys good highway conversation & podcasts'}"
                  </p>
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onOpenChat && onOpenChat(ride.driver, ride)}
                      className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-emerald-500/30 text-emerald-400 font-bold text-[11px] flex items-center space-x-1.5 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Message Host</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenChat && onOpenChat(ride.driver, ride)}
                      className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 font-semibold text-[11px] flex items-center space-x-1.5 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-400" />
                      <span>Call (Masked)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-gray-800 sm:pl-4">
                <span className="text-[11px] text-gray-400 block font-mono bg-gray-900 px-2 py-1 rounded inline-block">
                  {ride.vehicle.make} {ride.vehicle.model}
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 block mt-1">
                  {ride.vehicle.plate}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  Air Conditioned • Max 2 in back
                </span>
              </div>
            </div>

            {/* Active Booking Blocking Banner */}
            {hasActiveBooking && (
              <div className="bg-gradient-to-r from-amber-950/80 to-gray-900 border border-amber-500/50 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Single Active Ride Rule: You Already Have an Active Ride Booked</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  You are currently booked on an active trip with <strong>{activeBookingTrip?.driver?.name || 'your host'}</strong>. Under Swari personal carpooling regulations, a passenger can only book <strong>one ride at a time</strong>. Complete or cancel your current trip before reserving another car.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLiveTracking?.();
                    }}
                    className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs transition-all active:scale-95"
                  >
                    Open Active Ride Tracking
                  </button>
                </div>
              </div>
            )}

            {/* Seat Selection & Fare Breakdown */}
            <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Reserved Seat (Personal Booking)</h4>
                  <p className="text-xs text-gray-400">
                    <strong className="text-emerald-400">{ride.seatsAvailable} of {ride.totalSeats || 3} seats remaining</strong> • 1 passenger per booking
                  </p>
                </div>

                <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>1 Seat Reserved</span>
                </div>
              </div>

              {/* Co-passengers already booked in this vehicle */}
              {((ride.passengers && ride.passengers.length > 0) || (ride.bookedPassengers && ride.bookedPassengers.length > 0)) && (
                <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                    Co-Travelers Already Booked on this Ride
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(ride.bookedPassengers || ride.passengers).map((p, idx) => {
                      const pName = typeof p === 'string' ? p : p.name;
                      return (
                        <div key={idx} className="flex items-center space-x-1.5 bg-gray-950 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs text-gray-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-semibold text-white">{pName}</span>
                          <span className="text-[9px] text-emerald-400">(Seat #{idx + 1})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="border-t border-gray-900 pt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-400">
                  <span>Fare (1 Seat × ₹{ride.pricePerSeat}):</span>
                  <span className="font-semibold text-white">₹{totalAmount}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500 text-[11px]">
                  <span>↳ Estimated Fuel Cost Sharing (78%):</span>
                  <span>₹{fuelShare}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500 text-[11px]">
                  <span>↳ Highway FASTag Toll Share (22%):</span>
                  <span>₹{tollShare}</span>
                </div>
                <div className="flex items-center justify-between text-gray-300 font-bold text-sm pt-2 border-t border-gray-900">
                  <span>Total Payable:</span>
                  <span className="text-emerald-400 text-lg font-black">₹{totalAmount}</span>
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-[11px] text-emerald-300 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>
                  <strong>MV Act 1988 Compliance:</strong> This fare shares exact fuel & toll costs only. No commercial profit or taxi surcharge is charged.
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={hasActiveBooking}
                onClick={handleProceedToPayment}
                className={`flex-1 py-3 px-6 rounded-2xl text-white font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
                  hasActiveBooking
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    : isOnRequest
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl shadow-amber-500/20 active:scale-98'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-xl shadow-emerald-500/20 active:scale-98'
                }`}
              >
                <span>
                  {hasActiveBooking 
                    ? 'Active Booking In Progress' 
                    : isOnRequest 
                    ? `Request Seat from Host • ₹${totalAmount}` 
                    : `Continue to SafePay Checkout • ₹${totalAmount}`}
                </span>
                {!hasActiveBooking && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PAYMENT & ESCROW CHECKOUT (UPI QR & APPS) */}
        {/* ========================================================================= */}
        {paymentStep === 'PAYMENT' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <h3 className="text-xl font-black text-white">SafePay UPI Escrow Checkout</h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  Your payment of ₹{totalAmount} is locked in regulated escrow and only released once the trip completes.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-md'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <QrCode className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <span className="text-xs block">UPI / QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('SAFEPAY_ESCROW')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'SAFEPAY_ESCROW'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-md'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                <span className="text-xs block">SafeWallet (₹2.5k)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold shadow-md'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Zap className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <span className="text-xs block">NetBanking / Card</span>
              </button>
            </div>

            {/* Interactive UPI Section */}
            {paymentMethod === 'UPI' && (
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
                
                {/* Visual QR Code Display */}
                <div className="flex flex-col sm:flex-row items-center gap-5 bg-gray-900/90 p-4 rounded-xl border border-gray-800">
                  <div className="bg-white p-3 rounded-2xl shadow-lg shrink-0 flex flex-col items-center">
                    {/* SVG High-Res QR Code Representation */}
                    <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="120" height="120" fill="white" />
                      {/* Corner 1 */}
                      <rect x="10" y="10" width="30" height="30" rx="4" fill="#0f172a" />
                      <rect x="15" y="15" width="20" height="20" rx="2" fill="white" />
                      <rect x="20" y="20" width="10" height="10" rx="1" fill="#059669" />
                      {/* Corner 2 */}
                      <rect x="80" y="10" width="30" height="30" rx="4" fill="#0f172a" />
                      <rect x="85" y="15" width="20" height="20" rx="2" fill="white" />
                      <rect x="90" y="20" width="10" height="10" rx="1" fill="#059669" />
                      {/* Corner 3 */}
                      <rect x="10" y="80" width="30" height="30" rx="4" fill="#0f172a" />
                      <rect x="15" y="85" width="20" height="20" rx="2" fill="white" />
                      <rect x="20" y="90" width="10" height="10" rx="1" fill="#059669" />
                      {/* Matrix Grid */}
                      <rect x="45" y="15" width="10" height="10" fill="#0f172a" />
                      <rect x="60" y="15" width="15" height="10" fill="#0f172a" />
                      <rect x="45" y="30" width="25" height="10" fill="#059669" />
                      <rect x="15" y="45" width="25" height="10" fill="#0f172a" />
                      <rect x="45" y="45" width="30" height="30" rx="3" fill="#0f172a" />
                      <rect x="52" y="52" width="16" height="16" rx="2" fill="white" />
                      <circle cx="60" cy="60" r="5" fill="#059669" />
                      <rect x="80" y="45" width="15" height="15" fill="#0f172a" />
                      <rect x="80" y="65" width="30" height="10" fill="#059669" />
                      <rect x="45" y="80" width="10" height="25" fill="#0f172a" />
                      <rect x="60" y="85" width="20" height="10" fill="#0f172a" />
                      <rect x="85" y="80" width="25" height="15" fill="#0f172a" />
                      <rect x="65" y="100" width="30" height="10" fill="#059669" />
                    </svg>
                    <span className="text-[10px] font-bold text-gray-900 mt-1 uppercase tracking-wider font-mono">
                      ₹{totalAmount} • SWARI SAFEPAY
                    </span>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                      SCAN WITH ANY UPI APP
                    </span>
                    <h4 className="text-base font-black text-white">Instant UPI Dynamic QR</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Scan using Google Pay, PhonePe, Paytm, CRED or any BHIM UPI app to lock your seat in escrow.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'].map((app, idx) => (
                        <span key={idx} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-medium border border-gray-700">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct UPI ID Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-300">
                    Or Enter Your Virtual Payment Address (UPI ID)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      placeholder="e.g. mobile@okhdfcbank or user@paytm"
                      className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <div className="flex space-x-1">
                      {['@okhdfcbank', '@oksbi', '@paytm'].map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const prefix = customUpiId.includes('@') ? customUpiId.split('@')[0] : (customUpiId || 'user');
                            setCustomUpiId(`${prefix}${handle}`);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[10px] text-gray-400 font-mono"
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Escrow Guarantee Statement */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-start space-x-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">SafePay Escrow Safe-Harbor Guarantee</span>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                  Under the Motor Vehicles Act 1988 statutory guidelines, your ₹{totalAmount} fare is held securely in an RBI-compliant nodal account. The car owner only receives fuel disbursement once you verify safe journey completion.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentStep('DETAILS')}
                className="py-3 px-5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalBooking}
                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>Authorize Escrow Lock & Confirm Seat (₹{totalAmount})</span>
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: PENDING HOST APPROVAL (ON-REQUEST TRIP FLOW) */}
        {/* ========================================================================= */}
        {paymentStep === 'PENDING_APPROVAL' && (
          <div className="text-center py-6 space-y-6">
            
            <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 border-2 border-amber-500/40 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                SEAT REQUEST DELIVERED • AWAITING HOST APPROVAL
              </span>
              <h3 className="text-2xl font-black text-white">Request Sent to {ride.driver.name}!</h3>
              <p className="text-xs text-gray-300 max-w-md mx-auto mt-1">
                Request ID: <strong className="text-white font-mono">{bookingRef}</strong>. The host driver has been alerted on their dashboard to review your verified profile.
              </p>
            </div>

            <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span>Trip Corridor:</span>
                <span className="text-white font-bold">{ride.origin} ➔ {ride.destination}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Driver:</span>
                <span className="text-white font-bold">{ride.driver.name} ({ride.vehicle.model})</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Hold Amount:</span>
                <span className="text-emerald-400 font-bold">₹{totalAmount} (SafePay Escrow Hold)</span>
              </div>
              <div className="pt-2 border-t border-gray-900 text-[11px] text-gray-400">
                💡 <em>You will receive an instant WebSocket notification as soon as the driver accepts your seat.</em>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChat && onOpenChat(ride.driver, ride)}
                className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center space-x-1.5 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with Driver in Real-Time</span>
              </button>

              <button
                type="button"
                onClick={handleQuickSimulateApproval}
                disabled={isSimulatingApprove}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
                title="Single-tab simulation: trigger driver approval instantly"
              >
                <Check className="w-4 h-4" />
                <span>{isSimulatingApprove ? 'Accepting...' : '⚡ Simulate Driver "Yes, I Accept"'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-all"
              >
                Return to Search
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3B: BOOKING DECLINED */}
        {/* ========================================================================= */}
        {paymentStep === 'DECLINED' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Ride Request Declined by Host</h3>
              <p className="text-xs text-gray-300 mt-1 max-w-sm mx-auto">
                Host {ride.driver.name} was unable to accept your booking for this schedule. Your escrow authorization has been released and your slot is free.
              </p>
            </div>
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
            >
              Browse Other Rides
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: BOOKING CONFIRMED & STATUTORY MOTOR VEHICLES ACT 1988 PASS */}
        {/* ========================================================================= */}
        {paymentStep === 'CONFIRMED' && (
          <div className="space-y-6">
            
            {/* Confirmation Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">
                SEAT RESERVED • ESCROW SECURED
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Official Statutory Travel Pass
              </h3>
              <p className="text-xs text-gray-400">
                Motor Vehicles Act 1988 (Sec 66 & 192A) Non-Commercial Carpooling Compliance
              </p>
            </div>

            {/* STATUTORY TRAVEL PASS TICKET */}
            <div className="bg-gray-950 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
              
              {/* Pass Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-emerald-400 tracking-wider">SWARI INTERCITY NETWORK</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                      VERIFIED PASS
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-0.5">{ride.origin} ➔ {ride.destination}</h4>
                  <span className="text-[11px] font-mono text-gray-400">Departure: {ride.departureTime}</span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Pass Serial Number</span>
                  <span className="text-xs font-mono font-black text-amber-300 block">{passSerial || bookingRef}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">1 Seat Confirmed</span>
                </div>
              </div>

              {/* Driver & Passenger Manifest Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Host Driver Card */}
                <div className="bg-gray-900/90 p-3.5 rounded-2xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HOST CAR OWNER</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>KYC Verified</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img
                      src={ride.driver.avatar}
                      alt={ride.driver.name}
                      className="w-10 h-10 rounded-full object-cover border border-emerald-400"
                    />
                    <div>
                      <span className="font-bold text-white block">{ride.driver.name}</span>
                      <span className="text-[11px] font-mono text-amber-300 block">{ride.vehicle.plate}</span>
                      <span className="text-[10px] text-gray-400 block">{ride.vehicle.make} {ride.vehicle.model}</span>
                    </div>
                  </div>
                </div>

                {/* Passenger Traveler Card */}
                <div className="bg-gray-900/90 p-3.5 rounded-2xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BOOKED TRAVELER</span>
                    <span className="text-[10px] text-blue-400 font-bold flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>DigiLocker Verified</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                      alt={currentUser?.fullName || 'Traveler'}
                      className="w-10 h-10 rounded-full object-cover border border-blue-400"
                    />
                    <div>
                      <span className="font-bold text-white block">{currentUser?.fullName || 'Rahul Sharma'}</span>
                      <span className="text-[11px] font-mono text-gray-300 block">{currentUser?.phone || '+91 97XXX-X1142'}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold block">SafePay Escrow Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highway Toll & Fuel Cost Sharing Ledger */}
              <div className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Statutory Cost Sharing Audit (Zero Commercial Profit)
                </span>
                
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>Fuel Share Contribution (78%):</span>
                  <span className="font-mono text-gray-200">₹{fuelShare}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>National Highway FASTag Toll Share (22%):</span>
                  <span className="font-mono text-gray-200">₹{tollShare}</span>
                </div>
                <div className="flex items-center justify-between text-gray-400 text-[11px]">
                  <span>Commercial Surcharge / Taxi Fare:</span>
                  <span className="font-mono text-emerald-400">₹0.00 (Exempt)</span>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-800 pt-2 font-bold text-sm">
                  <span className="text-white">Total Cost Shared:</span>
                  <span className="text-emerald-400 font-black">₹{totalAmount}</span>
                </div>
              </div>

              {/* Statutory Legal Safe-Harbor Text */}
              <div className="text-[10px] text-gray-400 leading-relaxed border-t border-gray-900 pt-3">
                <strong>Statutory Notice:</strong> This travel pass certifies that the vehicle journey is a private, voluntary cost-sharing arrangement under Sections 66 and 192A of the Motor Vehicles Act, 1988. No commercial transport license or taxi permit is required.
              </div>

            </div>

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              
              <button
                type="button"
                onClick={handlePrintPass}
                className="p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-amber-300 font-bold border border-amber-500/30 flex flex-col items-center justify-center space-y-1 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Pass</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLiveTracking();
                }}
                className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex flex-col items-center justify-center space-y-1 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4" />
                <span>Live GPS Feed</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLuggageTag();
                }}
                className="p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-teal-300 font-bold border border-teal-500/30 flex flex-col items-center justify-center space-y-1 transition-all active:scale-95"
              >
                <Briefcase className="w-4 h-4 text-teal-400" />
                <span>Tag Luggage</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenManifest();
                }}
                className="p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold border border-gray-700 flex flex-col items-center justify-center space-y-1 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Legal Manifest</span>
              </button>

            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-gray-400 hover:text-white underline"
              >
                Close and return to ride list
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
