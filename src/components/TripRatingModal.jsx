import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  ThumbsUp, 
  Car,
  User,
  ArrowRightLeft
} from 'lucide-react';

export function TripRatingModal({ isOpen, onClose, trip, currentUser, onSubmitRating }) {
  // Rating Perspective: Auto-detect if user is Driver or Passenger
  const isUserDriver = currentUser?.role === 'DRIVER';
  const [ratingRole, setRatingRole] = useState(isUserDriver ? 'DRIVER' : 'PASSENGER');

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Compliment tags tailored to role
  const driverCompliments = [
    'Smooth & Safe Driving',
    'Punctual Pickup',
    'Clean Vehicle',
    'Comfortable AC',
    'Great Highway Music',
    'Polite & Respectful'
  ];

  const passengerCompliments = [
    'On Time at Pickup Spot',
    'Respectful of Vehicle Rules',
    'Pleasant Co-Traveler',
    'Prompt SafePay Settlement',
    'Great Highway Etiquette'
  ];

  const [selectedTags, setSelectedTags] = useState(
    ratingRole === 'PASSENGER' 
      ? ['Smooth & Safe Driving', 'Punctual Pickup'] 
      : ['On Time at Pickup Spot', 'Respectful of Vehicle Rules']
  );

  if (!isOpen || !trip) return null;

  const firstPassenger = trip.bookedPassengers?.[0]?.name || (typeof trip.passengers?.[0] === 'string' ? trip.passengers[0] : trip.passengers?.[0]?.name) || trip.passengerName || 'Passenger';
  const targetName = ratingRole === 'DRIVER' 
    ? firstPassenger 
    : (trip.driver?.name || 'Host Driver');

  const targetAvatar = ratingRole === 'DRIVER'
    ? (trip.bookedPassengers?.[0]?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80')
    : (trip.driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitRating) {
      onSubmitRating({
        tripId: trip.tripId || trip.id,
        rating,
        tags: selectedTags,
        reviewText,
        reviewerName: currentUser?.fullName || 'Verified Member',
        reviewerRole: ratingRole,
        targetName,
        targetRole: ratingRole === 'DRIVER' ? 'PASSENGER' : 'DRIVER'
      });
    }
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-white my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-white">Two-Way Verified Rating</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                RECIPROCAL TRUST
              </span>
            </div>
            <p className="text-xs text-gray-400">Both host and passenger rate each other to maintain community accountability</p>
          </div>
        </div>

        {/* Two-Way Role Switcher Bar */}
        <div className="grid grid-cols-2 p-1 bg-gray-950 rounded-2xl border border-gray-800 my-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setRatingRole('PASSENGER');
              setSelectedTags(['Smooth & Safe Driving', 'Punctual Pickup']);
            }}
            className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 ${
              ratingRole === 'PASSENGER'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Passenger Rates Driver</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRatingRole('DRIVER');
              setSelectedTags(['On Time at Pickup Spot', 'Respectful of Vehicle Rules']);
            }}
            className={`py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center space-x-1.5 ${
              ratingRole === 'DRIVER'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Driver Rates Passenger</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Two-Way Rating Saved!</h3>
            <p className="text-xs text-gray-300 max-w-sm mx-auto">
              Your verified review of <strong>{targetName}</strong> has been sealed. Mutual ratings are now visible on both verified profiles.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Target Profile Card */}
            <div className="flex items-center space-x-3.5 bg-gray-950 p-4 rounded-2xl border border-gray-800">
              <div className="relative">
                <img
                  src={targetAvatar}
                  alt={targetName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-0.5 border border-gray-950 text-white" title="Govt Aadhaar KYC Verified">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  {ratingRole === 'PASSENGER' ? 'Rating Host Driver' : 'Rating Co-Passenger'}
                </span>
                <h4 className="text-sm font-bold text-white">{targetName}</h4>
                <span className="text-[11px] text-gray-400">
                  Route: {trip.pickupPoint?.name || trip.origin} ➔ {trip.dropoffPoint?.name || trip.destination}
                </span>
              </div>
            </div>

            {/* Interactive 5-Star Rating */}
            <div className="text-center py-2 space-y-1 bg-gray-950/60 p-3 rounded-2xl border border-gray-800/80">
              <span className="text-[11px] font-bold text-gray-300 block">Overall Journey Rating</span>
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-black text-amber-400 block font-mono">
                {rating === 5 ? '5.0 — Exceptional Ride' : rating === 4 ? '4.0 — Good Experience' : `${rating}.0 — Average / Needs Improvement`}
              </span>
            </div>

            {/* Compliments / Verified Badges */}
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Select Compliment Badges (Two-Way Trust)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentComplimentList.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                          : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Review */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Written Feedback (Visible on community profile)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={ratingRole === 'PASSENGER' 
                  ? 'E.g., Great driving along NH 44, very punctual, and car was clean...'
                  : 'E.g., Very respectful co-passenger, arrived on time at the toll gate pickup...'
                }
                rows={2}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Submit Two-Way Verified Rating</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
