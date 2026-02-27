/* ═══════════════════════════════════════════════════════════
   Portfolio Enhancer — Performance, Accessibility & UX
   ═══════════════════════════════════════════════════════════ */

class PortfolioEnhancer {
  constructor() {
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupAccessibility();
    this.setupPerformance();
    this.setupParallaxHero();
  }

  /* ── Lazy Loading Images ── */
  setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    if (!images.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.addEventListener('load', () => img.classList.add('loaded'));
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    images.forEach(img => observer.observe(img));
  }

  /* ── Accessibility ── */
  setupAccessibility() {
    // Skip-to-content link
    const skip = document.createElement('a');
    skip.href = '#about';
    skip.className = 'skip-link';
    skip.textContent = 'Skip to main content';
    skip.style.cssText = 'position:fixed;top:-100%;left:1rem;padding:.75rem 1.5rem;background:var(--accent);color:#fff;border-radius:var(--radius-sm);z-index:10002;font-weight:600;transition:top .3s';
    skip.addEventListener('focus', () => { skip.style.top = '1rem'; });
    skip.addEventListener('blur', () => { skip.style.top = '-100%'; });
    document.body.prepend(skip);

    // Keyboard nav: Escape closes mobile menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const toggle = document.querySelector('.nav-toggle');
        const menu = document.querySelector('.nav-menu');
        if (toggle?.classList.contains('active')) {
          toggle.classList.remove('active');
          menu?.classList.remove('active');
        }
      }
    });

    // Ensure ARIA states on toggle
    const toggle = document.querySelector('.nav-toggle');
    if (toggle) {
      toggle.setAttribute('aria-label', 'Toggle navigation');
      toggle.setAttribute('aria-expanded', 'false');

      const observer = new MutationObserver(() => {
        toggle.setAttribute('aria-expanded', toggle.classList.contains('active') ? 'true' : 'false');
      });
      observer.observe(toggle, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ── Performance ── */
  setupPerformance() {
    // Debounced resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      document.body.classList.add('resize-animation-stopper');
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.body.classList.remove('resize-animation-stopper');
      }, 400);
    });

    // Preload critical font weights
    const preload = (href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      document.head.appendChild(link);
    };
    // Fonts are already loaded via <link> but we ensure early fetch
    preload('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');

    // Add animation stopper style
    if (!document.getElementById('resize-stopper')) {
      const style = document.createElement('style');
      style.id = 'resize-stopper';
      style.textContent = `.resize-animation-stopper *{animation:none!important;transition:none!important}`;
      document.head.appendChild(style);
    }
  }

  /* ── Subtle Hero Parallax ── */
  setupParallaxHero() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const content = hero.querySelector('.hero-container');
    if (!content) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY < window.innerHeight) {
        const opacity = 1 - scrollY / (window.innerHeight * 0.8);
        const translate = scrollY * 0.25;
        content.style.opacity = Math.max(0, opacity);
        content.style.transform = `translateY(${translate}px)`;
      }
    }, { passive: true });
  }
}

// ── Initialise ──
document.addEventListener('DOMContentLoaded', () => {
  new PortfolioEnhancer();
});
