import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  return children;
}
