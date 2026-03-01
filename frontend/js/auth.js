document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, go to dashboard
  if (getToken()) {
    window.location.href = "/dashboard.html";
    return;
  }

  const registerTab = document.getElementById("register-tab");
  const loginTab = document.getElementById("login-tab");
  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const errorBox = document.getElementById("error-box");

  function showTab(tab) {
    if (tab === "register") {
      registerTab.classList.add("border-sky-500", "text-sky-600");
      registerTab.classList.remove("border-transparent", "text-slate-500");
      loginTab.classList.remove("border-sky-500", "text-sky-600");
      loginTab.classList.add("border-transparent", "text-slate-500");
      registerForm.classList.remove("hidden");
      loginForm.classList.add("hidden");
    } else {
      loginTab.classList.add("border-sky-500", "text-sky-600");
      loginTab.classList.remove("border-transparent", "text-slate-500");
      registerTab.classList.remove("border-sky-500", "text-sky-600");
      registerTab.classList.add("border-transparent", "text-slate-500");
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    }
    errorBox.classList.add("hidden");
  }

  registerTab.addEventListener("click", () => showTab("register"));
  loginTab.addEventListener("click", () => showTab("login"));

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  // Register
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    try {
      const data = await apiPost("/auth/register", { name, email, password });
      saveAuth(data);
      window.location.href = "/dashboard.html";
    } catch (err) {
      showError(err.message);
    }
  });

  // Login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
      const data = await apiPost("/auth/login", { email, password });
      saveAuth(data);
      window.location.href = "/dashboard.html";
    } catch (err) {
      showError(err.message);
    }
  });
});
