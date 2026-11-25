import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Car, 
  ShieldCheck, 
  Heart, 
  ArrowRight, 
  Sparkles, 
  Activity, 
  UserPlus, 
  LogIn,
  KeyRound,
  Mail,
  Phone,
  Check,
  AlertCircle
} from 'lucide-react';
import { PERSONAS } from '../data/mockUsers';
import { loginUser, signupUser, sendOtp, verifyOtp } from '../services/api';
import { socketService } from '../services/socket';
import { LoadingSpinner } from './common/LoadingSpinner';

export function LoginModal({ currentUserId, onSelectPersona, onClose }) {
  const [activeTab, setActiveTab] = useState('personas'); // 'personas' | 'signin' | 'signup'
  const [savedCustomUser, setSavedCustomUser] = useState(null);

  // Sign In Form State
  const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Sign Up Form State
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('PASSENGER'); // 'PASSENGER' | 'DRIVER'
  const [company, setCompany] = useState('');
  const [upiId, setUpiId] = useState('');

  // Driver Vehicle Specifics
  const [vehicleMake, setVehicleMake] = useState('Tata');
  const [vehicleModel, setVehicleModel] = useState('Nexon EV');
  const [vehiclePlate, setVehiclePlate] = useState('KA 05 AB 1234');
  const [fuelType, setFuelType] = useState('ELECTRIC_EV');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Keyboard accessibility: Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load custom user from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('swari_custom_user');
      if (stored) {
        setSavedCustomUser(JSON.parse(stored));
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  const handlePersonaLogin = async (persona) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await loginUser({ personaId: persona.id });
      if (res?.data?.accessToken) {
        socketService.updateAuthToken(res.data.accessToken);
      }
      onSelectPersona(persona);
      onClose();
    } catch (err) {
      console.warn('Backend login fallback to persona:', err.message);
      // Fallback to offline persona if backend offline in dev
      onSelectPersona(persona);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await loginUser({
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (res?.data?.accessToken) {
        socketService.updateAuthToken(res.data.accessToken);
      }
      const user = res.data.user;
      onSelectPersona(user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      setErrorMessage('Please enter your 10-digit phone number.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await sendOtp(loginPhone.trim());
      setOtpSent(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch simulated OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!loginOtp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await verifyOtp(loginPhone.trim(), loginOtp.trim());
      if (res?.data?.accessToken) {
        socketService.updateAuthToken(res.data.accessToken);
      }
      const user = res.data.user;
      onSelectPersona(user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Invalid verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('Full name, email, and password are required.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const formattedPhone = phone.trim().startsWith('+91') ? phone.trim() : `+91 ${phone.trim()}`;
      const payload = {
        fullName: fullName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        phone: formattedPhone,
        role: role,
        company: company.trim() || undefined,
        vehiclePlate: role === 'DRIVER' ? vehiclePlate.toUpperCase() : undefined,
        vehicleMake: role === 'DRIVER' ? vehicleMake : undefined,
        vehicleModel: role === 'DRIVER' ? vehicleModel : undefined
      };

      const res = await signupUser(payload);
      if (res?.data?.accessToken) {
        socketService.updateAuthToken(res.data.accessToken);
      }

      const registeredUser = res.data.user;
      try {
        localStorage.setItem('swari_custom_user', JSON.stringify(registeredUser));
      } catch {}

      onSelectPersona(registeredUser);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[700] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative text-white max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
              <UserCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="login-modal-title" className="text-lg font-black text-white">Identity & Account Access</h3>
              <p className="text-xs text-gray-400">Authentic JWT sessions, verified roles & corridor access</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            aria-label="Close identity modal"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 my-4 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs shrink-0" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'personas'}
            onClick={() => { setActiveTab('personas'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'personas' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Seeded Personas
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'signin'}
            onClick={() => { setActiveTab('signin'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'signin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'signup'}
            onClick={() => { setActiveTab('signup'); setErrorMessage(''); }}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'signup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div role="alert" className="mb-3 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Seeded Personas (1-Click Authentic Login) */}
        {activeTab === 'personas' && (
          <div className="space-y-3 py-1 flex-1 overflow-y-auto">
            {loading && <LoadingSpinner text="Authenticating persona token..." />}

            {/* Custom Saved User */}
            {savedCustomUser && (
              <div
                onClick={() => handlePersonaLogin(savedCustomUser)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  currentUserId === savedCustomUser.id
                    ? 'bg-emerald-950/60 border-emerald-400 shadow-lg'
                    : 'bg-gray-950 border-emerald-500/40 hover:border-emerald-400 hover:bg-gray-900'
                }`}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => { if (e.key === 'Enter') handlePersonaLogin(savedCustomUser); }}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="relative">
                    <img
                      src={savedCustomUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-gray-950 text-white">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">{savedCustomUser.fullName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        SAVED ({savedCustomUser.role})
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{savedCustomUser.phone}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </div>
            )}

            {/* Persona 0: Admin HQ */}
            <div
              onClick={() => handlePersonaLogin(PERSONAS.admin_hq)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                currentUserId === PERSONAS.admin_hq.id
                  ? 'bg-indigo-950/60 border-indigo-500/80 shadow-lg'
                  : 'bg-gray-950/90 border-indigo-500/30 hover:border-indigo-500/60 hover:bg-gray-800/40'
              }`}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') handlePersonaLogin(PERSONAS.admin_hq); }}
            >
              <div className="flex items-center space-x-3.5">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/30 border-2 border-indigo-400 flex items-center justify-center text-indigo-300">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">Platform Operations & Safety HQ</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300 mt-0.5 font-medium">ERSS 112 Control Room & Telemetry</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-400" />
            </div>

            {/* Persona 1: Rahul Sharma (Passenger) */}
            <div
              onClick={() => handlePersonaLogin(PERSONAS.passenger_rahul)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                currentUserId === PERSONAS.passenger_rahul.id
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg'
                  : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
              }`}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') handlePersonaLogin(PERSONAS.passenger_rahul); }}
            >
              <div className="flex items-center space-x-3.5">
                <img
                  src={PERSONAS.passenger_rahul.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-teal-500"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{PERSONAS.passenger_rahul.fullName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      PASSENGER
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {PERSONAS.passenger_rahul.company} • Verified DigiLocker
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </div>

            {/* Persona 2: Vikramaditya Rao (Car Owner) */}
            <div
              onClick={() => handlePersonaLogin(PERSONAS.driver_vikram)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                currentUserId === PERSONAS.driver_vikram.id
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg'
                  : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
              }`}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') handlePersonaLogin(PERSONAS.driver_vikram); }}
            >
              <div className="flex items-center space-x-3.5">
                <img
                  src={PERSONAS.driver_vikram.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{PERSONAS.driver_vikram.fullName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      CAR OWNER
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Tata Nexon EV • Corridor Host NH 44
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </div>

            {/* Persona 3: Dr. Ananya Subramanian */}
            <div
              onClick={() => handlePersonaLogin(PERSONAS.driver_ananya)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                currentUserId === PERSONAS.driver_ananya.id
                  ? 'bg-pink-950/40 border-pink-500/80 shadow-lg'
                  : 'bg-gray-950/70 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
              }`}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') handlePersonaLogin(PERSONAS.driver_ananya); }}
            >
              <div className="flex items-center space-x-3.5">
                <img
                  src={PERSONAS.driver_ananya.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover border-2 border-pink-500"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">{PERSONAS.driver_ananya.fullName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center space-x-1">
                      <Heart className="w-2.5 h-2.5" />
                      <span>WOMEN HOST</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Hyundai Creta • Verified Female Travel Shield
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        )}

        {/* Tab 2: Sign In (Password or OTP) */}
        {activeTab === 'signin' && (
          <div className="space-y-4 py-2 text-xs flex-1 overflow-y-auto">
            <div className="flex rounded-xl bg-gray-950 p-1 border border-gray-800 mb-4">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  loginMode === 'password' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('otp')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  loginMode === 'otp' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                }`}
              >
                Simulated OTP
              </button>
            </div>

            {loginMode === 'password' ? (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-gray-300 font-semibold mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" aria-hidden="true" />
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. rahul.sharma@swari.in"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-gray-300 font-semibold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" aria-hidden="true" />
                    <input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In with Secure Session'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label htmlFor="login-phone" className="block text-gray-300 font-semibold mb-1">
                        10-Digit Mobile Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-400 font-bold">+91</span>
                        <input
                          id="login-phone"
                          type="tel"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
                          placeholder="98765-43210"
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-11 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Dispatching...' : 'Dispatch Verification OTP (MOCK)'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-gray-400 text-xs">
                      Simulated OTP dispatched to +91 {loginPhone}. Check dev console or use default test code 123456.
                    </p>
                    <div>
                      <label htmlFor="login-otp" className="block text-gray-300 font-semibold mb-1">
                        6-Digit OTP
                      </label>
                      <input
                        id="login-otp"
                        type="text"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white tracking-widest text-center font-mono text-base focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP & Authorize Session'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Sign Up Form */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 py-2 text-xs flex-1 overflow-y-auto pr-1">
            {/* Role Toggle */}
            <div>
              <label className="block text-gray-300 font-bold mb-1">Select Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('PASSENGER')}
                  className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center space-x-2 ${
                    role === 'PASSENGER'
                      ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md'
                      : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Passenger</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('DRIVER')}
                  className={`p-3 rounded-2xl border text-center transition-all flex items-center justify-center space-x-2 ${
                    role === 'DRIVER'
                      ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-md'
                      : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Car Owner (Host Driver)</span>
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aditya Verma"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="aditya@swari.in"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Password * (Min 8 chars)</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">10-Digit Mobile Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 font-bold">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765-43210"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-11 pr-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details if DRIVER */}
            {role === 'DRIVER' && (
              <div className="bg-gray-950 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Vehicle Registration (MV Act 1988 Compliance)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Make & Model</label>
                    <input
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Nexon EV"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Vehicle Plate (RC)</label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                      placeholder="e.g. KA 05 AB 1234"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-emerald-500 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Register & Authorize Session'}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
