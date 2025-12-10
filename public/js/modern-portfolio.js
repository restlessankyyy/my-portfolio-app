// Modern Portfolio JavaScript - 2026

class ModernPortfolio {
  constructor() {
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupScrollEffects();
    this.setupIntersectionObserver();
    this.setupContactForm();
    this.setupParticles();
    this.setupTypingEffect();
    this.setupSmoothScrolling();
    this.setupCounterAnimation();
    this.setupTimelineAnimation();
    this.setupTiltEffect();
    this.setupRevealAnimations();
  }

  // 3D Tilt Effect for Cards
  setupTiltEffect() {
    const tiltElements = document.querySelectorAll("[data-tilt]");

    tiltElements.forEach((element) => {
      const maxTilt = parseInt(element.getAttribute("data-tilt-max")) || 10;

      element.addEventListener("mousemove", (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      element.addEventListener("mouseleave", () => {
        element.style.transform =
          "perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)";
      });
    });
  }

  // Reveal animations on scroll
  setupRevealAnimations() {
    const revealElements = document.querySelectorAll(
      ".section-title, .project-card, .skill-category, .cert-card",
    );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1 },
    );

    revealElements.forEach((el) => {
      el.classList.add("reveal-element");
      revealObserver.observe(el);
    });

    // Add reveal CSS
    const style = document.createElement("style");
    style.textContent = `
            .reveal-element {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }
            .reveal-element.revealed {
                opacity: 1;
                transform: translateY(0);
            }
        `;
    document.head.appendChild(style);
  }

