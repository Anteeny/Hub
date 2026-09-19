/* ==========================================================================
   AnteenyHub Interactive Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPortfolioModal();
  initPortfolioFilters();
  initHeroSpotlight();
  initContactModalTriggers();
  initContactForm();
  initPricingConnector();
  initScrollSpy();
});

/* --- Navbar Scroll & Mobile Menu --- */
function initNavbar() {
  const header = document.querySelector('.header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Toggle mobile menu
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const icon = mobileToggle.querySelector('i');
    if (navMenu.classList.contains('active')) {
      icon.className = 'ti ti-x';
    } else {
      icon.className = 'ti ti-menu-2';
    }
  });

  // Close mobile menu when clicking nav link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      mobileToggle.querySelector('i').className = 'ti ti-menu-2';
    });
  });
}

/* --- Contact Modal Triggers (open contact modal from buttons/links) --- */
function initContactModalTriggers() {
  const contactModal = document.getElementById('contact-modal');
  const contactBackdrop = document.getElementById('contact-backdrop');
  const contactClose = document.getElementById('contact-modal-close');

  if (!contactModal) return;

  const openButtons = document.querySelectorAll('.open-contact-btn');
  const contactLinks = document.querySelectorAll('a[href="#contact"]');

  const open = (e) => {
    if (e) e.preventDefault();
    contactModal.classList.add('active');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    contactModal.classList.remove('active');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openButtons.forEach(b => b.addEventListener('click', open));
  contactLinks.forEach(a => a.addEventListener('click', open));

  contactClose && contactClose.addEventListener('click', close);
  contactBackdrop && contactBackdrop.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal.classList.contains('active')) {
      close();
    }
  });
}

