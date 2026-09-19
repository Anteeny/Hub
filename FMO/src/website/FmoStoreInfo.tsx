import React from 'react';

export const FmoStoreInfo: React.FC = () => {
  const schedule = [
    { day: 'Monday', hours: '08:00 AM – 05:30 PM', status: 'Open' },
    { day: 'Tuesday', hours: '08:00 AM – 05:30 PM', status: 'Open' },
    { day: 'Wednesday', hours: '08:00 AM – 05:30 PM', status: 'Open' },
    { day: 'Thursday', hours: '08:00 AM – 05:30 PM', status: 'Open' },
    { day: 'Friday', hours: '08:00 AM – 05:30 PM', status: 'Open' },
    { day: 'Saturday', hours: '08:00 AM – 05:00 PM', status: 'Open' },
    { day: 'Sunday', hours: 'Closed (By Exclusive Appointment)', status: 'VIP Only' }
  ];

  return (
    <section id="store-info" className="py-20 bg-white border-t border-[#c5a059]/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Flagship Hours & Address */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <span className="text-xs font-bold tracking-[0.25em] text-[#a17f39] uppercase block mb-2">
                Enugu Sartorial Flagship
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#0b0f19] mb-4">
                Visit Our Trans-Ekulu Showroom
              </h2>
              <div className="w-16 h-0.5 bg-[#c5a059] mb-4"></div>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Step into a world of tailored excellence. Located at Hilmak Place Plaza by the landmark Bilante Flyover in Trans-Ekulu, Enugu. Enjoy private fitting suites and dedicated master tailoring.
              </p>
            </div>

            {/* Address Card */}
            <div className="bg-[#faf9f6] rounded-2xl p-6 border border-[#c5a059]/30 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b0f19] text-[#c5a059] flex items-center justify-center text-xl flex-shrink-0">
                  <i className="ti ti-map-2"></i>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0b0f19] mb-0.5">Physical Boutique Address</h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    Hilmak Place Plaza Plot C, 1A Pocket Layout, Trans-Ekulu by Bilante Flyover, Enugu, Enugu State
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ti ti-phone text-[#c5a059] text-base"></i>
                  <a href="tel:+2347018135116" className="font-bold hover:text-[#c5a059]">
                    0701 813 5116
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <i className="ti ti-brand-instagram text-[#c5a059] text-base"></i>
                  <a
                    href="https://instagram.com/fmo.ng"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:text-[#c5a059]"
                  >
                    @FMO.NG
                  </a>
                </div>
              </div>
            </div>

            {/* Operating Times Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-[#0b0f19] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="ti ti-clock text-[#c5a059]"></i>
                  <span className="font-serif-luxury text-xs font-bold uppercase tracking-wider">
                    Weekly Operating Schedule
                  </span>
                </div>
                <span className="text-[10px] text-[#c5a059] font-mono">Punctual Service</span>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {schedule.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2.5 px-5 hover:bg-[#faf9f6] transition-colors">
                    <span className="font-medium text-gray-800">{item.day}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-600">{item.hours}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'Open'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Flyers Showcase */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif-luxury text-lg font-bold text-[#0b0f19] flex items-center gap-2">
                <i className="ti ti-news text-[#c5a059]"></i>
                <span>Editorial Announcements &amp; Editions</span>
              </h3>
              <span className="text-[11px] text-[#a17f39] font-semibold">2026 Archive</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Flyer 1: The Opening */}
              <div className="group rounded-xl overflow-hidden border border-[#c5a059]/30 shadow-md bg-[#0b0f19] relative">
                <img
                  src="/fmo_opening.jpg"
                  alt="FMO The Business News - The Opening 23rd May 2026"
                  className="w-full h-[360px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059]">
                    Grand Opening
                  </span>
                  <p className="text-white text-xs font-bold">The Business News Edition</p>
                  <p className="text-gray-300 text-[10px]">23rd May 2026 • Flagship Launch</p>
                </div>
              </div>

              {/* Flyer 2: Induction Szn */}
              <div className="group rounded-xl overflow-hidden border border-[#c5a059]/30 shadow-md bg-[#0b0f19] relative">
                <img
                  src="/fmo_induction.jpg"
                  alt="FMO Breaking News - It's Induction Szn 2026 Edition"
                  className="w-full h-[360px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c5a059]">
                    Special Edition
                  </span>
                  <p className="text-white text-xs font-bold">It's Induction Szn 2026</p>
                  <p className="text-gray-300 text-[10px]">For Newly Inducted Men of Class &amp; Culture</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
