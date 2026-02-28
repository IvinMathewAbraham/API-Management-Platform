document.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("api-key-input");
  const quoteBtn = document.getElementById("quote-btn");
  const jokeBtn = document.getElementById("joke-btn");
  const resultBox = document.getElementById("result-box");
  const resultPre = document.getElementById("result-json");
  const rateInfo = document.getElementById("rate-info");
  const errorBox = document.getElementById("pg-error");

  // Optional: if user is logged in show nav
  if (getToken()) {
    const user = getUser();
    document.getElementById("user-name").textContent = user?.name || "User";
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.classList.remove("hidden");
    logoutBtn.addEventListener("click", logout);
    document.getElementById("auth-nav").classList.remove("hidden");
  } else {
    document.getElementById("auth-nav").classList.add("hidden");
    document.getElementById("logout-btn").classList.add("hidden");
  }

  function showResult(data) {
    errorBox.classList.add("hidden");
    resultBox.classList.remove("hidden");

    // Separate rate-limit meta from display data
    const limit = data._rateLimitLimit;
    const remaining = data._rateLimitRemaining;
    delete data._rateLimitLimit;
    delete data._rateLimitRemaining;

    resultPre.textContent = JSON.stringify(data, null, 2);

    if (limit !== null && remaining !== null) {
      rateInfo.textContent = `${remaining} requests remaining of ${limit} this hour`;
      rateInfo.classList.remove("hidden");
      const pct = limit > 0 ? (remaining / limit) * 100 : 100;
      rateInfo.className = `mt-3 text-sm font-medium ${
        pct < 20 ? "text-red-600" : pct < 50 ? "text-yellow-600" : "text-green-600"
      }`;
    } else {
      rateInfo.classList.add("hidden");
    }
  }

  function showError(msg) {
    resultBox.classList.add("hidden");
    rateInfo.classList.add("hidden");
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  async function callApi(endpoint) {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showError("Please enter an API key.");
      return;
    }
    try {
      const data = await apiGet(endpoint, { "x-api-key": key });
      showResult(data);
    } catch (err) {
      if (err.status === 429) {
        showError("Rate limit exceeded. Try again next hour.");
      } else {
        showError(err.message);
      }
    }
  }

  quoteBtn.addEventListener("click", () => callApi("/api/v1/quotes"));
  jokeBtn.addEventListener("click", () => callApi("/api/v1/jokes"));
});