/* --- Portfolio Projects Database & Modal Logic --- */
const PROJECTS_DATA = {
  'storeflow': {
    title: 'Storeflow Multi-Tenant Retail POS & Cloud ERP',
    badge: 'Production SaaS',
    badgeColor: 'var(--accent-cyan)',
    miniClass: 'storeflow-mini',
    miniContent: `
      <div class="mini-pos-bar">
        <span class="mini-tag-pos">STOREFLOW POS</span>
        <span class="mini-badge-pos">Terminal 1 • Active</span>
      </div>
      <div class="mini-pos-grid">
        <div class="mini-pos-metric"><small>Net Sales Today</small><strong>₦245,800</strong></div>
        <div class="mini-pos-metric"><small>VAT (7.5%)</small><strong>₦17,150</strong></div>
        <div class="mini-pos-metric"><small>Till Float</small><strong>Balanced</strong></div>
      </div>
      <div class="mini-pos-lines">
        <div class="mini-line-item"><span>Paracetamol 500mg (x2)</span><span>₦1,800</span></div>
        <div class="mini-line-item"><span>Amoxil 250mg (x1)</span><span>₦3,200</span></div>
      </div>
    `,
    description: 'A complete multi-tenant cloud retail point-of-sale and store administration system engineered for Nigerian commercial businesses. It supports multi-terminal registers, cryptographic cashier PIN locking, cash drawer till reconciliation (opening/closing shifts and Z-reports), automated 7.5% Nigerian VAT calculations, dynamic barcode search, and 80mm thermal receipt printing.',
    features: [
      'Multi-tenant architecture powered by Supabase Row-Level Security (RLS)',
      'Cash drawer till reconciliation with opening float, closing audit & Z-Reports',
      '4-digit cashier PIN authentication with PBKDF2 cryptographic hashing',
      '80mm thermal receipt generator & Nigerian VAT compliance ledgers',
      'Multi-register support with instant live/demo sandbox toggling'
    ],
    tech: ['React 18', 'Vite', 'TypeScript', 'Supabase RLS', 'Vanilla CSS Tokens', 'Web Crypto API'],
    liveUrl: 'https://storeflow-mu-eight.vercel.app/'
  },
  'colour-picnic': {
    title: 'UNN Freshers Colour Picnic 2026',
    badge: 'Live Event Platform',
    badgeColor: 'var(--accent-gold)',
    miniClass: 'picnic-mini',
    miniContent: `
      <div class="mini-ticket-header">
        <span class="mini-tag-picnic">UNN COLOUR PICNIC</span>
        <span class="mini-badge-picnic">CEDR Field</span>
      </div>
      <div class="mini-team-badge" style="background:#2E9CFF22; color:#2E9CFF; border:1px solid #2E9CFF44; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:700; margin:6px 0;">
        ⚡ Team Waves (Sky Blue) • Biological Sciences
      </div>
      <div class="mini-stub-pass">
        <div style="font-size:9px; color:#888;">TICKET PASS ID</div>
        <strong style="color:var(--accent-gold); font-size:13px; letter-spacing:1px;">UCP-2026-9481</strong>
      </div>
    `,
    description: 'A high-concurrency event registration and ticketing platform engineered for the University of Nigeria Nsukka (UNN) freshman welcome week. The system maps incoming students to their official faculty color teams, features a synchronized countdown clock, generates digital pass stubs, and automates verified WhatsApp community onboarding.',
    features: [
      'Automatic faculty-to-team colour classification logic',
      'Dynamic digital ticket stub generation with custom attendee ID',
      'Live synchronized countdown timer with timezone persistence',
      'Integrated WhatsApp community onboarding funnel for 1,000+ freshers',
      'Real-time registration tracking with Supabase backend'
    ],
    tech: ['JavaScript ES6', 'Supabase Backend', 'HTML5 Canvas API', 'Modern CSS3', 'WhatsApp Automation'],
    liveUrl: 'https://freshers-experience26.vercel.app/'
  },
  'admin-portal': {
    title: 'NCF Leadership Database & Admin Intelligence Portal',
    badge: 'Enterprise Dashboard',
    badgeColor: 'var(--accent-cyan)',
    miniClass: 'admin-mini',
    miniContent: `
      <div class="mini-sidebar"><div class="mini-dot" style="background:var(--accent-cyan)"></div><div class="mini-dot"></div><div class="mini-dot"></div></div>
      <div class="mini-dash-main">
        <div class="mini-header-line"></div>
        <div class="mini-stat-row">
          <div class="mini-stat-block"></div>
          <div class="mini-stat-block"></div>
        </div>
        <div class="mini-chart-mock">
          <svg viewBox="0 0 100 40" class="mini-chart-svg" style="width:100%; height:25px;">
            <path d="M0,40 Q25,10 50,25 T100,5" fill="none" stroke="#06b6d4" stroke-width="2" />
            <circle cx="50" cy="25" r="2" fill="#06b6d4" />
            <circle cx="100" cy="5" r="2" fill="#06b6d4" />
          </svg>
        </div>
      </div>
    `,
    description: 'A centralized organizational administration portal built to manage student leadership directories, attendance trackers, and activity metrics. Employs modern grid architecture, dynamic sidebars, and real-time database visualization syncing.',
    features: [
      'Interactive Chart.js real-time analytics graphs',
      'Dynamic sidebar navigation collapsers with fluid transitions',
      'Advanced client-side multi-parameter search & filtering',
      'Supabase database authentication with Row-Level Security'
    ],
    tech: ['JavaScript ES6+', 'Chart.js API', 'Supabase Syncing', 'Glassmorphism UI'],
    liveUrl: 'https://ncfunn.vercel.app'
  },
  'mirror-academy': {
    title: 'The Mirror School of Transformation',
    badge: 'EdTech Platform',
    badgeColor: 'var(--accent-violet)',
    miniClass: 'academy-mini',
    miniContent: `
      <div class="mini-nav"><span class="mini-logo">TMS</span><span class="mini-badge">Academy</span></div>
      <div class="mini-hero">
        <div class="mini-text-line lg"></div>
        <div class="mini-text-line md"></div>
      </div>
      <div class="mini-cards">
        <div class="mini-box"><div class="mini-circle"></div><div class="mini-text-line sm"></div></div>
        <div class="mini-box"><div class="mini-circle"></div><div class="mini-text-line sm"></div></div>
      </div>
    `,
    description: 'A contemporary digital academy portal engineered for transformational education. Integrates subject-focused course explorer filters, responsive curriculum grids, partner carousels, and typography hierarchies designed for modern digital schooling.',
    features: [
      'Subject explorer & responsive sidebar filter logic',
      'Dynamic course curriculum card grid with animated hover states',
      'Accessible typography hierarchies and high-contrast dark palette',
      'Partner integration carousel with smooth hardware acceleration'
    ],
    tech: ['React.js', 'Vite', 'Semantic CSS', 'Responsive Grids'],
    liveUrl: 'https://mirrorschooloftransformation.vercel.app/'
  },
  'accountability': {
    title: 'NCF Member Accountability System',
    badge: 'Client Portal',
    badgeColor: 'var(--accent-gold)',
    miniClass: 'accountability-mini',
    miniContent: `
      <div class="mini-form-header">
        <div class="mini-circle-logo"></div>
        <div class="mini-text-line sm"></div>
      </div>
      <div class="mini-stepper">
        <span class="mini-step done"></span>
        <span class="mini-step-line done"></span>
        <span class="mini-step done"></span>
        <span class="mini-step-line"></span>
        <span class="mini-step"></span>
      </div>
      <div class="mini-form-body">
        <div class="mini-input"></div>
        <div class="mini-input"></div>
        <div class="mini-button bg-gold-color" style="background:var(--accent-gold); height:8px; border-radius:2px;"></div>
      </div>
    `,
    description: 'A multi-step accountability and data reporting form engineered for leadership evaluations. Features stage-by-stage stepper logic, offline crash recovery with Web LocalStorage, rich validation states, and attachment uploading.',
    features: [
      'Multi-stage step progress tracking indicator',
      'Self-saving forms with Web LocalStorage disaster recovery',
      'Custom client attachment upload workflows',
      'Optimized lightweight asset management with zero external framework overhead'
    ],
    tech: ['HTML5', 'Vanilla CSS', 'JavaScript ES6', 'Local Storage API'],
    liveUrl: 'accountability.html'
  }
};

