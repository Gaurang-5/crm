/**
 * Apple Design & Fluid Interfaces Implementation
 * Lifestyle Mantra Landing Page
 *
 * Core Principles Implemented:
 * 1. Response (0-ms pointer-down feedback)
 * 2. Direct Manipulation (1:1 tracking with Pointer Events & setPointerCapture)
 * 3. Interruptibility & Velocity Handoff (Continuous physics spring solver)
 * 4. Spring Physics (Damping ratio & Response parameters)
 * 5. Momentum Projection (Apple project() exponential decay formula)
 * 6. Rubber-Banding (Apple rubberband() boundary resistance formula)
 * 7. Spatial Consistency (Origin-anchored transitions)
 * 8. Frame-level Smoothness (requestAnimationFrame & compositor properties)
 * 9. Reduced Motion & Accessibility (Media query fallbacks)
 */

// --- 1. Global Setup & Cursor Glow ---
const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('pointermove', (e) => {
  root.style.setProperty('--x', e.clientX + 'px');
  root.style.setProperty('--y', e.clientY + 'px');
});

// --- 2. Apple Physics & Spring Engine (§3, §4, §5, §6, §9) ---

/**
 * Apple's exact momentum projection formula (from WWDC Designing Fluid Interfaces)
 * @param {number} velocity - Current velocity in units/second
 * @param {number} decelerationRate - Deceleration constant (default 0.998 for scroll feel)
 * @returns {number} Projected distance in units
 */
