import React, { useState } from 'react';
import { Product } from '../lib/types';
import confetti from 'canvas-confetti';

interface FmoFittingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: Product | null;
}

export const FmoFittingModal: React.FC<FmoFittingModalProps> = ({
  isOpen,
  onClose,
  selectedProduct
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('Bespoke Fitting');
  const [eventDate, setEventDate] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [inseam, setInseam] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#c5a059', '#a17f39', '#111827', '#ffffff']
    });

    setSubmitted(true);
  };

  const handleWhatsAppDirect = () => {
    const message = `Hello FMO Flagship Store,\n\nI would like to book a private fitting appointment.\nName: ${fullName || 'Client'}\nPhone: ${phone || 'Not provided'}\nService: ${serviceType}\nSelected Suit: ${selectedProduct ? selectedProduct.name : 'Consultation'}\nEvent Date: ${eventDate || 'TBD'}\nMeasurements: Chest: ${chest || 'N/A'}, Waist: ${waist || 'N/A'}, Inseam: ${inseam || 'N/A'}\nNotes: ${notes || 'None'}`;
    window.open(`https://wa.me/2347018135116?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#c5a059]/40 shadow-2xl p-6 sm:p-8 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-lg w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-colors"
        >
          <i className="ti ti-x"></i>
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#c5a059]"></span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#a17f39]">
                Flagship VIP Fitting Suite
              </span>
            </div>

            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#0b0f19] mb-2">
              Book Your Private Fitting
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Experience the FMO sartorial standard at Hilmak Place Plaza, Trans-Ekulu by Bilante Flyover, Enugu.
            </p>

            {selectedProduct && (
              <div className="bg-[#faf9f6] p-3 rounded-lg border border-[#c5a059]/30 mb-5 flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ background: selectedProduct.primaryColorHex }}
                ></span>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Selected Ensemble:</span>
                  <p className="text-xs font-bold text-[#0b0f19]">{selectedProduct.name}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Emeka Okafor"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#c5a059]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Service Required</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#c5a059]"
                  >
                    <option value="Bespoke Fitting">Bespoke Suit Tailoring & Fitting</option>
                    <option value="Ceremonial Rental">High-End Tuxedo / Suit Rental</option>
                    <option value="Executive Styling">Executive Wardrobe Consultation</option>
                    <option value="Wedding Party Styling">Groom & Groomsmen Package</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Event / Desired Fitting Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#c5a059]"
                  />
                </div>
              </div>

              {/* Optional Client Measurements Section */}
              <div className="border-t border-gray-100 pt-3">
                <span className="text-[11px] font-bold text-[#a17f39] uppercase tracking-wider block mb-2">
                  Optional Measurements (If Known)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Chest (inches)</label>
                    <input
                      type="text"
                      placeholder="e.g. 42R"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Waist (inches)</label>
                    <input
                      type="text"
                      placeholder="e.g. 34"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Trouser Inseam</label>
                    <input
                      type="text"
                      placeholder="e.g. 32"
                      value={inseam}
                      onChange={(e) => setInseam(e.target.value)}
                      className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-[#c5a059]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notes / Custom Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. I prefer double-breasted with peak lapels for my brother's wedding on Saturday."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#c5a059]"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="flex-1 py-3 gold-gradient-btn text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <i className="ti ti-check text-sm"></i>
                <span>Confirm Appointment</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppDirect}
                className="py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <i className="ti ti-brand-whatsapp text-base"></i>
                <span>Direct WhatsApp</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl mb-4">
              <i className="ti ti-check"></i>
            </div>
            <h4 className="font-editorial text-2xl font-bold text-[#0b0f19] mb-2">
              Fitting Request Reserved
            </h4>
            <p className="text-xs text-gray-600 max-w-sm mx-auto mb-6 leading-relaxed">
              Thank you, <span className="font-bold text-[#0b0f19]">{fullName}</span>. Our master tailor has logged your appointment. We will reach you on <span className="font-bold">{phone}</span> to confirm your private suite slot.
            </p>

            <div className="bg-[#faf9f6] p-4 rounded-xl border border-[#c5a059]/20 text-xs text-left mb-6 max-w-md mx-auto space-y-1">
              <p className="font-bold text-[#0b0f19]">FMO Flagship Boutique Location:</p>
              <p className="text-gray-600">Hilmak Place Plaza Plot C, 1A Pocket Layout, Trans-Ekulu by Bilante Flyover, Enugu</p>
              <p className="text-[#a17f39] font-medium pt-1">Call / Text: +234 701 813 5116</p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={handleWhatsAppDirect}
                className="py-2.5 px-4 bg-[#25D366] text-white text-xs font-bold rounded-lg flex items-center gap-2"
              >
                <i className="ti ti-brand-whatsapp text-sm"></i>
                <span>Open in WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="py-2.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
