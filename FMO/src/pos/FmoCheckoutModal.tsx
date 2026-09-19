import React, { useState } from 'react';
import { PaymentMethod, CartItem } from '../lib/types';
import { FMO_STORE_SETTINGS } from '../data/fmoStoreSettings';

interface FmoCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  onCompleteSale: (saleData: {
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    depositAmount: number;
    balanceDue: number;
    isDeposit: boolean;
  }) => void;
}

export const FmoCheckoutModal: React.FC<FmoCheckoutModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  discount,
  tax,
  total,
  onCompleteSale
}) => {
  if (!isOpen) return null;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cashTendered, setCashTendered] = useState<number>(total);
  const [paymentReference, setPaymentReference] = useState('');
  const [isDeposit, setIsDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(Math.round(total * 0.5));
  const [copiedBank, setCopiedBank] = useState(false);

  // Quick cash increment pills
  const quickCashPills = [50000, 100000, 200000, 500000, 1000000];

  const effectivePayable = isDeposit ? depositAmount : total;
  const changeDue = Math.max(0, (cashTendered || 0) - effectivePayable);
  const balanceDue = isDeposit ? Math.max(0, total - depositAmount) : 0;

  const paymentOptions: { id: PaymentMethod; label: string; icon: string; desc: string }[] = [
    { id: 'cash', label: 'Cash', icon: 'ti-cash', desc: 'Physical currency at till' },
    { id: 'credit_card', label: 'Credit Card', icon: 'ti-credit-card', desc: 'Mastercard / Visa' },
    { id: 'debit_card', label: 'Debit Card', icon: 'ti-credit-card-filled', desc: 'Local Verve / Chip' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: 'ti-building-bank', desc: 'Instant account transfer' },
    { id: 'paypal', label: 'PayPal', icon: 'ti-brand-paypal', desc: 'Online / International' },
    { id: 'bank_check', label: 'Bank Check', icon: 'ti-check', desc: 'Corporate / Bank draft' },
    { id: 'other', label: 'Other Methods', icon: 'ti-dots', desc: 'Alternative payments' }
  ];

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(FMO_STORE_SETTINGS.accountNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      alert('Please enter client name for this sartorial invoice.');
      return;
    }

    onCompleteSale({
      customerName,
      customerPhone,
      paymentMethod,
      paymentReference,
      depositAmount: isDeposit ? depositAmount : total,
      balanceDue,
      isDeposit
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#c5a059]/40 shadow-2xl p-6 sm:p-8 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm cursor-pointer"
        >
          <i className="ti ti-x"></i>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a17f39]">
            Checkout &amp; In-Store Payment
          </span>
        </div>

        <h3 className="font-serif-luxury text-2xl font-bold text-[#0b0f19] mb-1">
          Complete Sartorial Order
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          We accept all forms of payment • Nigerian VAT &amp; 80mm thermal receipt compliant.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Client Identification */}
          <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Client Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chief Anthony Ubagu"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#c5a059]"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Client Phone (WhatsApp)</label>
              <input
                type="tel"
                placeholder="e.g. 0803 123 4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#c5a059]"
              />
            </div>
          </div>

          {/* Deposit / Fitting Hold Toggle */}
          <div className="bg-[#faf9f6] p-4 rounded-xl border border-[#c5a059]/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-bold text-xs text-[#0b0f19]">
                  Down-Payment Deposit / Fitting Hold?
                </span>
                <span className="block text-[11px] text-gray-500">
                  Allow client to pay a deposit now; balance due upon final fitting/pickup.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeposit}
                  onChange={(e) => {
                    setIsDeposit(e.target.checked);
                    if (e.target.checked && !depositAmount) {
                      setDepositAmount(Math.round(total * 0.5));
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c5a059]"></div>
              </label>
            </div>

            {isDeposit && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="block font-bold text-[#a17f39] mb-1">
                    Deposit Tendered Today (₦):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max={total}
                    value={depositAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDepositAmount(val);
                      setCashTendered(val);
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-[#c5a059] rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-500 mb-1">
                    Balance Due on Pickup:
                  </label>
                  <div className="px-3.5 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-mono font-bold">
                    ₦{balanceDue.toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector Grid */}
          <div>
            <label className="block font-bold text-gray-700 mb-2 uppercase tracking-wider text-[11px]">
              Select Payment Method:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentOptions.map((opt) => {
                const isSelected = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(opt.id);
                      setCashTendered(effectivePayable);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0b0f19] text-white border-[#c5a059] shadow-md ring-1 ring-[#c5a059]'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#c5a059]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <i className={`ti ${opt.icon} text-base text-[#c5a059]`}></i>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                      )}
                    </div>
                    <div>
                      <span className="block font-bold text-xs">{opt.label}</span>
                      <span className="block text-[9px] text-gray-400 truncate">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Payment Input Fields */}
          {paymentMethod === 'cash' && (
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <label className="font-bold text-gray-700">Cash Received at Register (₦):</label>
                <span className="font-mono text-xs font-bold text-[#a17f39]">
                  Amount Due: ₦{effectivePayable.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                min={effectivePayable}
                value={cashTendered || ''}
                onChange={(e) => setCashTendered(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono font-bold"
              />
              <div className="flex flex-wrap gap-2">
                {quickCashPills.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashTendered(amt)}
                    className="px-2.5 py-1 bg-white border border-gray-300 rounded text-[10px] font-mono hover:bg-gray-50 cursor-pointer"
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-500 font-medium">Customer Change Due:</span>
                <span className="font-mono text-base font-bold text-emerald-600">
                  ₦{changeDue.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  FMO Official Bank Account Details
                </span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 cursor-pointer"
                >
                  {copiedBank ? '✓ Copied!' : 'Copy Account'}
                </button>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1 font-mono text-xs">
                <p className="text-gray-500">Bank: <span className="font-bold text-black">{FMO_STORE_SETTINGS.bankName}</span></p>
                <p className="text-gray-500">Account No: <span className="font-bold text-black text-sm">{FMO_STORE_SETTINGS.accountNumber}</span></p>
                <p className="text-gray-500">Beneficiary: <span className="font-bold text-black">{FMO_STORE_SETTINGS.accountName}</span></p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Bank Transfer Reference / Session ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. TRF-99482104"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}

          {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block font-bold text-gray-700 text-[11px]">
                POS Terminal Transaction Approval / RRN Code:
              </label>
              <input
                type="text"
                placeholder="e.g. STANBIC-RRN-881920"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono"
              />
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-indigo-200 space-y-2">
              <label className="block font-bold text-indigo-900 text-[11px]">
                PayPal Transaction ID / Client Email:
              </label>
              <input
                type="text"
                placeholder="e.g. client@domain.com / PAYID-10293"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs"
              />
            </div>
          )}

          {paymentMethod === 'bank_check' && (
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block font-bold text-gray-700 text-[11px]">
                Bank Check Number &amp; Issuing Bank:
              </label>
              <input
                type="text"
                placeholder="e.g. CHK-0019284 - First Bank"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs"
              />
            </div>
          )}

          {paymentMethod === 'other' && (
            <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 space-y-2">
              <label className="block font-bold text-gray-700 text-[11px]">
                Payment Description / Notes:
              </label>
              <input
                type="text"
                placeholder="e.g. Barter / Gift Certificate / Partner Credit"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-lg text-xs"
              />
            </div>
          )}

          {/* Financial Breakdown Card */}
          <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
            <div className="flex justify-between text-gray-600">
              <span>Order Subtotal:</span>
              <span className="font-mono font-medium">₦{subtotal.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied:</span>
                <span className="font-mono">-₦{discount.toLocaleString()}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Nigerian VAT (7.5%):</span>
                <span className="font-mono font-medium">₦{tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-[#0b0f19] pt-1.5 border-t border-gray-300">
              <span>Total Gross Value:</span>
              <span className="font-mono">₦{total.toLocaleString()}</span>
            </div>
            {isDeposit && (
              <div className="flex justify-between text-xs font-bold text-[#a17f39] pt-1 border-t border-dashed border-gray-300">
                <span>Deposit Payable Now:</span>
                <span className="font-mono text-sm">₦{depositAmount.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-3.5 gold-gradient-btn text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <i className="ti ti-printer text-base"></i>
              <span>
                {isDeposit ? 'Record Deposit & Print Slip' : 'Complete Sale & Print Thermal Receipt'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
