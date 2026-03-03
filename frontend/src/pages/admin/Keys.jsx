import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPatch, apiDelete } from "../../api/client.js";

export default function AdminKeys() {
  const [data, setData] = useState({ keys: [], total: 0, page: 1, pages: 1 });
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set("status", statusFilter);
      const res = await apiGet(`/admin/keys?${params}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle(id) {
    try {
      await apiPatch(`/admin/keys/${id}/suspend`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Permanently delete this API key?")) return;
    try {
      await apiDelete(`/admin/keys/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">API Key Management</h2>
      <p className="text-sm text-slate-500 mb-6">View and manage all API keys across users.</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
        </select>
        <span className="ml-auto text-sm text-slate-400 self-center">{data.total} keys</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium">Key</th>
                <th className="text-left px-3 py-3 font-medium">User</th>
                <th className="text-left px-3 py-3 font-medium">Status</th>
                <th className="text-left px-3 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : data.keys.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-slate-400">No keys found</td></tr>
              ) : data.keys.map((k) => (
                <tr key={k._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{k.maskedKey}</td>
                  <td className="py-3 px-3">
                    {k.user ? (
                      <div>
                        <div className="font-medium text-slate-700">{k.user.name}</div>
                        <div className="text-xs text-slate-400">{k.user.email}</div>
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ${k.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${k.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {k.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleToggle(k._id)} className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${k.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                        {k.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                      <button onClick={() => handleDelete(k._id)} className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
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
