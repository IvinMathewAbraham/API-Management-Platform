document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "User";
  document.getElementById("logout-btn").addEventListener("click", logout);

  // ── Plan management elements ────────
  const planFreeCard = document.getElementById("plan-free-card");
  const planProCard = document.getElementById("plan-pro-card");
  const freeCheck = document.getElementById("free-check");
  const proCheck = document.getElementById("pro-check");
  const selectFreeBtn = document.getElementById("select-free-btn");
  const selectProBtn = document.getElementById("select-pro-btn");
  const planError = document.getElementById("plan-error");
  const planSuccess = document.getElementById("plan-success");

  function highlightPlanCards(plan) {
    if (plan === "free") {
      planFreeCard.classList.replace("border-gray-200", "border-indigo-500");
      planProCard.classList.replace("border-indigo-500", "border-gray-200");
      freeCheck.classList.remove("hidden");
      proCheck.classList.add("hidden");
      selectFreeBtn.disabled = true;
      selectFreeBtn.textContent = "Current Plan";
      selectProBtn.disabled = false;
      selectProBtn.textContent = "Upgrade to Pro";
    } else {
      planProCard.classList.replace("border-gray-200", "border-indigo-500");
      planFreeCard.classList.replace("border-indigo-500", "border-gray-200");
      proCheck.classList.remove("hidden");
      freeCheck.classList.add("hidden");
      selectProBtn.disabled = true;
      selectProBtn.textContent = "Current Plan";
      selectFreeBtn.disabled = false;
      selectFreeBtn.textContent = "Switch to Free";
    }
  }

  async function changePlan(newPlan) {
    planError.classList.add("hidden");
    planSuccess.classList.add("hidden");
    try {
      const data = await apiPatch("/user/plan", { plan: newPlan });
      // Update localStorage with new user info
      const updatedUser = data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      highlightPlanCards(newPlan);
      planSuccess.textContent = `Plan updated to ${newPlan.toUpperCase()} successfully!`;
      planSuccess.classList.remove("hidden");
      // Refresh usage stats to reflect new limits
      await loadUsage();
    } catch (err) {
      planError.textContent = err.message;
      planError.classList.remove("hidden");
    }
  }

  selectFreeBtn.addEventListener("click", () => changePlan("free"));
  selectProBtn.addEventListener("click", () => changePlan("pro"));

  // ── Usage stats ─────────────────────
  async function loadUsage() {
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

      // Highlight current plan card
      highlightPlanCards(data.plan);
    } catch (err) {
      document.getElementById("dashboard-error").textContent = err.message;
      document.getElementById("dashboard-error").classList.remove("hidden");
    }
  }

  await loadUsage();
});
