import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, CartItem, ClientMeasurements } from '../lib/types';

interface FmoVariantDrawerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id'>) => void;
}

export const FmoVariantDrawer: React.FC<FmoVariantDrawerProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  if (!isOpen || !product) return null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [transactionType, setTransactionType] = useState<'sale' | 'rental'>('sale');
  const [requiresAlteration, setRequiresAlteration] = useState(false);
  const [alterationNotes, setAlterationNotes] = useState('');
  const [measurements, setMeasurements] = useState<ClientMeasurements>({
    chest: '',
    waist: '',
    inseam: '',
    sleeve: '',
    shoulder: ''
  });

  // Keep selected variant synced when product changes
  useEffect(() => {
    if (product && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  const handleAdd = () => {
    if (!selectedVariant) return;

    onAddToCart({
      product,
      variant: selectedVariant,
      quantity: 1,
      type: transactionType,
      requiresAlteration,
      alterationNotes: requiresAlteration ? alterationNotes : undefined,
      measurements: requiresAlteration ? measurements : undefined,
      unitPrice: transactionType === 'sale' ? selectedVariant.sellingPrice : selectedVariant.rentalPrice
    });

    onClose();
  };

  const currentPrice = transactionType === 'sale' ? selectedVariant.sellingPrice : selectedVariant.rentalPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-white shadow-2xl border-l border-[#c5a059]/30 flex flex-col justify-between animate-slide-in overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-100 bg-[#faf9f6]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-[#c5a059]/15 text-[#a17f39] px-2.5 py-0.5 rounded">
              {product.categoryId.replace('-', ' ')}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm transition-colors cursor-pointer"
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
          <h3 className="font-serif-luxury text-lg font-bold text-[#0b0f19] leading-tight">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-medium">
            {product.fabric} • {product.silhouette}
          </p>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Sale vs Rental Toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Transaction Mode:
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTransactionType('sale')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transactionType === 'sale'
                    ? 'bg-[#0b0f19] text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <i className="ti ti-shopping-bag text-xs text-[#c5a059]"></i>
                <span>Permanent Sale</span>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('rental')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  transactionType === 'rental'
                    ? 'bg-[#0b0f19] text-white shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <i className="ti ti-hanger text-xs text-[#c5a059]"></i>
                <span>Ceremonial Rental</span>
              </button>
            </div>
          </div>

          {/* Color Variation Swatch */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ti ti-palette text-[#c5a059]"></i>
                Fabric Shade:
              </label>
              <span className="text-xs font-semibold text-[#a17f39]">
                {selectedVariant.colorName}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#faf9f6] rounded-xl border border-gray-200">
              <span
                className="w-6 h-6 rounded-full border border-black/20 shadow-sm flex-shrink-0"
                style={{ background: selectedVariant.colorHex }}
              ></span>
              <div className="text-xs">
                <p className="font-bold text-[#0b0f19]">{selectedVariant.colorName}</p>
                <p className="text-[10px] text-gray-500">Color SKU: {selectedVariant.sku}</p>
              </div>
            </div>
          </div>

          {/* Size Selector Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ti ti-ruler text-[#c5a059]"></i>
                Size Option:
              </label>
              <span className="text-[11px] text-gray-500 font-mono">
                Stock: {selectedVariant.stock} available
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {product.variants.map((v) => {
                const isSelected = selectedVariant.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0b0f19] text-white border-[#c5a059] shadow-md ring-1 ring-[#c5a059]'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-[#c5a059]'
                    }`}
                  >
                    <span>{v.size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alterations Module Toggle */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="block text-xs font-bold text-[#0b0f19]">Requires Tailor Alterations?</span>
                <span className="block text-[10px] text-gray-500">Attach measurements &amp; print tailor work slip</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresAlteration}
                  onChange={(e) => setRequiresAlteration(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c5a059]"></div>
              </label>
            </div>

            {requiresAlteration && (
              <div className="bg-[#faf9f6] p-4 rounded-xl border border-[#c5a059]/30 space-y-3 animate-fade-in text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#a17f39] block">
                  Tailor Measurements (Inches)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Chest</label>
                    <input
                      type="text"
                      placeholder="42R"
                      value={measurements.chest}
                      onChange={(e) => setMeasurements({ ...measurements, chest: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Waist</label>
                    <input
                      type="text"
                      placeholder="34"
                      value={measurements.waist}
                      onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">Inseam</label>
                    <input
                      type="text"
                      placeholder="32"
                      value={measurements.inseam}
                      onChange={(e) => setMeasurements({ ...measurements, inseam: e.target.value })}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">Tailor Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Hem trouser 1 inch, taper jacket waist"
                    value={alterationNotes}
                    onChange={(e) => setAlterationNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer with Price & Add Button */}
        <div className="p-5 border-t border-gray-200 bg-[#faf9f6]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                {transactionType === 'sale' ? 'Purchase Amount' : 'Ceremonial Rental'}
              </span>
              <span className="font-mono text-xl font-bold text-[#0b0f19]">
                ₦{currentPrice.toLocaleString()}
              </span>
            </div>
            <div className="text-right text-[11px] text-gray-500 font-medium">
              <span className="block text-[#a17f39] font-semibold">{selectedVariant.size}</span>
              <span>SKU: {selectedVariant.sku}</span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="w-full py-3.5 gold-gradient-btn text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <i className="ti ti-plus text-sm"></i>
            <span>Add to Active Order</span>
          </button>
        </div>
      </div>
    </div>
  );
};
