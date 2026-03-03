import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

export default function AuthModal({ tab = "register", onClose }) {
  const [activeTab, setActiveTab] = useState(tab);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.target);
    try {
      await register(form.get("name"), form.get("email"), form.get("password"));
      onClose();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.target);
    try {
      await login(form.get("email"), form.get("password"));
      onClose();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setActiveTab("register"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "register" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Register
            </button>
            <button
              onClick={() => { setActiveTab("login"); setError(""); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "login" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Sign In
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-6">
            {activeTab === "register" ? "Create your account" : "Welcome back"}
          </h2>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-in">
              {error}
            </div>
          )}

          {/* Register form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input name="name" type="text" required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input name="email" type="email" required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input name="password" type="password" required minLength={6} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" placeholder="••••••••" />
              </div>
              <button disabled={loading} className="w-full py-2.5 bg-sky-600 text-white rounded-lg font-semibold text-sm hover:bg-sky-700 disabled:opacity-60 transition-all shadow-sm shadow-sky-200">
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          {/* Login form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input name="email" type="email" required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input name="password" type="password" required className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all" placeholder="••••••••" />
              </div>
              <button disabled={loading} className="w-full py-2.5 bg-sky-600 text-white rounded-lg font-semibold text-sm hover:bg-sky-700 disabled:opacity-60 transition-all shadow-sm shadow-sky-200">
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
