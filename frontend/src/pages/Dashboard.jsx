import { useState, useEffect, useRef, useCallback } from "react";
import useAuth from "../hooks/useAuth.js";
import { apiGet } from "../api/client.js";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);
ChartJS.defaults.font.family = "system-ui, -apple-system, sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = "#64748b";

const commonScaleOpts = { grid: { color: "rgba(148,163,184,0.12)" }, ticks: { maxTicksLimit: 8 } };

function formatTime(t) {
  if (!t) return "";
  if (t.includes("T")) return t.split("T")[1];
  const d = new Date(t + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}
function statusColor(code) {
  if (code < 300) return "#10b981";
  if (code < 400) return "#f59e0b";
  if (code < 500) return "#f97316";
  return "#ef4444";
}
function statusBadge(code) {
  const colors = { 2: "bg-emerald-100 text-emerald-700", 3: "bg-amber-100 text-amber-700", 4: "bg-orange-100 text-orange-700", 5: "bg-red-100 text-red-700" };
  const group = Math.floor(code / 100);
  return <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${colors[group] || "bg-slate-100 text-slate-600"}`}>{code}</span>;
}
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function animateCountUp(el, target) {
  if (!el) return;
  const duration = 600;
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString();
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState("24h");
  const [error, setError] = useState("");

  // Refs for count-up
  const totalRef = useRef(null);
  const hourRef = useRef(null);
  const remainRef = useRef(null);
  const latencyRef = useRef(null);

  // Data state
  const [usage, setUsage] = useState(null);
  const [overview, setOverview] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [latencyData, setLatencyData] = useState([]);
  const [statusCodes, setStatusCodes] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [keysData, setKeysData] = useState([]);
  const [recent, setRecent] = useState([]);

  const loadAll = useCallback(async () => {
    try {
      const [usageRes, overviewRes, tsRes, latRes, scRes, epRes, keysRes, recRes] = await Promise.all([
        apiGet("/dashboard/usage"),
        apiGet(`/dashboard/analytics/overview?range=${range}`),
        apiGet(`/dashboard/analytics/timeseries?range=${range}`),
        apiGet(`/dashboard/analytics/latency?range=${range}`),
        apiGet(`/dashboard/analytics/status-codes?range=${range}`),
        apiGet(`/dashboard/analytics/endpoints?range=${range}`),
        apiGet(`/dashboard/analytics/keys?range=${range}`),
        apiGet("/dashboard/analytics/recent?limit=25"),
      ]);
      setUsage(usageRes);
      setOverview(overviewRes);
      setTimeseries(tsRes);
      setLatencyData(latRes);
      setStatusCodes(scRes);
      setEndpoints(epRes);
      setKeysData(keysRes);
      setRecent(recRes);

      // Animate count-ups
      animateCountUp(totalRef.current, usageRes.totalRequests);
      animateCountUp(hourRef.current, usageRes.requestsThisHour);
      animateCountUp(remainRef.current, usageRes.remaining);
      animateCountUp(latencyRef.current, Math.round(overviewRes.avgLatency));
    } catch (err) {
      setError(err.message);
    }
  }, [range]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { const id = setInterval(loadAll, 60000); return () => clearInterval(id); }, [loadAll]);

  const pct = usage ? (usage.limit > 0 ? Math.round((usage.requestsThisHour / usage.limit) * 100) : 0) : 0;

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 animate-fade-in">{error}</div>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Plan" border="border-l-sky-500">
          <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${usage?.plan === "pro" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-800"}`}>
            {usage?.plan?.toUpperCase() || "—"}
          </span>
        </StatCard>
        <StatCard label="Total Requests" border="border-l-violet-500"><span ref={totalRef}>0</span></StatCard>
        <StatCard label="This Hour" border="border-l-emerald-500"><span ref={hourRef}>0</span></StatCard>
        <StatCard label="Remaining" border="border-l-amber-500">
          <span ref={remainRef}>0</span>
          <span className="text-sm text-slate-400 font-normal"> / {usage?.limit || 0}</span>
        </StatCard>
        <StatCard label="Avg Latency" border="border-l-pink-500"><span ref={latencyRef}>0</span><span className="text-sm text-slate-400 font-normal"> ms</span></StatCard>
        <StatCard label="Error Rate" border="border-l-red-500">{overview?.errorRate?.toFixed(1) || "0.0"}%</StatCard>
      </div>

      {/* Usage bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Hourly Usage</span>
          <span className={`text-sm font-semibold ${pct > 85 ? "text-red-600" : pct > 60 ? "text-amber-600" : "text-slate-500"}`}>{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ease-out ${pct > 85 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-2 mb-6">
        {["24h", "7d", "30d"].map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${range === r ? "bg-sky-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            {r}
          </button>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <ChartCard title="Requests Over Time">
          <Line data={{
            labels: timeseries.map((d) => formatTime(d.time)),
            datasets: [
              { label: "Requests", data: timeseries.map((d) => d.count), borderColor: "#0ea5e9", backgroundColor: "rgba(14,165,233,0.08)", fill: true, tension: 0.3, pointRadius: 3, pointHoverRadius: 5 },
              { label: "Errors", data: timeseries.map((d) => d.errorCount), borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)", fill: true, tension: 0.3, pointRadius: 2, pointHoverRadius: 4 },
            ],
          }} options={{ responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: "index" }, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } } }, scales: { x: commonScaleOpts, y: { ...commonScaleOpts, beginAtZero: true } } }} />
        </ChartCard>

        <ChartCard title="Latency Over Time">
          <Line data={{
            labels: latencyData.map((d) => formatTime(d.time)),
            datasets: [
              { label: "Avg (ms)", data: latencyData.map((d) => d.avg), borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,0.08)", fill: true, tension: 0.3, pointRadius: 3 },
              { label: "P95 (ms)", data: latencyData.map((d) => d.p95), borderColor: "#f59e0b", borderDash: [5, 3], tension: 0.3, pointRadius: 2, fill: false },
              { label: "Max (ms)", data: latencyData.map((d) => d.max), borderColor: "#ef4444", borderDash: [2, 2], tension: 0.3, pointRadius: 1, fill: false },
            ],
          }} options={{ responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: "index" }, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } } }, scales: { x: commonScaleOpts, y: { ...commonScaleOpts, beginAtZero: true, title: { display: true, text: "ms" } } } }} />
        </ChartCard>

        <ChartCard title="Status Code Distribution">
          <Doughnut data={{
            labels: statusCodes.map((d) => String(d.statusCode)),
            datasets: [{ data: statusCodes.map((d) => d.count), backgroundColor: statusCodes.map((d) => statusColor(d.statusCode)), borderWidth: 0 }],
          }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 12, padding: 12 } } } }} />
        </ChartCard>

        <ChartCard title="Top Endpoints">
          <Bar data={{
            labels: endpoints.slice(0, 8).map((d) => d.endpoint),
            datasets: [{ label: "Requests", data: endpoints.slice(0, 8).map((d) => d.count), backgroundColor: "#0ea5e9", borderRadius: 4, maxBarThickness: 28 }],
          }} options={{ responsive: true, maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { ...commonScaleOpts, beginAtZero: true }, y: { ...commonScaleOpts, ticks: { font: { size: 11 } } } } }} />
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Per-key usage */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-800 text-sm">Per-Key Usage</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-medium">Key</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-right px-3 py-2.5 font-medium">Requests</th>
                <th className="text-right px-3 py-2.5 font-medium">Avg Latency</th>
                <th className="text-right px-5 py-2.5 font-medium">Error Rate</th>
              </tr></thead>
              <tbody>
                {keysData.length === 0 ? (
                  <tr><td colSpan="5" className="py-6 text-center text-slate-400">No key usage data yet</td></tr>
                ) : keysData.map((k) => (
                  <tr key={k.apiKeyId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-slate-500">{k.maskedKey}</td>
                    <td className="py-3 px-3"><span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${k.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{k.status}</span></td>
                    <td className="py-3 px-3 text-right font-semibold">{k.count.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">{k.avgLatency != null ? `${k.avgLatency} ms` : "—"}</td>
                    <td className={`py-3 px-5 text-right ${k.errorRate > 5 ? "text-red-600 font-semibold" : ""}`}>{k.errorRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent requests */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h3 className="font-semibold text-slate-800 text-sm">Recent Requests</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left px-5 py-2.5 font-medium">Endpoint</th>
                <th className="text-left px-3 py-2.5 font-medium">Method</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-right px-3 py-2.5 font-medium">Latency</th>
                <th className="text-left px-3 py-2.5 font-medium">IP</th>
                <th className="text-right px-5 py-2.5 font-medium">Time</th>
              </tr></thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan="6" className="py-6 text-center text-slate-400">No requests yet</td></tr>
                ) : recent.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-5 font-mono text-xs">{r.endpoint}</td>
                    <td className="py-2.5 px-3 text-xs font-semibold">{r.method}</td>
                    <td className="py-2.5 px-3">{statusBadge(r.statusCode)}</td>
                    <td className="py-2.5 px-3 text-right text-xs">{r.responseTime != null ? `${r.responseTime.toFixed(1)} ms` : "—"}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-400">{r.ip || "—"}</td>
                    <td className="py-2.5 px-5 text-xs text-slate-400 text-right" title={new Date(r.createdAt).toLocaleString()}>{timeAgo(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {usage?.plan === "free" && (
        <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 border border-sky-200 rounded-xl p-6 text-center">
          <h3 className="font-bold text-slate-800">Need more requests?</h3>
          <p className="text-sm text-slate-500 mt-1">Upgrade to Pro for 1,000 requests/hour and advanced analytics.</p>
          <Link to="/plans" className="inline-block mt-4 px-6 py-2.5 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition-all shadow-sm shadow-sky-200">
            View Plans
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, border, children }) {
  return (
    <div className={`stat-card bg-white rounded-xl border border-slate-200 border-l-4 ${border} p-4`}>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-slate-800">{children}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 text-sm mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}