function project(velocity, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

/**
 * Apple's exact rubber-banding formula for boundary resistance
 * @param {number} overshoot - Raw distance past boundary
 * @param {number} dimension - Screen or element dimension
 * @param {number} constant - Resistance constant (default 0.55)
 * @returns {number} Rubber-banded offset
 */
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Analytical Spring Animator supporting live target re-targeting (interruptibility)
 * and initial velocity handoff without position/velocity jumps.
 */
class SpringAnimation {
  constructor(options = {}) {
    this.current = options.from || 0;
    this.target = options.to || 0;
    this.velocity = options.velocity || 0;
    this.damping = options.damping ?? 1.0; // 1.0 = critically damped, 0.8 = slight bounce
    this.response = options.response ?? 0.35; // response time in seconds
    this.onUpdate = options.onUpdate || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.rafId = null;
    this.startTime = null;
    this.startPos = this.current;
    this.startVel = this.velocity;
  }

  setTarget(newTarget, newVelocity = null) {
    // Read live presentation state for continuous interruptibility (§3)
    this.startPos = this.current;
    this.target = newTarget;
    if (newVelocity !== null) {
      this.startVel = newVelocity;
    } else {
      this.startVel = this.velocity;
    }
    this.startTime = performance.now();
    if (!this.rafId) {
      this.start();
    }
  }

  start() {
    this.startTime = performance.now();
    const tick = (now) => {
      if (prefersReducedMotion) {
        this.current = this.target;
        this.velocity = 0;
        this.onUpdate(this.current);
        this.onComplete();
        this.rafId = null;
        return;
      }

      const t = (now - this.startTime) / 1000; // time in seconds
      const omega0 = (2 * Math.PI) / this.response;
      const x0 = this.startPos - this.target;
      const v0 = this.startVel;

      let x, v;
      if (Math.abs(this.damping - 1.0) < 1e-4) {
        // Critically damped spring (ζ = 1.0)
        const A = x0;
        const B = v0 + omega0 * A;
        const expTerm = Math.exp(-omega0 * t);
        x = (A + B * t) * expTerm;
        v = (B - omega0 * (A + B * t)) * expTerm;
      } else if (this.damping < 1.0) {
        // Under-damped spring (ζ < 1.0, slight bounce)
        const zeta = this.damping;
        const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
        const A = x0;
        const B = (v0 + zeta * omega0 * A) / omegaD;
        const expTerm = Math.exp(-zeta * omega0 * t);
        const cosTerm = Math.cos(omegaD * t);
        const sinTerm = Math.sin(omegaD * t);
        x = expTerm * (A * cosTerm + B * sinTerm);
        v = expTerm * ((B * omegaD - A * zeta * omega0) * cosTerm - (A * omegaD + B * zeta * omega0) * sinTerm);
      } else {
        // Over-damped fallback
        x = x0 * Math.exp(-omega0 * t);
        v = -omega0 * x;
      }

      this.current = this.target + x;
      this.velocity = v;

      this.onUpdate(this.current);

      // Check settling condition
      if (t > 0.05 && Math.abs(x) < 0.05 && Math.abs(v) < 0.5) {
        this.current = this.target;
        this.velocity = 0;
        this.onUpdate(this.current);
        this.onComplete();
        this.rafId = null;
      } else {
        this.rafId = requestAnimationFrame(tick);
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// --- 3. Instant 0-ms Latency Press Feedback (§1) ---
document.body.addEventListener('pointerdown', (e) => {
  const target = e.target.closest('.button, .glass-cta, .nav-pill a, .nav-avatar, .mobile-menu-button, .step, input, select');
  if (target) {
    target.style.transform = 'scale(0.96)';
    target.style.transition = 'transform 80ms cubic-bezier(0, 0, 0.2, 1)';
  }
}, { passive: true });

document.body.addEventListener('pointerup', (e) => {
  const target = e.target.closest('.button, .glass-cta, .nav-pill a, .nav-avatar, .mobile-menu-button, .step');
  if (target) {
    target.style.transform = '';
    target.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
  }
}, { passive: true });

document.body.addEventListener('pointercancel', (e) => {
  const target = e.target.closest('.button, .glass-cta, .nav-pill a, .nav-avatar, .mobile-menu-button, .step');
  if (target) {
    target.style.transform = '';
    target.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
  }
}, { passive: true });

// --- 4. Mobile Menu Sheet (Origin-Anchored & Swipeable §7 & §10) ---
const menuButton = document.querySelector('.mobile-menu-button');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');

const closeMenu = () => {
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
  mobileMenu?.setAttribute('aria-hidden', 'true');
};

menuButton?.addEventListener('click', (e) => {
  // Spatial consistency: anchor transform origin to trigger button (§7)
  const rect = menuButton.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  if (mobileMenu) {
    mobileMenu.style.transformOrigin = `${originX}px ${originY}px`;
  }

  const isOpen = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  mobileMenu?.setAttribute('aria-hidden', String(!isOpen));
});

mobileMenuLinks.forEach(link => link.addEventListener('click', closeMenu));

// --- 5. Interactive 1:1 Split Handle Component (§2, §3, §5, §6, §9) ---

function initSplitSlider(container, beforeMarkup, afterMarkup) {
  container.classList.add('split-slider');
  container.innerHTML = `
    <div class="split-layer before">${beforeMarkup}</div>
    <div class="split-layer after">${afterMarkup}</div>
    <div class="split-label before">BEFORE</div>
    <div class="split-label after">AFTER</div>
    <div class="split-handle" role="slider" aria-label="Compare transformation" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" tabindex="0">
      <div class="split-line"></div>
      <div class="split-knob">
        <svg viewBox="0 0 24 24"><path d="M8.5 6L2.5 12L8.5 18M15.5 6L21.5 12L15.5 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
      </div>
    </div>
  `;

  let currentPct = 50;
  let isDragging = false;
  let history = [];
  const handle = container.querySelector('.split-handle');

  const setSplitPosition = (pct) => {
    currentPct = Math.max(0, Math.min(100, pct));
    container.style.setProperty('--split-pos', `${currentPct}%`);
    handle.setAttribute('aria-valuenow', Math.round(currentPct));
  };

  setSplitPosition(50);

  // Spring animation for smooth settling and velocity handoff
  const spring = new SpringAnimation({
    from: 50,
    to: 50,
    damping: 0.82, // slight bounce on flick (§4)
    response: 0.35,
    onUpdate: (val) => setSplitPosition(val)
  });

  const onPointerDown = (e) => {
    isDragging = true;
    spring.stop();
    handle.setPointerCapture(e.pointerId); // 1:1 direct tracking (§2)
    history = [{ pos: e.clientX, time: performance.now() }];
    handle.classList.add('active');
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    let rawPct = ((e.clientX - rect.left) / rect.width) * 100;

    // Apply Rubber-Banding if overshoot past 0% or 100% bounds (§9)
    if (rawPct < 0) {
      const overshoot = -rawPct;
      rawPct = -rubberband(overshoot, 100, 0.55);
    } else if (rawPct > 100) {
      const overshoot = rawPct - 100;
      rawPct = 100 + rubberband(overshoot, 100, 0.55);
    }

    setSplitPosition(rawPct);

    // Maintain velocity history (last 5 events)
    const now = performance.now();
    history.push({ pos: rawPct, time: now });
    if (history.length > 5) history.shift();
  };

  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    handle.classList.remove('active');

    // Calculate release velocity (% per second) (§5)
    let releaseVelocity = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = (last.time - first.time) / 1000;
      if (dt > 0.005) {
        releaseVelocity = (last.pos - first.pos) / dt;
      }
    }

    // Momentum projection to choose nearest snap target (§6)
    const projectedEndpoint = currentPct + project(releaseVelocity, 0.998);
    let target = 50;
    if (projectedEndpoint < 25) target = 0;
    else if (projectedEndpoint > 75) target = 100;

    // Hand off release velocity into spring animation (§5)
    spring.startPos = currentPct;
    spring.velocity = releaseVelocity;
    spring.setTarget(target, releaseVelocity);
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);

  // Keyboard navigation for accessibility
  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      spring.setTarget(Math.max(0, currentPct - 10));
    } else if (e.key === 'ArrowRight') {
      spring.setTarget(Math.min(100, currentPct + 10));
    }
  });
}

