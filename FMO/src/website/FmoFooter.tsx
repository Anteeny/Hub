import React from 'react';

interface FmoFooterProps {
  onSwitchToPos: () => void;
  onOpenFittingModal: () => void;
}

export const FmoFooter: React.FC<FmoFooterProps> = ({
  onSwitchToPos,
  onOpenFittingModal
}) => {
  return (
    <footer className="bg-[#0b0f19] text-white pt-16 pb-12 border-t-2 border-[#c5a059]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/fmo_logo.png" alt="FMO Bowtie" className="h-10 w-auto brightness-110" />
              <div className="flex flex-col">
                <span className="font-serif-luxury text-lg font-bold tracking-wider text-white">
                  FOR MEN ONLY
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#c5a059] font-semibold">
                  Sartorial House
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              No. 1 Suit Store in Enugu. Built for the modern gentleman who values class, culture, and precision tailoring.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] text-[#c5a059] italic font-serif-luxury">
                "Become the Standard. You Didn't Come This Far to Look Ordinary."
              </span>
            </div>
          </div>

          {/* Col 2: The 7 Suit Categories */}
          <div>
            <h4 className="font-serif-luxury text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">
              Suit Categories
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><a href="#lookbook" className="hover:text-white transition-colors">Double-Breasted Suits (15)</a></li>
              <li><a href="#lookbook" className="hover:text-white transition-colors">3-Piece Mario Casas &amp; Striped (20)</a></li>
              <li><a href="#lookbook" className="hover:text-white transition-colors">Jodhpuri / Bandhgala Collar (5)</a></li>
              <li><a href="#lookbook" className="hover:text-white transition-colors">2-Piece Executive Contemporary (2)</a></li>
              <li><a href="#lookbook" className="hover:text-white transition-colors">Crossover Wrap Suits (3)</a></li>
              <li><a href="#lookbook" className="hover:text-white transition-colors">Black-Tie Wedding Tuxedos (2)</a></li>
              <li><a href="#lookbook" className="hover:text-white transition-colors">Gentleman Look Bundles (7)</a></li>
            </ul>
          </div>

          {/* Col 3: Services & Tailoring */}
          <div>
            <h4 className="font-serif-luxury text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">
              Sartorial Services
            </h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><button onClick={onOpenFittingModal} className="hover:text-white transition-colors text-left cursor-pointer">Bespoke Fitting Consultations</button></li>
              <li><a href="#rentals" className="hover:text-white transition-colors">Ceremonial Tuxedo Rentals</a></li>
              <li><a href="#pillars" className="hover:text-white transition-colors">Groom &amp; Groomsmen Packages</a></li>
              <li><a href="#pillars" className="hover:text-white transition-colors">Executive Wardrobe Consulting</a></li>
              <li><span className="text-gray-500">In-House Master Alterations</span></li>
            </ul>
          </div>

          {/* Col 4: Flagship Contact & Staff Portal */}
          <div className="space-y-4">
            <h4 className="font-serif-luxury text-xs font-bold uppercase tracking-widest text-[#c5a059] mb-4">
              Flagship Boutique
            </h4>
            <div className="space-y-2 text-xs text-gray-300">
              <p className="flex items-start gap-2">
                <i className="ti ti-map-pin text-[#c5a059] flex-shrink-0 mt-0.5"></i>
                <span>Hilmak Place Plaza Plot C, 1A Pocket Layout, Trans-Ekulu by Bilante Flyover, Enugu</span>
              </p>
              <p className="flex items-center gap-2">
                <i className="ti ti-phone text-[#c5a059]"></i>
                <a href="tel:+2347018135116" className="hover:text-[#c5a059]">0701 813 5116</a>
              </p>
              <p className="flex items-center gap-2">
                <i className="ti ti-brand-instagram text-[#c5a059]"></i>
                <a href="https://instagram.com/fmo.ng" target="_blank" rel="noopener noreferrer" className="hover:text-[#c5a059]">@FMO.NG</a>
              </p>
            </div>

            {/* Launch Staff POS Button in Footer */}
            <div className="pt-2">
              <button
                onClick={onSwitchToPos}
                className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg border border-[#c5a059]/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <i className="ti ti-lock text-[#c5a059]"></i>
                <span>Staff POS &amp; Cloud ERP Terminal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 FMO (For Men Only) Luxury Menswear Limited. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Enugu, Nigeria</span>
            <span>•</span>
            <span>Master Tailoring &amp; Retail Cloud POS</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
