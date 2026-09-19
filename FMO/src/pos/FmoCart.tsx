import React, { useState } from 'react';
import { CartItem } from '../lib/types';

interface FmoCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: (discountAmount: number) => void;
  vatEnabled: boolean;
  vatRate: number;
}

export const FmoCart: React.FC<FmoCartProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  vatEnabled,
  vatRate
}) => {
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const calculatedDiscount =
    discountType === 'percent'
      ? Math.round((subtotal * (discountValue || 0)) / 100)
      : Math.min(discountValue || 0, subtotal);

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const tax = vatEnabled ? Math.round(taxableAmount * vatRate) : 0;
  const grandTotal = taxableAmount + tax;

  return (
    <div className="w-full lg:w-96 bg-white border-l border-[#c5a059]/20 flex flex-col h-full shadow-lg justify-between">
      {/* Cart Header */}
      <div className="p-4 border-b border-gray-100 bg-[#faf9f6] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0b0f19] text-[#c5a059] flex items-center justify-center text-sm">
            <i className="ti ti-receipt-2"></i>
          </div>
          <div>
            <h3 className="font-serif-luxury text-sm font-bold text-[#0b0f19]">Active Sartorial Ticket</h3>
            <span className="text-[10px] text-gray-500 font-mono">
              {items.length} {items.length === 1 ? 'item' : 'items'} in order
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <i className="ti ti-trash text-xs"></i>
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="p-4 overflow-y-auto flex-1 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-xl text-gray-400 mb-3">
              <i className="ti ti-shopping-bag"></i>
            </div>
            <p className="font-serif-luxury text-xs font-bold text-gray-600">Ticket is currently empty</p>
            <p className="text-[11px] text-gray-400 mt-1 max-w-[200px] mx-auto">
              Select any suit cut from the catalog to configure color swatches &amp; sizes.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-[#faf9f6] p-3.5 rounded-xl border border-gray-200/80 relative space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-3 h-3 rounded-full border border-black/20"
                      style={{ background: item.variant.colorHex }}
                    ></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {item.variant.colorName} • {item.variant.size}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        item.type === 'sale'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#0b0f19] leading-tight">
                    {item.product.name}
                  </h4>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-500 text-xs p-1"
                >
                  <i className="ti ti-x"></i>
                </button>
              </div>

              {/* Alterations Badge */}
              {item.requiresAlteration && (
                <div className="bg-[#c5a059]/10 p-2 rounded border border-[#c5a059]/30 text-[10px] space-y-0.5">
                  <div className="flex items-center gap-1 text-[#a17f39] font-bold">
                    <i className="ti ti-needle text-xs"></i>
                    <span>Tailor Work Slip Attached</span>
                  </div>
                  {item.alterationNotes && (
                    <p className="text-gray-600 truncate">{item.alterationNotes}</p>
                  )}
                  {item.measurements && (
                    <p className="text-gray-500 font-mono text-[9px]">
                      C:{item.measurements.chest || '-'} W:{item.measurements.waist || '-'} I:
                      {item.measurements.inseam || '-'}
                    </p>
                  )}
                </div>
              )}

              {/* Price & Quantity Controls */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="font-mono text-xs font-bold text-[#0b0f19]">
                  ₦{(item.unitPrice * item.quantity).toLocaleString()}
                </span>

                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Financial Totals */}
      {items.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-[#faf9f6] space-y-3 text-xs">
          {/* Discount Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 font-medium">Discount:</span>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setDiscountType('flat')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  discountType === 'flat' ? 'bg-[#0b0f19] text-white font-bold' : 'text-gray-600'
                }`}
              >
                ₦ Flat
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('percent')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  discountType === 'percent' ? 'bg-[#0b0f19] text-white font-bold' : 'text-gray-600'
                }`}
              >
                % Off
              </button>
            </div>
            <input
              type="number"
              min="0"
              placeholder={discountType === 'flat' ? '₦0' : '0%'}
              value={discountValue || ''}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-right"
            />
          </div>

          {/* Ledger Numbers */}
          <div className="space-y-1.5 border-t border-gray-200/80 pt-2 text-[11px]">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono">₦{subtotal.toLocaleString()}</span>
            </div>

            {calculatedDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discount Applied:</span>
                <span className="font-mono">-₦{calculatedDiscount.toLocaleString()}</span>
              </div>
            )}

            {vatEnabled && (
              <div className="flex justify-between text-gray-600">
                <span>Nigerian VAT (7.5%):</span>
                <span className="font-mono">₦{tax.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-[#0b0f19] pt-2 border-t border-gray-300">
              <span>Total Payable:</span>
              <span className="font-mono text-base text-[#a17f39]">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Checkout Action Button */}
          <button
            onClick={() => onCheckout(calculatedDiscount)}
            className="w-full py-3.5 gold-gradient-btn text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <i className="ti ti-cash text-sm"></i>
            <span>Proceed to Payment</span>
          </button>
        </div>
      )}
    </div>
  );
};
