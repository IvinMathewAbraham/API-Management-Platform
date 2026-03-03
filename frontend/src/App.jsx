import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

// Lazy-load pages
const Landing = lazy(() => import("./pages/Landing.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Keys = lazy(() => import("./pages/Keys.jsx"));
const Plans = lazy(() => import("./pages/Plans.jsx"));
const Playground = lazy(() => import("./pages/Playground.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.jsx"));
const AdminKeys = lazy(() => import("./pages/admin/Keys.jsx"));
const AdminLogs = lazy(() => import("./pages/admin/Logs.jsx"));
const AdminHealth = lazy(() => import("./pages/admin/Health.jsx"));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public landing */}
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
        </Route>

        {/* Authenticated user pages */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="keys" element={<Keys />} />
          <Route path="plans" element={<Plans />} />
        </Route>

        {/* Playground — semi-public (uses DashboardLayout but no strict auth) */}
        <Route element={<DashboardLayout />}>
          <Route path="playground" element={<Playground />} />
        </Route>

        {/* Admin pages */}
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/keys" element={<AdminKeys />} />
          <Route path="admin/logs" element={<AdminLogs />} />
          <Route path="admin/health" element={<AdminHealth />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<div className="flex items-center justify-center min-h-screen text-slate-500">Page not found</div>} />
      </Routes>
    </Suspense>
  );
}
