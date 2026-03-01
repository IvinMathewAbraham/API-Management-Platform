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
    const mobileUserName = document.getElementById("mobile-user-name");
    if (mobileUserName) mobileUserName.textContent = user?.name || "User";
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.classList.remove("hidden");
    logoutBtn.addEventListener("click", logout);
    document.getElementById("auth-nav").classList.remove("hidden");
    const mobileAuthNav = document.getElementById("mobile-auth-nav");
    if (mobileAuthNav) mobileAuthNav.classList.remove("hidden");
    const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
    if (mobileLogoutBtn) mobileLogoutBtn.classList.remove("hidden");
  } else {
    document.getElementById("auth-nav").classList.add("hidden");
    document.getElementById("logout-btn").classList.add("hidden");
  }

  function syntaxHighlight(json) {
    const str = JSON.stringify(json, null, 2);
    return str.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";    // number
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-string";
        } else if (/true|false/.test(match)) {
          cls = "json-boolean";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  }

  function showResult(data, endpoint, elapsed) {
    errorBox.classList.add("hidden");
    resultBox.classList.remove("hidden");

    // Separate rate-limit meta from display data
    const limit = data._rateLimitLimit;
    const remaining = data._rateLimitRemaining;
    delete data._rateLimitLimit;
    delete data._rateLimitRemaining;

    // Update response header
    document.getElementById("resp-endpoint").textContent = endpoint;
    resultPre.innerHTML = syntaxHighlight(data);

    // Show response time
    const respTime = document.getElementById("resp-time");
    if (respTime && elapsed !== undefined) {
      respTime.textContent = `${elapsed}ms`;
      respTime.classList.remove("hidden");
    }

    const rateInfoBar = document.getElementById("rate-info-bar");
    const rateBar = document.getElementById("rate-bar");

    if (limit !== null && remaining !== null) {
      const used = limit - remaining;
      const pct = limit > 0 ? (remaining / limit) * 100 : 100;
      rateInfo.textContent = `${remaining} / ${limit} remaining`;
      rateInfoBar.classList.remove("hidden");
      rateBar.style.width = `${pct}%`;
      // Color the mini bar based on remaining %
      rateBar.className = `h-full rounded-full transition-all duration-500 ${
        pct < 20 ? "bg-red-500" : pct < 50 ? "bg-amber-400" : "bg-emerald-500"
      }`;
      rateInfo.className = `text-xs font-medium whitespace-nowrap ${
        pct < 20 ? "text-red-600" : pct < 50 ? "text-amber-600" : "text-slate-500"
      }`;
    } else {
      rateInfoBar.classList.add("hidden");
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
    const startTime = performance.now();
    try {
      const data = await apiGet(endpoint, { "x-api-key": key });
      const elapsed = Math.round(performance.now() - startTime);
      showResult(data, endpoint, elapsed);
    } catch (err) {
      if (err.status === 429) {
        showError("Rate limit exceeded. Try again next hour.");
      } else {
        showError(err.message);
      }
    }
  }

  // Copy response button with icon swap
  document.getElementById("copy-response-btn").addEventListener("click", () => {
    const text = resultPre.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const label = document.getElementById("copy-response-label");
      const icon = document.getElementById("copy-resp-icon");
      label.textContent = "Copied!";
      icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>';
      setTimeout(() => {
        label.textContent = "Copy";
        icon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>';
      }, 2000);
    });
  });

  quoteBtn.addEventListener("click", () => callApi("/api/v1/quotes"));
  jokeBtn.addEventListener("click", () => callApi("/api/v1/jokes"));
});
