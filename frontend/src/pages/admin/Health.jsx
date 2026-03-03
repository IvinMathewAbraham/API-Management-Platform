import { useState, useEffect } from "react";
import { apiGet } from "../../api/client.js";

export default function AdminHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await apiGet("/admin/health");
      setHealth(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const id = setInterval(load, 30000); return () => clearInterval(id); }, []);

  function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    parts.push(`${m}m`);
    return parts.join(" ");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>;
  }

  const statusDot = (ok) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">System Health</h2>
          <p className="text-sm text-slate-500">Real-time platform health and statistics. Auto-refreshes every 30s.</p>
        </div>
        <button onClick={load} className="px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
          Refresh
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusCard label="Overall" value={health.status?.toUpperCase()} ok={health.status === "ok"}>
          {statusDot(health.status === "ok")}
        </StatusCard>
        <StatusCard label="MongoDB" value={health.mongo} ok={health.mongo === "connected"}>
          {statusDot(health.mongo === "connected")}
        </StatusCard>
        <StatusCard label="Redis" value={health.redis} ok={health.redis === "connected"}>
          {statusDot(health.redis === "connected")}
        </StatusCard>
        <StatusCard label="Uptime" value={formatUptime(health.uptime)} ok={true} />
      </div>

      {/* System info */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Server Info</h3>
          <dl className="space-y-3">
            <InfoRow label="Memory Usage" value={`${health.memoryMB} MB`} />
            <InfoRow label="Node.js" value={health.nodeVersion} />
            {health.redisInfo && <InfoRow label="Redis Memory" value={health.redisInfo.usedMemory} />}
            <InfoRow label="Last Check" value={new Date(health.timestamp).toLocaleTimeString()} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Platform Counts</h3>
          <dl className="space-y-3">
            <InfoRow label="Total Users" value={health.counts.users.toLocaleString()} />
            <InfoRow label="Pro Users" value={health.counts.proUsers.toLocaleString()} />
            <InfoRow label="API Keys" value={`${health.counts.activeKeys} active / ${health.counts.apiKeys} total`} />
            <InfoRow label="Total Logs" value={health.counts.logs.toLocaleString()} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, ok, children }) {
  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all ${ok ? "border-emerald-200" : "border-red-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        {children}
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className={`text-lg font-bold ${ok ? "text-emerald-700" : "text-red-700"}`}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
