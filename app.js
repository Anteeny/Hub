/* ==========================================================================
   AnteenyHub Interactive Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPortfolioModal();
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

/* --- Portfolio Projects Database & Modal Logic --- */
const PROJECTS_DATA = {
  'mirror-academy': {
    title: 'The Mirror School Academy',
    badge: 'Ongoing',
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
    description: 'A premium, responsive online learning platform built to provide structured educational experiences. The app integrates semantic layouts, responsive grid card collections, custom navigation, and typography controls designed for modern digital schooling.',
    features: [
      'Subject Explorer & Sidebar Filters',
      'Dynamic responsive courses card grid',
      'Custom typography API styling',
      'Fully customizable partner carousel'
    ],
    tech: ['React.js', 'Vite', 'Vanilla CSS', 'GitHub Pages'],
    liveUrl: '../FutureLearnClone/index.html'
  },
  'accountability': {
    title: 'NCF Accountability System',
    badge: 'Completed',
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
    description: 'A multi-step accountability and data reporting form engineered for membership evaluation. This client portal features clean stage-by-stage stepper logic, rich user guides, validation states, local storage data recovery, and file uploading mocks.',
    features: [
      'Step-by-step progress tracking indicator',
      'Self-saving forms using Web LocalStorage',
      'Custom client upload dialog box',
      'Optimized lightweight asset management'
    ],
    tech: ['HTML5', 'Vanilla CSS', 'JavaScript ES6', 'Local Storage'],
    liveUrl: '../index.html'
  },
  'admin-portal': {
    title: 'NCF Admin Portal & Dashboard',
    badge: 'Completed',
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
    description: 'A comprehensive, enterprise-level administrative dashboard built to manage membership databases, stats trackers, and activity metrics. Employs modern grid architecture, dynamic sidebars, and real-time database visualization syncing.',
    features: [
      'Chart.js real-time analytics graphs',
      'Dynamic sidebar navigation collapsers',
      'Advanced client-side search & filters',
      'Supabase database authentication integration'
    ],
    tech: ['JavaScript ES6+', 'Chart.js API', 'Supabase Syncing', 'Glassmorphism'],
    liveUrl: 'https://ncfunn.vercel.app'
  },
  'quote-generator': {
    title: 'Minimalist Quote Image Generator',
    badge: 'Completed',
    badgeColor: 'var(--accent-pink)',
    miniClass: 'quote-mini',
    miniContent: `
      <div class="mini-card-canvas">
        <div class="mini-quote-quotes" style="font-family:serif; font-size:1.5rem; color:var(--accent-pink)">“</div>
        <div class="mini-text-line md center" style="margin: 0 auto 4px auto;"></div>
        <div class="mini-text-line sm center" style="margin: 0 auto;"></div>
      </div>
      <div class="mini-controls" style="display:flex; gap:6px;">
        <div class="mini-knob"></div><div class="mini-knob"></div><div class="mini-knob"></div>
      </div>
    `,
    description: 'An interactive canvas rendering utility that enables users to design customized graphic quote cards. The tool dynamically downloads configuration sets, applies live font assets, integrates glowing background blob controls, and renders high-definition PNG cards.',
    features: [
      'html2canvas client graphic generation',
      'Direct Google Fonts API selector',
      'Live gradient & filters canvas builder',
      'One-click high-res image download'
    ],
    tech: ['Canvas API', 'html2canvas', 'Google Fonts API', 'CSS Variables'],
    liveUrl: '../Quote/index.html'
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
        <span class="modal-project-badge" style="background: ${data.badgeColor}22; color: ${data.badgeColor}; border: 1px solid ${data.badgeColor}33">${data.badge}</span>
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
        <div style="display:flex; gap:10px;">
          ${data.liveUrl ? `<a href="${data.liveUrl}" target="_blank" class="btn btn-sm btn-secondary">View Live <i class="ti ti-external-link"></i></a>` : ''}
          <a href="#contact" class="btn btn-sm btn-primary modal-cta-btn">Inquire Project</a>
        </div>
      </div>
    `;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Hook modal cta click to close modal and scroll
    const modalCta = modalBody.querySelector('.modal-cta-btn');
    modalCta.addEventListener('click', () => {
      closeModal();
    });
  };

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  cards.forEach(card => {
    const info = card.querySelector('.portfolio-info');
    info.addEventListener('click', () => {
      const projectId = card.getAttribute('data-project');
      openModal(projectId);
    });
  });

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);

  // Esc key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
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

    // Simulated API response delay
    setTimeout(() => {
      submitBtn.innerHTML = `
        <i class="ti ti-check"></i>
        <span>Submitted!</span>
      `;
      
      // Toast notice
      showToast('Project inquiry submitted! We will email you back within 12 hours.', 'success');

      // Reset form
      form.reset();

      // Reset button after success visual
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
      }, 3000);
      
    }, 1800);
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
    toast.innerHTML = `
      <i class="ti ti-circle-check-filled text-green toast-icon"></i>
      <span>${message}</span>
    `;

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
