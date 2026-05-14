import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import EmployeeAnalytics from "../components/analytics/EmployeeAnalytics";
import LeadAnalytics from "../components/analytics/LeadAnalytics";
import AdminAnalytics from "../components/analytics/AdminAnalytics";
import CinematicLoader from "../components/shared/CinematicLoader";
import { Z_INDEX } from "../constants/zIndex";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const resolvedRole = role || user?.role;

  useEffect(() => {
    if (resolvedRole === "admin") {
      console.log("🛡️ Admin detected on /analytics - Redirecting to /admin");
      navigate("/admin", { replace: true });
    }
  }, [resolvedRole, navigate]);

  if (resolvedRole === "admin") {
    return <CinematicLoader text="Redirecting to Operations Center..." />;
  }

  const renderAnalytics = () => {
    // Role-based rendering
    if (resolvedRole === "employee") {
      return <EmployeeAnalytics />;
    }

    if (resolvedRole === "lead") {
      return <LeadAnalytics />;
    }

    if (resolvedRole === "admin") {
      return <AdminAnalytics />;
    }

    // Fallback for users without role (defaults to employee view)
    return <EmployeeAnalytics />;
  };

  return (
    <div className="min-h-screen bg-[#0F1117]">
      {/* Header with back button */}
      <div className="fixed top-0 left-0 right-0 bg-[#0F1117]/80 backdrop-blur-md border-b border-white/10" style={{ zIndex: Z_INDEX.PANEL }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/workspace")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            <span className="text-sm font-medium">Back to Workspace</span>
          </button>

          <h1 className="text-lg font-semibold text-slate-100">Analytics</h1>

          <div className="w-24"></div>
        </div>
      </div>

      {/* Analytics content */}
      <div className="pt-16">
        {renderAnalytics()}
      </div>
    </div>
  );
}
