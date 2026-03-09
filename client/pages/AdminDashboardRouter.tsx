/**
 * Admin Dashboard Router
 * Redirects to the correct dashboard based on admin role
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/lib/admin-auth";
import { Loader2 } from "lucide-react";

export default function AdminDashboardRouter() {
  const { adminUser, loading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!adminUser) {
      navigate("/admin/login", { replace: true });
      return;
    }

    switch (adminUser.role) {
      case "super_admin":
        navigate("/admin/super-admin", { replace: true });
        break;
      case "admin":
        navigate("/admin/city-admin", { replace: true });
        break;
      case "supervisor":
        navigate("/admin/supervisor", { replace: true });
        break;
      default:
        navigate("/admin/login", { replace: true });
    }
  }, [adminUser, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );
}
