import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const location = useLocation();

  if (loading) return <p className="p-4">loading...</p>;
  if (!user)
    return <Navigate to="/signin" state={{ from: location }} replace />;

  return <Outlet />;
}
