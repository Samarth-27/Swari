import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  PhoneCall, 
  ShieldCheck, 
  Lock, 
  MapPin, 
  CheckCheck, 
  Smile, 
  Paperclip,
  Clock,
  AlertCircle,
  PhoneOff,
  Radio,
  Check,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { socketService } from '../services/socket';
import { 
  fetchChatMessages, 
  sendChatMessageApi, 
  approveBooking as apiApproveBooking, 
  declineBooking as apiDeclineBooking 
} from '../services/api';

export function RideChatModal({ 
  driver, 
  passenger, 
  tripInfo, 
  onClose,
  onApproveBooking,
  onDeclineBooking
}) {
  const tripId = tripInfo?.tripId || tripInfo?.id || 'RIDE-101';
  const isDriver = passenger?.role === 'DRIVER';
  const myName = passenger?.fullName || 'Verified Traveler';
  const myRole = isDriver ? 'driver' : 'passenger';

  const otherAvatar = isDriver
    ? (driver?.avatar || tripInfo?.passengerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80')
    : (driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');

  const otherName = isDriver
    ? (driver?.name || tripInfo?.passengerName || 'Verified Passenger')
    : (driver?.name || 'Host Driver');

  const otherRoleLabel = isDriver ? 'Passenger' : 'Host Driver';

  const defaultGreeting = {
    id: `INIT-${tripId}`,
    tripId,
    sender: isDriver ? 'passenger' : 'driver',
    senderName: otherName,
    text: isDriver 
      ? `Hello! Looking forward to sharing this carpool ride with you along ${tripInfo?.origin || 'the corridor'}.`
      : `Hi ${passenger?.fullName?.split(' ')[0] || 'there'}! I have your seat reserved. Where along ${tripInfo?.origin || 'the highway corridor'} would you like to meet?`,
    time: 'Just now',
    type: 'TEXT'
  };

  const [messages, setMessages] = useState([defaultGreeting]);
  const [inputVal, setInputVal] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(tripInfo?.pendingRequests || []);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Persisted Two-Way Chat Messages & Real-Time Sync
  useEffect(() => {
    let isMounted = true;

    // 1. Fetch real-time persisted messages from backend database
    fetchChatMessages(tripId).then(res => {
      if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
        setMessages(res.data);
      }
    });

    // 2. Connect to WebSocket room
    socketService.joinChatRoom(tripId, myName);

    // 3. Listen to incoming messages in real-time
    const unsubMsg = socketService.onChatMessage((incomingMsg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === incomingMsg.id)) return prev;
        return [...prev, incomingMsg];
      });
    });

    const unsubHistory = socketService.onChatHistory((history) => {
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history);
      }
    });

    // 4. Listen to booking request / approval events
    const unsubReq = socketService.onBookingRequested((payload) => {
      if (payload && payload.tripId === tripId) {
        setPendingRequests(prev => [...prev.filter(r => r.name !== payload.passengerName), payload.request]);
      }
    });

    const unsubApprove = socketService.onBookingApproved((payload) => {
      if (payload && payload.tripId === tripId) {
        setPendingRequests(prev => prev.filter(r => r.name !== payload.passengerName));
      }
    });

    return () => {
      isMounted = false;
      unsubMsg?.();
      unsubHistory?.();
      unsubReq?.();
      unsubApprove?.();
    };
  }, [tripId, myName]);

  // Call timer simulation
  useEffect(() => {
    let timer;
    if (isCalling) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tripId,
      sender: myRole,
      senderName: myName,
      text: inputVal.trim(),
      type: 'TEXT',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Broadcast over WebSocket and save to database in parallel
    socketService.sendChatMessage(tripId, userMsg);
    try {
      await sendChatMessageApi(tripId, userMsg);
    } catch (err) {
      console.warn('[SWARI-CHAT] Backend chat persistence error:', err.message);
    }
  };

  // Driver Approves Booking from Chat
  const handleChatApprove = async (pName) => {
    if (onApproveBooking) {
      await onApproveBooking(tripId, pName);
    } else {
      await apiApproveBooking(tripId, pName);
    }
    setPendingRequests(prev => prev.filter(r => r.name !== pName));
  };

  // Driver Declines Booking from Chat
  const handleChatDecline = async (pName) => {
    if (onDeclineBooking) {
      await onDeclineBooking(tripId, pName);
    } else {
      await apiDeclineBooking(tripId, pName);
    }
    setPendingRequests(prev => prev.filter(r => r.name !== pName));
  };

  const formatCallTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Escape key accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-modal-title"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full h-[640px] shadow-2xl flex flex-col relative text-white overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-gray-950 p-4 border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={otherAvatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-950"></span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 id="chat-modal-title" className="text-sm font-bold text-white">{otherName}</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  {otherRoleLabel}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Two-Way Persistent Stream • Real-Time Database</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Masked Call Button */}
            <button
              onClick={() => setIsCalling(!isCalling)}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                isCalling
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-emerald-500/30'
              }`}
              title="Encrypted virtual VoIP call (phone number stays private)"
            >
              {isCalling ? (
                <>
                  <PhoneOff className="w-4 h-4" />
                  <span>{formatCallTime(callDuration)}</span>
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4" />
                  <span className="hidden sm:inline">Call Masked</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* In-Call Active Banner */}
        {isCalling && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold">Swari Virtual Voice Relay Connected • HD Voice</span>
            </div>
            <span className="font-mono font-bold text-white">{formatCallTime(callDuration)}</span>
          </div>
        )}

        {/* Pending Request Alert for Driver */}
        {isDriver && pendingRequests.length > 0 && (
          <div className="bg-gradient-to-r from-amber-950/90 to-gray-950 border-b border-amber-500/50 px-4 py-2 flex items-center justify-between text-xs shrink-0 animate-pulse-subtle">
            <div className="flex items-center space-x-2 text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">
                {pendingRequests[0].name} requested a seat on this ride
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleChatDecline(pendingRequests[0].name)}
                className="px-2 py-0.5 rounded-lg bg-gray-800 hover:bg-red-950 text-red-400 text-[10px] font-bold border border-red-500/30"
              >
                Decline
              </button>
              <button
                onClick={() => handleChatApprove(pendingRequests[0].name)}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold shadow-sm flex items-center space-x-1"
              >
                <Check className="w-3 h-3" />
                <span>Yes, I Accept</span>
              </button>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-gray-950/50 px-4 py-2 border-b border-gray-800/60 text-[10px] text-gray-400 flex items-center justify-between shrink-0">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>DPDP Act 2023 Masked • Messages saved in database</span>
          </span>
          <span className="text-gray-500">Corridor: {tripInfo?.origin?.split(' ')[0] || 'BLR'} ➔ {tripInfo?.destination?.split(' ')[0] || 'MAA'}</span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
          {messages.map(msg => {
            // 1. System Booking Request Card
            if (msg.type === 'BOOKING_REQUEST') {
              const reqPassenger = msg.passengerName || msg.requestDetails?.name || 'Traveler';
              const isTargetPending = pendingRequests.some(r => r.name === reqPassenger);

              return (
                <div key={msg.id} className="w-full my-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/70 via-gray-950 to-amber-950/40 border border-amber-500/40 shadow-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Seat Reservation Request</span>
                    </span>
                    <span className="text-[9px] text-gray-400 font-mono">{msg.time}</span>
                  </div>
                  <p className="text-xs text-gray-200">{msg.text}</p>
                  
                  {isDriver && isTargetPending && (
                    <div className="flex items-center space-x-2 pt-1 border-t border-gray-800">
                      <button
                        onClick={() => handleChatDecline(reqPassenger)}
                        className="flex-1 py-1 px-2 rounded-xl bg-gray-800 hover:bg-red-950/80 text-red-400 border border-red-500/30 text-[11px] font-bold transition-all"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleChatApprove(reqPassenger)}
                        className="flex-1 py-1 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white text-[11px] font-bold shadow-md flex items-center justify-center space-x-1 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Yes, I Accept</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            // 2. System Booking Confirmed Card
            if (msg.type === 'BOOKING_CONFIRMED') {
              return (
                <div key={msg.id} className="w-full my-2 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 shadow-md space-y-1 text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ride Confirmed in Database</span>
                  </div>
                  <p className="text-[11px] text-gray-200">{msg.text}</p>
                  <span className="text-[9px] text-emerald-300 font-mono block">SafePay Escrow Locked • Travel Pass Available</span>
                </div>
              );
            }

            // 3. System Booking Declined Card
            if (msg.type === 'BOOKING_DECLINED') {
              return (
                <div key={msg.id} className="w-full my-2 p-2.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-center space-y-0.5">
                  <span className="text-[10px] text-red-400 font-bold block">{msg.text}</span>
                  <span className="text-[9px] text-gray-500 block">Slot released back to highway corridor</span>
                </div>
              );
            }

            // 4. Standard User Chat Message
            const isMe = msg.senderName === myName || (isDriver ? msg.sender === 'driver' : msg.sender === 'passenger');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                      : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700/80'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-75">
                    <span>{msg.time}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Message Chips */}
        <div className="px-4 py-2 bg-gray-950/60 border-t border-gray-800/80 flex items-center space-x-2 overflow-x-auto text-[11px] shrink-0">
          <span className="text-gray-500 text-[10px] uppercase font-bold shrink-0">Quick:</span>
          {[
            "Yes, I accept your ride request!",
            "I'm at the toll pickup point",
            "Running 5 mins late",
            "I have 1 medium trolley bag",
            "What's your car color?"
          ].map((quickText, idx) => (
            <button
              key={idx}
              onClick={() => setInputVal(quickText)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-all border border-gray-700/60 shrink-0"
            >
              {quickText}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-gray-950 border-t border-gray-800 flex items-center space-x-2 shrink-0">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Message ${otherName}...`}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}
