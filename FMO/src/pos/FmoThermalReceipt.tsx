import React from 'react';
import { Sale } from '../lib/types';
import { FMO_STORE_SETTINGS } from '../data/fmoStoreSettings';

interface FmoThermalReceiptProps {
  sale: Sale;
  onClose: () => void;
  onPrint: () => void;
}

export const FmoThermalReceipt: React.FC<FmoThermalReceiptProps> = ({
  sale,
  onClose,
  onPrint
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative my-6 text-black">
        {/* Modal Controls */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4 no-print">
          <span className="text-xs font-bold uppercase tracking-wider text-[#a17f39]">
            80mm Thermal Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="px-3 py-1 bg-[#0b0f19] text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
            >
              <i className="ti ti-printer text-xs"></i>
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black text-sm p-1 cursor-pointer"
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
        </div>

        {/* Printable 80mm Receipt Document */}
        <div className="printable-receipt font-mono text-[11px] leading-tight text-black">
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-400 mb-2">
            <h2 className="text-sm font-bold tracking-wider uppercase">FMO FOR MEN ONLY</h2>
            <p className="text-[10px] text-gray-700 font-semibold">NO. 1 SUIT STORE IN ENUGU</p>
            <p className="text-[9px] text-gray-600 mt-1">
              {FMO_STORE_SETTINGS.address}
            </p>
            <p className="text-[9px] text-gray-600">
              {FMO_STORE_SETTINGS.landmark}, {FMO_STORE_SETTINGS.city}
            </p>
            <p className="text-[9px] text-gray-700 font-bold mt-1">
              TEL: {FMO_STORE_SETTINGS.phone} • IG: {FMO_STORE_SETTINGS.instagram}
            </p>
          </div>

          {/* Metadata */}
          <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>RECEIPT #:</span>
              <span className="font-bold">{sale.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>DATE/TIME:</span>
              <span>{new Date(sale.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>CASHIER:</span>
              <span>{sale.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>REGISTER:</span>
              <span>{sale.registerName}</span>
            </div>
            <div className="flex justify-between">
              <span>CLIENT:</span>
              <span className="font-bold">{sale.customerName}</span>
            </div>
            {sale.customerPhone && (
              <div className="flex justify-between">
                <span>PHONE:</span>
                <span>{sale.customerPhone}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2 border-b border-dashed border-gray-400">
            <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-gray-300">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/4 text-center">QTY</span>
              <span className="w-1/4 text-right">TOTAL</span>
            </div>

            <div className="divide-y divide-gray-200 py-1 space-y-1">
              {sale.items.map((item, idx) => (
                <div key={idx} className="pt-1">
                  <div className="flex justify-between font-semibold">
                    <span className="w-1/2 truncate">{item.product.name}</span>
                    <span className="w-1/4 text-center">{item.quantity}</span>
                    <span className="w-1/4 text-right">
                      ₦{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-600 flex justify-between">
                    <span>
                      {item.variant.colorName} • {item.variant.size} [{item.type.toUpperCase()}]
                    </span>
                  </div>
                  {item.requiresAlteration && (
                    <div className="text-[9px] text-[#a17f39] font-bold">
                      * ALTERATION ATTACHED
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>SUBTOTAL:</span>
              <span>₦{sale.subtotal.toLocaleString()}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>DISCOUNT:</span>
                <span>-₦{sale.discount.toLocaleString()}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between">
                <span>VAT (7.5%):</span>
                <span>₦{sale.tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xs pt-1 border-t border-gray-300">
              <span>TOTAL VALUE:</span>
              <span>₦{sale.total.toLocaleString()}</span>
            </div>

            {sale.status === 'deposit_held' ? (
              <>
                <div className="flex justify-between font-bold text-[#a17f39] pt-1">
                  <span>DEPOSIT TENDERED:</span>
                  <span>₦{sale.depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-red-700 pt-0.5">
                  <span>BALANCE ON PICKUP:</span>
                  <span>₦{sale.balanceDue.toLocaleString()}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-gray-700 pt-1">
                <span>AMOUNT PAID:</span>
                <span>₦{sale.total.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-[9px] text-gray-600 pt-1">
              <span>PAYMENT METHOD:</span>
              <span className="uppercase font-bold">{sale.paymentMethod.replace('_', ' ')}</span>
            </div>
            {sale.paymentReference && (
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>REF / RRN:</span>
                <span>{sale.paymentReference}</span>
              </div>
            )}
          </div>

          {/* Footer Notice */}
          <div className="text-center pt-3 space-y-1 text-[9px] text-gray-600">
            <p className="font-bold text-black">"DELIVERING CLASS &amp; CULTURE"</p>
            <p>Bespoke commissions require fitting inspection prior to final pickup.</p>
            <p>Rental returns must be made within 48 hours of milestone event.</p>
            <p className="pt-2 text-[8px] text-gray-400">Powered by Storeflow Cloud ERP • AnteenyHub</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 no-print">
          <button
            onClick={onPrint}
            className="w-full py-2.5 gold-gradient-btn text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2"
          >
            <i className="ti ti-printer text-sm"></i>
            <span>Send to Receipt Printer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
