import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle, 
  UserCheck, 
  FileText, 
  PhoneCall, 
  Heart, 
  AlertTriangle, 
  Lock,
  UploadCloud,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function TrustVerificationModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('aadhaar');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(true);
  const [isDlVerified, setIsDlVerified] = useState(true);
  const [isRcVerified, setIsRcVerified] = useState(true);
  const [womenOnlyEnabled, setWomenOnlyEnabled] = useState(false);

  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: 'Sanjay Sharma (Father)', phone: '+91 98450-XXXXX', relation: 'Family' },
    { name: 'Priya Verma (Sister)', phone: '+91 94480-XXXXX', relation: 'Family' }
  ]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddContact = (e) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setEmergencyContacts(prev => [...prev, { name: newContactName, phone: newContactPhone, relation: 'Emergency' }]);
    setNewContactName('');
    setNewContactPhone('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-white max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">Swari Shield™ Verification Hub</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  Level 3 Verified
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Multi-layer trust & identity verification for 100% safe intercity carpooling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Sub-Tabs */}
        <div className="flex items-center space-x-2 pt-4 pb-2 border-b border-gray-800/80 text-xs shrink-0 overflow-x-auto">
          {[
            { id: 'aadhaar', label: 'Govt ID / Aadhaar', icon: UserCheck },
            { id: 'dl', label: 'Driving License & RC', icon: FileText },
            { id: 'safety', label: 'Women-Only & SOS', icon: Heart },
            { id: 'legal', label: 'Motor Vehicles Compliance', icon: Lock }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-medium transition-all shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          
          {/* TAB 1: AADHAAR / DIGILOCKER */}
          {activeTab === 'aadhaar' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Govt. ID Verified via DigiLocker</h4>
                    <p className="text-xs text-emerald-300">Aadhaar Card: XXXX-XXXX-9182</p>
                    <p className="text-[10px] text-gray-400">Name Match: 100% • Biometric Face Match: Passed</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-lg">
                  Active
                </span>
              </div>

              <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-3">
                <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Why Swari Enforces Mandatory Govt ID Verification:
                </h5>
                <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                  <li>Eliminates anonymous strangers, ensuring every passenger and driver is legal & verified.</li>
                  <li>Real-time verification against the Government of India DigiLocker database.</li>
                  <li>Your full Aadhaar number is never stored or visible to other users; only masked verification status is shown.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: DRIVING LICENSE & VEHICLE RC */}
          {activeTab === 'dl' && (
            <div className="space-y-4">
              {/* DL Card */}
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Driving License (DL) Verified</h4>
                    <p className="text-xs text-gray-300">DL No: KA05-2018-0094120</p>
                    <p className="text-[10px] text-gray-500">Parivahan Sewa Status: Active • Commercial Penalty Score: 0</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">Verified</span>
              </div>

              {/* RC Card */}
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Vehicle Registration Certificate (RC)</h4>
                    <p className="text-xs text-gray-300">KA 05 MN 2819 • Tata Nexon EV</p>
                    <p className="text-[10px] text-gray-500">Insurance Valid till Oct 2027 • FASTag Active</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">Verified</span>
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                <strong>Anti-Sting Protection:</strong> Swari automatically validates that the vehicle is private (white-board), has zero pending rash-driving challans, and is insured for private occupant travel.
              </div>
            </div>
          )}

          {/* TAB 3: WOMEN-ONLY & SOS HUB */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              
              {/* Women-Only Toggle */}
              <div className="bg-pink-950/30 border border-pink-500/40 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-pink-400" />
                    <h4 className="text-sm font-bold text-white">Women-Only Travel Mode</h4>
                  </div>
                  <p className="text-xs text-pink-200">
                    When enabled, only verified female drivers and female co-travelers can view or book your rides.
                  </p>
                </div>
                <button
                  onClick={() => setWomenOnlyEnabled(!womenOnlyEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    womenOnlyEnabled ? 'bg-pink-600 justify-end' : 'bg-gray-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                </button>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Emergency SOS Contacts</span>
                  </h5>
                  <span className="text-[10px] text-gray-500">Auto WhatsApp Alerts</span>
                </div>

                <div className="space-y-2">
                  {emergencyContacts.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                      <div>
                        <span className="font-semibold text-white block">{c.name}</span>
                        <span className="text-[10px] text-gray-400">{c.phone}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                    </div>
                  ))}
                </div>

                {/* Add Contact Form */}
                <form onSubmit={handleAddContact} className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Contact Name"
                    className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="Phone Number (+91)"
                    className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    + Add SOS Contact
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: MOTOR VEHICLES ACT LEGAL COMPLIANCE */}
          {activeTab === 'legal' && (
            <div className="space-y-3 bg-gray-950 p-4 rounded-2xl border border-gray-800 text-xs leading-relaxed text-gray-300">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Legal Defense Shield (Motor Vehicles Act 1988)</span>
              </div>
              <p>
                To protect car owners from illegal taxi harassment or union disputes, <strong>Swari</strong> enforces algorithmic legal compliance:
              </p>
              <div className="space-y-2 pt-2">
                <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800">
                  <strong className="text-white block">1. Non-Commercial Expense Pooling:</strong>
                  Seat pricing is algorithmically capped to only cover fuel, toll charges, and vehicle maintenance. Drivers cannot turn a profit, preserving pure cost-sharing status under Section 66/192A.
                </div>
                <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800">
                  <strong className="text-white block">2. Maximum Seat Quota:</strong>
                  Drivers cannot post more than 3 passenger seats per car, preventing taxi-style multi-group overcrowding.
                </div>
                <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800">
                  <strong className="text-white block">3. Digital Trip Manifest:</strong>
                  Every booked ride generates an in-app legal pass certifying all passengers are registered co-travelers sharing fuel costs.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
