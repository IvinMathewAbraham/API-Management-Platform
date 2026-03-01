/* global Chart, apiGet, requireAuth, getUser, logout */

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "User";
  const mobileUserName = document.getElementById("mobile-user-name");
  if (mobileUserName) mobileUserName.textContent = user?.name || "User";
  document.getElementById("logout-btn").addEventListener("click", logout);

  // ── State ───────────────────────────────────────────
  let currentRange = "24h";
  const chartInstances = {};

  // ── Helpers ─────────────────────────────────────────
  function animateCountUp(el, target) {
    const duration = 600;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function formatTime(t) {
    if (!t) return "";
    if (t.includes("T")) {
      // "2026-03-01T14:00" → "14:00"
      return t.split("T")[1];
    }
    // "2026-03-01" → "Mar 01"
    const d = new Date(t + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  }

  function statusColor(code) {
    if (code < 300) return "#10b981";   // emerald-500
    if (code < 400) return "#f59e0b";   // amber-500
    if (code < 500) return "#f97316";   // orange-500
    return "#ef4444";                    // red-500
  }

  function statusBadge(code) {
    const colors = {
      2: "bg-emerald-100 text-emerald-700",
      3: "bg-amber-100 text-amber-700",
      4: "bg-orange-100 text-orange-700",
      5: "bg-red-100 text-red-700",
    };
    const group = Math.floor(code / 100);
    return `<span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${colors[group] || "bg-slate-100 text-slate-600"}">${code}</span>`;
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // ── Chart defaults ──────────────────────────────────
  Chart.defaults.font.family = "system-ui, -apple-system, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = "#64748b";

  const commonScaleOpts = {
    grid: { color: "rgba(148,163,184,0.12)" },
    ticks: { maxTicksLimit: 8 },
  };

  // ── Load usage stats (existing) ────────────────────
  async function loadUsage() {
    try {
      const data = await apiGet("/dashboard/usage");
      document.getElementById("plan-badge").textContent = data.plan.toUpperCase();
      document.getElementById("plan-badge").className =
        data.plan === "pro"
          ? "inline-block px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800"
          : "inline-block px-3 py-1 text-sm font-semibold rounded-full bg-slate-100 text-slate-800";

      animateCountUp(document.getElementById("total-requests"), data.totalRequests);
      animateCountUp(document.getElementById("requests-hour"), data.requestsThisHour);
      animateCountUp(document.getElementById("remaining"), data.remaining);
      document.getElementById("limit").textContent = data.limit;

      const pct = data.limit > 0 ? Math.round((data.requestsThisHour / data.limit) * 100) : 0;
      const bar = document.getElementById("usage-bar");
      bar.style.width = `${Math.min(pct, 100)}%`;
      bar.className = `h-full rounded-full transition-all duration-700 ease-out flex items-center justify-center ${
        pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"
      }`;
      const barLabel = document.getElementById("usage-bar-label");
      if (barLabel) barLabel.textContent = pct > 15 ? `${pct}%` : "";
      const usagePct = document.getElementById("usage-pct");
      if (usagePct) {
        usagePct.textContent = `${pct}%`;
        usagePct.className = `text-sm font-semibold ${pct > 85 ? "text-red-600" : pct > 60 ? "text-amber-600" : "text-slate-500"}`;
      }

      const upgradeCta = document.getElementById("upgrade-cta");
      if (upgradeCta) {
        data.plan === "free" ? upgradeCta.classList.remove("hidden") : upgradeCta.classList.add("hidden");
      }
    } catch (err) {
      document.getElementById("dashboard-error").textContent = err.message;
      document.getElementById("dashboard-error").classList.remove("hidden");
    }
  }

  // ── Load analytics overview (new stat cards) ───────
  async function loadOverview() {
    try {
      const data = await apiGet(`/dashboard/analytics/overview?range=${currentRange}`);
      const avgEl = document.getElementById("avg-latency");
      const errEl = document.getElementById("error-rate");
      if (avgEl) animateCountUp(avgEl, Math.round(data.avgLatency));
      if (errEl) errEl.textContent = data.errorRate.toFixed(1);
    } catch { /* silent */ }
  }

  // ── Chart: Requests Over Time ──────────────────────
  async function loadRequestsChart() {
    try {
      const data = await apiGet(`/dashboard/analytics/timeseries?range=${currentRange}`);
      const labels = data.map((d) => formatTime(d.time));
      const counts = data.map((d) => d.count);
      const errors = data.map((d) => d.errorCount);

      if (chartInstances.requests) chartInstances.requests.destroy();

      const ctx = document.getElementById("chart-requests").getContext("2d");
      chartInstances.requests = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Requests",
              data: counts,
              borderColor: "#0ea5e9",
              backgroundColor: "rgba(14,165,233,0.08)",
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
            {
              label: "Errors",
              data: errors,
              borderColor: "#ef4444",
              backgroundColor: "rgba(239,68,68,0.08)",
              fill: true,
              tension: 0.3,
              pointRadius: 2,
              pointHoverRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } } },
          scales: { x: commonScaleOpts, y: { ...commonScaleOpts, beginAtZero: true } },
        },
      });
    } catch { /* silent */ }
  }

  // ── Chart: Latency Over Time ───────────────────────
  async function loadLatencyChart() {
    try {
      const data = await apiGet(`/dashboard/analytics/latency?range=${currentRange}`);
      const labels = data.map((d) => formatTime(d.time));

      if (chartInstances.latency) chartInstances.latency.destroy();

      const ctx = document.getElementById("chart-latency").getContext("2d");
      chartInstances.latency = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Avg (ms)",
              data: data.map((d) => d.avg),
              borderColor: "#8b5cf6",
              backgroundColor: "rgba(139,92,246,0.08)",
              fill: true,
              tension: 0.3,
              pointRadius: 3,
            },
            {
              label: "P95 (ms)",
              data: data.map((d) => d.p95),
              borderColor: "#f59e0b",
              borderDash: [5, 3],
              tension: 0.3,
              pointRadius: 2,
              fill: false,
            },
            {
              label: "Max (ms)",
              data: data.map((d) => d.max),
              borderColor: "#ef4444",
              borderDash: [2, 2],
              tension: 0.3,
              pointRadius: 1,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: "index" },
          plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } } },
          scales: {
            x: commonScaleOpts,
            y: { ...commonScaleOpts, beginAtZero: true, title: { display: true, text: "ms" } },
          },
        },
      });
    } catch { /* silent */ }
  }

  // ── Chart: Status Code Distribution ────────────────
  async function loadStatusChart() {
    try {
      const data = await apiGet(`/dashboard/analytics/status-codes?range=${currentRange}`);
      const labels = data.map((d) => String(d.statusCode));
      const counts = data.map((d) => d.count);
      const colors = data.map((d) => statusColor(d.statusCode));

      if (chartInstances.status) chartInstances.status.destroy();

      const ctx = document.getElementById("chart-status").getContext("2d");
      chartInstances.status = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels,
          datasets: [{ data: counts, backgroundColor: colors, borderWidth: 0 }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 12, padding: 12 } },
          },
        },
      });
    } catch { /* silent */ }
  }

  // ── Chart: Top Endpoints ───────────────────────────
  async function loadEndpointsChart() {
    try {
      const data = await apiGet(`/dashboard/analytics/endpoints?range=${currentRange}`);
      const top = data.slice(0, 8);
      const labels = top.map((d) => d.endpoint);
      const counts = top.map((d) => d.count);

      if (chartInstances.endpoints) chartInstances.endpoints.destroy();

      const ctx = document.getElementById("chart-endpoints").getContext("2d");
      chartInstances.endpoints = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Requests",
              data: counts,
              backgroundColor: "#0ea5e9",
              borderRadius: 4,
              maxBarThickness: 28,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: { ...commonScaleOpts, beginAtZero: true },
            y: { ...commonScaleOpts, ticks: { font: { size: 11 } } },
          },
        },
      });
    } catch { /* silent */ }
  }

  // ── Table: Per-Key Usage ───────────────────────────
  async function loadKeysTable() {
    try {
      const data = await apiGet(`/dashboard/analytics/keys?range=${currentRange}`);
      const tbody = document.getElementById("keys-table-body");
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">No key usage data yet</td></tr>';
        return;
      }
      tbody.innerHTML = data
        .map(
          (k) => `
          <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="py-3 pr-4 font-mono text-xs text-slate-500">${k.maskedKey}</td>
            <td class="py-3 pr-4">
              <span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                k.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }">${k.status}</span>
            </td>
            <td class="py-3 pr-4 text-right font-semibold">${k.count.toLocaleString()}</td>
            <td class="py-3 pr-4 text-right">${k.avgLatency != null ? k.avgLatency + " ms" : "—"}</td>
            <td class="py-3 text-right ${k.errorRate > 5 ? "text-red-600 font-semibold" : ""}">${k.errorRate}%</td>
          </tr>`
        )
        .join("");
    } catch { /* silent */ }
  }

  // ── Table: Recent Requests ─────────────────────────
  async function loadRecentTable() {
    try {
      const data = await apiGet("/dashboard/analytics/recent?limit=25");
      const tbody = document.getElementById("recent-table-body");
      if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-slate-400">No requests yet</td></tr>';
        return;
      }
      tbody.innerHTML = data
        .map(
          (r) => `
          <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="py-2.5 pr-4 font-mono text-xs">${r.endpoint}</td>
            <td class="py-2.5 pr-4 text-xs font-semibold">${r.method}</td>
            <td class="py-2.5 pr-4">${statusBadge(r.statusCode)}</td>
            <td class="py-2.5 pr-4 text-right text-xs">${r.responseTime != null ? r.responseTime.toFixed(1) + " ms" : "—"}</td>
            <td class="py-2.5 pr-4 text-xs text-slate-400">${r.ip || "—"}</td>
            <td class="py-2.5 text-xs text-slate-400" title="${new Date(r.createdAt).toLocaleString()}">${timeAgo(r.createdAt)}</td>
          </tr>`
        )
        .join("");
    } catch { /* silent */ }
  }

  // ── Load all analytics ─────────────────────────────
  async function loadAll() {
    await Promise.all([
      loadUsage(),
      loadOverview(),
      loadRequestsChart(),
      loadLatencyChart(),
      loadStatusChart(),
      loadEndpointsChart(),
      loadKeysTable(),
      loadRecentTable(),
    ]);
  }

  // ── Range selector ─────────────────────────────────
  document.querySelectorAll(".range-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentRange = btn.dataset.range;
      document.querySelectorAll(".range-btn").forEach((b) => {
        b.className = "range-btn px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 hover:bg-slate-50 transition-all";
      });
      btn.className = "range-btn px-3 py-1.5 text-xs font-medium rounded-md bg-sky-500 text-white transition-all";
      // Reload range-dependent data
      loadOverview();
      loadRequestsChart();
      loadLatencyChart();
      loadStatusChart();
      loadEndpointsChart();
      loadKeysTable();
    });
  });

  // ── Initial load ───────────────────────────────────
  await loadAll();

  // ── Auto-refresh every 60s ─────────────────────────
  setInterval(loadAll, 60_000);
});
