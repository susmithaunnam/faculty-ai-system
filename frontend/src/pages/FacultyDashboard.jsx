import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function FacultyDashboard() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [classesToday, setClassesToday] = useState(0);
  const [todaysAllocation, setTodaysAllocation] = useState(null);
  const [substituteName, setSubstituteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) return;

    async function loadDashboard() {
      try {
        const [leavesRes, timetableRes, allocationsRes, facultyRes] = await Promise.all([
          apiFetch("/leave-requests/me"),
          apiFetch("/timetable/me"),
          apiFetch("/substitute-allocations/today"),
          apiFetch("/directory/faculty"),
        ]);

        setLeaveRequests(leavesRes.data);

        // JS getDay(): 0=Sunday...6=Saturday. Our schema: 1=Monday...6=Saturday, no Sunday.
        const jsToday = new Date().getDay();
        const todaysClasses = timetableRes.data.filter(
          (slot) => jsToday !== 0 && slot.day_of_week === jsToday
        );
        setClassesToday(todaysClasses.length);

        const myAllocation = allocationsRes.data.find(
          (a) => a.original_faculty_id === profile.id
        );
        setTodaysAllocation(myAllocation || null);

        if (myAllocation?.substitute_faculty_id) {
          const sub = facultyRes.data.find((f) => f.id === myAllocation.substitute_faculty_id);
          setSubstituteName(sub?.full_name || "a colleague");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [profile]);

  const pendingCount = leaveRequests.filter((l) => l.status === "pending").length;
  const approvedCount = leaveRequests.filter((l) => l.status === "approved").length;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex justify-between items-center p-6 bg-slate-800 shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">Faculty Dashboard</h1>
          <p className="text-gray-400">Welcome back, {profile?.full_name || "..."} 👋</p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg">
          Logout
        </button>
      </header>

      {error && <p className="text-red-400 text-center mt-4">{error}</p>}

      <section className="grid md:grid-cols-3 gap-6 p-8">
        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg text-gray-300">Pending Leaves</h2>
          <p className="text-5xl mt-4 font-bold text-cyan-400">{loading ? "-" : pendingCount}</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg text-gray-300">Approved Leaves</h2>
          <p className="text-5xl mt-4 font-bold text-green-400">{loading ? "-" : approvedCount}</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg text-gray-300">Classes Today</h2>
          <p className="text-5xl mt-4 font-bold text-yellow-400">{loading ? "-" : classesToday}</p>
        </div>
      </section>

      <section className="mx-8 bg-cyan-900 rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold">🤖 Substitute Status</h2>

        {loading ? (
          <p className="mt-4 text-lg">Checking today's schedule...</p>
        ) : todaysAllocation ? (
          todaysAllocation.substitute_faculty_id ? (
            <>
              <p className="mt-4 text-lg">{substituteName} is covering your class today.</p>
              <ul className="mt-4 space-y-2 list-disc ml-6">
                {todaysAllocation.allocation_reason?.same_department && <li>Same Department</li>}
                {todaysAllocation.allocation_reason?.subject_match && (
                  <li>Subject match: {todaysAllocation.allocation_reason.subject_match}</li>
                )}
                <li>Current weekly load: {todaysAllocation.allocation_reason?.current_weekly_load}</li>
                <li>Score: {todaysAllocation.allocation_score}/100</li>
              </ul>
            </>
          ) : (
            <p className="mt-4 text-lg">
              No qualified substitute was found for today's class — please check with admin.
            </p>
          )
        ) : (
          <p className="mt-4 text-lg">No substitute coverage needed today.</p>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-6 p-8">
        <button
          onClick={() => navigate("/leave")}
          className="bg-cyan-500 hover:bg-cyan-600 p-6 rounded-2xl text-2xl font-bold"
        >
          Apply Leave
        </button>

        <button
          onClick={() => navigate("/timetable")}
          className="bg-purple-600 hover:bg-purple-700 p-6 rounded-2xl text-2xl font-bold"
        >
          View Timetable
        </button>

        <button
          onClick={() => navigate("/swaps")}
          className="bg-orange-500 hover:bg-orange-600 p-6 rounded-2xl text-2xl font-bold"
        >
          Swap Requests
        </button>
      </section>
    </div>
  );
}

export default FacultyDashboard;