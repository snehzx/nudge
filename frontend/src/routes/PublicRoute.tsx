import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function PublicRoute() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  if (loading) return <p className="p-4">loading…</p>;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
