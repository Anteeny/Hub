import React, { useState, useMemo } from 'react';
import { Product, CartItem, Sale, Shift, PaymentMethod, SuitCategory, ColorFamily } from '../lib/types';
import { FMO_CATEGORIES, FMO_CATALOG, COLOR_FAMILIES } from '../data/fmoCatalog';
import { FMO_STORE_SETTINGS } from '../data/fmoStoreSettings';
import { FmoCart } from './FmoCart';
import { FmoVariantDrawer } from './FmoVariantDrawer';
import { FmoCheckoutModal } from './FmoCheckoutModal';
import { FmoThermalReceipt } from './FmoThermalReceipt';
import { FmoZReportModal } from './FmoZReportModal';
import { FmoDepositQueueModal } from './FmoDepositQueueModal';
import { FmoReportsScreen } from './FmoReportsScreen';

interface FmoPosTerminalProps {
  onSwitchToWebsite: () => void;
  sales: Sale[];
  onRecordSale: (newSale: Sale) => void;
  onUpdateSale: (updatedSale: Sale) => void;
}

export const FmoPosTerminal: React.FC<FmoPosTerminalProps> = ({
  onSwitchToWebsite,
  sales,
  onRecordSale,
  onUpdateSale
}) => {
  // State
  const [activeCategory, setActiveCategory] = useState<SuitCategory | 'all'>('all');
  const [activeColor, setActiveColor] = useState<ColorFamily>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isDepositQueueOpen, setIsDepositQueueOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const cashierName = 'Tony Ubagu (Lead Stylist)';

  // Active Till Shift State
  const [currentShift, setCurrentShift] = useState<Shift>({
    id: 'shift-fmo-001',
    registerId: 'REG-01',
    registerName: 'Main Flagship Register 1',
    openedAt: new Date().toISOString(),
    openedBy: cashierName,
    openingFloat: 50000,
    expectedCash: 50000,
    totalSalesCount: sales.length,
    totalGrossSales: sales.reduce((a, b) => a + b.total, 0),
    cashSales: sales.filter((s) => s.paymentMethod === 'cash').reduce((a, b) => a + b.total, 0),
    cardSales: sales.filter((s) => s.paymentMethod === 'debit_card' || s.paymentMethod === 'credit_card').reduce((a, b) => a + b.total, 0),
    transferSales: sales.filter((s) => s.paymentMethod === 'bank_transfer').reduce((a, b) => a + b.total, 0),
    otherSales: sales.filter((s) => s.paymentMethod === 'other' || s.paymentMethod === 'paypal' || s.paymentMethod === 'bank_check').reduce((a, b) => a + b.total, 0),
    status: 'open'
  });

  // Open Fitting Queue
  const openFittingOrders = useMemo(() => {
    return sales.filter((s) => s.status === 'deposit_held');
  }, [sales]);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return FMO_CATALOG.filter((product) => {
      const matchesCat = activeCategory === 'all' || product.categoryId === activeCategory;
      const matchesCol = activeColor === 'all' || product.colorFamily === activeColor;
      const matchesSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.visualDetails.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesCol && matchesSearch;
    });
  }, [activeCategory, activeColor, searchQuery]);

  // Cart Handlers
  const handleAddToCart = (newItem: Omit<CartItem, 'id'>) => {
    const existingIndex = cartItems.findIndex(
      (it) =>
        it.product.id === newItem.product.id &&
        it.variant.id === newItem.variant.id &&
        it.type === newItem.type &&
        it.requiresAlteration === newItem.requiresAlteration
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { ...newItem, id: `cart-${Date.now()}` }]);
    }
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems(cartItems.filter((i) => i.id !== id));
    } else {
      setCartItems(cartItems.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));
    }
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((i) => i.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Checkout Handlers
  const subtotal = cartItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const tax = FMO_STORE_SETTINGS.vatEnabled ? Math.round((subtotal - appliedDiscount) * FMO_STORE_SETTINGS.vatRate) : 0;
  const grandTotal = Math.max(0, subtotal - appliedDiscount + tax);

  const handleInitiateCheckout = (discountAmount: number) => {
    setAppliedDiscount(discountAmount);
    setIsCheckoutOpen(true);
  };

  const handleCompleteSale = (saleData: {
    customerName: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    depositAmount: number;
    balanceDue: number;
    isDeposit: boolean;
  }) => {
    const receiptNum = `FMO-${Date.now().toString().slice(-6)}`;
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber: receiptNum,
      createdAt: new Date().toISOString(),
      items: [...cartItems],
      subtotal,
      tax,
      discount: appliedDiscount,
      total: grandTotal,
      depositAmount: saleData.depositAmount,
      balanceDue: saleData.balanceDue,
      paymentMethod: saleData.paymentMethod,
      paymentReference: saleData.paymentReference,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      status: saleData.isDeposit ? 'deposit_held' : 'completed',
      cashierName,
      registerName: currentShift.registerName,
      requiresAlterations: cartItems.some((it) => it.requiresAlteration)
    };

    onRecordSale(newSale);

    // Update Shift Totals
    setCurrentShift((prev) => ({
      ...prev,
      totalSalesCount: prev.totalSalesCount + 1,
      totalGrossSales: prev.totalGrossSales + newSale.total,
      cashSales: saleData.paymentMethod === 'cash' ? prev.cashSales + saleData.depositAmount : prev.cashSales,
      cardSales:
        saleData.paymentMethod === 'debit_card' || saleData.paymentMethod === 'credit_card'
          ? prev.cardSales + saleData.depositAmount
          : prev.cardSales,
      transferSales:
        saleData.paymentMethod === 'bank_transfer'
          ? prev.transferSales + saleData.depositAmount
          : prev.transferSales,
      expectedCash:
        saleData.paymentMethod === 'cash' ? prev.expectedCash + saleData.depositAmount : prev.expectedCash
    }));

    // Reset & Open Receipt
    setCartItems([]);
    setIsCheckoutOpen(false);
    setActiveReceiptSale(newSale);
  };

  const handleCollectBalance = (saleId: string, paymentMethod: PaymentMethod) => {
    const saleToClose = sales.find((s) => s.id === saleId);
    if (!saleToClose) return;

    const updated: Sale = {
      ...saleToClose,
      status: 'completed',
      depositAmount: saleToClose.total,
      balanceDue: 0,
      paymentMethod
    };

    onUpdateSale(updated);

    if (paymentMethod === 'cash') {
      setCurrentShift((prev) => ({
        ...prev,
        cashSales: prev.cashSales + saleToClose.balanceDue,
        expectedCash: prev.expectedCash + saleToClose.balanceDue
      }));
    }

    setActiveReceiptSale(updated);
  };

  const handleCloseShift = (closingCashActual: number) => {
    setCurrentShift((prev) => ({
      ...prev,
      closedAt: new Date().toISOString(),
      closedBy: cashierName,
      closingCashActual,
      status: 'closed'
    }));
    setIsZReportOpen(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#faf9f6] text-[#111827] overflow-hidden">
      {/* Top POS Header */}
      <header className="h-16 bg-[#0b0f19] text-white px-4 sm:px-6 flex items-center justify-between border-b border-[#c5a059]/30 flex-shrink-0 z-30">
        {/* Left: Return to Brand Website Button + Store Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToWebsite}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#c5a059] text-gray-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Back to Customer Website & Lookbook"
          >
            <i className="ti ti-arrow-left text-sm text-[#c5a059]"></i>
            <span className="hidden sm:inline">Storefront &amp; Lookbook</span>
          </button>

          <div className="h-6 w-[1px] bg-gray-700 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <img src="/fmo_logo.png" alt="FMO" className="h-7 w-auto brightness-110" />
            <div>
              <span className="font-serif-luxury text-sm font-bold tracking-wider text-white block leading-tight">
                FMO CLOUD POS
              </span>
              <span className="text-[9px] text-[#c5a059] font-mono block">
                Trans-Ekulu Flagship Register
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right Actions: Open Fittings, Z-Reports, Reports, Cashier Pill */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Open Fitting Queue Button */}
          <button
            onClick={() => setIsDepositQueueOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            title="View open deposits & pending fittings"
          >
            <i className="ti ti-needle text-sm"></i>
            <span className="hidden md:inline font-semibold">Fitting Queue:</span>
            <span className="font-mono font-bold bg-amber-400 text-black px-1.5 rounded text-[10px]">
              {openFittingOrders.length}
            </span>
          </button>

          {/* Z-Report / Till Drawer Button */}
          {FMO_STORE_SETTINGS.enableDrawerShifts && (
            <button
              onClick={() => setIsZReportOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Till Shifts & Z-Reports"
            >
              <i className="ti ti-cash text-sm text-[#c5a059]"></i>
              <span className="hidden lg:inline font-semibold">Till Z-Report</span>
            </button>
          )}

          {/* Reports Ledger Button */}
          <button
            onClick={() => setIsReportsOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="View Sales Reports & CSV Export"
          >
            <i className="ti ti-chart-bar text-sm text-[#c5a059]"></i>
            <span className="hidden lg:inline font-semibold">Reports</span>
          </button>

          {/* Cashier ID Pill */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-700">
            <div className="w-7 h-7 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold text-xs">
              <i className="ti ti-user"></i>
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-bold text-white leading-tight">
                {cashierName}
              </span>
              <span className="block text-[9px] text-emerald-400 font-medium">● Shift Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Terminal View: Category Sidebar + Product Grid + Right Cart */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Category Sidebar (7 categories) */}
        <aside className="w-16 sm:w-56 bg-white border-r border-[#c5a059]/20 flex flex-col flex-shrink-0 justify-between">
          <div className="p-3 border-b border-gray-100 hidden sm:block bg-[#faf9f6]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
              Garment Categories
            </span>
          </div>

          <div className="p-2 space-y-1 overflow-y-auto flex-1 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#0b0f19] text-white shadow-md border-l-4 border-[#c5a059]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <i className="ti ti-grid-dots text-sm text-[#c5a059]"></i>
                <span className="hidden sm:inline font-semibold">All Suit Cuts</span>
              </div>
              <span className="text-[10px] opacity-70 font-mono hidden sm:inline">47</span>
            </button>

            {FMO_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#0b0f19] text-white shadow-md border-l-4 border-[#c5a059]'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <i className={`ti ${cat.icon} text-sm text-[#c5a059]`}></i>
                  <span className="hidden sm:inline font-semibold truncate">{cat.name}</span>
                </div>
                <span className="text-[10px] opacity-70 font-mono hidden sm:inline">{cat.itemCount}</span>
              </button>
            ))}
          </div>

          {/* Store Info Mini Badge */}
          <div className="p-3 border-t border-gray-100 hidden sm:block bg-[#faf9f6] text-[10px] text-gray-500 space-y-0.5">
            <span className="font-bold text-[#0b0f19] block truncate">Hilmak Place Plaza</span>
            <span className="block truncate text-gray-400">Trans-Ekulu, Enugu</span>
          </div>
        </aside>

        {/* Center: Search, Color Variation Ribbon & Product Cards Grid */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#faf9f6]">
          {/* Search Bar & Color Filter Header */}
          <div className="p-4 border-b border-gray-200 bg-white space-y-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Quick search by cut name, fabric, style..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#faf9f6] border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#c5a059]"
                />
              </div>

              {activeColor !== 'all' && (
                <button
                  onClick={() => setActiveColor('all')}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold rounded-lg cursor-pointer whitespace-nowrap"
                >
                  Clear Color
                </button>
              )}
            </div>

            {/* Color Swatch Fast-Picker Ribbon */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1 flex-shrink-0">
                Colors:
              </span>
              {COLOR_FAMILIES.map((c) => {
                const isSelected = activeColor === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveColor(c.id as ColorFamily)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0b0f19] text-white shadow-sm ring-1 ring-[#c5a059]'
                        : 'bg-[#faf9f6] text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-sm flex-shrink-0"
                      style={{ background: c.hex }}
                    ></span>
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Touch Grid */}
          <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-xl p-3.5 border border-gray-200 hover:border-[#c5a059] shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group select-none active:scale-[0.98]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-sm"
                      style={{ background: product.primaryColorHex }}
                    ></span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 truncate">
                      {product.availableColors[0]?.name}
                    </span>
                  </div>

                  <h4 className="font-serif-luxury text-xs font-bold text-[#0b0f19] leading-tight mb-1 group-hover:text-[#a17f39] transition-colors">
                    {product.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                    {product.visualDetails}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-gray-100 mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-gray-400 block font-semibold">Buy / Rent</span>
                    <span className="font-mono text-xs font-bold text-[#0b0f19]">
                      ₦{product.basePrice.toLocaleString()}
                    </span>
                  </div>

                  <span className="w-6 h-6 rounded-full bg-[#c5a059]/10 text-[#a17f39] flex items-center justify-center text-xs group-hover:bg-[#c5a059] group-hover:text-white transition-colors">
                    <i className="ti ti-plus"></i>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right Sartorial Ticket Cart Panel */}
        <FmoCart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onCheckout={handleInitiateCheckout}
          vatEnabled={FMO_STORE_SETTINGS.vatEnabled}
          vatRate={FMO_STORE_SETTINGS.vatRate}
        />
      </div>

      {/* Variant Selection Drawer */}
      <FmoVariantDrawer
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Modal */}
      <FmoCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        subtotal={subtotal}
        discount={appliedDiscount}
        tax={tax}
        total={grandTotal}
        onCompleteSale={handleCompleteSale}
      />

      {/* Thermal Receipt Print Modal */}
      {activeReceiptSale && (
        <FmoThermalReceipt
          sale={activeReceiptSale}
          onClose={() => setActiveReceiptSale(null)}
          onPrint={() => window.print()}
        />
      )}

      {/* Z-Report Shift Reconciliation Modal */}
      <FmoZReportModal
        shift={currentShift}
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        onCloseShift={handleCloseShift}
      />

      {/* Open Deposits & Fitting Queue Modal */}
      <FmoDepositQueueModal
        isOpen={isDepositQueueOpen}
        onClose={() => setIsDepositQueueOpen(false)}
        openOrders={openFittingOrders}
        onCollectBalance={handleCollectBalance}
      />

      {/* Reports Screen */}
      {isReportsOpen && (
        <FmoReportsScreen
          sales={sales}
          onClose={() => setIsReportsOpen(false)}
          onReprintReceipt={(s) => setActiveReceiptSale(s)}
        />
      )}
    </div>
  );
};
