import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch } from "../api/client.js";

export default function Keys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [newRawKey, setNewRawKey] = useState(null); // full key shown once after generation

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/apikey/me");
      setKeys(data.keys ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const data = await apiPost("/apikey/generate");
      setNewRawKey(data.apiKey);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function revoke(id) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await apiPatch(`/apikey/${id}/revoke`);
      setKeys((prev) => prev.map((k) => (k._id === id ? { ...k, status: "revoked" } : k)));
    } catch (err) {
      setError(err.message);
    }
  }

  function copyKey(text, id) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  /** Display a masked version: first 8 chars + **************** */
  function maskedKey(prefix) {
    return `${prefix}${"*".repeat(24)}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-in">{error}</div>}

      {/* One-time raw key banner */}
      {newRawKey && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
            <span className="text-sm font-bold text-amber-800">Copy your API key now — it won't be shown again!</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded-lg text-slate-800 break-all border border-amber-200">
              {newRawKey}
            </code>
            <button onClick={() => copyKey(newRawKey, "new")} className="shrink-0 px-3 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors">
              {copiedId === "new" ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewRawKey(null)} className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">API Keys</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your API keys for accessing the platform.</p>
        </div>
        <button onClick={generate} disabled={generating} className="px-4 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-sky-200">
          {generating ? (<><SpinnerIcon /> Generating...</>) : (<><PlusIcon /> Generate Key</>)}
        </button>
      </div>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No API Keys Yet</h3>
          <p className="text-sm text-slate-500 mb-6">Generate your first API key to start making requests.</p>
          <button onClick={generate} disabled={generating} className="px-5 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-all shadow-sm shadow-sky-200">
            Generate Your First Key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k._id} className={`bg-white rounded-xl border p-5 transition-all ${k.status === "revoked" ? "border-slate-200 opacity-60" : "border-slate-200 hover:border-sky-200 hover:shadow-sm"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <code className="text-sm font-mono bg-slate-50 px-3 py-1.5 rounded-lg text-slate-700 break-all">
                      {maskedKey(k.keyPrefix)}
                    </code>
                    {k.status === "active" && (
                      <button onClick={() => copyKey(maskedKey(k.keyPrefix), k._id)} className="shrink-0 text-slate-400 hover:text-sky-600 transition-colors" title="Copy prefix">
                        {copiedId === k._id ? <CheckIcon /> : <CopyIcon />}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-xs ${k.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${k.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {k.status}
                    </span>
                    <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {k.status === "active" && (
                  <button onClick={() => revoke(k._id)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>;
}
function SpinnerIcon() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />;
}
function CopyIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg>;
}
function CheckIcon() {
  return <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m4.5 12.75 6 6 9-13.5" /></svg>;
}
