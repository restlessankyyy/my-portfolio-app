// Enhanced Portfolio JavaScript - 2026 Edition
// Performance optimized with modern ES6+ features

class PortfolioEnhancer {
  constructor() {
    this.init();
  }

  init() {
    this.setupScrollAnimations();
    this.setupNavigation();
    this.setupIntersectionObserver();
    this.setupPerformanceOptimizations();
    this.setupAccessibility();
  }

  // Smooth scroll animations
  setupScrollAnimations() {
    // Create intersection observer for scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-on-scroll");
          // Add a small delay to trigger the animation
          setTimeout(() => {
            entry.target.classList.add("animated");
          }, 100);
          // Unobserve after animation to improve performance
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe sections and key elements (excluding skill-category to prevent conflicts)
    const animateElements = document.querySelectorAll(
      ".project-card, .timeline-item, .about-highlights",
    );
    animateElements.forEach((el) => observer.observe(el));
  }

  // Enhanced navigation with active state
  setupNavigation() {
    const navbar = document.getElementById("navbar");
    const navLinks = document.querySelectorAll(".nav-link");

    // Navbar scroll effect
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 50) {
          navbar.classList.add("scrolled");
        } else {
          navbar.classList.remove("scrolled");
        }
      },
      { passive: true },
    );

    // Active section highlighting
    const sections = document.querySelectorAll("section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((link) => link.classList.remove("active"));
            const activeLink = document.querySelector(`a[href="#${id}"]`);
            if (activeLink) activeLink.classList.add("active");
          }
        });
      },
      { threshold: 0.3 },
    );

    sections.forEach((section) => observer.observe(section));
  }

  // Intersection observer for performance
  setupIntersectionObserver() {
    // Lazy load images
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            imageObserver.unobserve(img);
          }
        }
      });
    });

    const lazyImages = document.querySelectorAll("img[data-src]");
    lazyImages.forEach((img) => imageObserver.observe(img));
  }

  // Performance optimizations
  setupPerformanceOptimizations() {
    // Debounced resize handler
    let resizeTimeout;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          this.handleResize();
        }, 250);
      },
      { passive: true },
    );

    // Preload critical resources
    this.preloadResources();
  }

  preloadResources() {
    const criticalImages = ["./img/ankit.jpg", "./img/ankit.webp"];

    criticalImages.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
    });
  }

  handleResize() {
    // Optimize for mobile
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle("mobile", isMobile);
  }

  // Accessibility enhancements
  setupAccessibility() {
    // Focus management
    this.setupFocusManagement();

    // Keyboard navigation
    this.setupKeyboardNavigation();

    // ARIA updates
    this.updateAriaStates();
  }

  setupFocusManagement() {
    // Skip to main content
    const skipLink = document.createElement("a");
    skipLink.href = "#main";
    skipLink.textContent = "Skip to main content";
    skipLink.className = "skip-link";
    skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 9999;
            transition: top 0.3s;
        `;

    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px";
    });

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px";
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  setupKeyboardNavigation() {
    // Keyboard navigation for nav toggle
    const navToggle = document.getElementById("nav-toggle");
    if (navToggle) {
      navToggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navToggle.click();
        }
      });
    }

    // Escape key to close mobile menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const navMenu = document.getElementById("nav-menu");
        if (navMenu && navMenu.classList.contains("active")) {
          navToggle.click();
        }
      }
    });
  }

  updateAriaStates() {
    // Update ARIA expanded states for mobile nav
    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");

    if (navToggle && navMenu) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-controls", "nav-menu");

      navToggle.addEventListener("click", () => {
        const isExpanded = navMenu.classList.contains("active");
        navToggle.setAttribute("aria-expanded", isExpanded.toString());
      });
    }
  }
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new PortfolioEnhancer());
} else {
  new PortfolioEnhancer();
}

// Service Worker for PWA capabilities (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("SW registered"))
      .catch(() => console.log("SW registration failed"));
  });
}
