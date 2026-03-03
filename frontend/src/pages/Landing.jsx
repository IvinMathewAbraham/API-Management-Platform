import { useEffect, useRef, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

// ── Reusable hooks ──────────────────────────────────
function useInView(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px", ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function CountUp({ target, decimals = 0, suffix = "", prefix = "", duration = 2000 }) {
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = target * ease;
          el.textContent = prefix + current.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, decimals, suffix, prefix, duration]);
  return <span ref={ref}>0</span>;
}

// ── Landing page ────────────────────────────────────
export default function Landing() {
  const { openAuthModal } = useOutletContext();

  // Hero word rotation
  const [heroWord, setHeroWord] = useState("Manage");
  const [wordClass, setWordClass] = useState("");
  useEffect(() => {
    const words = ["Manage", "Monitor", "Secure", "Scale"];
    let idx = 0;
    const interval = setInterval(() => {
      setWordClass("word-exit");
      setTimeout(() => {
        idx = (idx + 1) % words.length;
        setHeroWord(words[idx]);
        setWordClass("word-enter");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setWordClass(""));
        });
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Demo quote rotation
  const quotes = [
    { q: '"The only way to do great work is to love what you do."', a: '"Steve Jobs"' },
    { q: '"Code is like humor. When you have to explain it, it\'s bad."', a: '"Cory House"' },
    { q: '"First, solve the problem. Then, write the code."', a: '"John Johnson"' },
    { q: '"Simplicity is the soul of efficiency."', a: '"Austin Freeman"' },
  ];
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteOpacity, setQuoteOpacity] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteOpacity(0);
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % quotes.length);
        setQuoteOpacity(1);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // FAQ
  const [openFaq, setOpenFaq] = useState(-1);
  const faqs = [
    { q: "How do I get an API key?", a: "Register for an account, then visit the API Keys page to generate your first key. It's instant and free." },
    { q: "What are the rate limits?", a: "Free plan: 100 requests per hour. Pro plan: 1,000 requests per hour. Rate limits reset every hour." },
    { q: "Is my API key secure?", a: "Yes. We store only a SHA-256 hash of your key. The raw key is shown once at generation time — we never store or log it." },
    { q: "Can I upgrade or downgrade my plan?", a: "Yes. Switch between Free and Pro instantly from the Plans page. Changes take effect immediately." },
    { q: "What content does the API serve?", a: "Currently quotes and jokes. We're expanding to facts, trivia, and more. The API format stays the same." },
    { q: "How do I monitor my usage?", a: "The Dashboard shows real-time stats: total requests, hourly usage, latency charts, and error rates." },
  ];

  return (
    <>
      {/* ── Hero ────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900">
        {/* Background effects */}
        <div className="absolute inset-0 landing-grid-bg opacity-30" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "4s" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-sky-300 text-xs font-medium">Now in public beta</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              <span className={`hero-word text-sky-400 ${wordClass}`}>{heroWord}</span>
              <br />Your APIs with Ease
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-lg leading-relaxed">
              Generate API keys, enforce rate limits, and monitor usage — all from a single, developer-friendly dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => openAuthModal("register")} className="px-6 py-3 bg-sky-500 text-white font-semibold rounded-xl hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/25">
                Get Started Free
              </button>
              <a href="#features" className="px-6 py-3 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-all">
                Learn More
              </a>
            </div>
          </div>

          {/* Floating dashboard mock */}
          <div className="hidden lg:block animate-float" style={{ animationDelay: "0.5s" }}>
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-400">dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[["1,247", "Total Requests", "text-sky-400"], ["842", "This Hour", "text-emerald-400"], ["99.2%", "Uptime", "text-amber-400"]].map(([val, label, color]) => (
                  <div key={label} className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold ${color}`}>{val}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3 h-24 flex items-end gap-1">
                {[30, 45, 35, 60, 50, 75, 65, 80, 70, 90, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-sky-500/60 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { val: 10000, suffix: "+", label: "API Calls Served" },
            { val: 500, suffix: "+", label: "Developers" },
            { val: 99.9, decimals: 1, suffix: "%", label: "Uptime" },
            { val: 50, suffix: "ms", label: "Avg Latency" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
                <CountUp target={s.val} decimals={s.decimals || 0} suffix={s.suffix} />
              </p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────── */}
      <FeaturesSection />

      {/* ── Live Demo ───────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-slate-800">Try It Live</h2>
            <p className="mt-3 text-slate-500">See what the API returns — no signup needed to preview</p>
          </AnimatedSection>
          <AnimatedSection className="mt-10">
            <div className="bg-slate-800 rounded-2xl p-6 text-left shadow-xl max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-400 font-mono">GET /api/v1/quotes</span>
              </div>
              <div className="font-mono text-sm space-y-2 min-h-[80px]">
                <p className="text-slate-400">{"{"}</p>
                <p style={{ opacity: quoteOpacity, transition: "opacity 0.3s ease" }}>
                  <span className="text-sky-300 ml-4">"quote"</span><span className="text-white">: </span>
                  <span className="text-emerald-300">{quotes[quoteIdx].q}</span>
                </p>
                <p style={{ opacity: quoteOpacity, transition: "opacity 0.3s ease" }}>
                  <span className="text-sky-300 ml-4">"author"</span><span className="text-white">: </span>
                  <span className="text-emerald-300">{quotes[quoteIdx].a}</span>
                </p>
                <p className="text-slate-400">{"}"}</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────── */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-slate-800">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-slate-500">Start free, upgrade when you need more</p>
          </AnimatedSection>
          <div className="mt-12 grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="border border-slate-200 rounded-2xl p-8 text-left hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold text-slate-800">Free</h3>
                <p className="mt-2 text-4xl font-extrabold text-slate-800">$0<span className="text-base font-normal text-slate-400">/mo</span></p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {["100 requests/hour", "1 API key", "Basic dashboard", "Community support"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openAuthModal("register")} className="mt-8 w-full py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-all">
                  Get Started
                </button>
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="border-2 border-sky-500 rounded-2xl p-8 text-left relative hover:shadow-lg transition-shadow bg-sky-50/30">
                <span className="absolute -top-3 left-6 px-3 py-0.5 bg-sky-500 text-white text-xs font-bold rounded-full">Popular</span>
                <h3 className="text-lg font-bold text-slate-800">Pro</h3>
                <p className="mt-2 text-4xl font-extrabold text-slate-800">$19<span className="text-base font-normal text-slate-400">/mo</span></p>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  {["1,000 requests/hour", "Unlimited API keys", "Advanced analytics", "Priority support", "Custom rate limits"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-sky-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openAuthModal("register")} className="mt-8 w-full py-2.5 bg-sky-600 text-white font-semibold rounded-lg text-sm hover:bg-sky-700 transition-all shadow-sm shadow-sky-200">
                  Upgrade to Pro
                </button>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────── */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">Frequently Asked Questions</h2>
          </AnimatedSection>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <AnimatedSection key={i}>
                <div className={`faq-item bg-white rounded-xl border border-slate-200 ${openFaq === i ? "open" : ""}`}>
                  <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="faq-toggle w-full flex items-center justify-between px-6 py-4 text-left">
                    <span className="text-sm font-semibold text-slate-700">{faq.q}</span>
                    <svg className="faq-chevron w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="faq-answer">
                    <p className="px-6 pb-4 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-sky-600 to-sky-500">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-sky-100 text-lg">Join hundreds of developers managing their APIs with SimpleAPI.</p>
          <button onClick={() => openAuthModal("register")} className="mt-8 px-8 py-3.5 bg-white text-sky-600 font-bold rounded-xl hover:bg-sky-50 transition-all shadow-lg">
            Create Free Account
          </button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">SimpleAPI</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} SimpleAPI. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

// ── Sub-components ──────────────────────────────────

function AnimatedSection({ children, className = "" }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={`animate-on-scroll ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

function FeaturesSection() {
  const features = [
    { title: "API Key Management", desc: "Generate, rotate, and revoke API keys instantly. Keys are hashed for security.", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" },
    { title: "Rate Limiting", desc: "Redis-backed rate limiting with per-plan quotas. Protect your APIs from abuse.", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
    { title: "Usage Analytics", desc: "Real-time dashboards with request counts, latency charts, and error breakdowns.", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
    { title: "Developer-First", desc: "Simple REST API with clear docs. Just add x-api-key header and start building.", icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" },
    { title: "Docker Ready", desc: "One command deployment with Docker Compose. MongoDB, Redis, and app — all containerized.", icon: "M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" },
    { title: "Secure by Default", desc: "Hashed passwords, hashed API keys, JWT auth, Helmet security headers, and CORS.", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-800">Everything You Need</h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">A complete toolkit for managing API keys, enforcing rate limits, and monitoring usage.</p>
        </AnimatedSection>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <AnimatedSection key={i}>
              <div className="feature-card bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all group">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-sky-100 transition-colors">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