function initPortfolioModal() {
  const cards = document.querySelectorAll('.portfolio-card');
  const modal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');
  const modalBackdrop = document.getElementById('modal-backdrop');

  const openModal = (projectId) => {
    const data = PROJECTS_DATA[projectId];
    if (!data) return;

    // Inject content
    modalBody.innerHTML = `
      <div class="modal-header-section">
        <span class="modal-project-badge" style="background: ${data.badgeColor}22; color: ${data.badgeColor}; border: 1px solid ${data.badgeColor}44">${data.badge}</span>
        <h3 class="modal-title">${data.title}</h3>
      </div>
      
      <div class="modal-visual-preview">
        <div class="project-mini-ui ${data.miniClass}">
          ${data.miniContent}
        </div>
      </div>
      
      <p class="modal-description">${data.description}</p>
      
      <h4 class="modal-features-title">Core Implementation Details</h4>
      <ul class="modal-features-list">
        ${data.features.map(feat => `<li><i class="ti ti-circle-check"></i><span>${feat}</span></li>`).join('')}
      </ul>
      
      <div class="modal-actions">
        <div class="modal-tech-pills">
          ${data.tech.map(t => `<span>${t}</span>`).join('')}
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          ${data.liveUrl ? `<a href="${data.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">Launch Live Project <i class="ti ti-arrow-up-right"></i></a>` : ''}
          <a href="#contact" class="btn btn-sm btn-secondary modal-cta-btn">Discuss Similar Project</a>
        </div>
      </div>
    `;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Hook modal cta click to close modal and scroll
    const modalCta = modalBody.querySelector('.modal-cta-btn');
    if (modalCta) {
      modalCta.addEventListener('click', () => {
        closeModal();
      });
    }
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicking directly on a link with an href, don't open modal
      if (e.target.closest('a')) return;
      const projectId = card.getAttribute('data-project');
      openModal(projectId);
    });

    const detailsBtn = card.querySelector('.open-details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = card.getAttribute('data-project');
        openModal(projectId);
      });
    }
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

  // Esc key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* --- Portfolio Category Filter Logic --- */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  const cards = document.querySelectorAll('.portfolio-card');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = '';
          card.style.animation = 'slideInCard 0.35s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* --- Interactive Hero Spotlight Switcher --- */
