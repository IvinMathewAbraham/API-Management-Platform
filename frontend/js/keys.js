document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "User";
  const mobileUserName = document.getElementById("mobile-user-name");
  if (mobileUserName) mobileUserName.textContent = user?.name || "User";
  document.getElementById("logout-btn").addEventListener("click", logout);

  const keyAlert = document.getElementById("key-alert");
  const keyValue = document.getElementById("key-value");
  const copyBtn = document.getElementById("copy-btn");
  const keysBody = document.getElementById("keys-body");
  const genBtn = document.getElementById("generate-btn");
  const genError = document.getElementById("gen-error");

  async function loadKeys() {
    try {
      const data = await apiGet("/apikey/me");
      keysBody.innerHTML = "";
      if (data.keys.length === 0) {
        keysBody.innerHTML = `
          <tr>
            <td colspan="4" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <svg class="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"/>
                </svg>
                <p class="text-slate-500 font-medium">No API keys yet</p>
                <p class="text-slate-400 text-sm">Generate your first API key to get started.</p>
              </div>
            </td>
          </tr>`;
        return;
      }
      data.keys.forEach((k) => {
        const tr = document.createElement("tr");
        tr.className = "border-t border-slate-100 hover:bg-slate-50 transition-colors";
        const statusBadge =
          k.status === "active"
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Active
              </span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                Revoked
              </span>`;
        const revokeBtn =
          k.status === "active"
            ? `<button class="revoke-btn text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all" data-id="${k._id}">Revoke</button>`
            : `<span class="text-xs text-slate-400">—</span>`;
        tr.innerHTML = `
          <td class="px-6 py-4 font-mono text-sm text-slate-600">${k._id}</td>
          <td class="px-6 py-4">${statusBadge}</td>
          <td class="px-6 py-4 text-sm text-slate-500">${new Date(k.createdAt).toLocaleString()}</td>
          <td class="px-6 py-4">${revokeBtn}</td>
        `;
        keysBody.appendChild(tr);
      });

      // Attach revoke handlers
      keysBody.querySelectorAll(".revoke-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const keyId = btn.dataset.id;
          if (!confirm("Revoke this API key? This cannot be undone.")) return;
          btn.disabled = true;
          btn.textContent = "Revoking…";
          try {
            await apiPatch(`/apikey/${keyId}/revoke`);
            await loadKeys();
          } catch (err) {
            genError.textContent = err.message;
            genError.classList.remove("hidden");
          }
        });
      });
    } catch (err) {
      genError.textContent = err.message;
      genError.classList.remove("hidden");
    }
  }

  // Generate key
  genBtn.addEventListener("click", async () => {
    genError.classList.add("hidden");
    keyAlert.classList.add("hidden");
    genBtn.disabled = true;
    genBtn.textContent = "Generating…";

    try {
      const data = await apiPost("/apikey/generate");
      keyValue.textContent = data.apiKey;
      keyAlert.classList.remove("hidden");
      await loadKeys();
    } catch (err) {
      genError.textContent = err.message;
      genError.classList.remove("hidden");
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = "Generate New API Key";
    }
  });

  // Copy to clipboard with icon swap
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(keyValue.textContent).then(() => {
      const label = document.getElementById("copy-label");
      const icon = document.getElementById("copy-icon");
      label.textContent = "Copied!";
      icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>';
      setTimeout(() => {
        label.textContent = "Copy";
        icon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>';
      }, 2000);
    });
  });

  // Initial load
  await loadKeys();
});
