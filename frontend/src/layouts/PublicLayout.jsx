import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import AuthModal from "../components/AuthModal.jsx";

export default function PublicLayout() {
  const { token } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, tab: "register" });

  // If logged in, redirect to dashboard
  if (token) return <Navigate to="/dashboard" replace />;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = authModal.open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [authModal.open]);

  const openAuthModal = (tab = "register") => setAuthModal({ open: true, tab });
  const closeAuthModal = () => setAuthModal({ open: false, tab: "register" });

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "nav-scrolled" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`nav-brand-text font-bold text-lg ${scrolled ? "text-slate-800" : "text-white"}`}>
              SimpleAPI
            </span>
          </a>

          <div className="hidden sm:flex items-center gap-6">
            <a href="#features" className={`nav-link-landing text-sm font-medium ${scrolled ? "text-slate-500 hover:text-slate-800" : "text-white/80 hover:text-white"}`}>Features</a>
            <a href="#pricing" className={`nav-link-landing text-sm font-medium ${scrolled ? "text-slate-500 hover:text-slate-800" : "text-white/80 hover:text-white"}`}>Pricing</a>
            <a href="#faq" className={`nav-link-landing text-sm font-medium ${scrolled ? "text-slate-500 hover:text-slate-800" : "text-white/80 hover:text-white"}`}>FAQ</a>
            <button onClick={() => openAuthModal("login")} className={`text-sm font-medium ${scrolled ? "text-slate-600 hover:text-slate-800" : "text-white/90 hover:text-white"}`}>
              Sign In
            </button>
            <button onClick={() => openAuthModal("register")} className="bg-white text-sky-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-sky-50 transition-all shadow-sm">
              Get Started Free
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(true)} className="sm:hidden p-2" aria-label="Open menu">
            <svg className={`w-6 h-6 ${scrolled ? "text-slate-700" : "text-white"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900 p-6 animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/60 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="mt-12 flex flex-col gap-4">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white text-base font-medium">Features</a>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white text-base font-medium">Pricing</a>
              <a href="#faq" onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white text-base font-medium">FAQ</a>
              <hr className="border-white/10" />
              <button onClick={() => { setMobileOpen(false); openAuthModal("login"); }} className="text-white/90 text-base font-medium text-left">Sign In</button>
              <button onClick={() => { setMobileOpen(false); openAuthModal("register"); }} className="bg-sky-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center">Get Started Free</button>
            </div>
          </div>
        </div>
      )}

      {/* Page content */}
      <Outlet context={{ openAuthModal }} />

      {/* Auth modal */}
      {authModal.open && <AuthModal tab={authModal.tab} onClose={closeAuthModal} />}
    </div>
  );
}
