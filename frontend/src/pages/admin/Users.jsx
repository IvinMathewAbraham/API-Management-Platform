import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPatch, apiDelete } from "../../api/client.js";

export default function AdminUsers() {
  const [data, setData] = useState({ users: [], total: 0, page: 1, pages: 1 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (planFilter) params.set("plan", planFilter);
      const res = await apiGet(`/admin/users?${params}`);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, planFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id, name) {
    if (!confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return;
    try {
      await apiDelete(`/admin/users/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRoleToggle(id, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Change role to ${newRole}?`)) return;
    try {
      await apiPatch(`/admin/users/${id}/role`, { role: newRole });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-1">User Management</h2>
      <p className="text-sm text-slate-500 mb-6">View and manage all registered users.</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 w-64" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400">
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
        </select>
        <span className="ml-auto text-sm text-slate-400 self-center">{data.total} users</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-3 py-3 font-medium">Role</th>
                <th className="text-left px-3 py-3 font-medium">Plan</th>
                <th className="text-right px-3 py-3 font-medium">Keys</th>
                <th className="text-left px-3 py-3 font-medium">Joined</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : data.users.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-slate-400">No users found</td></tr>
              ) : data.users.map((u) => (
                <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{u.role}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.plan === "pro" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{u.plan}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="font-semibold">{u.activeKeys}</span>
                    <span className="text-slate-400">/{u.keyCount}</span>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleRoleToggle(u._id, u.role)} className="px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded transition-colors" title={`Make ${u.role === "admin" ? "user" : "admin"}`}>
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button onClick={() => handleDelete(u._id, u.name)} className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors">
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
