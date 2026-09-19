import React from 'react';

interface FmoHeaderProps {
  onOpenFittingModal: () => void;
  onSwitchToPos: () => void;
}

export const FmoHeader: React.FC<FmoHeaderProps> = ({
  onOpenFittingModal,
  onSwitchToPos
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-[#c5a059]/20 transition-all duration-300">
      {/* Top Banner with Flagship Address & Hours */}
      <div className="bg-[#0b0f19] text-[#f8fafc] text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#c5a059]">
              <i className="ti ti-map-pin text-sm"></i>
              Hilmak Place Plaza, Trans-Ekulu by Bilante Flyover, Enugu
            </span>
            <span className="hidden md:inline text-gray-500">•</span>
            <span className="hidden md:flex items-center gap-1 text-gray-300">
              <i className="ti ti-clock text-sm text-[#c5a059]"></i>
              Mon–Fri: 08:00–17:30 | Sat: 08:00–17:00
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:+2347018135116"
              className="flex items-center gap-1 hover:text-[#c5a059] transition-colors"
            >
              <i className="ti ti-phone text-xs text-[#c5a059]"></i>
              <span>0701 813 5116</span>
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="https://instagram.com/fmo.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#c5a059] transition-colors"
            >
              <i className="ti ti-brand-instagram text-xs text-[#c5a059]"></i>
              <span>@FMO.NG</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <a href="#home" className="flex items-center gap-3 group">
            <img
              src="/fmo_logo.png"
              alt="FMO Logo"
              className="h-11 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-serif-luxury text-xl font-bold tracking-wider text-[#0b0f19] leading-tight">
                FOR MEN ONLY
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#c5a059] font-semibold">
                Sartorial House • Enugu
              </span>
            </div>
          </a>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#111827]">
            <a href="#lookbook" className="hover:text-[#c5a059] transition-colors">
              Suit Lookbook
            </a>
            <a href="#pillars" className="hover:text-[#c5a059] transition-colors">
              The 3 Pillars
            </a>
            <a href="#rentals" className="hover:text-[#c5a059] transition-colors">
              Tuxedo Rentals
            </a>
            <a href="#store-info" className="hover:text-[#c5a059] transition-colors">
              Flagship Boutique
            </a>
          </nav>

          {/* Actions: Book Fitting & Staff POS Launch */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenFittingModal}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-[#c5a059] text-[#c5a059] hover:bg-[#c5a059] hover:text-white text-xs font-semibold rounded-md tracking-wider uppercase transition-all duration-200"
            >
              <i className="ti ti-needle text-sm"></i>
              <span>Book Fitting</span>
            </button>

            {/* Launch Staff POS Terminal Button */}
            <button
              onClick={onSwitchToPos}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0b0f19] hover:bg-[#171d2d] text-white text-xs font-medium rounded-md border border-[#c5a059]/40 shadow-sm hover:border-[#c5a059] transition-all duration-200"
              title="Switch to Storeflow POS Terminal"
            >
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
              <i className="ti ti-device-desktop-analytics text-sm text-[#c5a059]"></i>
              <span className="font-semibold tracking-wide">Staff POS Terminal</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
