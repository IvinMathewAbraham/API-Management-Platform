document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "User";
  document.getElementById("logout-btn").addEventListener("click", logout);

  try {
    const data = await apiGet("/dashboard/usage");
    document.getElementById("plan-badge").textContent = data.plan.toUpperCase();
    document.getElementById("plan-badge").className =
      data.plan === "pro"
        ? "inline-block px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800"
        : "inline-block px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800";

    document.getElementById("total-requests").textContent = data.totalRequests;
    document.getElementById("requests-hour").textContent = data.requestsThisHour;
    document.getElementById("remaining").textContent = data.remaining;
    document.getElementById("limit").textContent = data.limit;

    // Progress bar
    const pct = data.limit > 0 ? Math.round((data.requestsThisHour / data.limit) * 100) : 0;
    const bar = document.getElementById("usage-bar");
    bar.style.width = `${Math.min(pct, 100)}%`;
    bar.className = `h-full rounded-full transition-all duration-500 ${
      pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-green-500"
    }`;
  } catch (err) {
    document.getElementById("dashboard-error").textContent = err.message;
    document.getElementById("dashboard-error").classList.remove("hidden");
  }
});
