// Shared API client
// When served behind nginx proxy, base is "" (same origin).
// For local dev without nginx, set to "http://localhost:5000".
const API_BASE = "";

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

function saveAuth(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "/index.html";
  }
}

function logout() {
  clearAuth();
  window.location.href = "/index.html";
}

async function apiPost(url, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/index.html";
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || "Request failed" };
  return data;
}

async function apiGet(url, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { headers });

  if (res.status === 401 && !extraHeaders["x-api-key"]) {
    clearAuth();
    window.location.href = "/index.html";
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || "Request failed" };

  // Attach rate-limit headers if present
  data._rateLimitLimit = res.headers.get("X-RateLimit-Limit");
  data._rateLimitRemaining = res.headers.get("X-RateLimit-Remaining");

  return data;
}

async function apiPatch(url, body = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/index.html";
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || "Request failed" };
  return data;
}