function initHeroSpotlight() {
  const tabs = document.querySelectorAll('.spotlight-tab');
  const spotlightBody = document.getElementById('hero-spotlight-body');
  if (!tabs.length || !spotlightBody) return;

  const SPOTLIGHTS = {
    'storeflow': {
      title: 'Storeflow Multi-Tenant Retail POS',
      category: 'Cloud SaaS • Live Deployment',
      url: 'https://storeflow-mu-eight.vercel.app/',
      image: 'storeflow_preview.png',
      badge: '● Active POS in Nigeria',
      metrics: [
        { label: 'Nigerian VAT', value: '7.5% Auto' },
        { label: 'Query Latency', value: '< 0.4s' },
        { label: 'Till Shifts', value: 'Z-Reports' }
      ],
      desc: 'Real-time retail operating system with cashier PIN verification, till shifts, and 80mm thermal receipts.'
    },
    'picnic': {
      title: 'UNN Freshers Colour Picnic 2026',
      category: 'Campus Event Portal • Live Platform',
      url: 'https://freshers-experience26.vercel.app/',
      image: 'colour_picnic.jpg',
      badge: '● CEDR Field Event',
      metrics: [
        { label: 'Faculty Teams', value: '6 Colors' },
        { label: 'Ticket Pass', value: 'Canvas Stub' },
        { label: 'Onboarding', value: 'WhatsApp' }
      ],
      desc: 'High-throughput freshman orientation ticketing portal with faculty color teams and instant digital passes.'
    },
    'ncf': {
      title: 'NCF Leadership Admin Intelligence',
      category: 'Enterprise Database • Supabase',
      url: 'https://ncfunn.vercel.app',
      image: 'ncf_admin.png',
      badge: '● Live Executive Hub',
      metrics: [
        { label: 'Sync Engine', value: 'Supabase RLS' },
        { label: 'Visuals', value: 'Chart.js' },
        { label: 'Attendance', value: 'Real-Time' }
      ],
      desc: 'Centralized organizational management environment with live analytics and automated reporting.'
    }
  };

  const renderSpotlight = (key) => {
    const item = SPOTLIGHTS[key] || SPOTLIGHTS['storeflow'];
    spotlightBody.innerHTML = `
      <div class="spotlight-content-grid">
        <div class="spotlight-preview-img-wrap">
          <img src="${item.image}" alt="${item.title}" class="spotlight-preview-img">
          <span class="spotlight-status-pill">${item.badge}</span>
        </div>
        <div class="spotlight-details">
          <span class="spotlight-cat">${item.category}</span>
          <h4 class="spotlight-title">${item.title}</h4>
          <p class="spotlight-desc">${item.desc}</p>
          <div class="spotlight-metrics-row">
            ${item.metrics.map(m => `
              <div class="spotlight-metric">
                <span class="spotlight-metric-val">${m.value}</span>
                <span class="spotlight-metric-lbl">${m.label}</span>
              </div>
            `).join('')}
          </div>
          <div class="spotlight-action">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
              <span>Launch Live System</span>
              <i class="ti ti-arrow-up-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-spotlight');
      renderSpotlight(key);
    });
  });

  // Render initial
  renderSpotlight('storeflow');
}

/* --- Inquiry Form Handling --- */
function initContactForm() {
  const form = document.getElementById('inquiry-form');
  const submitBtn = document.getElementById('submit-btn');
  const toastWrapper = document.getElementById('toast-wrapper');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // UI Loading state
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <i class="ti ti-loader-2" style="animation: spin 1s linear infinite;"></i>
      <span>Encrypting & Sending...</span>
    `;

    const formData = new FormData(form);

    // Send email using FormSubmit AJAX endpoint
    fetch('https://formsubmit.co/ajax/contact@anteenyhub.site', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(response => {
        if (response.ok) {
          submitBtn.innerHTML = `
          <i class="ti ti-check"></i>
          <span>Submitted!</span>
        `;
          showToast('Project inquiry submitted! We will email you back within 12 hours.', 'success');
          form.reset();
        } else {
          throw new Error('Form submission failed');
        }
      })
      .catch(error => {
        console.error('Error submitting form:', error);
        submitBtn.innerHTML = `
        <i class="ti ti-x"></i>
        <span>Failed to Send</span>
      `;
        showToast('Oops! Something went wrong. Please email us directly or try again.', 'error');
      })
      .finally(() => {
        // Reset button after success/failure visual
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalContent;
        }, 3000);
      });
  });

  // Dynamic spinner keyframe helper injection
  if (!document.getElementById('spin-keyframe-style')) {
    const style = document.createElement('style');
    style.id = 'spin-keyframe-style';
    style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    const isError = type === 'error';
    const iconClass = isError ? 'ti ti-circle-x-filled text-pink' : 'ti ti-circle-check-filled text-green';

    toast.innerHTML = `
      <i class="${iconClass} toast-icon"></i>
      <span>${message}</span>
    `;

    if (isError) {
      toast.style.borderColor = 'rgba(236, 72, 153, 0.35)';
      toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(236, 72, 153, 0.1)';
    }

    toastWrapper.appendChild(toast);

    // Fade-in trigger
    setTimeout(() => toast.classList.add('show'), 50);

    // Clear after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

/* --- Pricing Tier Connector --- */
function initPricingConnector() {
  const pricingButtons = document.querySelectorAll('.pricing-action a');
  const selectDropdown = document.getElementById('interest');

  pricingButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const packageType = btn.getAttribute('data-package');
      if (!packageType || !selectDropdown) return;

      // Match dropdown values
      if (packageType === 'Launch Pad') {
        selectDropdown.value = 'launch-pad';
      } else if (packageType === 'Application Engine') {
        selectDropdown.value = 'application-engine';
      } else if (packageType === 'Enterprise Scale') {
        selectDropdown.value = 'enterprise-scale';
      }
    });
  });
}

/* --- Scroll Spy for Navbar Navigation highlight --- */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}
