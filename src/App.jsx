import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { SearchAndBook } from './components/SearchAndBook';
import { PassengerBroadcastBoard } from './components/PassengerBroadcastBoard';

// Code-split dynamic modals & heavy map/dashboard components for optimal initial payload
const LiveTrackingModal = lazy(() => import('./components/LiveTrackingModal').then(m => ({ default: m.LiveTrackingModal })));
const TrustVerificationModal = lazy(() => import('./components/TrustVerificationModal').then(m => ({ default: m.TrustVerificationModal })));
const PostRideModal = lazy(() => import('./components/PostRideModal').then(m => ({ default: m.PostRideModal })));
const BroadcastRequestModal = lazy(() => import('./components/BroadcastRequestModal').then(m => ({ default: m.BroadcastRequestModal })));
const DigitalManifestModal = lazy(() => import('./components/DigitalManifestModal').then(m => ({ default: m.DigitalManifestModal })));
const LuggageTagModal = lazy(() => import('./components/LuggageTagModal').then(m => ({ default: m.LuggageTagModal })));
const LoginModal = lazy(() => import('./components/LoginModal').then(m => ({ default: m.LoginModal })));
const RideDetailsModal = lazy(() => import('./components/RideDetailsModal').then(m => ({ default: m.RideDetailsModal })));
const RideChatModal = lazy(() => import('./components/RideChatModal').then(m => ({ default: m.RideChatModal })));
const PassengerDashboard = lazy(() => import('./components/PassengerDashboard').then(m => ({ default: m.PassengerDashboard })));
const DriverDashboard = lazy(() => import('./components/DriverDashboard').then(m => ({ default: m.DriverDashboard })));
const AdminConsoleDashboard = lazy(() => import('./components/AdminConsoleDashboard').then(m => ({ default: m.AdminConsoleDashboard })));
const UserUnifiedDashboard = lazy(() => import('./components/UserUnifiedDashboard').then(m => ({ default: m.UserUnifiedDashboard })));
const CsEngineInspectorModal = lazy(() => import('./components/CsEngineInspectorModal').then(m => ({ default: m.CsEngineInspectorModal })));
const TripRatingModal = lazy(() => import('./components/TripRatingModal').then(m => ({ default: m.TripRatingModal })));
import { PERSONAS } from './data/mockUsers';
import { ACTIVE_MOCK_TRIP } from './data/mockData';
import { 
  fetchTrips, 
  fetchBroadcasts, 
  publishTrip as apiPublishTrip, 
  publishBroadcast as apiPublishBroadcast, 
  sendDriverOffer as apiSendOffer,
  bookTripSeat as apiBookTripSeat,
  cancelTrip as apiCancelTrip,
  completeTrip as apiCompleteTrip,
  cancelBooking as apiCancelBooking,
  submitTwoWayRating as apiSubmitTwoWayRating,
  requestBooking as apiRequestBooking,
  approveBooking as apiApproveBooking,
  declineBooking as apiDeclineBooking
} from './services/api';
import { socketService } from './services/socket';
import { ShieldCheck, Navigation, Car, Radio, Heart, Bell, FileText, LayoutDashboard } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('explore'); // Default to iconic BlaBlaCar Find Rides search
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('swari_custom_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return PERSONAS.passenger_rahul;
  });
  
  const [driverRides, setDriverRides] = useState([]);
  const [passengerRequests, setPassengerRequests] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null); // Dynamic: only set when user actually has an active booked trip
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState(null);
  
  // Single Active Invariants: 1 car trip per driver, 1 active booking per passenger
  const userPublishedTrip = driverRides.find(r => {
    if (!r || r.status === 'COMPLETED' || r.status === 'CANCELLED') return false;
    const dName = (r.driver?.name || '').toLowerCase().trim();
    const uName = (currentUser.fullName || '').toLowerCase().trim();
    const uFirst = uName.split(' ')[0];
    return dName === uName || (uFirst.length > 2 && dName.includes(uFirst));
  }) || null;

  const hasActiveBooking = Boolean(activeTrip && activeTrip.status !== 'COMPLETED' && activeTrip.status !== 'CANCELLED');
  
  // Modals
  const [selectedRideForDetails, setSelectedRideForDetails] = useState(null);
  const [activeChatContext, setActiveChatContext] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLiveTrackingOpen, setIsLiveTrackingOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isPostRideOpen, setIsPostRideOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isLuggageTagOpen, setIsLuggageTagOpen] = useState(false);
  const [isCsInspectorOpen, setIsCsInspectorOpen] = useState(false);
  const [ratingTrip, setRatingTrip] = useState(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // 1. Initial Data Fetch & Real-Time Multi-Client WebSocket Setup
  const loadData = () => {
    setTripsLoading(true);
    setTripsError(null);
    Promise.all([
      fetchTrips().then(res => {
        if (res && Array.isArray(res.data)) {
          setDriverRides(res.data);
          // Detect if currentUser is passenger on an active trip
          const myName = (currentUser?.fullName || '').toLowerCase().trim();
          const myFirst = myName.split(' ')[0];
          const myActiveRide = res.data.find(t => {
            if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
            const inPax = t.passengers && t.passengers.some(p => {
              const nameStr = typeof p === 'string' ? p : (p?.name || '');
              return myFirst && nameStr.toLowerCase().includes(myFirst);
            });
            const inBooked = t.bookedPassengers && t.bookedPassengers.some(p => {
              const nameStr = typeof p === 'string' ? p : (p?.name || '');
              return myFirst && nameStr.toLowerCase().includes(myFirst);
            });
            return Boolean(inPax || inBooked);
          });
          if (myActiveRide) {
            setActiveTrip({
              tripId: myActiveRide.id,
              routeId: myActiveRide.routeId,
              driver: myActiveRide.driver,
              vehicle: myActiveRide.vehicle,
              fareTotal: myActiveRide.pricePerSeat,
              pickupPoint: { name: myActiveRide.origin, status: 'CONFIRMED' },
              dropoffPoint: { name: myActiveRide.destination, status: 'SCHEDULED' },
              currentTelemetry: { speedKmph: 82, currentHighway: 'NH 44 Corridor' },
              status: 'IN_TRANSIT'
            });
          }
        }
      }),
      fetchBroadcasts().then(res => {
        if (res && Array.isArray(res.data)) {
          setPassengerRequests(res.data);
        }
      })
    ])
    .catch(err => {
      console.warn('Initial load warning:', err.message);
      setTripsError(err.message || 'Unable to connect to corridor API.');
    })
    .finally(() => {
      setTripsLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    socketService.connect();

    // Listen to new trips published by drivers in real-time
    const unsubTrip = socketService.onTripPublished((newTrip) => {
      if (!newTrip || !newTrip.id) return;
      setDriverRides(prev => {
        if (prev.some(t => t.id === newTrip.id)) return prev;
        return [newTrip, ...prev];
      });
      triggerToast(`🚗 New Car Trip Published: ${newTrip.origin} ➔ ${newTrip.destination} (₹${newTrip.pricePerSeat}/seat)`);
    });

    // Listen to seat reservations across all clients via OS Semaphore sync
    const unsubSeat = socketService.onTripSeatBooked((payload) => {
      if (!payload || !payload.tripId) return;
      setDriverRides(prev => prev.map(t => {
        if (t.id === payload.tripId) {
          const updatedPassengers = payload.passengers || (
            t.passengers?.includes(payload.passengerName) 
              ? t.passengers 
              : [...(t.passengers || []), payload.passengerName]
          );
          const updatedBookedPassengers = payload.bookedPassengers || [
            ...(t.bookedPassengers || []),
            {
              bookingId: `BK-${Date.now().toString().slice(-4)}`,
              name: payload.passengerName,
              phone: payload.passengerDetails?.phone || '+91 97XXX-X1142',
              avatar: payload.passengerDetails?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
              company: payload.passengerDetails?.company || 'Verified Professional',
              bookedAt: 'Just now',
              seats: payload.bookedSeats || 1,
              escrowStatus: 'SECURED_ESCROW'
            }
          ];
          return {
            ...t,
            seatsAvailable: payload.seatsAvailable !== undefined ? payload.seatsAvailable : Math.max(0, t.seatsAvailable - (payload.bookedSeats || 1)),
            passengers: updatedPassengers,
            bookedPassengers: updatedBookedPassengers
          };
        }
        return t;
      }));
      triggerToast(`🎫 Seat Reserved on ${payload.tripId} by ${payload.passengerName || 'Traveler'}! ${payload.seatsAvailable} seat(s) remaining.`);
    });

    // Listen to trip updates (completed, cancelled, modified)
    const unsubUpdate = socketService.onTripUpdated((updatedTrip) => {
      if (!updatedTrip || !updatedTrip.id) return;
      setDriverRides(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    });

    const unsubCompleted = socketService.onTripCompleted((payload) => {
      if (!payload || !payload.tripId) return;
      setDriverRides(prev => prev.map(t => t.id === payload.tripId ? { ...t, status: 'COMPLETED' } : t));
      setActiveTrip(prev => (prev && (prev.tripId === payload.tripId || prev.id === payload.tripId) ? { ...prev, status: 'COMPLETED' } : prev));
      triggerToast(`🏁 Trip ${payload.tripId} marked completed.`);
    });

    const unsubCancelled = socketService.onTripCancelled((payload) => {
      if (!payload || !payload.tripId) return;
      setDriverRides(prev => prev.map(t => t.id === payload.tripId ? { ...t, status: 'CANCELLED' } : t));
      setActiveTrip(prev => (prev && (prev.tripId === payload.tripId || prev.id === payload.tripId) ? null : prev));
      triggerToast(`Trip ${payload.tripId} cancelled.`);
    });

    // Listen to passenger public travel requests in real-time
    const unsubBroadcast = socketService.onBroadcastCreated((newBroadcast) => {
      if (!newBroadcast || !newBroadcast.id) return;
      setPassengerRequests(prev => {
        if (prev.some(b => b.id === newBroadcast.id)) return prev;
        return [newBroadcast, ...prev];
      });
      triggerToast(`📢 New Passenger Request: ${newBroadcast.origin} ➔ ${newBroadcast.destination} (Budget: ₹${newBroadcast.budgetInRupees})`);
    });

    // Listen to driver offers sent to passenger
    const unsubOffer = socketService.onOfferReceived((payload) => {
      if (payload && payload.offer) {
        triggerToast(`🔔 New Car Offer Received! ${payload.offer.driverName} offered ₹${payload.offer.offeredFare}`);
        setPassengerRequests(prev => prev.map(req => {
          if (req.id === payload.broadcastId) {
            return {
              ...req,
              driverOffers: [...(req.driverOffers || []), payload.offer]
            };
          }
          return req;
        }));
      }
    });

    // Listen to emergency SOS alerts
    const unsubSos = socketService.onSosAlert((sosPayload) => {
      triggerToast(`🚨 Emergency SOS Alert Dispatched for ${sosPayload.vehiclePlate}`);
    });

    // Listen to on-request booking requests (Host Driver perspective)
    const unsubReq = socketService.onBookingRequested((payload) => {
      if (!payload || !payload.tripId) return;
      setDriverRides(prev => prev.map(t => {
        if (t.id === payload.tripId) {
          const prevRequests = t.pendingRequests || [];
          return {
            ...t,
            pendingRequests: [...prevRequests.filter(p => p.name !== payload.passengerName), payload.request]
          };
        }
        return t;
      }));
      triggerToast(`🚨 Incoming Passenger Request! ${payload.passengerName} requested a seat on your trip.`);
    });

    // Listen to booking approval
    const unsubApprove = socketService.onBookingApproved((payload) => {
      if (!payload || !payload.tripId) return;
      let matchedTrip = null;
      setDriverRides(prev => prev.map(t => {
        if (t.id === payload.tripId) {
          const updatedTrip = payload.trip || {
            ...t,
            seatsAvailable: payload.seatsAvailable,
            passengers: payload.passengers || (
              t.passengers?.includes(payload.passengerName) ? t.passengers : [...(t.passengers || []), payload.passengerName]
            ),
            bookedPassengers: payload.bookedPassengers || t.bookedPassengers,
            pendingRequests: (t.pendingRequests || []).filter(p => {
              const nameStr = typeof p === 'string' ? p : (p?.name || '');
              return !nameStr.toLowerCase().includes((payload.passengerName || '').toLowerCase().split(' ')[0]);
            })
          };
          matchedTrip = updatedTrip;
          return updatedTrip;
        }
        return t;
      }));

      // Check if currentUser is the passenger whose booking was just approved
      const myFirst = (currentUser?.fullName || '').toLowerCase().trim().split(' ')[0];
      const paxFirst = (payload.passengerName || '').toLowerCase().trim().split(' ')[0];
      if (myFirst && paxFirst && (myFirst === paxFirst || (payload.passengerName || '').toLowerCase().includes(myFirst))) {
        const t = matchedTrip || payload.trip;
        if (t) {
          setActiveTrip({
            tripId: t.id,
            routeId: t.routeId,
            driver: t.driver,
            vehicle: t.vehicle,
            fareTotal: t.pricePerSeat,
            pickupPoint: { name: t.origin, status: 'CONFIRMED' },
            dropoffPoint: { name: t.destination, status: 'SCHEDULED' },
            currentTelemetry: { speedKmph: 82, currentHighway: 'NH 44 Corridor' },
            status: 'IN_TRANSIT'
          });
        }
      }
      triggerToast(`🎉 Booking Approved for ${payload.passengerName} on trip ${payload.tripId}!`);
    });

    // Listen to booking decline
    const unsubDecline = socketService.onBookingDeclined((payload) => {
      if (!payload || !payload.tripId) return;
      setDriverRides(prev => prev.map(t => {
        if (t.id === payload.tripId) {
          return {
            ...t,
            pendingRequests: (t.pendingRequests || []).filter(p => p.name !== payload.passengerName)
          };
        }
        return t;
      }));
      triggerToast(`Booking request for ${payload.passengerName} was declined.`);
    });

    return () => {
      unsubTrip?.();
      unsubSeat?.();
      unsubUpdate?.();
      unsubCompleted?.();
      unsubCancelled?.();
      unsubBroadcast?.();
      unsubOffer?.();
      unsubSos?.();
      unsubReq?.();
      unsubApprove?.();
      unsubDecline?.();
    };
  }, []);

  // 2. Handle Persona Switch
  const handleSelectPersona = (persona) => {
    setCurrentUser(persona);
    // Dynamically update active booking for switched persona
    const pName = (persona?.fullName || '').toLowerCase().trim();
    const pFirst = pName.split(' ')[0];
    const myActiveRide = driverRides.find(t => {
      if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
      const inPax = t.passengers && t.passengers.some(p => {
        const nameStr = typeof p === 'string' ? p : (p?.name || '');
        return pFirst && nameStr.toLowerCase().includes(pFirst);
      });
      const inBooked = t.bookedPassengers && t.bookedPassengers.some(p => {
        const nameStr = typeof p === 'string' ? p : (p?.name || '');
        return pFirst && nameStr.toLowerCase().includes(pFirst);
      });
      return Boolean(inPax || inBooked);
    });
    if (myActiveRide) {
      setActiveTrip({
        tripId: myActiveRide.id,
        routeId: myActiveRide.routeId,
        driver: myActiveRide.driver,
        vehicle: myActiveRide.vehicle,
        fareTotal: myActiveRide.pricePerSeat,
        pickupPoint: { name: myActiveRide.origin, status: 'CONFIRMED' },
        dropoffPoint: { name: myActiveRide.destination, status: 'SCHEDULED' },
        currentTelemetry: { speedKmph: 82, currentHighway: 'NH 44 Corridor' },
        status: 'IN_TRANSIT'
      });
    } else {
      setActiveTrip(null);
    }
    triggerToast(`Switched account to ${persona.fullName} (${persona.role})`);
  };

  // 3. Driver sends car offer / invite to passenger
  const handleSendDriverOffer = async (requestId, offerData) => {
    setPassengerRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          driverOffers: [...(req.driverOffers || []), offerData]
        };
      }
      return req;
    }));
    triggerToast(`Car offer of ₹${offerData.offeredFare} delivered to passenger!`);
    await apiSendOffer(requestId, offerData);
  };

  // 4. Passenger accepts driver offer
  const handleAcceptOfferAndTrack = (req, offer) => {
    const updatedTrip = {
      ...ACTIVE_MOCK_TRIP,
      tripId: `SWARI-${Date.now().toString().slice(-5)}`,
      routeId: req.routeId,
      driver: {
        name: offer.driverName,
        rating: 4.95,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
      },
      vehicle: {
        make: offer.car?.split(' ')[0] || 'Tata',
        model: offer.car || 'Car',
        plate: 'KA 05 MN 2819'
      },
      fareTotal: offer.offeredFare,
      pickupPoint: {
        name: req.origin,
        timeCompleted: offer.pickupEstimate || 'Just Now',
        status: 'CONFIRMED'
      },
      dropoffPoint: {
        name: req.destination,
        expectedTime: 'In 3h 15m',
        status: 'SCHEDULED'
      },
      status: 'IN_TRANSIT'
    };
    setActiveTrip(updatedTrip);
    setIsLiveTrackingOpen(true);
    triggerToast(`Booking confirmed with ${offer.driverName}! Live satellite GPS stream active.`);
  };

  // 5. Passenger books driver ride directly from Explore or Details Modal (1 seat, 1 active booking at a time)
  const handleConfirmBookingFromDetails = async (bookingData) => {
    if (hasActiveBooking) {
      triggerToast('⚠️ Single active booking rule: You already have an active ride booked.');
      return;
    }

    try {
      triggerToast(`Reserving seat under OS Dijkstra Semaphore...`);
      const res = await apiBookTripSeat(bookingData.id, 1, currentUser.fullName || 'Verified Traveler', {
        phone: currentUser.phone || '+91 97XXX-X1142',
        avatar: currentUser.avatar,
        company: currentUser.company,
        rating: currentUser.rating || 5.0
      });
      
      if (res && res.success && res.data) {
        const updated = res.data;
        setDriverRides(prev => prev.map(r => r.id === updated.id ? updated : r));

        const confirmedTrip = {
          ...ACTIVE_MOCK_TRIP,
          tripId: updated.id,
          routeId: updated.routeId,
          driver: updated.driver,
          vehicle: updated.vehicle,
          fareTotal: updated.pricePerSeat,
          pickupPoint: {
            name: updated.origin,
            timeCompleted: updated.departureTime || '04:30 PM',
            status: 'CONFIRMED'
          },
          dropoffPoint: {
            name: updated.destination,
            expectedTime: 'In 4h 30m',
            status: 'SCHEDULED'
          },
          currentTelemetry: {
            speedKmph: 82,
            currentHighway: 'NH 44 Corridor',
            nextToll: 'Attibele Toll Plaza (12 km ahead)'
          },
          status: 'IN_TRANSIT'
        };
        setActiveTrip(confirmedTrip);
        triggerToast(`🎉 Booking confirmed! 1 seat reserved with ${updated.driver.name}.`);
      } else {
        triggerToast(`⚠️ ${res?.message || 'Booking could not be confirmed.'}`);
      }
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Booking failed.'}`);
    }
  };

  // Request Booking for On-Request Trips
  const handleRequestBooking = async (ride, passenger) => {
    try {
      triggerToast(`Submitting seat request to host driver ${ride.driver.name}...`);
      const res = await apiRequestBooking(ride.id, passenger.fullName || 'Verified Traveler', {
        phone: passenger.phone || '+91 97XXX-X1142',
        avatar: passenger.avatar,
        company: passenger.company,
        rating: passenger.rating || 5.0,
        notes: `${ride.origin} ➔ ${ride.destination}`
      });
      if (res && res.success) {
        triggerToast(`📨 Request sent! Host driver notified to review and approve.`);
        return res;
      } else {
        triggerToast(`⚠️ ${res?.message || 'Could not send request.'}`);
        return null;
      }
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not send request.'}`);
      return null;
    }
  };

  // Driver Approves Booking Request
  const handleApproveBooking = async (tripId, passengerName) => {
    try {
      triggerToast(`Approving booking for ${passengerName}...`);
      const res = await apiApproveBooking(tripId, passengerName);
      if (res && res.success && res.data) {
        setDriverRides(prev => prev.map(t => t.id === tripId ? res.data : t));
        triggerToast(`✅ Passenger ${passengerName} approved & seat confirmed!`);
      }
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not approve booking.'}`);
    }
  };

  // Driver Declines Booking Request
  const handleDeclineBooking = async (tripId, passengerName) => {
    try {
      triggerToast(`Declining booking for ${passengerName}...`);
      const res = await apiDeclineBooking(tripId, passengerName);
      if (res && res.success) {
        setDriverRides(prev => prev.map(t => {
          if (t.id === tripId) {
            return {
              ...t,
              pendingRequests: (t.pendingRequests || []).filter(p => {
                const pName = typeof p === 'string' ? p : (p?.name || '');
                return !pName.toLowerCase().includes((passengerName || '').toLowerCase().split(' ')[0]);
              })
            };
          }
          return t;
        }));
        triggerToast(`Booking request for ${passengerName} declined.`);
      }
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not decline booking.'}`);
    }
  };

  const handleBookAndTrack = (ride) => {
    setSelectedRideForDetails(ride);
  };

  // 6. Complete Trip (Frees Driver / Passenger slot)
  const handleCompleteTrip = async (tripId) => {
    try {
      const tripToRate = driverRides.find(t => t.id === tripId) || activeTrip;
      setDriverRides(prev => prev.map(t => t.id === tripId ? { ...t, status: 'COMPLETED' } : t));
      if (activeTrip && (activeTrip.tripId === tripId || activeTrip.id === tripId)) {
        setActiveTrip(prev => ({ ...prev, status: 'COMPLETED' }));
      }
      triggerToast('✅ Trip completed! SafePay escrow released and slots freed.');
      await apiCompleteTrip(tripId);
      if (tripToRate) {
        setTimeout(() => setRatingTrip(tripToRate), 500);
      }
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not complete trip.'}`);
    }
  };

  // Quick Return Trip Publisher (BlaBlaCar parity)
  const handlePublishReturnRide = (trip) => {
    if (!trip) return;
    setIsPostRideOpen(true);
    triggerToast(`🔄 Setting up return trip: ${trip.destination} ➔ ${trip.origin}`);
  };

  // 7. Cancel Car Trip (Driver cancels published trip)
  const handleCancelTrip = async (tripId) => {
    try {
      setDriverRides(prev => prev.map(t => t.id === tripId ? { ...t, status: 'CANCELLED' } : t));
      triggerToast('Trip cancelled. Your driver hosting slot is now free.');
      await apiCancelTrip(tripId);
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not cancel trip.'}`);
    }
  };

  // 8. Cancel Passenger Booking (Frees passenger slot & restores seat)
  const handleCancelBooking = async (tripId) => {
    try {
      setDriverRides(prev => prev.map(t => {
        if (t.id === tripId) {
          return {
            ...t,
            seatsAvailable: Math.min(t.totalSeats || 3, (t.seatsAvailable || 0) + 1)
          };
        }
        return t;
      }));
      setActiveTrip(prev => ({ ...prev, status: 'CANCELLED' }));
      triggerToast('Booking cancelled. Your ride booking slot is now free.');
      await apiCancelBooking(tripId, currentUser.fullName || 'Verified Traveler');
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not cancel booking.'}`);
    }
  };

  // 9. Publish new passenger request with custom budget
  const handlePublishRequest = async (newReq) => {
    try {
      const payload = {
        ...newReq,
        passenger: {
          name: currentUser.fullName,
          avatar: currentUser.avatar,
          rating: currentUser.rating || 4.9,
          completedTrips: currentUser.totalTrips || 1,
          company: currentUser.company || 'Swari Verified Community'
        }
      };
      triggerToast('Broadcasting travel request...');
      const res = await apiPublishBroadcast(payload);
      if (res && res.success && res.data) {
        setPassengerRequests(prev => [res.data, ...prev.filter(b => b.id !== res.data.id)]);
        setActiveTab('broadcasts');
        triggerToast(`📢 Request broadcasted! Car drivers along the corridor can now offer rides.`);
      } else {
        triggerToast(`⚠️ ${res?.message || 'Could not broadcast request.'}`);
      }
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not broadcast request.'}`);
    }
  };

  // 10. Publish new driver trip (Only 1 active trip at a time)
  const handlePublishRide = async (newRide) => {
    if (userPublishedTrip) {
      triggerToast(`⚠️ Single car trip rule: You already have an active car trip published (${userPublishedTrip.origin} ➔ ${userPublishedTrip.destination}). Complete or cancel it first.`);
      return;
    }

    try {
      const payload = {
        ...newRide,
        driver: {
          name: currentUser.fullName,
          rating: 5.0,
          totalRides: 14,
          avatar: currentUser.avatar,
          isAadhaarVerified: true,
          isDlVerified: true,
          phoneMasked: currentUser.phone || '+91 98XXX-X0011'
        }
      };

      triggerToast('Publishing trip to network...');
      const res = await apiPublishTrip(payload);
      if (res && res.success && res.data) {
        setDriverRides(prev => [res.data, ...prev.filter(t => t.id !== res.data.id)]);
        setActiveTab('explore');
        triggerToast(`🚗 Car trip published! Live on all passenger radars.`);
      } else {
        triggerToast(`⚠️ ${res?.message || 'Could not publish trip.'}`);
      }
    } catch (err) {
      triggerToast(`⚠️ ${err.message || 'Could not publish trip.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[999] bg-emerald-600 border border-emerald-400 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <Bell className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenLiveTracking={() => setIsLiveTrackingOpen(true)}
        onOpenPostRide={() => setIsPostRideOpen(true)}
        activeTrip={activeTrip}
      />

      {/* Main Dynamic View with Lazy Suspense */}
      <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500 animate-pulse">Loading Swari module...</div>}>
        <main className="flex-1 pb-16">
        
        {/* VIEW 1: ROLE-BASED PERSONALIZED DASHBOARD (Dual Section: Passenger Mode + Driver Mode) */}
        {activeTab === 'dashboard' && (
          currentUser.role === 'ADMIN' ? (
            <AdminConsoleDashboard
              onOpenLiveTracking={() => setIsLiveTrackingOpen(true)}
              onOpenManifest={() => setIsManifestOpen(true)}
            />
          ) : (
            <UserUnifiedDashboard
              user={currentUser}
              activeTrip={activeTrip}
              driverRides={driverRides}
              broadcasts={passengerRequests}
              onOpenLiveTracking={() => setIsLiveTrackingOpen(true)}
              onOpenManifest={() => setIsManifestOpen(true)}
              onOpenLuggageTag={() => setIsLuggageTagOpen(true)}
              onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
              onOpenPostRide={() => setIsPostRideOpen(true)}
              onAcceptOffer={handleAcceptOfferAndTrack}
              onSendOffer={handleSendDriverOffer}
              onOpenChat={(driver, ride) => setActiveChatContext({ driver, ride })}
              onCancelTrip={handleCancelTrip}
              onCompleteTrip={handleCompleteTrip}
              onCancelBooking={handleCancelBooking}
              onOpenRating={(trip) => setRatingTrip(trip)}
              onPublishReturnRide={handlePublishReturnRide}
              onApproveBooking={handleApproveBooking}
              onDeclineBooking={handleDeclineBooking}
            />
          )
        )}

        {/* VIEW 2: EXPLORE / SEARCH RIDES (Iconic BlaBlaCar Experience) */}
        {activeTab === 'explore' && (
          <SearchAndBook
            rides={driverRides}
            onSelectRide={(ride) => setSelectedRideForDetails(ride)}
            onBookAndTrack={handleBookAndTrack}
            onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
            onOpenPostRide={() => setIsPostRideOpen(true)}
            hasActiveBooking={hasActiveBooking}
            activeTrip={activeTrip}
            onOpenLiveTracking={() => setIsLiveTrackingOpen(true)}
            loading={tripsLoading}
            error={tripsError}
            onRetry={loadData}
          />
        )}

        {/* VIEW 3: PASSENGER RADAR & BIDS */}
        {activeTab === 'broadcasts' && (
          <PassengerBroadcastBoard
            requests={passengerRequests}
            userMode={currentUser.role === 'DRIVER' ? 'driver' : 'passenger'}
            currentUser={currentUser}
            onSendDriverOffer={handleSendDriverOffer}
            onAcceptOfferAndTrack={handleAcceptOfferAndTrack}
            onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
          />
        )}

        {/* VIEW 4: LIVE GPS TELEMETRY MONITOR (Contextual) */}
        {activeTab === 'tracking' && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {activeTrip ? (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Navigation className="w-8 h-8 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-white">Active Live Satellite Feed</h2>
                <p className="text-xs text-gray-300 max-w-lg mx-auto">
                  Tracking vehicle <strong>{activeTrip.vehicle?.plate}</strong> ({activeTrip.vehicle?.make} {activeTrip.vehicle?.model}) cruising on {activeTrip.currentTelemetry?.currentHighway || 'Corridor'}.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsLiveTrackingOpen(true)}
                    className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Open Fullscreen Interactive Map & Telemetry
                  </button>
                  <button
                    onClick={() => setIsManifestOpen(true)}
                    className="py-3 px-5 rounded-2xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-emerald-400 font-bold text-sm transition-all flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Legal Manifest (MV Act 1988)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                  <Navigation className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">No Active Ride in Progress</h3>
                <p className="text-xs text-gray-400">
                  Live GPS telemetry becomes available when you have confirmed a carpool seat or started hosting a car trip.
                </p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
                >
                  Find Available Rides
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {selectedRideForDetails && (
        <RideDetailsModal
          ride={selectedRideForDetails}
          currentUser={currentUser}
          onClose={() => setSelectedRideForDetails(null)}
          onConfirmBooking={handleConfirmBookingFromDetails}
          onRequestBooking={handleRequestBooking}
          onOpenLiveTracking={() => setIsLiveTrackingOpen(true)}
          onOpenLuggageTag={() => setIsLuggageTagOpen(true)}
          onOpenManifest={() => setIsManifestOpen(true)}
          onOpenChat={(driver, ride) => setActiveChatContext({ driver, ride })}
          hasActiveBooking={hasActiveBooking}
          activeBookingTrip={activeTrip}
        />
      )}

      {activeChatContext && (
        <RideChatModal
          driver={activeChatContext.driver}
          passenger={currentUser}
          tripInfo={activeChatContext.ride}
          onClose={() => setActiveChatContext(null)}
          onApproveBooking={handleApproveBooking}
          onDeclineBooking={handleDeclineBooking}
        />
      )}

      {isLoginOpen && (
        <LoginModal
          currentUserId={currentUser.id}
          onSelectPersona={handleSelectPersona}
          onClose={() => setIsLoginOpen(false)}
        />
      )}

      {isLiveTrackingOpen && (
        <LiveTrackingModal
          trip={activeTrip}
          onClose={() => setIsLiveTrackingOpen(false)}
        />
      )}

      {isVerificationOpen && (
        <TrustVerificationModal
          onClose={() => setIsVerificationOpen(false)}
        />
      )}

      {isPostRideOpen && (
        <PostRideModal
          currentUser={currentUser}
          onClose={() => setIsPostRideOpen(false)}
          onPublishRide={handlePublishRide}
          activePublishedTrip={userPublishedTrip}
          onCancelTrip={handleCancelTrip}
        />
      )}

      {isBroadcastModalOpen && (
        <BroadcastRequestModal
          onClose={() => setIsBroadcastModalOpen(false)}
          onPublishRequest={handlePublishRequest}
        />
      )}

      {isManifestOpen && (
        <DigitalManifestModal
          tripId={activeTrip?.tripId || 'RIDE-101'}
          onClose={() => setIsManifestOpen(false)}
        />
      )}

      {isLuggageTagOpen && (
        <LuggageTagModal
          onClose={() => setIsLuggageTagOpen(false)}
          onConfirm={(tagData) => triggerToast(`Luggage ${tagData.tagId} tagged & insured!`)}
        />
      )}

      {isCsInspectorOpen && (
        <CsEngineInspectorModal
          onClose={() => setIsCsInspectorOpen(false)}
        />
      )}

      {ratingTrip && (
        <TripRatingModal
          isOpen={Boolean(ratingTrip)}
          trip={ratingTrip}
          currentUser={currentUser}
          onClose={() => setRatingTrip(null)}
          onSubmitRating={async (reviewData) => {
            await apiSubmitTwoWayRating(reviewData.tripId, reviewData);
            triggerToast(`⭐ Two-way verified rating saved for ${reviewData.targetName}!`);
          }}
        />
      )}
      </Suspense>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800/80 py-8 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-black text-white text-base">SWARI</span>
            <span>• Next-Gen Intercity Carpooling & Ride-Sharing Network</span>
          </div>
          <div className="flex items-center space-x-6 text-[11px]">
            <button onClick={() => setIsManifestOpen(true)} className="hover:text-emerald-400 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Travel Manifest</span>
            </button>
            <span className="text-gray-600">|</span>
            <button onClick={() => setIsVerificationOpen(true)} className="hover:text-emerald-400">
              Swari Shield™
            </button>
            <span className="text-gray-600">|</span>
            <button onClick={() => setIsCsInspectorOpen(true)} className="hover:text-indigo-400">
              CS Architecture & Telemetry
            </button>
            <span className="text-gray-600">|</span>
            <span>Motor Vehicles Act 1988 Compliance</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
