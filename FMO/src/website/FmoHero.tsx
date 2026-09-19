import React, { useState, useEffect } from 'react';

interface FmoHeroProps {
  onOpenFittingModal: () => void;
  onExploreLookbook: () => void;
}

export const FmoHero: React.FC<FmoHeroProps> = ({
  onOpenFittingModal,
  onExploreLookbook
}) => {
  // Countdown to 23rd May 2026 Flagship Gala Opening
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const target = new Date('2026-05-23T08:00:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="home" className="relative overflow-hidden pt-10 pb-20 bg-gradient-to-b from-[#faf9f6] via-[#f5f2ea] to-[#faf9f6]">
      {/* Subtle Background Monogram */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none">
        <span className="font-serif-luxury text-[32rem] font-black text-[#0b0f19]">FMO</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Newspaper Style Editorial Header */}
        <div className="text-center mb-8 border-b-2 border-double border-[#c5a059]/30 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#a17f39] text-xs font-semibold tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]"></span>
            <span>Enugu Flagship Sartorial House</span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0b0f19] leading-tight mb-4">
            Become The Standard.
          </h1>

          <p className="font-serif-luxury italic text-xl sm:text-2xl text-[#a17f39] max-w-3xl mx-auto font-medium">
            "You Didn't Come This Far to Look Ordinary."
          </p>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto mt-3 leading-relaxed">
            No. 1 Suit Store in Enugu. For the Man of Class & Culture. Precision-engineered double-breasted power suits, heritage 3-piece striped ensembles, and bespoke black-tie tuxedos.
          </p>
        </div>

        {/* Hero Visual Grid with Boutique Image & Announcement Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
          {/* Main Boutique Interior Showcase */}
          <div className="lg:col-span-8 relative group">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#c5a059]/30 bg-[#0b0f19]">
              <img
                src="/fmo_store.png"
                alt="FMO Flagship Boutique Interior in Trans-Ekulu, Enugu"
                className="w-full h-[400px] sm:h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Overlay & Captions */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-[#c5a059] text-white text-[11px] font-bold tracking-wider uppercase rounded-md shadow-sm">
                    Flagship Boutique
                  </span>
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-gray-200 border border-white/10 text-[11px] font-medium rounded-md">
                    Trans-Ekulu, Enugu
                  </span>
                </div>
                <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-white mb-2">
                  A High-End Sartorial Experience
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
                  Featuring an exclusive fitting lounge, private executive wardrobe suites, and over 47 distinct suit cuts crafted for commanding leadership presence.
                </p>
              </div>
            </div>

            {/* Quick Floating Highlights */}
            <div className="absolute -bottom-5 -right-5 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-[#c5a059]/40 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-[#c5a059]/15 flex items-center justify-center text-[#c5a059] text-xl font-bold">
                <i className="ti ti-trophy"></i>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#0b0f19] uppercase tracking-wider">
                  No. 1 in Enugu
                </span>
                <span className="block text-[11px] text-gray-500">
                  Class • Culture • Craftsmanship
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Countdown & Quick Actions */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Opening & Induction Highlight Card */}
            <div className="bg-[#0b0f19] text-white rounded-2xl p-6 border border-[#c5a059]/40 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#c5a059]/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <i className="ti ti-calendar-event text-lg text-[#c5a059]"></i>
                  <span className="font-serif-luxury text-xs tracking-widest text-[#c5a059] uppercase font-bold">
                    Flagship Store Opening
                  </span>
                </div>
                <span className="text-[11px] bg-[#c5a059]/20 text-[#c5a059] px-2 py-0.5 rounded font-mono font-bold">
                  23 MAY 2026
                </span>
              </div>

              <h4 className="font-editorial text-2xl font-bold text-white mb-2 leading-snug">
                The Grand Sartorial Gala
              </h4>
              <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                Celebrating the official public launch of our Trans-Ekulu flagship showroom and the 2026 Induction Season collection.
              </p>

              {/* Countdown Grid */}
              <div className="grid grid-cols-4 gap-2 text-center mb-6">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="block font-mono text-xl font-bold text-[#c5a059]">{timeLeft.days}</span>
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Days</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="block font-mono text-xl font-bold text-[#c5a059]">{timeLeft.hours}</span>
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Hours</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="block font-mono text-xl font-bold text-[#c5a059]">{timeLeft.minutes}</span>
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Mins</span>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <span className="block font-mono text-xl font-bold text-[#c5a059]">{timeLeft.seconds}</span>
                  <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Secs</span>
                </div>
              </div>

              {/* Primary Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={onOpenFittingModal}
                  className="w-full py-3 px-4 gold-gradient-btn text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <i className="ti ti-needle text-base"></i>
                  <span>Book Private Fitting</span>
                </button>

                <button
                  onClick={onExploreLookbook}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-gray-200 border border-white/15 text-xs font-semibold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <i className="ti ti-eye text-base text-[#c5a059]"></i>
                  <span>Explore 47+ Suit Cuts</span>
                </button>
              </div>
            </div>

            {/* Operating Times Quick Snippet */}
            <div className="bg-white rounded-xl p-5 border border-[#c5a059]/20 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#c5a059]/10 text-[#a17f39] flex items-center justify-center text-lg">
                  <i className="ti ti-door-enter"></i>
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#0b0f19]">Today's Boutique Hours</span>
                  <span className="block text-[11px] text-gray-500">Mon–Fri: 08:00 AM – 05:30 PM</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Open
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
