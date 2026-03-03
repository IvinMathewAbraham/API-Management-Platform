// Shared API client — mirrors the original vanilla JS api.js
// When served behind nginx/vite proxy, base is "" (same origin).

const API_BASE = "";

export function getToken() {
  return localStorage.getItem("token");
}

export function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}

export function saveAuth(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function apiPost(url, body) {
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
    // Use a custom event or flag instead of hard navigation
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || "Request failed" };
  return data;
}

export async function apiGet(url, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { headers });

  if (res.status === 401 && !extraHeaders["x-api-key"]) {
    clearAuth();
    // Use a custom event or flag instead of hard navigation
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || "Request failed" };

  // Attach rate-limit headers if present
  data._rateLimitLimit = res.headers.get("X-RateLimit-Limit");
  data._rateLimitRemaining = res.headers.get("X-RateLimit-Remaining");

  return data;
}

export async function apiPatch(url, body = {}) {
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
    // Use a custom event or flag instead of hard navigation
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || "Request failed" };
  return data;
}

export async function apiDelete(url) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { method: "DELETE", headers });

  if (res.status === 401) {
    clearAuth();
    // Use a custom event or flag instead of hard navigation
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Session expired");
  }

  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || "Request failed" };
  return data;
}
