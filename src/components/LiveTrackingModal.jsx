import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Navigation, 
  Phone, 
  MessageSquare, 
  Share2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Gauge, 
  BatteryCharging, 
  X, 
  CheckCircle,
  Copy,
  ChevronRight,
  ExternalLink,
  FileText,
  Briefcase
} from 'lucide-react';
import { HIGHWAY_ROUTES } from '../data/mockData';
import { socketService } from '../services/socket';
import { triggerEmergencySos } from '../services/api';
import { DigitalManifestModal } from './DigitalManifestModal';
import { LuggageTagModal } from './LuggageTagModal';

export function LiveTrackingModal({ trip, onClose, onEmergencyTrigger }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const carMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  const routeData = HIGHWAY_ROUTES[trip.routeId] || HIGHWAY_ROUTES['BLR-MAA'];
  const waypoints = routeData.waypoints;

  // Real-time animation states
  const [progressFraction, setProgressFraction] = useState(0.42);
  const [telemetry, setTelemetry] = useState(trip.currentTelemetry);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);
  const [showManifest, setShowManifest] = useState(false);
  const [showLuggageTag, setShowLuggageTag] = useState(false);
  const [luggageTagInfo, setLuggageTagInfo] = useState(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'driver', text: 'Hi Rahul! Just crossed Attibele. Traffic is clear on NH 44.', time: '04:45 PM' },
    { sender: 'passenger', text: 'Great Vikram! AC temperature is perfect. Let me know when we stop for coffee.', time: '04:50 PM' },
    { sender: 'driver', text: 'Sure, planned a 15-min tea break at Vellore bypass.', time: '04:52 PM' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Dark Theme Tiles
      const map = L.map(mapContainerRef.current, {
        center: [telemetry.lat, telemetry.lng],
        zoom: 9,
        zoomControl: false
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors & CartoDB',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Draw Highway Route Polyline
      const latLngs = waypoints.map(w => [w.lat, w.lng]);
      const polyline = L.polyline(latLngs, {
        color: '#10b981',
        weight: 5,
        opacity: 0.85,
        dashArray: '1, 2'
      }).addTo(map);
      polylineRef.current = polyline;

      // Add Start & End Markers
      const startPoint = waypoints[0];
      const endPoint = waypoints[waypoints.length - 1];

      // Origin Marker
      const originIcon = L.divIcon({
        className: 'custom-origin-marker',
        html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #3b82f6;"></div>`,
        iconSize: [14, 14]
      });
      L.marker([startPoint.lat, startPoint.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>Pickup Origin:</b><br/>${startPoint.name}`);

      // Destination Marker
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #ef4444;"></div>`,
        iconSize: [16, 16]
      });
      L.marker([endPoint.lat, endPoint.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b><br/>${endPoint.name}`);

      // Add Waypoint/Toll markers
      waypoints.slice(1, -1).forEach(wp => {
        const wpIcon = L.divIcon({
          className: 'custom-wp-marker',
          html: `<div style="background-color: ${wp.type === 'toll' ? '#f59e0b' : '#6b7280'}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #1f2937;"></div>`,
          iconSize: [10, 10]
        });
        L.marker([wp.lat, wp.lng], { icon: wpIcon })
          .addTo(map)
          .bindPopup(`<b>${wp.type === 'toll' ? 'Highway FASTag Toll' : 'Stopover'}</b><br/>${wp.name}`);
      });

      // Moving Car Marker (Animated Car Icon)
      const carIcon = L.divIcon({
        className: 'custom-car-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.3); animation: pulse-ring 1.8s infinite;"></div>
            <div style="background: #047857; border: 2px solid #34d399; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(16, 185, 129, 0.8);">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const carMarker = L.marker([telemetry.lat, telemetry.lng], { icon: carIcon }).addTo(map);
      carMarkerRef.current = carMarker;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Connect to real-time WebSockets
  useEffect(() => {
    socketService.connect();
    socketService.onTelemetryUpdate((updatedTrip) => {
      if (updatedTrip && updatedTrip.currentTelemetry) {
        setTelemetry(prev => ({
          ...prev,
          ...updatedTrip.currentTelemetry
        }));
        if (carMarkerRef.current) {
          carMarkerRef.current.setLatLng([
            updatedTrip.currentTelemetry.lat,
            updatedTrip.currentTelemetry.lng
          ]);
        }
      }
    });

    // Fallback simulation timer if socket is offline
    const interval = setInterval(() => {
      setProgressFraction(prev => {
        const next = prev + 0.003;
        if (next >= 0.95) return 0.2;
        return next;
      });

      setTelemetry(prev => {
        const totalPoints = waypoints.length;
        const targetIndex = Math.min(Math.floor(progressFraction * totalPoints), totalPoints - 2);
        const p1 = waypoints[targetIndex];
        const p2 = waypoints[targetIndex + 1];

        const localFraction = (progressFraction * totalPoints) - targetIndex;
        const currentLat = p1.lat + (p2.lat - p1.lat) * localFraction;
        const currentLng = p1.lng + (p2.lng - p1.lng) * localFraction;

        if (carMarkerRef.current && !socketService.isConnected) {
          carMarkerRef.current.setLatLng([currentLat, currentLng]);
        }

        const newSpeed = Math.floor(78 + Math.random() * 12);
        const remainingKm = Math.max(12, Math.floor(trip.currentTelemetry.distanceRemainingKm * (1 - progressFraction)));
        const etaMins = Math.floor(remainingKm * 0.9);

        return {
          ...prev,
          lat: currentLat,
          lng: currentLng,
          speedKmph: newSpeed,
          distanceRemainingKm: remainingKm,
          etaMinutes: etaMins
        };
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [progressFraction, waypoints, trip.currentTelemetry.distanceRemainingKm]);

  // Handle Share Link
  const handleCopyShareLink = () => {
    navigator.clipboard?.writeText(`https://swari.in/track/${trip.tripId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Send In-App Chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, {
      sender: 'passenger',
      text: chatInput,
      time: 'Just now'
    }]);
    setChatInput('');
  };

  // Handle Emergency Confirmation
  const handleConfirmEmergency = async () => {
    setSosActivated(true);
    setShowSosConfirm(false);
    await triggerEmergencySos({
      tripId: trip.tripId,
      vehiclePlate: trip.vehicle.plate,
      driverName: trip.driver.name,
      currentLocation: { lat: telemetry.lat, lng: telemetry.lng }
    });
    alert('🚨 Emergency SOS Triggered! Real-time GPS pushed to Police Dial 112, Swari Rapid Response Desk, and family contacts.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header / Status Strip */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gray-950 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Live GPS Ride Tracking
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {trip.tripId}
                </span>
                {socketService.isConnected && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    WebSocket Live
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {routeData.name} • Highway Transit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            
            {/* Anti-Theft Luggage Tag */}
            <button
              onClick={() => setShowLuggageTag(true)}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 border border-gray-700 transition-all"
              title="Tag and insure luggage against theft"
            >
              <Briefcase className="w-3.5 h-3.5 text-teal-400" />
              <span>{luggageTagInfo ? 'Luggage Sealed' : 'Tag Luggage'}</span>
            </button>

            {/* Legal Manifest Pass Button */}
            <button
              onClick={() => setShowManifest(true)}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-emerald-300 border border-gray-700 transition-all"
              title="Official MV Act 1988 cost-sharing certificate for RTO/Police"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Legal Manifest</span>
            </button>

            {/* Share Trip Link Button */}
            <button
              onClick={handleCopyShareLink}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-200 border border-gray-700 transition-all"
              title="Share live location with family on WhatsApp"
            >
              {copiedLink ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-gray-400" />}
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share Live Trip'}</span>
            </button>

            {/* Silent Emergency SOS Button */}
            <button
              onClick={() => setShowSosConfirm(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-900/40 transition-all active:scale-95"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Map + Live Telemetry HUD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
          
          {/* Left 2 Cols: Interactive Leaflet Map */}
          <div className="lg:col-span-2 relative h-[380px] sm:h-[450px] lg:h-full min-h-[380px] bg-gray-950">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Floating Live Telemetry Badge on Map */}
            <div className="absolute top-4 left-4 z-[400] glass-panel p-3 rounded-xl max-w-xs shadow-xl text-white">
              <div className="flex items-center justify-between space-x-3 mb-2">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Gauge className="w-4 h-4 animate-spin-slow" />
                  <span>Real-Time Telemetry</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                  GPS Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Cruising Speed</span>
                  <span className="text-lg font-black text-white">{telemetry.speedKmph} <span className="text-xs font-normal text-gray-400">km/h</span></span>
                </div>
                <div className="bg-gray-900/80 p-2 rounded-lg border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Distance Left</span>
                  <span className="text-lg font-black text-white">{telemetry.distanceRemainingKm} <span className="text-xs font-normal text-gray-400">km</span></span>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-gray-300 flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-gray-400">Next Toll:</span>
                <span className="font-semibold text-amber-300">{telemetry.nextToll}</span>
              </div>
            </div>

            {/* Recenter Button */}
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([telemetry.lat, telemetry.lng], 11, { animate: true });
                }
              }}
              className="absolute bottom-4 left-4 z-[400] glass-panel px-3 py-2 rounded-xl text-xs font-semibold text-white hover:bg-gray-800/90 transition-all flex items-center space-x-1.5 shadow-lg"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Center on Car</span>
            </button>
          </div>

          {/* Right Col: Driver Info, Stopovers, Actions & Chat */}
          <div className="lg:col-span-1 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Driver & Vehicle Card */}
            <div className="bg-gray-800/80 rounded-xl p-4 border border-gray-700/80 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={trip.driver.avatar}
                    alt={trip.driver.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/80"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h4 className="text-sm font-bold text-white">{trip.driver.name}</h4>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" title="Aadhaar & DL Verified Driver" />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-300 mt-0.5">
                      <span className="text-amber-400 font-bold">★ {trip.driver.rating}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{trip.driver.totalRides} trips</span>
                    </div>
                  </div>
                </div>

                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {trip.vehicle.fuelType || 'EV'}
                </span>
              </div>

              {/* Car Specifics */}
              <div className="mt-3 pt-3 border-t border-gray-700/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block">Vehicle</span>
                  <span className="font-semibold text-white">{trip.vehicle.make} {trip.vehicle.model}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Number Plate</span>
                  <span className="font-mono font-bold text-amber-300">{trip.vehicle.plate}</span>
                </div>
              </div>

              {/* Direct Communication Buttons (Masked Calling & In-App Chat) */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => alert(`Connecting secure masked proxy call via Swari Exotel Gateway: ${trip.driver.phoneMasked}`)}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Masked Call</span>
                </button>
                <button
                  onClick={() => setChatOpen(!chatOpen)}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{chatOpen ? 'Hide Chat' : 'In-App Chat'}</span>
                </button>
              </div>
            </div>

            {/* In-App Chat Accordion */}
            {chatOpen && (
              <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 flex flex-col h-56">
                <div className="text-xs font-bold text-gray-300 pb-2 border-b border-gray-800 flex items-center justify-between">
                  <span>Chat with Vikramaditya</span>
                  <span className="text-[10px] text-emerald-400 font-normal">Encrypted</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 py-2 text-xs">
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col ${m.sender === 'passenger' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`p-2 rounded-lg max-w-[85%] ${
                          m.sender === 'passenger'
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : 'bg-gray-800 text-gray-200 rounded-bl-none'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[9px] text-gray-500 mt-0.5">{m.time}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex items-center space-x-1 pt-2 border-t border-gray-800">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* Journey Timeline & Stopovers */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/60">
              <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Trip Milestones</span>
                <span className="text-[10px] text-emerald-400 font-semibold">ETA ~{telemetry.etaMinutes} mins</span>
              </h5>

              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-700">
                {/* Milestone 1: Pickup */}
                <div className="flex items-start space-x-3 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-white block">{trip.pickupPoint.name}</span>
                    <span className="text-emerald-400 text-[10px]">Picked Up • {trip.pickupPoint.timeCompleted}</span>
                  </div>
                </div>

                {/* Milestone 2: Mid-way Toll */}
                <div className="flex items-start space-x-3 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-gray-950 shrink-0 shadow-sm animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-amber-200 block">Krishnagiri / Vaniyambadi</span>
                    <span className="text-gray-400 text-[10px]">Highway Cruising • Live Speed: {telemetry.speedKmph} km/h</span>
                  </div>
                </div>

                {/* Milestone 3: Destination */}
                <div className="flex items-start space-x-3 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-gray-300 block">{trip.dropoffPoint.name}</span>
                    <span className="text-gray-400 text-[10px]">Expected Arrival: {trip.dropoffPoint.expectedTime}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Escrow Payment Security Pill */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Swari SafePay Escrow: <strong>₹{trip.fareTotal}</strong></span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                Protected
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Emergency SOS Confirmation Modal */}
      {showSosConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 p-4">
          <div className="bg-gray-900 border border-red-600 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            
            <h3 className="text-xl font-black text-white">Silent Emergency SOS</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Activating Silent SOS will covertly push your live coordinates, vehicle plate (<strong className="text-white">{trip.vehicle.plate}</strong>), and driver profile to:
            </p>

            <div className="bg-gray-950 p-3 rounded-xl text-left text-xs space-y-1.5 border border-gray-800 text-gray-300">
              <div className="flex items-center justify-between">
                <span>🚨 National Police ERSS:</span>
                <strong className="text-white">Dial 112</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>🛡️ Swari Rapid Response Desk:</span>
                <strong className="text-emerald-400">Live Satellite Telemetry</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>📱 Trusted Emergency Contacts:</span>
                <strong className="text-white">WhatsApp Live Tracking Sent</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowSosConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmergency}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
              >
                Confirm SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Travel Manifest Modal (MV Act 1988) */}
      {showManifest && (
        <DigitalManifestModal
          tripId={trip.tripId}
          onClose={() => setShowManifest(false)}
        />
      )}

      {/* Anti-Theft Luggage Tagging Modal */}
      {showLuggageTag && (
        <LuggageTagModal
          onClose={() => setShowLuggageTag(false)}
          onConfirm={(tagData) => setLuggageTagInfo(tagData)}
        />
      )}

    </div>
  );
}
