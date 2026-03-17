/* ═══════════════════════════════════════════════════════════
   Modern Portfolio — Main Interactions & Animations
   ═══════════════════════════════════════════════════════════ */

class ModernPortfolio {
  constructor() {
    this.init();
  }

  init() {
    this.setupCustomCursor();
    this.setupScrollProgress();
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupTypingEffect();
    this.setupRevealAnimations();
    this.setupCounterAnimation();
    this.setupTimelineAnimation();
    this.setupProjectFilters();
    this.setupContactForm();
    this.setupSmoothScrolling();
  }

  /* ── Custom Cursor ── */
  setupCustomCursor() {
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    let mouseX = 0,
      mouseY = 0;
    let ringX = 0,
      ringY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    };
    animateRing();

    // Hover state for interactive elements
    const interactives = document.querySelectorAll(
      "a, button, .project-card, .skill-card, .filter-btn, .tl-card, .pub-card",
    );
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", () =>
        document.body.classList.add("cursor-hover"),
      );
      el.addEventListener("mouseleave", () =>
        document.body.classList.remove("cursor-hover"),
      );
    });
  }

  /* ── Scroll Progress Bar ── */
  setupScrollProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return;

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = `${progress}%`;
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── Navigation ── */
  setupNavigation() {
    const navbar = document.querySelector(".navbar");
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.querySelector(".nav-menu");
    const links = document.querySelectorAll(".nav-link");

    // Scroll state
    window.addEventListener(
      "scroll",
      () => {
        const scrollY = window.scrollY;
        navbar.classList.toggle("scrolled", scrollY > 50);
      },
      { passive: true },
    );

    // Mobile toggle
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
        menu.classList.toggle("active");
      });
    }

    // Close menu on link click
    links.forEach((link) => {
      link.addEventListener("click", () => {
        toggle?.classList.remove("active");
        menu?.classList.remove("active");
      });
    });

    // Active link on scroll
    const sections = document.querySelectorAll(
      ".section[id], .section-alt[id]",
    );
    const observerOptions = { rootMargin: "-30% 0px -70% 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          const id = entry.target.id;
          const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
          if (activeLink) activeLink.classList.add("active");
        }
      });
    }, observerOptions);

    sections.forEach((sec) => observer.observe(sec));

    // Re-activate Home link when at top of page
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY < 200) {
          links.forEach((l) => l.classList.remove("active"));
          const homeLink = document.querySelector('.nav-link[href="#home"]');
          if (homeLink) homeLink.classList.add("active");
        }
      },
      { passive: true },
    );
  }

  /* ── Theme Toggle ── */
  setupThemeToggle() {
    const btn = document.querySelector(".theme-toggle");
    if (!btn) return;

    const saved = localStorage.getItem("portfolio-theme");
    if (saved === "light") document.body.classList.add("light-mode");

    // Set correct icon on load (sun = dark mode, moon = light mode)
    const setIcon = () => {
      const icon = btn.querySelector("i");
      if (icon)
        icon.className = document.body.classList.contains("light-mode")
          ? "fas fa-moon"
          : "fas fa-sun";
    };
    setIcon();

    btn.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");
      const isLight = document.body.classList.contains("light-mode");
      localStorage.setItem("portfolio-theme", isLight ? "light" : "dark");
      setIcon();
    });
  }

  /* ── Typing Effect ── */
  setupTypingEffect() {
    const el = document.getElementById("typed-text");
    if (!el) return;

    const texts = [
      "Multi-Cloud Solution Architect",
      "AWS • Azure • GCP Specialist",
      "Enterprise Cloud Transformation Leader",
      "AI & Cloud Innovation Expert",
      "Open Source Builder & Contributor",
      "FinOps & DevOps Strategist",
    ];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const speed = { type: 55, delete: 30, pause: 2000 };

    const tick = () => {
      const current = texts[textIndex];
      if (isDeleting) {
        charIndex--;
        el.textContent = current.substring(0, charIndex);
      } else {
        charIndex++;
        el.textContent = current.substring(0, charIndex);
      }

      let delay = isDeleting ? speed.delete : speed.type;

      if (!isDeleting && charIndex === current.length) {
        delay = speed.pause;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        delay = 300;
      }

      setTimeout(tick, delay);
    };

    tick();
  }

  /* ── Reveal-on-Scroll ── */
  setupRevealAnimations() {
    const elements = document.querySelectorAll(".reveal-up");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ── Counter Animation ── */
  setupCounterAnimation() {
    const counters = document.querySelectorAll(".mini-stat-num[data-count]");
    if (!counters.length) return;

    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const duration = 2000;
      const start = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    counters.forEach((c) => observer.observe(c));
  }

  /* ── Timeline Animation ── */
  setupTimelineAnimation() {
    const items = document.querySelectorAll(".tl-item");
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateX(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    items.forEach((item, i) => {
      item.style.opacity = "0";
      item.style.transform = "translateX(-20px)";
      item.style.transition = `opacity .6s var(--ease-out) ${i * 0.1}s, transform .6s var(--ease-out) ${i * 0.1}s`;
      observer.observe(item);
    });
  }

  /* ── Project Filters ── */
  setupProjectFilters() {
    const buttons = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".project-card");
    if (!buttons.length || !cards.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const filter = btn.dataset.filter;

        cards.forEach((card) => {
          const categories = card.dataset.category?.split(" ") || [];
          const show = filter === "all" || categories.includes(filter);

          if (show) {
            card.classList.remove("hidden");
            card.style.animation = "fadeUp .4s var(--ease-out) forwards";
          } else {
            card.classList.add("hidden");
          }
        });
      });
    });

    // Add fadeUp keyframe dynamically
    if (!document.getElementById("filter-keyframes")) {
      const style = document.createElement("style");
      style.id = "filter-keyframes";
      style.textContent = `@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`;
      document.head.appendChild(style);
    }
  }

  /* ── Contact Form ── */
  setupContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
      };

      const btn = form.querySelector(".btn-primary");
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
      btn.disabled = true;

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
          form.reset();
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
          }, 3000);
        } else {
          throw new Error("Server error");
        }
      } catch {
        // Fallback to mailto
        const subject = encodeURIComponent(
          `Portfolio Contact from ${data.name}`,
        );
        const body = encodeURIComponent(
          `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`,
        );
        window.open(
          `mailto:ankit.raj@outlook.com?subject=${subject}&body=${body}`,
        );
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  /* ── Smooth Scrolling ── */
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const id = anchor.getAttribute("href");
        if (id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();

        const offset = 72; // navbar height
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  }
}

// ── Initialise ──
document.addEventListener("DOMContentLoaded", () => {
  new ModernPortfolio();
});