  // Navigation functionality
  setupNavigation() {
    const navToggle = document.getElementById("nav-toggle");
    const navMenu = document.getElementById("nav-menu");
    const navbar = document.getElementById("navbar");

    // Mobile menu toggle
    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        navMenu.classList.toggle("active");
        navToggle.classList.toggle("active");
      });

      // Close menu when clicking on a link
      document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          navMenu.classList.remove("active");
          navToggle.classList.remove("active");
        });
      });
    }

    // Navbar scroll effect
    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });

    // Active navigation link
    this.updateActiveNavLink();
    window.addEventListener("scroll", () => this.updateActiveNavLink());
  }

  updateActiveNavLink() {
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  }

  // Theme toggle functionality
  setupThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
    const icon = themeToggle.querySelector("i");

    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      body.classList.toggle("light-mode", savedTheme === "light");
      this.updateThemeIcon(icon, savedTheme === "light");
    } else {
      // Default to dark mode
      this.updateThemeIcon(icon, false);
    }

    themeToggle.addEventListener("click", () => {
      body.classList.toggle("light-mode");
      const isLight = body.classList.contains("light-mode");

      localStorage.setItem("theme", isLight ? "light" : "dark");
      this.updateThemeIcon(icon, isLight);
    });
  }

  updateThemeIcon(icon, isLight) {
    icon.className = isLight ? "fas fa-sun" : "fas fa-moon";
  }

  // Scroll effects
  setupScrollEffects() {
    // Subtle parallax effect for hero section (reduced to prevent overlap)
    window.addEventListener("scroll", () => {
      const scrolled = window.pageYOffset;
      const hero = document.querySelector(".hero");
      if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.2}px)`;
      }
    });

    // Scroll to top functionality
    const scrollToTop = document.createElement("button");
    scrollToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTop.className = "scroll-to-top";
    scrollToTop.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: var(--shadow-lg);
        `;

    document.body.appendChild(scrollToTop);

    window.addEventListener("scroll", () => {
      if (window.scrollY > 500) {
        scrollToTop.style.opacity = "1";
        scrollToTop.style.visibility = "visible";
      } else {
        scrollToTop.style.opacity = "0";
        scrollToTop.style.visibility = "hidden";
      }
    });

    scrollToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Intersection Observer for animations
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll(`
            .timeline-item,
            .skill-item,
            .project-card,
            .contact-item,
            .about-highlights .highlight-item
        `);

    animateElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });

    // Add CSS for animation
    const style = document.createElement("style");
    style.textContent = `
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
    document.head.appendChild(style);
  }

  // Contact form functionality - Modern serverless approach
  setupContactForm() {
    const contactForm = document.getElementById("contact-form");

    if (contactForm) {
      contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);

        // Validate form data
        if (!data.name || !data.email || !data.message) {
          this.showNotification("Please fill in all fields.", "error");
          return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          this.showNotification("Please enter a valid email address.", "error");
          return;
        }

        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML =
          '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
          // Send to our serverless API endpoint
          const response = await fetch("/api/contact", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            this.showNotification(
              "✅ Message sent successfully! I'll get back to you soon.",
              "success",
            );
            contactForm.reset();

            // Add a nice animation
            contactForm.classList.add("form-success");
            setTimeout(
              () => contactForm.classList.remove("form-success"),
              2000,
            );
          } else {
            throw new Error(result.error || "Failed to send message");
          }
        } catch (error) {
          console.error("Contact form error:", error);

          // Fallback to mailto
          const subject = encodeURIComponent(
            `Portfolio Contact from ${data.name}`,
          );
          const body = encodeURIComponent(
            `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`,
          );

          this.showNotification("Opening email client as backup...", "info");
          window.location.href = `mailto:rajankit749@gmail.com?subject=${subject}&body=${body}`;
        } finally {
          // Reset button
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      });
    }
  }

  showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Set background color based on type
    let backgroundColor;
    switch (type) {
      case "success":
        backgroundColor = "var(--success-color)";
        break;
      case "error":
        backgroundColor = "var(--error-color)";
        break;
      case "info":
        backgroundColor = "var(--primary-color)";
        break;
      default:
        backgroundColor = "var(--primary-color)";
    }

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            background: ${backgroundColor};
            box-shadow: var(--shadow-lg);
            max-width: 350px;
            word-wrap: break-word;
        `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Particles background effect
  setupParticles() {
    const canvas = document.createElement("canvas");
    canvas.id = "particles-canvas";
    canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.5;
        `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: null, y: null };

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Mouse movement
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        this.color = `hsl(${Math.random() * 60 + 200}, 70%, 60%)`;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Mouse interaction
        if (mouse.x && mouse.y) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            this.x -= (dx / distance) * 2;
            this.y -= (dy / distance) * 2;
          }
        }

        // Boundary check
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const numberOfParticles = Math.floor(
        (canvas.width * canvas.height) / 15000,
      );

      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${1 - distance / 100})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    window.addEventListener("resize", initParticles);
  }

  // Typing effect for hero section
  setupTypingEffect() {
    const element = document.getElementById("typed-text");
    if (!element) return;

    const texts = [
      "Multi-Cloud Solution Architect",
      "AWS • Azure • GCP Specialist",
      "Enterprise Cloud Transformation Leader",
      "AI & Cloud Innovation Expert",
      "FinOps & DevOps Strategist",
    ];

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pauseTime = 2500;

    const type = () => {
      const currentText = texts[textIndex];

      if (isDeleting) {
        element.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        element.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
      }

      let speed = isDeleting ? deleteSpeed : typeSpeed;

      if (!isDeleting && charIndex === currentText.length) {
        speed = pauseTime;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
      }

      setTimeout(type, speed);
    };

    // Start typing effect after a delay
    setTimeout(type, 500);
  }

  // Counter animation for stats
  setupCounterAnimation() {
    const counters = document.querySelectorAll(".stat-number[data-count]");

    const observerOptions = {
      threshold: 0.5,
      rootMargin: "0px",
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute("data-count"));
          const duration = 2000; // 2 seconds
          const step = target / (duration / 16); // 60fps
          let current = 0;

          const updateCounter = () => {
            current += step;
            if (current < target) {
              counter.textContent = Math.floor(current);
              requestAnimationFrame(updateCounter);
            } else {
              counter.textContent = target;
            }
          };

          updateCounter();
          counterObserver.unobserve(counter);
        }
      });
    }, observerOptions);

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  // Timeline animation
  setupTimelineAnimation() {
    const timelineItems = document.querySelectorAll(".timeline-item");

    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px",
    };

    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, index * 100);
        }
      });
    }, observerOptions);

    timelineItems.forEach((item) => timelineObserver.observe(item));
  }

  // Smooth scrolling for navigation links
  setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          const offsetTop = target.offsetTop - 70; // Account for fixed navbar

          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      });
    });

    // Scroll indicator in hero section
    const scrollIndicator = document.querySelector(".scroll-indicator");
    if (scrollIndicator) {
      scrollIndicator.addEventListener("click", () => {
        const aboutSection = document.querySelector("#about");
        if (aboutSection) {
          aboutSection.scrollIntoView({ behavior: "smooth" });
        }
      });
    }
  }

  // Utility method to load external data (for future use)
  async loadExternalData(url) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error("Failed to load external data:", error);
      return null;
    }
  }

  // Method to update portfolio content dynamically
  updatePortfolioContent(data) {
    // Update experience section
    if (data.experience) {
      this.updateExperience(data.experience);
    }

    // Update skills section
    if (data.skills) {
      this.updateSkills(data.skills);
    }

    // Update projects section
    if (data.projects) {
      this.updateProjects(data.projects);
    }
  }

  updateExperience(experiences) {
    const timeline = document.querySelector(".timeline");
    if (!timeline) return;

    timeline.innerHTML = "";

    experiences.forEach((exp) => {
      const timelineItem = document.createElement("div");
      timelineItem.className = "timeline-item";
      timelineItem.innerHTML = `
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h3 class="job-title">${exp.title}</h3>
                    <h4 class="company">${exp.company}</h4>
                    <span class="job-date">${exp.date}</span>
                    <p class="job-description">${exp.description}</p>
                    <div class="job-tech">
                        ${exp.technologies.map((tech) => `<span class="tech-tag">${tech}</span>`).join("")}
                    </div>
                </div>
            `;
      timeline.appendChild(timelineItem);
    });
  }

  updateSkills(skillCategories) {
    const skillsGrid = document.querySelector(".skills-grid");
    if (!skillsGrid) return;

    skillsGrid.innerHTML = "";

    skillCategories.forEach((category) => {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "skill-category";
      categoryDiv.innerHTML = `
                <h3>${category.name}</h3>
                <div class="skill-items">
                    ${category.skills
                      .map(
                        (skill) => `
                        <div class="skill-item">
                            <i class="${skill.icon}"></i>
                            <span>${skill.name}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
      skillsGrid.appendChild(categoryDiv);
    });
  }

  updateProjects(projects) {
    const projectsGrid = document.querySelector(".projects-grid");
    if (!projectsGrid) return;

    projectsGrid.innerHTML = "";

    projects.forEach((project) => {
      const projectCard = document.createElement("div");
      projectCard.className = "project-card";
      projectCard.innerHTML = `
                <div class="project-image">
                    <img src="${project.image}" alt="${project.title}">
                    <div class="project-overlay">
                        <a href="${project.liveUrl}" class="project-link" target="_blank">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                        <a href="${project.githubUrl}" class="project-github" target="_blank">
                            <i class="fab fa-github"></i>
                        </a>
                    </div>
                </div>
                <div class="project-content">
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <div class="project-tech">
                        ${project.technologies.map((tech) => `<span class="tech-tag">${tech}</span>`).join("")}
                    </div>
                </div>
            `;
      projectsGrid.appendChild(projectCard);
    });
  }
}

// Initialize the portfolio when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ModernPortfolio();
});

// Export for potential module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = ModernPortfolio;
}
