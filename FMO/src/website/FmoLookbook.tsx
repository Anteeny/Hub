import React, { useState, useMemo } from 'react';
import { FMO_CATEGORIES, FMO_CATALOG, COLOR_FAMILIES } from '../data/fmoCatalog';
import { Product, SuitCategory, ColorFamily } from '../lib/types';
import { FmoAiFittingRoom } from './FmoAiFittingRoom';

interface FmoLookbookProps {
  onSelectProductForFitting: (product: Product) => void;
  onOrderSuit?: (product: Product, selectedColor: string) => void;
}

export const FmoLookbook: React.FC<FmoLookbookProps> = ({
  onSelectProductForFitting,
  onOrderSuit
}) => {
  const [activeCategory, setActiveCategory] = useState<SuitCategory | 'all'>('all');
  const [activeColor, setActiveColor] = useState<ColorFamily>('all');
  const [priceMode, setPriceMode] = useState<'purchase' | 'rental'>('purchase');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // AI Try-On Studio State
  const [showAiStudio, setShowAiStudio] = useState<boolean>(false);
  const [aiTryOnProduct, setAiTryOnProduct] = useState<Product | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return FMO_CATALOG.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.categoryId === activeCategory;
      const matchesColor = activeColor === 'all' || product.colorFamily === activeColor;
      const matchesSearch =
        searchQuery === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.visualDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.fabric.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesColor && matchesSearch;
    });
  }, [activeCategory, activeColor, searchQuery]);

  return (
    <section id="lookbook" className="py-12 bg-[#faf9f6] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-xs font-bold tracking-[0.25em] text-[#a17f39] uppercase block mb-2">
            The Sartorial Catalog
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl font-bold text-[#0b0f19] mb-3">
            Sartorial Lookbook &amp; Cuts
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
            Browse our 47+ precision-crafted silhouettes. Filter by category or color family to discover your next commanding ensemble.
          </p>
        </div>

        {/* Luxury AI Virtual Fitting Room Hero Banner */}
        <div className="mb-10 bg-gradient-to-r from-[#0b0f19] via-[#111827] to-[#0b0f19] rounded-2xl p-6 sm:p-8 border border-[#c5a059]/40 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative z-10 max-w-xl text-left">
            <div className="inline-flex items-center gap-2 bg-[#c5a059]/20 border border-[#c5a059] px-3 py-1 rounded-full text-[11px] font-bold text-[#d4af37] uppercase tracking-wider mb-3">
              <span>✨</span>
              <span>AI Sartorial Bespoke Mirror</span>
            </div>
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
              Snap Your Face &amp; Try On Any FMO Suit
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Use our neural tailoring engine to snap your face or full body shot. See yourself fitted with accurate ambient boutique lighting, collar shadows, and custom cuts.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                setAiTryOnProduct(filteredProducts[0] || FMO_CATALOG[0]);
                setShowAiStudio(true);
              }}
              className="w-full sm:w-auto py-3.5 px-6 gold-gradient-btn text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-2xl hover:scale-105 transition-all cursor-pointer"
            >
              <span>📸</span>
              <span>Open AI Virtual Try-On Studio</span>
            </button>
          </div>
          {/* Subtle Ambient Gold Glow Background */}
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#c5a059]/15 to-transparent pointer-events-none" />
        </div>

        {/* Controls: Search, Price Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
            <input
              type="text"
              placeholder="Search suit name, fabric, cut..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#c5a059]/30 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#c5a059] shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                <i className="ti ti-x"></i>
              </button>
            )}
          </div>

          {/* Mode Switch: Purchase vs Rental */}
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#c5a059]/30 shadow-sm">
            <button
              onClick={() => setPriceMode('purchase')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                priceMode === 'purchase'
                  ? 'bg-[#0b0f19] text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <i className="ti ti-shopping-bag mr-1.5 text-xs text-[#c5a059]"></i>
              <span>Purchase Price</span>
            </button>
            <button
              onClick={() => setPriceMode('rental')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                priceMode === 'rental'
                  ? 'bg-[#0b0f19] text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <i className="ti ti-hanger mr-1.5 text-xs text-[#c5a059]"></i>
              <span>Ceremonial Rental</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#c5a059] text-white shadow-md'
                : 'bg-white text-gray-700 border border-[#c5a059]/20 hover:border-[#c5a059]'
            }`}
          >
            All Cuts ({FMO_CATALOG.length})
          </button>
          {FMO_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-[#c5a059] text-white shadow-md font-semibold'
                  : 'bg-white text-gray-700 border border-[#c5a059]/20 hover:border-[#c5a059]'
              }`}
            >
              <i className={`ti ${cat.icon} text-sm`}></i>
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat.itemCount}
              </span>
            </button>
          ))}
        </div>

        {/* Color Variation Filter Ribbon */}
        <div className="bg-white p-3.5 rounded-xl border border-[#c5a059]/20 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <i className="ti ti-palette text-[#c5a059]"></i>
              Filter by Color Variation:
            </span>
            {activeColor !== 'all' && (
              <button
                onClick={() => setActiveColor('all')}
                className="text-[11px] text-[#a17f39] hover:underline font-semibold"
              >
                Reset to All Colors
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {COLOR_FAMILIES.map((col) => {
              const isSelected = activeColor === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveColor(col.id as ColorFamily)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0b0f19] text-white shadow-md'
                      : 'bg-[#faf9f6] text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-inner flex-shrink-0"
                    style={{ background: col.hex }}
                  ></span>
                  <span className="text-[11px]">{col.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid with Real Photography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl overflow-hidden border border-[#c5a059]/25 hover:border-[#c5a059] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group text-left"
            >
              {/* Suit Photography Showcase (Authentic FMO Boutique Photo) */}
              <div
                className="relative w-full aspect-[4/5] bg-gray-900 overflow-hidden group/img cursor-pointer"
                onClick={() => setSelectedProductDetails(product)}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0b0f19] text-[#d4af37] font-bold text-xs">
                    FMO BESPOKE
                  </div>
                )}

                {/* Quick AI Try-On Overlay Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAiTryOnProduct(product);
                    setShowAiStudio(true);
                  }}
                  className="absolute bottom-3 right-3 bg-[#0b0f19]/90 hover:bg-[#c5a059] text-white hover:text-[#0b0f19] px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-all transform hover:scale-105 cursor-pointer z-10"
                >
                  <span>✨</span>
                  <span>AI Try-On</span>
                </button>

                {/* Category & Silhouette Pill */}
                <span className="absolute top-3 left-3 bg-black/75 backdrop-blur-sm text-gray-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                  {product.silhouette.split(',')[0]}
                </span>
              </div>

              {/* Card Header & Color Swatch Representation */}
              <div className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-inner flex-shrink-0"
                      style={{ background: product.primaryColorHex }}
                      title={`Color: ${product.availableColors[0]?.name}`}
                    ></span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 truncate">
                      {product.availableColors[0]?.name}
                    </span>
                  </div>
                  {product.featured && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#c5a059]/15 text-[#a17f39] px-2 py-0.5 rounded">
                      Featured
                    </span>
                  )}
                </div>

                <h3 className="font-serif-luxury text-sm sm:text-base font-bold text-[#0b0f19] leading-snug mb-1.5 group-hover:text-[#a17f39] transition-colors">
                  {product.name}
                </h3>

                <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mb-2.5">
                  {product.visualDetails}
                </p>

                {/* Fabric Pill */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                    {product.fabric}
                  </span>
                </div>
              </div>

              {/* Card Footer with Price & 3 Actions: Details, AI Try-On, Fit & Buy */}
              <div className="p-4 pt-3 border-t border-gray-100 bg-[#faf9f6]/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                      {priceMode === 'purchase' ? 'Purchase (₦)' : 'Rental (₦)'}
                    </span>
                    <span className="font-mono text-base font-bold text-[#0b0f19]">
                      ₦{(priceMode === 'purchase' ? product.basePrice : product.rentalPrice).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {priceMode === 'purchase'
                      ? `Rent: ₦${product.rentalPrice.toLocaleString()}`
                      : `Buy: ₦${product.basePrice.toLocaleString()}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setSelectedProductDetails(product)}
                    className="py-2 px-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => {
                      setAiTryOnProduct(product);
                      setShowAiStudio(true);
                    }}
                    className="py-2 px-1.5 bg-[#0b0f19] hover:bg-[#1f293d] text-[#d4af37] text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>✨ Try-On</span>
                  </button>

                  <button
                    onClick={() => onSelectProductForFitting(product)}
                    className="py-2 px-1.5 gold-gradient-btn text-black text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>Fit &amp; Buy</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State if Search yielded no results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#c5a059]/40 mt-8">
            <i className="ti ti-shirt-off text-4xl text-gray-400 mb-3 block"></i>
            <h3 className="font-editorial text-lg font-bold text-gray-700 mb-1">
              No Silhouettes Found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              We couldn't find any suits matching your search. Try resetting filters or searching for another fabric.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setActiveColor('all');
                setSearchQuery('');
              }}
              className="py-2 px-4 bg-[#0b0f19] text-white text-xs font-bold rounded-lg cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Suit Details Modal */}
      {selectedProductDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedProductDetails(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-[#c5a059]/40 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProductDetails(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-lg cursor-pointer"
            >
              ✕
            </button>

            {selectedProductDetails.imageUrl && (
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-gray-100">
                <img
                  src={selectedProductDetails.imageUrl}
                  alt=""
                  className="w-full h-full object-cover object-top"
                />
              </div>
            )}

            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/20"
                style={{ background: selectedProductDetails.primaryColorHex }}
              ></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#a17f39]">
                {selectedProductDetails.availableColors[0]?.name}
              </span>
            </div>

            <h3 className="font-editorial text-2xl font-bold text-[#0b0f19] mb-2">
              {selectedProductDetails.name}
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              {selectedProductDetails.visualDetails}
            </p>

            <div className="bg-[#faf9f6] rounded-xl p-4 border border-gray-200 mb-6 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Fabric Composition:</span>
                <span className="font-semibold text-gray-800">{selectedProductDetails.fabric}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Silhouette Structure:</span>
                <span className="font-semibold text-gray-800">{selectedProductDetails.silhouette}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Purchase Price:</span>
                <span className="font-mono font-bold text-[#0b0f19]">
                  ₦{selectedProductDetails.basePrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Ceremonial Rental:</span>
                <span className="font-mono font-bold text-[#a17f39]">
                  ₦{selectedProductDetails.rentalPrice.toLocaleString()} / Event
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const p = selectedProductDetails;
                  setSelectedProductDetails(null);
                  setAiTryOnProduct(p);
                  setShowAiStudio(true);
                }}
                className="flex-1 py-3 bg-[#0b0f19] text-[#d4af37] text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black transition-colors"
              >
                <span>✨</span>
                <span>AI Virtual Try-On</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = selectedProductDetails;
                  setSelectedProductDetails(null);
                  onSelectProductForFitting(p);
                }}
                className="flex-1 py-3 gold-gradient-btn text-black text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Book Fitting &amp; Buy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Virtual Fitting Room Modal */}
      {showAiStudio && (
        <FmoAiFittingRoom
          initialProduct={aiTryOnProduct || filteredProducts[0]}
          allProducts={FMO_CATALOG}
          onClose={() => setShowAiStudio(false)}
          onOrderSuit={(product, color) => {
            setShowAiStudio(false);
            if (onOrderSuit) {
              onOrderSuit(product, color);
            } else {
              onSelectProductForFitting(product);
            }
          }}
        />
      )}
    </section>
  );
};
