import { useState, useEffect } from "react";
import { apiGet } from "../api/client.js";

const endpoints = [
  { id: "random-quote", label: "Random Quote", path: "/api/v1/quotes", color: "sky" },
  { id: "random-joke", label: "Random Joke", path: "/api/v1/jokes", color: "emerald" },
];

function syntaxHighlight(json) {
  if (!json) return "";
  const str = typeof json === "string" ? json : JSON.stringify(json, null, 2);
  return str.replace(/("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
    let cls = "json-number";
    if (/^"/.test(match)) {
      cls = /:$/.test(match) ? "json-key" : "json-string";
    } else if (/true|false/.test(match)) {
      cls = "json-boolean";
    } else if (/null/.test(match)) {
      cls = "json-null";
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

export default function Playground() {
  const [apiKey, setApiKey] = useState("");
  const [selected, setSelected] = useState(endpoints[0]);
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState(null);
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimit, setRateLimit] = useState(null);

  // Try to load first active key
  useEffect(() => {
    apiGet("/apikey/me").then((data) => {
      const list = data.keys ?? [];
      const active = list.find((k) => k.status === "active");
      if (active) setApiKey(""); // key prefix only — user must paste full key
    }).catch(() => {});
  }, []);

  async function callApi() {
    if (!apiKey.trim()) { setError("Enter an API key"); return; }
    setLoading(true);
    setError("");
    setResponse(null);
    setStatus(null);
    setLatency(null);
    setRateLimit(null);

    const start = performance.now();
    try {
      const res = await fetch(selected.path, {
        headers: { "x-api-key": apiKey.trim() },
      });
      const elapsed = performance.now() - start;
      setLatency(Math.round(elapsed));
      setStatus(res.status);

      // Rate limit headers
      const rl = {
        limit: res.headers.get("x-ratelimit-limit"),
        remaining: res.headers.get("x-ratelimit-remaining"),
        reset: res.headers.get("x-ratelimit-reset"),
      };
      if (rl.limit) setRateLimit(rl);

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const rlPct = rateLimit ? Math.round(((rateLimit.limit - rateLimit.remaining) / rateLimit.limit) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">API Playground</h2>
        <p className="text-sm text-slate-500 mt-0.5">Test API endpoints with your key and see live responses.</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-in">{error}</div>}

      {/* API Key input */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-2">API Key</label>
        <div className="flex gap-3">
          <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key..." className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all" />
        </div>
      </div>

      {/* Endpoint selector + call */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <label className="block text-xs font-medium text-slate-500 mb-3">Endpoint</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {endpoints.map((ep) => (
            <button key={ep.id} onClick={() => setSelected(ep)} className={`p-3 rounded-lg border text-left transition-all text-xs font-medium ${selected.id === ep.id ? `border-${ep.color}-400 bg-${ep.color}-50 text-${ep.color}-700 ring-2 ring-${ep.color}-100` : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
              <div className="font-semibold">{ep.label}</div>
              <div className="mt-1 font-mono text-[10px] opacity-70">{ep.path}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 bg-slate-50 rounded-lg border border-slate-200 p-3">
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">GET</span>
          <code className="text-sm text-slate-600 font-mono flex-1 truncate">{selected.path}</code>
          <button onClick={callApi} disabled={loading} className="px-5 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0">
            {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Calling...</>) : "Send Request"}
          </button>
        </div>
      </div>

      {/* Rate limit bar */}
      {rateLimit && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Rate Limit</span>
            <span className="text-xs text-slate-400">{rateLimit.remaining} / {rateLimit.limit} remaining</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${rlPct > 85 ? "bg-red-500" : rlPct > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(rlPct, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Response */}
      {(response || status) && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500">Response</span>
              {status && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status < 300 ? "bg-emerald-100 text-emerald-700" : status < 400 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {status}
                </span>
              )}
            </div>
            {latency != null && (
              <span className="text-xs text-slate-400">{latency} ms</span>
            )}
          </div>
          <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto max-h-96 json-output" dangerouslySetInnerHTML={{ __html: syntaxHighlight(response) }} />
        </div>
      )}
    </div>
  );
}
