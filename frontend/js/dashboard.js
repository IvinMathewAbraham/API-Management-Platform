document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "User";
  const mobileUserName = document.getElementById("mobile-user-name");
  if (mobileUserName) mobileUserName.textContent = user?.name || "User";
  document.getElementById("logout-btn").addEventListener("click", logout);

  // ── Count-up animation ──────────────
  function animateCountUp(el, target) {
    const duration = 600;
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── Usage stats ─────────────────────
  async function loadUsage() {
    try {
      const data = await apiGet("/dashboard/usage");
      document.getElementById("plan-badge").textContent = data.plan.toUpperCase();
      document.getElementById("plan-badge").className =
        data.plan === "pro"
          ? "inline-block px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800"
          : "inline-block px-3 py-1 text-sm font-semibold rounded-full bg-slate-100 text-slate-800";

      // Animate stat numbers
      const totalEl = document.getElementById("total-requests");
      const hourEl = document.getElementById("requests-hour");
      const remainEl = document.getElementById("remaining");
      animateCountUp(totalEl, data.totalRequests);
      animateCountUp(hourEl, data.requestsThisHour);
      animateCountUp(remainEl, data.remaining);
      document.getElementById("limit").textContent = data.limit;

      // Progress bar
      const pct = data.limit > 0 ? Math.round((data.requestsThisHour / data.limit) * 100) : 0;
      const bar = document.getElementById("usage-bar");
      bar.style.width = `${Math.min(pct, 100)}%`;
      bar.className = `h-full rounded-full transition-all duration-700 ease-out flex items-center justify-center ${
        pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"
      }`;

      // Show percentage label inside bar when > 15%
      const barLabel = document.getElementById("usage-bar-label");
      if (barLabel) {
        barLabel.textContent = pct > 15 ? `${pct}%` : "";
      }

      // Show percentage next to bar title
      const usagePct = document.getElementById("usage-pct");
      if (usagePct) {
        usagePct.textContent = `${pct}%`;
        usagePct.className = `text-sm font-semibold ${
          pct > 85 ? "text-red-600" : pct > 60 ? "text-amber-600" : "text-slate-500"
        }`;
      }

      // Show upgrade CTA for free plan users
      const upgradeCta = document.getElementById("upgrade-cta");
      if (upgradeCta) {
        if (data.plan === "free") {
          upgradeCta.classList.remove("hidden");
        } else {
          upgradeCta.classList.add("hidden");
        }
      }
    } catch (err) {
      document.getElementById("dashboard-error").textContent = err.message;
      document.getElementById("dashboard-error").classList.remove("hidden");
    }
  }

  await loadUsage();
});
