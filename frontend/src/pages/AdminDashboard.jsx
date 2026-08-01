import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function AdminDashboard() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [facultyMap, setFacultyMap] = useState({});
  const [departmentMap, setDepartmentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [results, setResults] = useState([]); // recently approved, with substitute assignments

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [leavesRes, facultyRes, deptRes] = await Promise.all([
        apiFetch("/leave-requests?status=pending"),
        apiFetch("/directory/faculty"),
        apiFetch("/directory/departments"),
      ]);

      setPendingLeaves(leavesRes.data);

      const fMap = {};
      facultyRes.data.forEach((f) => { fMap[f.id] = f; });
      setFacultyMap(fMap);

      const dMap = {};
      deptRes.data.forEach((d) => { dMap[d.id] = d.name; });
      setDepartmentMap(dMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(leave) {
    setActionLoadingId(leave.id);
    setError("");
    try {
      await apiFetch(`/leave-requests/${leave.id}/approve`, { method: "PATCH" });
      const genRes = await apiFetch(`/substitute-allocations/generate/${leave.id}`, { method: "POST" });

      setResults((prev) => [
        {
          leaveId: leave.id,
          facultyName: facultyMap[leave.faculty_id]?.full_name || "Unknown",
          allocations: genRes.data,
        },
        ...prev,
      ]);
      setPendingLeaves((prev) => prev.filter((l) => l.id !== leave.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReject(leave) {
    setActionLoadingId(leave.id);
    setError("");
    try {
      await apiFetch(`/leave-requests/${leave.id}/reject`, { method: "PATCH" });
      setPendingLeaves((prev) => prev.filter((l) => l.id !== leave.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-cyan-400">Admin Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome, {profile?.full_name || "..."}</p>
        </div>
        <div className="flex gap-3 h-fit">
          <button
            onClick={() => navigate("/reports")}
            className="bg-cyan-600 hover:bg-cyan-700 px-5 py-2 rounded-lg"
          >
            View Reports
          </button>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg">
            Logout
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-6">
          Pending Leave Requests {!loading && `(${pendingLeaves.length})`}
        </h2>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : pendingLeaves.length === 0 ? (
          <p className="text-gray-400">No pending leave requests right now.</p>
        ) : (
          pendingLeaves.map((leave) => {
            const faculty = facultyMap[leave.faculty_id];
            return (
              <div key={leave.id} className="bg-slate-700 rounded-xl p-5 mb-5">
                <h3 className="text-xl font-bold">{faculty?.full_name || "Unknown Faculty"}</h3>
                <p>Department: {departmentMap[faculty?.department_id] || "—"}</p>
                <p>
                  Leave Dates: {leave.start_date}
                  {leave.end_date !== leave.start_date ? ` to ${leave.end_date}` : ""}
                </p>
                <p>Reason: {leave.reason || "—"}</p>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleApprove(leave)}
                    disabled={actionLoadingId === leave.id}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl disabled:opacity-50"
                  >
                    {actionLoadingId === leave.id ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(leave)}
                    disabled={actionLoadingId === leave.id}
                    className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {results.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Recently Approved — Substitute Assignments</h2>

          {results.map((r) => (
            <div key={r.leaveId} className="bg-slate-700 rounded-xl p-5 mb-5">
              <h3 className="text-xl font-bold mb-3">{r.facultyName}</h3>

              {r.allocations.length === 0 ? (
                <p className="text-gray-400">No classes needed covering for this leave.</p>
              ) : (
                r.allocations.map((a) => (
                  <div key={a.id} className="bg-slate-900 p-4 rounded-xl mb-3">
                    <p className="text-cyan-400 font-bold">🤖 {a.slot_date}</p>
                    {a.substitute_faculty_id ? (
                      <>
                        <p className="mt-2">
                          Substitute: {facultyMap[a.substitute_faculty_id]?.full_name || "Unknown"}
                        </p>
                        <p>Score: {a.allocation_score}/100</p>
                      </>
                    ) : (
                      <p className="mt-2 text-yellow-400">
                        No qualified substitute found — needs manual assignment.
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;