import React from 'react';

export const FmoPillars: React.FC = () => {
  const pillars = [
    {
      id: 1,
      number: '01',
      title: 'Premium Suit Sales & Customization',
      subtitle: 'Structured Silhouettes & Master Precision',
      description:
        'FMO designs and retails a sophisticated range of formal wear including classic business suits, sharp double-breasted ensembles, traditional tuxedos, and modern two-piece sets. Globally sourced fabrics with structured silhouettes designed to accentuate the natural frame with a commanding presence.',
      icon: 'ti-ruler-measure',
      tag: 'Bespoke & RTW',
      highlights: ['Globally Sourced Fabrics', 'Structured Power Shoulders', 'Hand-Stitched Pick Detailing']
    },
    {
      id: 2,
      number: '02',
      title: 'High-End Suit & Tuxedo Rentals',
      subtitle: 'Ceremonial Splendor Without Commitment',
      description:
        'Access luxury tailoring and ceremonial fabrics for milestone occasions such as weddings, red carpets, galas, and corporate ceremonies. FMO maintains strict standards within our rental catalog—providing professional in-house fittings, custom tailored adjustments, and medical-grade sanitization.',
      icon: 'ti-hanger',
      tag: 'Weddings & Galas',
      highlights: ['Custom In-House Alterations', 'Rigorous Sanitization', 'Full Accessory Ensembles']
    },
    {
      id: 3,
      number: '03',
      title: 'Executive Styling & Wardrobe Consulting',
      subtitle: 'Complete Image Architecture for Leaders',
      description:
        'Beyond providing individual garments, FMO operates as a comprehensive image consultancy. We offer one-on-one executive styling sessions to help corporate leaders, grooms, and public figures curate a cohesive, commanding personal brand that stands out effortlessly.',
      icon: 'ti-user-check',
      tag: 'Executive Image',
      highlights: ['One-on-One Consultations', 'Curated Event Styling', 'VIP Fitting Suite Access']
    }
  ];

  return (
    <section id="pillars" className="py-20 bg-white border-y border-[#c5a059]/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-[0.25em] text-[#a17f39] uppercase block mb-2">
            The Sartorial Ecosystem
          </span>
          <h2 className="font-editorial text-3xl sm:text-5xl font-bold text-[#0b0f19] mb-4">
            The Three Pillars of FMO
          </h2>
          <div className="w-20 h-0.5 bg-[#c5a059] mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            More than a clothing label, FMO is a comprehensive style ecosystem built for the modern gentleman who refuses to blend in.
          </p>
        </div>

        {/* 3 Pillar Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              className="relative rounded-2xl bg-[#faf9f6] p-8 border border-[#c5a059]/30 hover:border-[#c5a059] transition-all duration-300 hover:shadow-xl group flex flex-col justify-between"
            >
              {/* Pillar Number Badge */}
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#0b0f19] text-[#c5a059] flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                  <i className={`ti ${pillar.icon}`}></i>
                </div>
                <span className="font-serif-luxury text-3xl font-bold text-[#c5a059]/40 group-hover:text-[#c5a059] transition-colors">
                  {pillar.number}
                </span>
              </div>

              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-[#c5a059]/10 text-[#a17f39] px-2.5 py-1 rounded mb-3">
                  {pillar.tag}
                </span>
                <h3 className="font-serif-luxury text-xl font-bold text-[#0b0f19] mb-2 group-hover:text-[#a17f39] transition-colors">
                  {pillar.title}
                </h3>
                <h4 className="text-xs font-semibold text-[#a17f39] mb-3">
                  {pillar.subtitle}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                  {pillar.description}
                </p>
              </div>

              {/* Highlights List */}
              <div className="border-t border-[#c5a059]/20 pt-4 mt-auto">
                <ul className="space-y-2">
                  {pillar.highlights.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                      <i className="ti ti-check text-[#c5a059] text-sm"></i>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
