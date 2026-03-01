// ── Global functions (available immediately for inline onclick handlers) ──

function openAuthModal(tab) {
  const m = document.getElementById("auth-modal");
  if (!m) return;
  m.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  _showAuthTab(tab || "register");
}

function closeAuthModal() {
  const m = document.getElementById("auth-modal");
  if (!m) return;
  m.classList.add("hidden");
  document.body.style.overflow = "";
  const err = document.getElementById("error-box");
  if (err) err.classList.add("hidden");
}

function closeLandingMenu() {
  const menu = document.getElementById("landing-mobile-menu");
  if (menu) menu.classList.add("hidden");
}

function _showAuthTab(tab) {
  const registerTab = document.getElementById("register-tab");
  const loginTab = document.getElementById("login-tab");
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const modalTitle = document.getElementById("modal-title");
  const errorBox = document.getElementById("error-box");
  if (!registerTab || !loginTab) return;

  if (tab === "register") {
    registerTab.classList.add("border-sky-500", "text-sky-600");
    registerTab.classList.remove("border-transparent", "text-slate-500");
    loginTab.classList.remove("border-sky-500", "text-sky-600");
    loginTab.classList.add("border-transparent", "text-slate-500");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    if (modalTitle) modalTitle.textContent = "Create your account";
  } else {
    loginTab.classList.add("border-sky-500", "text-sky-600");
    loginTab.classList.remove("border-transparent", "text-slate-500");
    registerTab.classList.remove("border-sky-500", "text-sky-600");
    registerTab.classList.add("border-transparent", "text-slate-500");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    if (modalTitle) modalTitle.textContent = "Welcome back";
  }
  if (errorBox) errorBox.classList.add("hidden");
}

// Close on Escape
document.addEventListener("keydown", (e) => {
  const m = document.getElementById("auth-modal");
  if (e.key === "Escape" && m && !m.classList.contains("hidden")) {
    closeAuthModal();
  }
});

// ── DOMContentLoaded — remaining init ───────────────
document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, go to dashboard
  if (getToken()) {
    window.location.href = "/dashboard.html";
    return;
  }

  // ── Element refs ──────────────────────────────────
  const registerTab = document.getElementById("register-tab");
  const loginTab = document.getElementById("login-tab");
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const errorBox = document.getElementById("error-box");
  const mainNav = document.getElementById("main-nav");

  // ── Tab click handlers ────────────────────────────
  if (registerTab) registerTab.addEventListener("click", () => _showAuthTab("register"));
  if (loginTab) loginTab.addEventListener("click", () => _showAuthTab("login"));

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }
  // ── Register ──────────────────────────────────────
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    try {
      const data = await apiPost("/auth/register", { name, email, password });
      saveAuth(data);
      window.location.href = "/dashboard.html";
    } catch (err) {
      showError(err.message);
    }
  });

  // ── Login ─────────────────────────────────────────
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const data = await apiPost("/auth/login", { email, password });
      saveAuth(data);
      window.location.href = "/dashboard.html";
    } catch (err) {
      showError(err.message);
    }
  });

  // ── Landing Mobile Menu ───────────────────────────
  const landingMenuBtn = document.getElementById("landing-menu-btn");
  const landingMobileMenu = document.getElementById("landing-mobile-menu");

  if (landingMenuBtn && landingMobileMenu) {
    landingMenuBtn.addEventListener("click", () => {
      landingMobileMenu.classList.remove("hidden");
    });
  }

  // ── Navbar scroll effect ──────────────────────────
  if (mainNav) {
    const navSignInBtn = mainNav.querySelector("button");
    function updateNav() {
      if (window.scrollY > 60) {
        mainNav.classList.add("nav-scrolled");
      } else {
        mainNav.classList.remove("nav-scrolled");
      }
    }
    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();
  }

  // ── Hero word rotation ────────────────────────────
  const heroWord = document.getElementById("hero-word");
  if (heroWord) {
    const words = ["Manage", "Monitor", "Secure", "Scale"];
    let idx = 0;
    setInterval(() => {
      heroWord.classList.add("word-exit");
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        heroWord.textContent = words[idx];
        heroWord.classList.remove("word-exit");
        heroWord.classList.add("word-enter");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            heroWord.classList.remove("word-enter");
          });
        });
      }, 400);
    }, 2500);
  }

  // ── Scroll-triggered animations ───────────────────
  const scrollElements = document.querySelectorAll(".animate-on-scroll");
  if (scrollElements.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            // Stagger based on sibling index
            const delay = entry.target.style.animationDelay
              ? parseFloat(entry.target.style.animationDelay) * 1000
              : 0;
            setTimeout(() => {
              entry.target.classList.add("is-visible");
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    scrollElements.forEach((el) => observer.observe(el));
  }

  // ── Stats count-up animation ──────────────────────
  const countEls = document.querySelectorAll("[data-countup]");
  if (countEls.length > 0) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    countEls.forEach((el) => countObserver.observe(el));
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.countup);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;
      el.textContent = prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── FAQ accordion ─────────────────────────────────
  const faqItems = document.querySelectorAll(".faq-toggle");
  faqItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const isOpen = item.classList.contains("open");
      // Close all
      document.querySelectorAll(".faq-item.open").forEach((el) => el.classList.remove("open"));
      // Toggle current
      if (!isOpen) item.classList.add("open");
    });
  });

  // ── Demo quote rotation ───────────────────────────
  const demoQuote = document.getElementById("demo-quote");
  const demoAuthor = document.getElementById("demo-author");
  if (demoQuote && demoAuthor) {
    const quotes = [
      { q: '"The only way to do great work is to love what you do."', a: '"Steve Jobs"' },
      { q: '"Code is like humor. When you have to explain it, it\'s bad."', a: '"Cory House"' },
      { q: '"First, solve the problem. Then, write the code."', a: '"John Johnson"' },
      { q: '"Simplicity is the soul of efficiency."', a: '"Austin Freeman"' },
    ];
    let qi = 0;
    setInterval(() => {
      qi = (qi + 1) % quotes.length;
      demoQuote.style.opacity = "0";
      demoAuthor.style.opacity = "0";
      setTimeout(() => {
        demoQuote.textContent = quotes[qi].q;
        demoAuthor.textContent = quotes[qi].a;
        demoQuote.style.opacity = "1";
        demoAuthor.style.opacity = "1";
      }, 300);
    }, 4000);
    demoQuote.style.transition = "opacity 0.3s ease";
    demoAuthor.style.transition = "opacity 0.3s ease";
  }
});
