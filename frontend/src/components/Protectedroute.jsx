import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap a page with this to require login (and optionally a specific role).
 * Usage: <ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>
 */
function ProtectedRoute({ children, requireRole }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/" replace />;
  }

  if (requireRole && profile.role !== requireRole) {
    // Logged in, but wrong role — send them to their own dashboard instead
    return <Navigate to={profile.role === "admin" ? "/admin" : "/faculty"} replace />;
  }

  return children;
}

export default ProtectedRoute;