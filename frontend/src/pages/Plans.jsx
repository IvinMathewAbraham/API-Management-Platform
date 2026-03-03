import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth.js";
import { apiPatch, apiPost, apiGet } from "../api/client.js";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: ["100 requests / hour", "2 API keys", "Basic analytics", "Community support"],
    color: "sky",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For production applications",
    features: ["1,000 requests / hour", "10 API keys", "Advanced analytics", "Priority support", "Webhook notifications"],
    color: "amber",
    popular: true,
  },
];

export default function Plans() {
  const { user, updateUser } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  // Handle Stripe redirect back to /plans
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setSuccess("You're now on the Pro plan! It may take a moment to reflect.");
      // Refresh user data from server so plan badge updates immediately
      apiGet("/auth/me")
        .then((data) => { if (data.user) updateUser(data.user); })
        .catch(() => {});
      window.history.replaceState({}, "", "/plans");
    }
    if (params.get("canceled") === "1") {
      setError("Checkout was canceled. No charges were made.");
      window.history.replaceState({}, "", "/plans");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchPlan(planId) {
    setError("");
    setSuccess("");

    // Downgrading to Free — use existing PATCH endpoint
    if (planId === "free") {
      setSwitching(true);
      try {
        const res = await apiPatch("/user/plan", { plan: planId });
        updateUser({ ...user, plan: planId });
        setSuccess(res.message || "Switched to Free plan.");
        setShowConfirm(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setSwitching(false);
      }
      return;
    }

    // Upgrading to Pro — create Stripe Checkout session and redirect
    setSwitching(true);
    try {
      const res = await apiPost("/payment/checkout", {});
      if (res.url) window.location.href = res.url;
    } catch (err) {
      setError(err.message);
      setSwitching(false);
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    setError("");
    try {
      const res = await apiPost("/payment/portal", {});
      if (res.url) window.location.href = res.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-slate-800">Choose Your Plan</h2>
        <p className="text-sm text-slate-500 mt-2">Select the plan that best fits your needs.</p>
      </div>

      {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-in">{error}</div>}
      {success && <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 animate-fade-in">{success}</div>}

      {/* Billing portal — only shown to Pro users */}
      {user?.plan === "pro" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">Manage your subscription</p>
            <p className="text-xs text-amber-600 mt-0.5">Update payment method, view invoices, or cancel anytime</p>
          </div>
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="shrink-0 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            {portalLoading ? "Loading..." : "Billing Portal"}
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrent = user?.plan === plan.id;
          return (
            <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-6 transition-all ${isCurrent ? "border-sky-500 shadow-lg shadow-sky-100" : "border-slate-200 hover:border-slate-300"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                  POPULAR
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 px-3 py-0.5 bg-sky-500 text-white text-xs font-bold rounded-full">
                  CURRENT
                </div>
              )}

              <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{plan.description}</p>

              <div className="mt-4 mb-6">
                <span className="text-4xl font-extrabold text-slate-800">{plan.price}</span>
                <span className="text-sm text-slate-400 ml-1">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                    <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4.5 12.75 6 6 9-13.5" /></svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-lg text-sm font-semibold cursor-not-allowed">
                  Current Plan
                </button>
              ) : (
                <button onClick={() => setShowConfirm(plan.id)} className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${plan.id === "pro" ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200" : "bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-200"}`}>
                  {user?.plan === "pro" && plan.id === "free" ? "Downgrade" : "Upgrade"} to {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-modal-bg-in" onClick={() => !switching && setShowConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-modal-card-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">
              {user?.plan === "pro" && showConfirm === "free" ? "Downgrade" : "Upgrade"} to {showConfirm.toUpperCase()}?
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {showConfirm === "pro"
                ? "You'll be redirected to Stripe to complete your payment securely."
                : "You'll lose access to Pro features. Your rate limit will be reduced."}
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowConfirm(null)} disabled={switching} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={() => switchPlan(showConfirm)} disabled={switching} className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-all disabled:opacity-50">
                {switching
                  ? showConfirm === "pro" ? "Redirecting..." : "Switching..."
                  : showConfirm === "pro" ? "Go to Checkout" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
