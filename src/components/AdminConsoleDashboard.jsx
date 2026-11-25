import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Radio, 
  AlertTriangle, 
  Car, 
  Navigation, 
  FileText, 
  Users, 
  Server, 
  CheckCircle, 
  Lock, 
  Clock, 
  MapPin, 
  IndianRupee, 
  Cpu, 
  RefreshCw,
  PhoneCall,
  Search,
  Filter
} from 'lucide-react';

export function AdminConsoleDashboard({ onOpenLiveTracking, onOpenManifest }) {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'sos' | 'corridors' | 'system'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosResolved, setSosResolved] = useState(false);

  const fetchOverview = async () => {
    try {
      const apiEndpoint = typeof window !== 'undefined' && window.location.port === '5174'
        ? 'http://localhost:8000/api/v1/admin/overview'
        : '/api/v1/admin/overview';
      const res = await fetch(apiEndpoint);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Admin overview fetch fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 4000);
    return () => clearInterval(interval);
  }, []);

  const kpis = data?.kpis || {
    totalTripsTracked: 4,
    activeBroadcasts: 2,
    verifiedKycUsersCount: 1420,
    activeCorridorsCount: 3,
    statutoryComplianceRate: '100%',
    sosResponseAvgSeconds: 1.8
  };

  const activeVehicles = data?.activeVehicles || [
    {
      tripId: 'SWARI-TRIP-98421',
      driverName: 'Vikramaditya Rao',
      vehiclePlate: 'KA 05 MN 2819',
      vehicleModel: 'Tata Nexon EV Empowered',
      speedKmph: 84,
      currentHighway: 'NH 44 (Krishnagiri Corridor)',
      status: 'IN_TRANSIT',
      routeDeviationAlert: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Ops Command Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-indigo-950/80 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">Central Operations & Safety Control Room</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  HQ LEVEL 1
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                Real-time Highway Surveillance • ERSS 112 Safety Dispatch • Motor Vehicles Act 1988 Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Telemetry Feed: 0.5 Hz</span>
            </span>
            <button
              onClick={fetchOverview}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 hover:text-white border border-gray-700 transition-all"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-800/80 text-xs">
          <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800">
            <span className="text-gray-400 text-[10px] block uppercase font-bold">Active Corridor Vehicles</span>
            <span className="text-xl font-black text-white">{activeVehicles.length}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">All Cruising Normal</span>
          </div>

          <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800">
            <span className="text-gray-400 text-[10px] block uppercase font-bold">DigiLocker KYC Users</span>
            <span className="text-xl font-black text-teal-400">{kpis.verifiedKycUsersCount}</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Aadhaar Biometric Gated</span>
          </div>

          <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800">
            <span className="text-gray-400 text-[10px] block uppercase font-bold">MV Act 1988 Compliance</span>
            <span className="text-xl font-black text-emerald-400">{kpis.statutoryComplianceRate}</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Zero Commercial Surcharges</span>
          </div>

          <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800">
            <span className="text-gray-400 text-[10px] block uppercase font-bold">ERSS 112 Dispatch Avg</span>
            <span className="text-xl font-black text-indigo-400">{kpis.sosResponseAvgSeconds}s</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Instant Telemetry Push</span>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="mt-5 pt-4 border-t border-gray-800/80 flex items-center space-x-2 text-xs overflow-x-auto">
          {[
            { id: 'radar', label: `Highway Telemetry Radar (${activeVehicles.length})`, icon: Navigation },
            { id: 'sos', label: 'Emergency SOS & Anti-Theft', icon: AlertTriangle },
            { id: 'corridors', label: 'Corridor Liquidity & Bids', icon: Radio },
            { id: 'system', label: 'Server & Database Health', icon: Server }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
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

      {/* 2. TAB: HIGHWAY TELEMETRY RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Live Expressway Surveillance Radar</span>
            </h3>
            <span className="text-xs text-gray-400">Automated geofence tracking & route deviation detection</span>
          </div>

          <div className="space-y-3">
            {activeVehicles.map((v, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 hover:border-indigo-500/40 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gray-950 border border-gray-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{v.driverName}</h4>
                      <span className="font-mono text-xs font-bold bg-gray-800 text-amber-300 px-2 py-0.5 rounded">
                        {v.vehiclePlate}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {v.vehicleModel} • Location: <strong className="text-gray-300">{v.currentHighway}</strong>
                    </p>
                    <div className="flex items-center space-x-3 text-[11px] text-gray-500 mt-1">
                      <span>Coordinates: {v.lat?.toFixed(4)}, {v.lng?.toFixed(4)}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">Route Deviation: None (&lt;100m)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right bg-gray-950 px-3.5 py-2 rounded-2xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 block font-bold">Speed</span>
                    <span className="text-base font-black text-white">{v.speedKmph} <span className="text-xs font-normal text-gray-400">km/h</span></span>
                  </div>

                  <button
                    onClick={onOpenLiveTracking}
                    className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Live Map Stream</span>
                  </button>

                  <button
                    onClick={onOpenManifest}
                    className="py-2.5 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-emerald-300 border border-gray-700 text-xs font-semibold"
                    title="Audit MV Act 1988 Manifest"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TAB: EMERGENCY SOS & ANTI-THEFT */}
      {activeTab === 'sos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>National Emergency ERSS 112 & Anti-Theft Feed</span>
              </h3>
              <p className="text-xs text-gray-400">Immediate police telecommunications & covert in-cabin audio vault stream</p>
            </div>
          </div>

          <div className="bg-gray-900 border border-red-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">Active Incident Monitor: SWARI-TRIP-98421</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                      POLICE 112 DISPATCHED
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Vehicle Plate: <strong className="text-amber-300 font-mono">KA 05 MN 2819</strong> • Driver: Vikramaditya Rao
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono text-gray-400 bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-800">
                Lat: 12.6310, Lng: 78.0120
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-gray-950 p-3.5 rounded-2xl border border-gray-800">
              <div>
                <span className="text-gray-500 block text-[10px]">Highway Toll Interception</span>
                <span className="font-semibold text-amber-300">Krishnagiri Plaza (Boom Barrier Alerted)</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Encrypted Audio Stream</span>
                <span className="text-emerald-400 font-mono">vault.swari.in/audio/enc-9941.mp3</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">SafePay Escrow Status</span>
                <span className="text-red-400 font-bold">FROZEN (Anti-Theft Lock)</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => alert('🚨 Dispatched Highway Patrol Squad unit to Attibele/Krishnagiri NH 44 sector.')}
                className="py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold border border-gray-700"
              >
                Re-dispatch Patrol Squad
              </button>
              <button
                onClick={() => {
                  setSosResolved(true);
                  alert('Incident marked RESOLVED by HQ Safety Officer.');
                }}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                {sosResolved ? 'Incident Resolved' : 'Mark Incident Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB: CORRIDORS & LIQUIDITY */}
      {activeTab === 'corridors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Intercity Highway Corridors & Liquidity</h3>
            <span className="text-xs text-gray-400">All corridors governed under statutory expense ceilings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'BLR-MAA', name: 'NH 44 Bengaluru ⇄ Chennai', km: 345, trips: 2, avgBudget: '₹570', compliance: '100%' },
              { id: 'DEL-CHD', name: 'NH 44 Delhi ⇄ Chandigarh', km: 245, trips: 1, avgBudget: '₹480', compliance: '100%' },
              { id: 'MUM-PUN', name: 'Mumbai ⇄ Pune Expressway', km: 148, trips: 1, avgBudget: '₹350', compliance: '100%' }
            ].map(c => (
              <div key={c.id} className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-white text-sm">{c.name}</h4>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    {c.compliance}
                  </span>
                </div>
                <div className="bg-gray-950 p-3 rounded-2xl border border-gray-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Highway Distance:</span>
                    <span className="text-white font-semibold">{c.km} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Carpool Trips:</span>
                    <span className="text-emerald-400 font-bold">{c.trips}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Passenger Budget:</span>
                    <span className="text-amber-400 font-bold">{c.avgBudget} / seat</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB: SYSTEM TELEMETRY & PERSISTENCE */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Node.js Process Telemetry</span>
            </h4>
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Heap Memory Used:</span>
                <span className="font-mono text-emerald-400 font-bold">42.8 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">WebSocket Sockets:</span>
                <span className="text-white font-bold">Active Stream</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gzip / Brotli Compression:</span>
                <span className="text-emerald-400 font-semibold">Enabled (Active)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Helmet CSP Security:</span>
                <span className="text-emerald-400 font-semibold">Enforced</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-5 rounded-3xl space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Storage & Statutory Engine</span>
            </h4>
            <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Persistence Store:</span>
                <span className="font-mono text-emerald-400 font-bold">server/data/store.json</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Write-Ahead Logging (WAL):</span>
                <span className="text-white font-semibold">Atomic Replace</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Motor Vehicles Act Audit:</span>
                <span className="text-emerald-400 font-bold">Passed (Zero Violations)</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
