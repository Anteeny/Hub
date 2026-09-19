import { useState, useEffect } from 'react';
import { Product, Sale } from './lib/types';
import { FMO_CATALOG } from './data/fmoCatalog';
import { FmoHeader } from './website/FmoHeader';
import { FmoHero } from './website/FmoHero';
import { FmoPillars } from './website/FmoPillars';
import { FmoLookbook } from './website/FmoLookbook';
import { FmoFittingModal } from './website/FmoFittingModal';
import { FmoStoreInfo } from './website/FmoStoreInfo';
import { FmoFooter } from './website/FmoFooter';
import { FmoPosTerminal } from './pos/FmoPosTerminal';

// Initial Demo Seed Sales for FMO Flagship Store
const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-init-01',
    receiptNumber: 'FMO-884210',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      {
        id: 'cart-init-01',
        product: FMO_CATALOG[0], // Navy Solid DB
        variant: FMO_CATALOG[0].variants[2], // 42R
        quantity: 1,
        type: 'sale',
        requiresAlteration: true,
        alterationNotes: 'Hem trouser cuff by 1 inch, taper lower leg',
        measurements: { chest: '42R', waist: '34', inseam: '32' },
        unitPrice: 420000
      }
    ],
    subtotal: 420000,
    tax: 31500,
    discount: 0,
    total: 451500,
    depositAmount: 451500,
    balanceDue: 0,
    paymentMethod: 'debit_card',
    paymentReference: 'STANBIC-RRN-994821',
    customerName: 'Barr. Obinna Nwosu',
    customerPhone: '0803 445 1920',
    status: 'completed',
    cashierName: 'Tony Ubagu (Lead Stylist)',
    registerName: 'Main Flagship Register 1',
    requiresAlterations: true
  },
  {
    id: 'sale-init-02',
    receiptNumber: 'FMO-884211',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    items: [
      {
        id: 'cart-init-02',
        product: FMO_CATALOG[15], // 3-Piece Mario Casas Burgundy
        variant: FMO_CATALOG[15].variants[1], // 40R
        quantity: 1,
        type: 'sale',
        requiresAlteration: true,
        alterationNotes: 'Take in jacket waist 0.5 inches for groom fitting',
        measurements: { chest: '40R', waist: '32', inseam: '31' },
        unitPrice: 520000
      }
    ],
    subtotal: 520000,
    tax: 39000,
    discount: 20000,
    total: 539000,
    depositAmount: 300000,
    balanceDue: 239000,
    paymentMethod: 'bank_transfer',
    paymentReference: 'ZENITH-TRF-0019284',
    customerName: 'Engr. Chidi Ikechukwu (Groom)',
    customerPhone: '0812 990 4412',
    status: 'deposit_held',
    cashierName: 'Tony Ubagu (Lead Stylist)',
    registerName: 'Main Flagship Register 1',
    requiresAlterations: true
  },
  {
    id: 'sale-init-03',
    receiptNumber: 'FMO-884212',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    items: [
      {
        id: 'cart-init-03',
        product: FMO_CATALOG[40], // White Wedding Tuxedo
        variant: FMO_CATALOG[40].variants[2], // 42R
        quantity: 1,
        type: 'rental',
        requiresAlteration: false,
        unitPrice: 120000
      }
    ],
    subtotal: 120000,
    tax: 9000,
    discount: 0,
    total: 129000,
    depositAmount: 129000,
    balanceDue: 0,
    paymentMethod: 'cash',
    customerName: 'Dr. Kevin Okeke',
    customerPhone: '0703 118 9022',
    status: 'completed',
    cashierName: 'Tony Ubagu (Lead Stylist)',
    registerName: 'Main Flagship Register 1',
    requiresAlterations: false
  }
];

export function App() {
  const [currentView, setCurrentView] = useState<'website' | 'pos'>('website');
  const [isFittingModalOpen, setIsFittingModalOpen] = useState(false);
  const [selectedProductForFitting, setSelectedProductForFitting] = useState<Product | null>(null);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);

  // Sync hash routing e.g. #pos
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#pos') {
        setCurrentView('pos');
      } else {
        setCurrentView('website');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchView = (view: 'website' | 'pos') => {
    setCurrentView(view);
    window.location.hash = view === 'pos' ? 'pos' : '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordSale = (newSale: Sale) => {
    setSales([newSale, ...sales]);
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    setSales(sales.map((s) => (s.id === updatedSale.id ? updatedSale : s)));
  };

  const handleOpenFittingForProduct = (product: Product) => {
    setSelectedProductForFitting(product);
    setIsFittingModalOpen(true);
  };

  const handleExploreLookbook = () => {
    const lookbookEl = document.getElementById('lookbook');
    if (lookbookEl) {
      lookbookEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If in POS view, render the touch POS terminal
  if (currentView === 'pos') {
    return (
      <FmoPosTerminal
        onSwitchToWebsite={() => switchView('website')}
        sales={sales}
        onRecordSale={handleRecordSale}
        onUpdateSale={handleUpdateSale}
      />
    );
  }

  // Otherwise render the Luxury Customer Brand Website
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      {/* Top Header */}
      <FmoHeader
        onOpenFittingModal={() => {
          setSelectedProductForFitting(null);
          setIsFittingModalOpen(true);
        }}
        onSwitchToPos={() => switchView('pos')}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <FmoHero
          onOpenFittingModal={() => {
            setSelectedProductForFitting(null);
            setIsFittingModalOpen(true);
          }}
          onExploreLookbook={handleExploreLookbook}
        />

        {/* 3 Core Pillars */}
        <FmoPillars />

        {/* Lookbook with Category & Color Variation Filters */}
        <FmoLookbook
          onSelectProductForFitting={handleOpenFittingForProduct}
        />

        {/* Flagship Showroom & Operating Hours */}
        <FmoStoreInfo />
      </main>

      {/* Footer */}
      <FmoFooter
        onSwitchToPos={() => switchView('pos')}
        onOpenFittingModal={() => {
          setSelectedProductForFitting(null);
          setIsFittingModalOpen(true);
        }}
      />

      {/* Fitting Consultation Modal */}
      <FmoFittingModal
        isOpen={isFittingModalOpen}
        onClose={() => setIsFittingModalOpen(false)}
        selectedProduct={selectedProductForFitting}
      />
    </div>
  );
}

export default App;
