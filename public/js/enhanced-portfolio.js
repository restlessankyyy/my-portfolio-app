/* ═══════════════════════════════════════════════════════════
   Enhanced Portfolio — Performance, A11y & 2026 Interactions
   ═══════════════════════════════════════════════════════════ */

class PortfolioEnhancer {
  constructor() {
    this.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.isTouchDevice = matchMedia("(hover: none)").matches;
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupAccessibility();
    this.setupPerformance();
    this.setupParallaxHero();
    this.setupMagneticButtons();
    this.setupCardTilt();
    this.setupStaggeredReveals();
    this.setupCursorContext();
    this.setupSectionFadeOnScroll();
  }

  /* ── Lazy Loading Images ── */
  setupLazyLoading() {
    const images = document.querySelectorAll("img[data-src]");
    if (!images.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            img.addEventListener("load", () => img.classList.add("loaded"));
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "200px" },
    );

    images.forEach((img) => observer.observe(img));
  }

  /* ── Accessibility ── */
  setupAccessibility() {
    // Skip-to-content link
    const skip = document.createElement("a");
    skip.href = "#about";
    skip.className = "skip-link";
    skip.textContent = "Skip to main content";
    skip.style.cssText =
      "position:fixed;top:-100%;left:1rem;padding:.75rem 1.5rem;background:var(--accent);color:#fff;border-radius:var(--radius-sm);z-index:10002;font-weight:600;transition:top .3s";
    skip.addEventListener("focus", () => {
      skip.style.top = "1rem";
    });
    skip.addEventListener("blur", () => {
      skip.style.top = "-100%";
    });
    document.body.prepend(skip);

    // Keyboard nav: Escape closes mobile menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const toggle = document.querySelector(".nav-toggle");
        const menu = document.querySelector(".nav-menu");
        if (toggle?.classList.contains("active")) {
          toggle.classList.remove("active");
          menu?.classList.remove("active");
        }
      }
    });

    // Ensure ARIA states on toggle
    const toggle = document.querySelector(".nav-toggle");
    if (toggle) {
      toggle.setAttribute("aria-label", "Toggle navigation");
      toggle.setAttribute("aria-expanded", "false");

      const observer = new MutationObserver(() => {
        toggle.setAttribute(
          "aria-expanded",
          toggle.classList.contains("active") ? "true" : "false",
        );
      });
      observer.observe(toggle, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  }

  /* ── Performance ── */
  setupPerformance() {
    // Debounced resize handler
    let resizeTimer;
    window.addEventListener("resize", () => {
      document.body.classList.add("resize-animation-stopper");
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.body.classList.remove("resize-animation-stopper");
      }, 400);
    });

    // Preload critical font weights
    const preload = (href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "style";
      link.href = href;
      document.head.appendChild(link);
    };
    // Fonts are already loaded via <link> but we ensure early fetch
    preload(
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
    );

    // Add animation stopper style
    if (!document.getElementById("resize-stopper")) {
      const style = document.createElement("style");
      style.id = "resize-stopper";
      style.textContent = `.resize-animation-stopper *{animation:none!important;transition:none!important}`;
      document.head.appendChild(style);
    }
  }

  /* ── Subtle Hero Parallax ── */
  setupParallaxHero() {
    const hero = document.querySelector(".hero");
    if (!hero) return;

    const content = hero.querySelector(".hero-container");
    if (!content) return;

    window.addEventListener(
      "scroll",
      () => {
        const scrollY = window.scrollY;
        if (scrollY < window.innerHeight) {
          const opacity = 1 - scrollY / (window.innerHeight * 0.8);
          const translate = scrollY * 0.25;
          content.style.opacity = Math.max(0, opacity);
          content.style.transform = `translateY(${translate}px)`;
        }
      },
      { passive: true },
    );
  }

  /* ── Magnetic Buttons — elements subtly attract toward cursor ── */
  setupMagneticButtons() {
    if (this.prefersReducedMotion || this.isTouchDevice) return;

    const magneticEls = document.querySelectorAll(
      ".btn-primary, .btn-outline, .social-link, .filter-btn, .theme-toggle",
    );

    magneticEls.forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        el.style.transition = "transform 0.2s var(--ease-out)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
        el.style.transition = "transform 0.4s var(--ease-out)";
      });
    });
  }

  /* ── 3D Card Tilt — perspective tilt on project & pub cards ── */
  setupCardTilt() {
    if (this.prefersReducedMotion || this.isTouchDevice) return;

    const cards = document.querySelectorAll(".project-card, .pub-card");

    cards.forEach((card) => {
      card.style.transformStyle = "preserve-3d";

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rotateX = y * -8; // max 8 degrees
        const rotateY = x * 8;
        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        card.style.transition = "transform 0.1s ease-out";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform =
          "perspective(600px) rotateX(0) rotateY(0) scale(1)";
        card.style.transition = "transform 0.5s var(--ease-out)";
      });
    });
  }

  /* ── Staggered Reveals — cascading entrance for grid children ── */
  setupStaggeredReveals() {
    if (this.prefersReducedMotion) return;

    const grids = document.querySelectorAll(
      ".projects-grid, .skills-grid, .pubs-grid",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const children = entry.target.children;
            Array.from(children).forEach((child, i) => {
              child.style.opacity = "0";
              child.style.transform = "translateY(24px) scale(0.97)";
              requestAnimationFrame(() => {
                child.style.transition = `opacity 0.5s var(--ease-out) ${i * 0.07}s, transform 0.5s var(--ease-out) ${i * 0.07}s`;
                child.style.opacity = "1";
                child.style.transform = "translateY(0) scale(1)";
              });
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    grids.forEach((grid) => observer.observe(grid));
  }

  /* ── Cursor Context — different cursor states for element types ── */
  setupCursorContext() {
    if (this.isTouchDevice) return;

    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    // Inject cursor context styles
    if (!document.getElementById("cursor-context-styles")) {
      const style = document.createElement("style");
      style.id = "cursor-context-styles";
      style.textContent = `
        body.cursor-text .cursor-dot{width:2px;height:20px;border-radius:1px;background:var(--text)}
        body.cursor-text .cursor-ring{opacity:0}
        body.cursor-expand .cursor-dot{width:50px;height:50px;background:rgba(168,85,247,.12);mix-blend-mode:difference}
        body.cursor-expand .cursor-ring{width:50px;height:50px;border-color:transparent}
      `;
      document.head.appendChild(style);
    }

    // Text-cursor over paragraphs & headings
    document
      .querySelectorAll("p, .section-desc, .tl-desc-text")
      .forEach((el) => {
        el.addEventListener("mouseenter", () => {
          document.body.classList.remove("cursor-hover", "cursor-expand");
          document.body.classList.add("cursor-text");
        });
        el.addEventListener("mouseleave", () => {
          document.body.classList.remove("cursor-text");
        });
      });

    // Expand-cursor over images and card images
    document
      .querySelectorAll(".card-img, .hero-container img")
      .forEach((el) => {
        el.addEventListener("mouseenter", () => {
          document.body.classList.remove("cursor-hover", "cursor-text");
          document.body.classList.add("cursor-expand");
        });
        el.addEventListener("mouseleave", () => {
          document.body.classList.remove("cursor-expand");
        });
      });
  }

  /* ── Section Fade on Scroll — subtle opacity+translate per section ── */
  setupSectionFadeOnScroll() {
    if (this.prefersReducedMotion) return;

    const sections = document.querySelectorAll(".section, .section-alt");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -60px 0px" },
    );

    sections.forEach((sec) => {
      sec.style.opacity = "0";
      sec.style.transform = "translateY(32px)";
      sec.style.transition =
        "opacity 0.7s var(--ease-out), transform 0.7s var(--ease-out)";
      observer.observe(sec);
    });

    // Ensure hero is always visible
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.style.opacity = "1";
      hero.style.transform = "none";
    }
  }
}

// ── Initialise ──
document.addEventListener("DOMContentLoaded", () => {
  new PortfolioEnhancer();
});
