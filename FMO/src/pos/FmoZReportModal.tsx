import React, { useState } from 'react';
import { Shift } from '../lib/types';
import { FMO_STORE_SETTINGS } from '../data/fmoStoreSettings';

interface FmoZReportModalProps {
  shift: Shift | null;
  isOpen: boolean;
  onClose: () => void;
  onCloseShift: (closingCashActual: number) => void;
}

export const FmoZReportModal: React.FC<FmoZReportModalProps> = ({
  shift,
  isOpen,
  onClose,
  onCloseShift
}) => {
  if (!isOpen || !shift) return null;

  const [closingCash, setClosingCash] = useState<number>(shift.expectedCash);
  const diff = (closingCash || 0) - shift.expectedCash;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmClose = () => {
    onCloseShift(closingCash);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-6 text-black border border-[#c5a059]/40">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059]"></span>
            <span className="font-serif-luxury text-sm font-bold text-[#0b0f19]">
              Shift Reconciliation &amp; Z-Report
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-sm p-1">
            <i className="ti ti-x"></i>
          </button>
        </div>

        {/* Printable Z-Report Summary */}
        <div className="printable-receipt font-mono text-[11px] leading-tight space-y-3">
          <div className="text-center pb-2 border-b border-dashed border-gray-400">
            <h3 className="font-bold text-sm uppercase">FMO (FOR MEN ONLY)</h3>
            <p className="text-[10px] text-gray-700">DAILY TILL SHIFT &amp; Z-REPORT</p>
            <p className="text-[9px] text-gray-500">{FMO_STORE_SETTINGS.address}, {FMO_STORE_SETTINGS.city}</p>
          </div>

          <div className="space-y-1 text-[10px] pb-2 border-b border-dashed border-gray-400">
            <div className="flex justify-between">
              <span>REGISTER:</span>
              <span className="font-bold">{shift.registerName}</span>
            </div>
            <div className="flex justify-between">
              <span>CASHIER:</span>
              <span>{shift.openedBy}</span>
            </div>
            <div className="flex justify-between">
              <span>SHIFT OPENED:</span>
              <span>{new Date(shift.openedAt).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span>STATUS:</span>
              <span className="uppercase font-bold">{shift.status}</span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="space-y-1.5 text-[10px] pb-2 border-b border-dashed border-gray-400">
            <div className="flex justify-between font-bold">
              <span>TRANSACTIONS COUNT:</span>
              <span>{shift.totalSalesCount}</span>
            </div>
            <div className="flex justify-between">
              <span>OPENING FLOAT:</span>
              <span>₦{shift.openingFloat.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>CASH PAYMENTS:</span>
              <span>₦{shift.cashSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>CARD PAYMENTS:</span>
              <span>₦{shift.cardSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>BANK TRANSFERS:</span>
              <span>₦{shift.transferSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>OTHER METHODS:</span>
              <span>₦{shift.otherSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
              <span>GROSS SHIFT SALES:</span>
              <span>₦{shift.totalGrossSales.toLocaleString()}</span>
            </div>
          </div>

          {/* Till Balance Calculations */}
          <div className="space-y-1.5 text-[10px] pt-1">
            <div className="flex justify-between font-bold text-xs">
              <span>EXPECTED DRAWER CASH:</span>
              <span className="font-mono text-[#a17f39]">₦{shift.expectedCash.toLocaleString()}</span>
            </div>

            {shift.status === 'open' ? (
              <div className="no-print pt-2 space-y-2">
                <label className="block text-[11px] font-bold text-gray-700">
                  Actual Cash Counted in Till (₦):
                </label>
                <input
                  type="number"
                  value={closingCash || ''}
                  onChange={(e) => setClosingCash(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs font-mono font-bold"
                />

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-bold text-gray-600">Difference (Over/Short):</span>
                  <span
                    className={`font-mono font-bold ${
                      diff === 0
                        ? 'text-emerald-600'
                        : diff > 0
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}
                  >
                    {diff > 0 ? `+₦${diff.toLocaleString()}` : `₦${diff.toLocaleString()}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between text-xs font-bold pt-1">
                <span>ACTUAL CASH CLOSED:</span>
                <span>₦{shift.closingCashActual?.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-5 border-t border-gray-200 mt-4 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="ti ti-printer text-sm"></i>
            <span>Print Z-Report</span>
          </button>

          {shift.status === 'open' && (
            <button
              onClick={handleConfirmClose}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <i className="ti ti-lock text-sm"></i>
              <span>Close Drawer Shift</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
