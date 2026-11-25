import React, { useState } from 'react';
import { X, Briefcase, Camera, ShieldCheck, CheckCircle } from 'lucide-react';

export function LuggageTagModal({ onClose, onConfirm }) {
  const [bagCount, setBagCount] = useState(1);
  const [description, setDescription] = useState('1 Black American Tourister Cabin Trolley');
  const [photoAdded, setPhotoAdded] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      onConfirm?.({
        bagCount,
        description,
        tagId: `TAG-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toISOString()
      });
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Anti-Theft Luggage Tagging</h3>
              <p className="text-[11px] text-gray-400">Pre-trip photo & insurance registration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSaved ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-white text-sm">Luggage Tagged & Insured!</h4>
            <p className="text-xs text-gray-400">Covered up to ₹25,000 against theft under Swari Shield.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Number of Bags in Trunk</label>
              <select
                value={bagCount}
                onChange={(e) => setBagCount(Number(e.target.value))}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value={1}>1 Bag / Backpack</option>
                <option value={2}>2 Bags (Medium Trolley + Backpack)</option>
                <option value={3}>3 Bags (Full Trunk Space)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Description / Identifier</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                required
              />
            </div>

            {/* Photo Attachment Preview */}
            <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-white block text-xs">Luggage Photo Attached</span>
                  <span className="text-[10px] text-emerald-400 font-mono">IMG_TRUNK_SECURE.JPG (Timestamped)</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                Captured
              </span>
            </div>

            <p className="text-[10px] text-gray-500 leading-tight">
              Timestamped luggage verification guarantees immediate insurance settlement if bags are swapped, forgotten, or stolen.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold"
              >
                Confirm & Seal
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