// --- 6. Render Client Results Grid ---
const clientResults = [
  { name: 'Client 01', focus: 'Weight Management', duration: 'Personal lifestyle journey', quote: 'A personal transformation built through consistent everyday habits.', beforeImage: '/marketing/assets/testimonials/customer-01-before.jpeg', afterImage: '/marketing/assets/testimonials/customer-01-after.jpeg' },
  { name: 'Client 02', focus: 'Weight Management', duration: 'Personal lifestyle journey', quote: 'Steady routines and personal support can make meaningful change feel possible.', beforeImage: '/marketing/assets/testimonials/customer-02-before.jpeg', afterImage: '/marketing/assets/testimonials/customer-02-after.jpeg', beforeClass: 'subject-zoom' },
  { name: 'Client 03', focus: 'Wellness Journey', duration: 'Personal lifestyle journey', quote: 'Every transformation follows its own pace, needs, and everyday rhythm.', beforeImage: '/marketing/assets/testimonials/customer-03-before.jpeg', afterImage: '/marketing/assets/testimonials/customer-03-after.jpeg' },
  { name: 'Client 04', focus: 'Weight Management', duration: 'Personal lifestyle journey', quote: 'Sustainable progress can begin at any age with a routine built around the individual.', beforeImage: '/marketing/assets/testimonials/customer-04-before.jpeg', afterImage: '/marketing/assets/testimonials/customer-04-after.jpeg', beforeClass: 'fit-contain' }
];

const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
const customerPhoto = (image, label, className = '') => image ? `<img${className ? ` class="${escapeHTML(className)}"` : ''} src="${escapeHTML(image)}" alt="${escapeHTML(label)}" loading="lazy" decoding="async" />` : `<span class="photo-placeholder">${escapeHTML(label)}</span>`;

const resultsGrid = document.querySelector('.client-results-grid');
if (resultsGrid) {
  resultsGrid.innerHTML = clientResults.map((item, index) => `
    <article class="result-card reveal" style="--card-index:${index}">
      <div class="result-meta">
        <span>${escapeHTML(item.duration)}</span>
        <strong>${escapeHTML(item.focus)}</strong>
      </div>
      <div class="result-photos" data-result-index="${index}">
        <div class="photo-card before">
          <span class="photo-badge">BEFORE</span>
          ${customerPhoto(item.beforeImage, `${item.name} before`, item.beforeClass)}
        </div>
        <div class="photo-card after">
          <span class="photo-badge">AFTER</span>
          ${customerPhoto(item.afterImage, `${item.name} after`)}
        </div>
      </div>
      <blockquote>${escapeHTML(item.quote)}</blockquote>
      <footer>
        ${escapeHTML(item.name)}
        <span>Individual results vary</span>
      </footer>
    </article>
  `).join('');
}

// --- 7. Intersection Observer & Card Stacking Physics ---
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

const updateResultStack = () => {
  const cards = document.querySelectorAll('.result-card');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const travel = Math.max(innerHeight * 0.65, 1);
    const progress = Math.min(Math.max((innerHeight * 0.15 - rect.top) / travel, 0), 1);
    card.style.setProperty('--stack-progress', progress.toFixed(3));
  });
};

addEventListener('scroll', updateResultStack, { passive: true });
addEventListener('resize', updateResultStack);
updateResultStack();

// --- 9. Scroll Navigation Blur & Vibrancy Shimmer ---
const nav = document.querySelector('.glass-nav');
if (nav) {
  addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.background = 'rgba(255, 255, 255, 0.88)';
      nav.style.borderBottomColor = 'rgba(0, 0, 0, 0.12)';
      nav.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.06)';
    } else {
      nav.style.background = 'rgba(255, 255, 255, 0.75)';
      nav.style.borderBottomColor = 'rgba(0, 0, 0, 0.06)';
      nav.style.boxShadow = 'none';
    }
  }, { passive: true });
}

// --- 10. Form Handling ---
const leadForm = document.querySelector('.lead-form');
if (leadForm) {
  let submissionId = crypto.randomUUID();
  leadForm.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const note = form.querySelector('.form-success');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const payload = Object.fromEntries(new FormData(form));
    const message = `New Lifestyle Mantra consultation request\n\nName: ${payload.name}\nPhone / WhatsApp: ${payload.phone}\nCity: ${payload.city}\nPrimary wellness goal: ${payload.goal}`;
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    button.disabled = true;
    if (note) note.textContent = 'Saving your consultation request…';
    try {
      const response = await fetch('/api/public/lead', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId,name:payload.name,phone:payload.phone,city:payload.city,interest:payload.goal})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Unable to save. Please try again.');
      submissionId = crypto.randomUUID();
      if (note) note.textContent = 'Request saved. Opening WhatsApp…';
      form.reset();
      window.location.assign(`https://wa.me/919897258859?text=${encodeURIComponent(message)}`);
    } catch (error) { if (note) note.textContent = error.message || 'Please check your connection and try again.'; }
    finally { button.disabled = false; }
  });
}
