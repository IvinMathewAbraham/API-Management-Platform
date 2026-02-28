document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();

  const user = getUser();
  document.getElementById("user-name").textContent = user?.name || "User";
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
        keysBody.innerHTML = `<tr><td colspan="3" class="px-6 py-8 text-center text-gray-400">No API keys yet. Generate one above.</td></tr>`;
        return;
      }
      data.keys.forEach((k) => {
        const tr = document.createElement("tr");
        tr.className = "border-t border-gray-100";
        const statusClass =
          k.status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700";
        tr.innerHTML = `
          <td class="px-6 py-4 font-mono text-sm text-gray-600">${k._id}</td>
          <td class="px-6 py-4"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">${k.status}</span></td>
          <td class="px-6 py-4 text-sm text-gray-500">${new Date(k.createdAt).toLocaleString()}</td>
        `;
        keysBody.appendChild(tr);
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

  // Copy to clipboard
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(keyValue.textContent).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 2000);
    });
  });

  // Initial load
  await loadKeys();
});
