import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../../api/client.js";

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

export default function AdminLogs() {
  const [data, setData] = useState({ logs: [], total: 0, page: 1, pages: 1 });
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ endpoint: "", method: "", statusCode: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (filters.endpoint) params.set("endpoint", filters.endpoint);
      if (filters.method) params.set("method", filters.method);
      if (filters.statusCode) params.set("statusCode", filters.statusCode);
      const [logsRes, statsRes] = await Promise.all([
        apiGet(`/admin/logs?${params}`),
        stats === null ? apiGet("/admin/logs/stats") : Promise.resolve(stats),
      ]);
      setData(logsRes);
      if (stats === null) setStats(statsRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">Request Logs</h2>
      <p className="text-sm text-slate-500 mb-6">Browse all API request logs across the platform.</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MiniCard label="Total Logs" value={stats.totalLogs?.toLocaleString()} />
          <MiniCard label="Last 24h Requests" value={stats.last24h?.requests?.toLocaleString()} />
          <MiniCard label="Avg Latency (24h)" value={`${stats.last24h?.avgLatency} ms`} />
          <MiniCard label="Error Rate (24h)" value={`${stats.last24h?.errorRate}%`} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" placeholder="Filter endpoint..." value={filters.endpoint} onChange={(e) => updateFilter("endpoint", e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 w-48" />
        <select value={filters.method} onChange={(e) => updateFilter("method", e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400">
          <option value="">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <select value={filters.statusCode} onChange={(e) => updateFilter("statusCode", e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400">
          <option value="">All Status</option>
          <option value="200">200</option>
          <option value="401">401</option>
          <option value="403">403</option>
          <option value="404">404</option>
          <option value="429">429</option>
          <option value="500">500</option>
        </select>
        <span className="ml-auto text-sm text-slate-400 self-center">{data.total} logs</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium">Endpoint</th>
                <th className="text-left px-3 py-3 font-medium">Method</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="text-right px-3 py-3 font-medium">Latency</th>
                <th className="text-left px-3 py-3 font-medium">User</th>
                <th className="text-left px-3 py-3 font-medium">IP</th>
                <th className="text-right px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : data.logs.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-slate-400">No logs found</td></tr>
              ) : data.logs.map((l) => (
                <tr key={l._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-xs">{l.endpoint}</td>
                  <td className="py-2.5 px-3 text-xs font-semibold">{l.method}</td>
                  <td className="py-2.5 px-3">{statusBadge(l.statusCode)}</td>
                  <td className="py-2.5 px-3 text-right text-xs">{l.responseTime != null ? `${l.responseTime.toFixed(1)} ms` : "—"}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-500">{l.user?.name || "—"}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-400">{l.ip || "—"}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-400 text-right" title={new Date(l.createdAt).toLocaleString()}>{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">Prev</button>
          <span className="text-sm text-slate-500">Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

function MiniCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}
