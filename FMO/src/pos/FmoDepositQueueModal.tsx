import React from 'react';
import { Sale, PaymentMethod } from '../lib/types';

interface FmoDepositQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  openOrders: Sale[];
  onCollectBalance: (saleId: string, paymentMethod: PaymentMethod) => void;
}

export const FmoDepositQueueModal: React.FC<FmoDepositQueueModalProps> = ({
  isOpen,
  onClose,
  openOrders,
  onCollectBalance
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-[#c5a059]/40">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm cursor-pointer"
        >
          <i className="ti ti-x"></i>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a17f39]">
            Fitting &amp; Bespoke Queue
          </span>
        </div>

        <h3 className="font-serif-luxury text-xl font-bold text-[#0b0f19] mb-1">
          Open Deposits &amp; Pending Balance Ledger
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Track pending fittings, ceremonial reservations, and collect final balance upon customer pickup.
        </p>

        <div className="space-y-3 max-h-[420px] overflow-y-auto">
          {openOrders.length === 0 ? (
            <div className="text-center py-12 bg-[#faf9f6] rounded-xl border border-dashed border-gray-200">
              <i className="ti ti-check-circle text-2xl text-emerald-600 mb-2 block"></i>
              <p className="text-xs font-bold text-gray-700">No open deposit balances</p>
              <p className="text-[11px] text-gray-500 mt-0.5">All customer orders have been fully settled.</p>
            </div>
          ) : (
            openOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                      Fitting Hold • Balance Due
                    </span>
                    <h4 className="font-bold text-sm text-[#0b0f19] mt-1">
                      {order.customerName}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Receipt: <span className="font-mono font-semibold">{order.receiptNumber}</span> • {order.customerPhone || 'No Phone'}
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-[10px] text-gray-500 uppercase block">Balance Due</span>
                    <span className="text-base font-bold text-red-700">
                      ₦{order.balanceDue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items in order */}
                <div className="text-[11px] text-gray-600 space-y-0.5 border-t border-gray-200/80 pt-2">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{it.quantity}x {it.product.name} ({it.variant.colorName} - {it.variant.size})</span>
                      <span className="font-mono">₦{(it.unitPrice * it.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Clear Balance Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-[10px] text-gray-500">
                    Deposit Paid: <span className="font-mono font-bold">₦{order.depositAmount.toLocaleString()}</span>
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onCollectBalance(order.id, 'cash')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <i className="ti ti-cash text-xs"></i>
                      <span>Collect Cash &amp; Release</span>
                    </button>
                    <button
                      onClick={() => onCollectBalance(order.id, 'debit_card')}
                      className="px-3 py-1.5 bg-[#0b0f19] hover:bg-black text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <i className="ti ti-credit-card text-xs"></i>
                      <span>Collect Card</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
