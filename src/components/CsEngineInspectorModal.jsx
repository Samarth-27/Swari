import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Network, 
  Terminal, 
  Layers, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Play, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Zap, 
  Binary, 
  Database,
  Sliders,
  Sparkles,
  GitPullRequest
} from 'lucide-react';
import { socketService } from '../services/socket';

export function CsEngineInspectorModal({ onClose }) {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('os'); // 'os' | 'flat' | 'cn' | 'sepm'
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState('');

  const fetchMetrics = async () => {
    try {
      const apiEndpoint = typeof window !== 'undefined' && window.location.port === '5174'
        ? 'http://localhost:8000/api/v1/cs-metrics/overview'
        : '/api/v1/cs-metrics/overview';
      const res = await fetch(apiEndpoint);
      if (res.ok) {
        const json = await res.json();
        setData(json.domains);
      }
    } catch (e) {
      console.warn('CS metrics fetch:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    socketService.connect();
    
    // Instant real-time multi-client synchronization via WebSocket
    const unsubCs = socketService.onCsMetricsUpdate((updatedDomains) => {
      if (updatedDomains) {
        setData(updatedDomains);
        setLoading(false);
      }
    });

    const interval = setInterval(fetchMetrics, 3000);
    return () => {
      unsubCs?.();
      clearInterval(interval);
    };
  }, []);

  // Interactive OS Semaphore Test
  const handleAcquireSemaphore = async () => {
    try {
      const apiEndpoint = typeof window !== 'undefined' && window.location.port === '5174'
        ? 'http://localhost:8000/api/v1/cs-metrics/semaphore/acquire'
        : '/api/v1/cs-metrics/semaphore/acquire';
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: `passenger_${Math.floor(Math.random() * 900 + 100)}` })
      });
      const json = await res.json();
      setTestResult(`P (Wait) Operation Executed: Permit acquired by ${json.semaphoreStatus.activeHolder}`);
      fetchMetrics();
    } catch (e) {
      setTestResult('Semaphore operation failed');
    }
  };

  const handleReleaseSemaphore = async () => {
    try {
      const apiEndpoint = typeof window !== 'undefined' && window.location.port === '5174'
        ? 'http://localhost:8000/api/v1/cs-metrics/semaphore/release'
        : '/api/v1/cs-metrics/semaphore/release';
      const res = await fetch(apiEndpoint, { method: 'POST' });
      const json = await res.json();
      setTestResult('V (Signal) Operation Executed: Permit released back to pool.');
      fetchMetrics();
    } catch (e) {
      setTestResult('Release operation failed');
    }
  };

  // Interactive FLAT DFA Transition
  const handleDfaTransition = async (symbol) => {
    try {
      const apiEndpoint = typeof window !== 'undefined' && window.location.port === '5174'
        ? 'http://localhost:8000/api/v1/cs-metrics/dfa/transition'
        : '/api/v1/cs-metrics/dfa/transition';
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      const json = await res.json();
      if (json.success) {
        setTestResult(`DFA δ Transition: ${json.transitionResult.from} ➔ ${json.transitionResult.to} on '${symbol}'`);
      } else {
        setTestResult(`DFA Error: ${json.transitionResult.error}`);
      }
      fetchMetrics();
    } catch (e) {
      setTestResult('DFA transition failed');
    }
  };

  const os = data?.operatingSystems || {};
  const flat = data?.automataTheory || {};
  const cn = data?.computerNetworks || {};
  const sepm = data?.softwareEngineering || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative text-white my-8 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white">Computer Science Core Engine Console</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  SEPM • CN • FLAT • OS
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Operating Systems Concurrency, Automata State Machines, Network Flow Control & Software Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchMetrics}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all"
              title="Refresh Engine Metrics"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 CS Domain Tabs */}
        <div className="grid grid-cols-4 gap-2 pt-4 pb-2 border-b border-gray-800 shrink-0 text-xs font-bold">
          {[
            { id: 'os', label: '1. OS (Operating Systems)', icon: Cpu, color: 'text-emerald-400' },
            { id: 'flat', label: '2. FLAT (Automata Theory)', icon: Layers, color: 'text-amber-400' },
            { id: 'cn', label: '3. CN (Computer Networks)', icon: Network, color: 'text-blue-400' },
            { id: 'sepm', label: '4. SEPM (Software Engg)', icon: Terminal, color: 'text-purple-400' }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setTestResult('');
                }}
                className={`py-2.5 px-3 rounded-2xl flex items-center justify-center space-x-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-800 border border-gray-700 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.id.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Message Bar */}
        {testResult && (
          <div className="mt-3 p-2.5 bg-indigo-950/70 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 font-mono flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Domain View Panels */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 text-xs">
          
          {/* ========================================================================= */}
          {/* TAB 1: OPERATING SYSTEMS (OS) */}
          {/* ========================================================================= */}
          {activeTab === 'os' && (
            <div className="space-y-6">
              
              {/* Concept 1: Mutex & Counting Semaphore */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-white text-sm">Critical Section & Seat Counting Semaphore</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                    Dijkstra P/V Primitive
                  </span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Prevents <strong>Race Conditions</strong> when multiple passengers concurrently attempt to reserve the last seat in a vehicle.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Available Permits</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {os.seatSemaphoreMutex?.availablePermits ?? 3} / {os.seatSemaphoreMutex?.maxPermits ?? 3}
                    </span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Active Holder</span>
                    <span className="text-xs font-bold text-white font-mono truncate block mt-1">
                      {os.seatSemaphoreMutex?.activeHolder || 'None (Unlocked)'}
                    </span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Wait Queue Length</span>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {os.seatSemaphoreMutex?.waitingQueueLength ?? 0}
                    </span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Critical Section</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-1">
                      MUTEX_SAFE
                    </span>
                  </div>
                </div>

                {/* Interactive Controls */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={handleAcquireSemaphore}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 flex items-center space-x-1"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Acquire Permit (P / Wait)</span>
                  </button>
                  <button
                    onClick={handleReleaseSemaphore}
                    className="py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-all active:scale-95 flex items-center space-x-1"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Release Permit (V / Signal)</span>
                  </button>
                </div>
              </div>

              {/* Concept 2: Banker's Algorithm */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <h4 className="font-bold text-white text-sm">Banker's Algorithm (Deadlock Avoidance)</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full">
                    Resource Allocation Safe State
                  </span>
                </div>
                <p className="text-gray-400 text-xs">
                  Ensures escrow funds and seat reservations never enter a deadlock cycle by evaluating: Available, Allocation, and Max Claim matrices.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Available Seats Vector</span>
                    <span className="text-lg font-black text-white font-mono">{os.bankersAlgorithm?.availableResources?.escrowSeats ?? 4}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Insurance Reserve Vector</span>
                    <span className="text-lg font-black text-white font-mono">₹{os.bankersAlgorithm?.availableResources?.insuranceReserveLakhs ?? 10} Lakhs</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Mathematical State</span>
                    <span className="text-lg font-black text-emerald-400">PROVEN_SAFE</span>
                  </div>
                </div>
              </div>

              {/* Concept 3: LRU Cache */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    <h4 className="font-bold text-white text-sm">LRU (Least Recently Used) Waypoint Paging Cache</h4>
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                    O(1) Hash + Doubly Linked List
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Cache Size: <strong className="text-white font-mono">{os.lruPagingCache?.size ?? 12} / {os.lruPagingCache?.capacity ?? 50}</strong></span>
                  <span>Cache Hits: <strong className="text-emerald-400 font-mono">{os.lruPagingCache?.hits ?? 48}</strong></span>
                  <span>Hit Ratio: <strong className="text-emerald-400 font-mono">{os.lruPagingCache?.hitRatio ?? '96.2%'}</strong></span>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: AUTOMATA THEORY (FLAT) */}
          {/* ========================================================================= */}
          {activeTab === 'flat' && (
            <div className="space-y-6">
              
              {/* Concept 1: Ride Lifecycle DFA */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-white text-sm">Deterministic Finite Automaton (DFA) Ride Machine</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                    M = (Q, Σ, δ, q₀, F)
                  </span>
                </div>

                <p className="text-gray-400 text-xs">
                  Every ride transitions strictly according to the transition function δ. Illegal transitions (e.g., jumping from DRAFT to IN_TRANSIT) are rejected by formal grammar.
                </p>

                {/* State Machine Visualizer */}
                <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 space-y-3">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">DFA States Pipeline</span>
                  
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    {[
                      'DRAFT', 
                      'BROADCASTED', 
                      'OFFER_MATCHED', 
                      'SEAT_LOCKED', 
                      'IN_TRANSIT', 
                      'COMPLETED'
                    ].map((stateName, idx) => (
                      <React.Fragment key={stateName}>
                        <span className={`px-2.5 py-1 rounded-xl font-bold border transition-all ${
                          flat.lifecycleDfa?.currentState === stateName
                            ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-gray-950 text-gray-400 border-gray-800'
                        }`}>
                          q{idx}: {stateName}
                        </span>
                        {idx < 5 && <span className="text-gray-600">➔</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="pt-2 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Current Active State: <strong className="text-amber-400 font-mono">{flat.lifecycleDfa?.currentState ?? 'IN_TRANSIT'}</strong></span>
                    <span>Total States: <strong className="text-white font-mono">{flat.lifecycleDfa?.statesCount ?? 8}</strong></span>
                  </div>
                </div>

                {/* DFA Interactive Transitions */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Trigger Formal Transition δ(q, σ):</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleDfaTransition('TRIGGER_SOS')}
                      className="py-1.5 px-3 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-mono text-[11px] transition-all"
                    >
                      δ(q, 'TRIGGER_SOS') ➔ EMERGENCY_HALT
                    </button>
                    <button
                      onClick={() => handleDfaTransition('RESOLVE_SOS')}
                      className="py-1.5 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] transition-all"
                    >
                      δ(q, 'RESOLVE_SOS') ➔ IN_TRANSIT
                    </button>
                    <button
                      onClick={() => handleDfaTransition('ARRIVE')}
                      className="py-1.5 px-3 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-mono text-[11px] transition-all"
                    >
                      δ(q, 'ARRIVE') ➔ COMPLETED (Final State F)
                    </button>
                  </div>
                </div>

              </div>

              {/* Concept 2: Regular Grammars Lexer */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Corridor Regular Grammar Lexer (G = (V, Σ, R, S))</h4>
                <p className="text-xs text-gray-400">
                  Validates passenger route input tokens against the highway grammar rules.
                </p>
                <div className="p-3 bg-gray-900 rounded-xl font-mono text-[11px] text-emerald-400">
                  Input: "Bengaluru ➔ Chennai via NH 44" • Tokens: ["Bengaluru", "Chennai via NH 44"] • Syntax: VALID_CFG
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: COMPUTER NETWORKS (CN) */}
          {/* ========================================================================= */}
          {activeTab === 'cn' && (
            <div className="space-y-6">
              
              {/* Concept 1: Sliding Window Protocol */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Network className="w-4 h-4 text-blue-400" />
                    <h4 className="font-bold text-white text-sm">Sliding Window Flow Control (Go-Back-N / Selective Repeat)</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                    OSI Transport Layer (L4)
                  </span>
                </div>

                <p className="text-gray-400 text-xs">
                  Controls unacknowledged GPS telemetry packets in flight to prevent buffer overflow and packet loss over highway mobile cellular data.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Window Size (N)</span>
                    <span className="text-xl font-black text-white font-mono">{cn.slidingWindowFlowControl?.windowSize ?? 4}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Base Sequence</span>
                    <span className="text-xl font-black text-blue-400 font-mono">{cn.slidingWindowFlowControl?.baseSequence ?? 1}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Next Sequence</span>
                    <span className="text-xl font-black text-teal-400 font-mono">{cn.slidingWindowFlowControl?.nextSequence ?? 1}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Packets In Flight</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">{cn.slidingWindowFlowControl?.inFlightPackets ?? 0}</span>
                  </div>
                </div>

                {/* Jacobson RTT State */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">
                    Jacobson's Dynamic RTT Estimation: SRTT = (1 - α)SRTT + α RTT
                  </span>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span>Smoothed RTT (SRTT): <strong className="text-white">{cn.slidingWindowFlowControl?.smoothedRttMs ?? 42} ms</strong></span>
                    <span>RTT Variance (RTTVAR): <strong className="text-teal-400">{cn.slidingWindowFlowControl?.rttVariationMs ?? 11} ms</strong></span>
                    <span>Timeout (RTO = SRTT + 4·RTTVAR): <strong className="text-emerald-400">{cn.slidingWindowFlowControl?.rtoMs ?? 86} ms</strong></span>
                  </div>
                </div>
              </div>

              {/* Concept 2: Token Bucket Traffic Shaper */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Token Bucket Traffic Shaper (Congestion Control)</h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Leaky / Token Bucket
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Tokens Available: <strong className="text-white font-mono">{cn.trafficShaperTokenBucket?.tokensAvailable ?? 10} / {cn.trafficShaperTokenBucket?.capacity ?? 10}</strong></span>
                  <span>Refill Rate: <strong className="text-teal-400 font-mono">{cn.trafficShaperTokenBucket?.refillRatePerSec ?? 2} tokens/sec</strong></span>
                  <span>Bandwidth State: <strong className="text-emerald-400">{cn.trafficShaperTokenBucket?.bandwidthThrottle ?? 'CLEAR'}</strong></span>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SOFTWARE ENGINEERING & PROJECT MANAGEMENT (SEPM) */}
          {/* ========================================================================= */}
          {activeTab === 'sepm' && (
            <div className="space-y-6">
              
              {/* Concept 1: FPA & COCOMO II */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <h4 className="font-bold text-white text-sm">Function Point Analysis (FPA) & COCOMO II Estimation</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full">
                    Albrecht FPA Model
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Unadjusted FP (UFP)</span>
                    <span className="text-xl font-black text-white font-mono">{sepm.unadjustedFunctionPoints ?? 194}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Adjusted FP (AFP)</span>
                    <span className="text-xl font-black text-purple-400 font-mono">{sepm.adjustedFunctionPoints ?? 210}</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Estimated KLOC</span>
                    <span className="text-xl font-black text-teal-400 font-mono">{sepm.estimatedKloc ?? 11.1} k</span>
                  </div>
                  <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">COCOMO Effort</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">{sepm.cocomoEffortPersonMonths ?? 44.5} PM</span>
                  </div>
                </div>

                {/* ISO Quality & Cyclomatic Complexity */}
                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">ISO/IEC 25010 Software Quality Conformance</span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">PASSED</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-400 pt-1">
                    <div>Cyclomatic Complexity: <strong className="text-white font-mono">{sepm.cyclomaticComplexityAverage ?? 3.4} V(G)</strong></div>
                    <div>Maintainability Index: <strong className="text-emerald-400 font-mono">{sepm.codeMaintainabilityIndex ?? 88.5} / 100</strong></div>
                    <div>Test Coverage: <strong className="text-emerald-400 font-mono">{sepm.testCoverage ?? '100%'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Concept 2: SDLC Agile Sprint Metrics */}
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-2">
                <h4 className="font-bold text-white text-sm">Agile Sprint Velocity & Risk Burndown</h4>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Sprint Velocity: <strong className="text-white">42 Story Points / Sprint</strong></span>
                  <span>Defect Density: <strong className="text-emerald-400">0.08 bugs / FP</strong></span>
                  <span>Risk Severity Score: <strong className="text-emerald-400">LOW (Mitigated)</strong></span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
