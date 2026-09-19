import React, { useState } from 'react';
import { Sale } from '../lib/types';
import { FMO_STORE_SETTINGS } from '../data/fmoStoreSettings';

interface FmoReportsScreenProps {
  sales: Sale[];
  onClose: () => void;
  onReprintReceipt: (sale: Sale) => void;
}

export const FmoReportsScreen: React.FC<FmoReportsScreenProps> = ({
  sales,
  onClose,
  onReprintReceipt
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'payments'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Total Analytics
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalDepositHeld = sales.filter((s) => s.status === 'deposit_held');
  const totalBalanceDue = totalDepositHeld.reduce((sum, s) => sum + s.balanceDue, 0);

  // Sales vs Rentals
  let totalSaleItemsCount = 0;
  let totalRentalItemsCount = 0;
  sales.forEach((s) => {
    s.items.forEach((it) => {
      if (it.type === 'sale') totalSaleItemsCount += it.quantity;
      if (it.type === 'rental') totalRentalItemsCount += it.quantity;
    });
  });

  // Payment Breakdown
  const paymentsSummary: Record<string, number> = {
    cash: 0,
    credit_card: 0,
    debit_card: 0,
    bank_transfer: 0,
    paypal: 0,
    bank_check: 0,
    other: 0
  };

  sales.forEach((s) => {
    if (paymentsSummary[s.paymentMethod] !== undefined) {
      paymentsSummary[s.paymentMethod] += s.depositAmount || s.total;
    }
  });

  // Filtered receipts
  const filteredSales = sales.filter(
    (s) =>
      s.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(searchQuery))
  );

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Receipt #', 'Date', 'Client Name', 'Phone', 'Total', 'Status', 'Payment Method'];
    const rows = sales.map((s) => [
      s.receiptNumber,
      new Date(s.createdAt).toLocaleDateString(),
      `"${s.customerName}"`,
      s.customerPhone || 'N/A',
      s.total,
      s.status,
      s.paymentMethod
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FMO_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] shadow-2xl relative border border-[#c5a059]/40 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-[#faf9f6] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059]"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a17f39]">
                FMO Cloud ERP Analytics
              </span>
            </div>
            <h3 className="font-serif-luxury text-xl font-bold text-[#0b0f19]">
              Executive Sales &amp; Sartorial Ledger
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-white border border-gray-300 hover:border-[#c5a059] text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <i className="ti ti-download text-xs text-[#c5a059]"></i>
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm cursor-pointer"
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-white gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#c5a059] text-[#0b0f19]'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Overview &amp; Metrics
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'receipts'
                ? 'border-[#c5a059] text-[#0b0f19]'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Receipts Ledger ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'border-[#c5a059] text-[#0b0f19]'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
          >
            Multi-Channel Payments
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">
                    Gross Revenue
                  </span>
                  <span className="font-mono text-xl font-bold text-[#0b0f19]">
                    ₦{totalRevenue.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-emerald-600 mt-1 font-semibold">
                    {sales.length} invoices generated
                  </span>
                </div>

                <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">
                    Pending Balances (Fitting Hold)
                  </span>
                  <span className="font-mono text-xl font-bold text-red-700">
                    ₦{totalBalanceDue.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-1">
                    {totalDepositHeld.length} open customer fittings
                  </span>
                </div>

                <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">
                    Permanent Suit Sales
                  </span>
                  <span className="font-mono text-xl font-bold text-[#a17f39]">
                    {totalSaleItemsCount} Garments
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-1">Bespoke &amp; RTW</span>
                </div>

                <div className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">
                    Ceremonial Rentals
                  </span>
                  <span className="font-mono text-xl font-bold text-indigo-700">
                    {totalRentalItemsCount} Outfits
                  </span>
                  <span className="block text-[10px] text-gray-500 mt-1">Weddings &amp; Galas</span>
                </div>
              </div>

              {/* Store Identity Summary */}
              <div className="bg-white p-5 rounded-xl border border-[#c5a059]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-sm text-[#0b0f19]">{FMO_STORE_SETTINGS.storeName}</h4>
                  <p className="text-xs text-gray-600 font-medium">{FMO_STORE_SETTINGS.address}, {FMO_STORE_SETTINGS.city}</p>
                  <p className="text-[11px] text-[#a17f39]">Tel: {FMO_STORE_SETTINGS.phone} • IG: {FMO_STORE_SETTINGS.instagram}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-gray-500 block">Nigerian VAT Registered:</span>
                  <span className="font-bold text-[#0b0f19]">7.5% Auto-Calculation Active</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipts' && (
            <div className="space-y-4">
              <div className="relative">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Search receipt #, client name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Receipt #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Total (₦)</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSales.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/80">
                        <td className="p-3 font-mono font-bold text-[#0b0f19]">{s.receiptNumber}</td>
                        <td className="p-3 text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 font-semibold text-gray-800">{s.customerName}</td>
                        <td className="p-3 font-mono font-bold">₦{s.total.toLocaleString()}</td>
                        <td className="p-3 uppercase text-[10px] text-gray-600">{s.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              s.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onReprintReceipt(s)}
                            className="px-2.5 py-1 bg-[#0b0f19] hover:bg-black text-white text-[10px] font-bold rounded flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <i className="ti ti-printer text-xs"></i>
                            <span>Reprint</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Breakdown of receipts collected across all 7 supported payment channels:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(paymentsSummary).map(([method, amount]) => (
                  <div key={method} className="bg-[#faf9f6] p-4 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      {method.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-lg font-bold text-[#0b0f19]">
                      ₦{amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
