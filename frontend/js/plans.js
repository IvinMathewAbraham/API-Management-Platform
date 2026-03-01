document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "User";
  const mobileUserName = document.getElementById("mobile-user-name");
  if (mobileUserName) mobileUserName.textContent = user?.name || "User";
  document.getElementById("logout-btn").addEventListener("click", logout);

  // ── DOM references ──────────────────
  const planFreeCard = document.getElementById("plan-free-card");
  const planProCard = document.getElementById("plan-pro-card");
  const freeCheck = document.getElementById("free-check");
  const proCheck = document.getElementById("pro-check");
  const selectFreeBtn = document.getElementById("select-free-btn");
  const selectProBtn = document.getElementById("select-pro-btn");
  const planError = document.getElementById("plan-error");
  const planSuccess = document.getElementById("plan-success");
  const confirmModal = document.getElementById("confirm-modal");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmOkBtn = document.getElementById("confirm-ok-btn");

  let currentPlan = "free";

  // ── Highlight current plan card ─────
  function highlightPlanCards(plan) {
    currentPlan = plan;
    if (plan === "free") {
      planFreeCard.classList.replace("border-slate-200", "border-sky-500");
      planFreeCard.classList.add("bg-sky-50/50");
      planProCard.classList.replace("border-sky-500", "border-slate-200");
      planProCard.classList.remove("bg-sky-50/50");
      freeCheck.classList.remove("hidden");
      proCheck.classList.add("hidden");
      selectFreeBtn.disabled = true;
      selectFreeBtn.textContent = "Current Plan";
      selectProBtn.disabled = false;
      selectProBtn.textContent = "Upgrade to Pro";
    } else {
      planProCard.classList.replace("border-slate-200", "border-sky-500");
      planProCard.classList.add("bg-sky-50/50");
      planFreeCard.classList.replace("border-sky-500", "border-slate-200");
      planFreeCard.classList.remove("bg-sky-50/50");
      proCheck.classList.remove("hidden");
      freeCheck.classList.add("hidden");
      selectProBtn.disabled = true;
      selectProBtn.textContent = "Current Plan";
      selectFreeBtn.disabled = false;
      selectFreeBtn.textContent = "Switch to Free";
    }
  }

  // ── Confirmation modal ──────────────
  function showConfirmModal(targetPlan) {
    const isUpgrade = targetPlan === "pro";
    confirmTitle.textContent = isUpgrade ? "Upgrade to Pro" : "Downgrade to Free";
    confirmMessage.textContent = isUpgrade
      ? "You'll get 1,000 requests per hour (10x the free plan). Your plan will be updated immediately."
      : "You'll be limited to 100 requests per hour. Your plan will be downgraded immediately.";
    confirmOkBtn.textContent = isUpgrade ? "Upgrade Now" : "Downgrade";
    confirmOkBtn.className = isUpgrade
      ? "flex-1 py-2.5 rounded-lg text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-200 transition-all"
      : "flex-1 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200 transition-all";

    // Replace old listener by cloning
    const newBtn = confirmOkBtn.cloneNode(true);
    confirmOkBtn.parentNode.replaceChild(newBtn, confirmOkBtn);
    // Update reference — the outer confirmOkBtn is now stale, so grab the new one
    const okBtn = document.getElementById("confirm-ok-btn");

    okBtn.addEventListener("click", async () => {
      okBtn.disabled = true;
      okBtn.textContent = "Updating…";
      await executePlanChange(targetPlan);
      closeConfirmModal();
      okBtn.disabled = false;
    });

    confirmModal.classList.remove("hidden");
  }

  // ── Execute plan change ─────────────
  async function executePlanChange(newPlan) {
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
    } catch (err) {
      planError.textContent = err.message;
      planError.classList.remove("hidden");
    }
  }

  // ── Button click handlers ───────────
  selectFreeBtn.addEventListener("click", () => {
    if (currentPlan === "free") return;
    showConfirmModal("free");
  });
  selectProBtn.addEventListener("click", () => {
    if (currentPlan === "pro") return;
    showConfirmModal("pro");
  });

  // ── Load current plan on page load ──
  try {
    const data = await apiGet("/dashboard/usage");
    highlightPlanCards(data.plan);
  } catch (err) {
    planError.textContent = err.message;
    planError.classList.remove("hidden");
  }
});
