import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

const DAY_LABELS = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
const DAYS = [1, 2, 3, 4, 5, 6];

function Timetable() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [slots, setSlots] = useState([]);
  const [facultyMap, setFacultyMap] = useState({});
  const [subjectMap, setSubjectMap] = useState({});
  const [todayAllocationMap, setTodayAllocationMap] = useState({});
  const [sectionFilter, setSectionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // JS getDay(): 0=Sunday...6=Saturday. Our schema: 1=Monday...6=Saturday, no Sunday.
  const jsToday = new Date().getDay();
  const todayDayOfWeek = jsToday === 0 ? null : jsToday;

  const [activeDay, setActiveDay] = useState(todayDayOfWeek || 1);

  useEffect(() => {
    if (!profile) return;
    loadTimetable();
  }, [profile]);

  async function loadTimetable() {
    setLoading(true);
    setError("");
    try {
      const [timetableRes, facultyRes, subjectsRes, allocationsRes] = await Promise.all([
        apiFetch(isAdmin ? "/timetable" : "/timetable/me"),
        apiFetch("/directory/faculty"),
        apiFetch("/directory/subjects"),
        apiFetch("/substitute-allocations/today"),
      ]);

      const sorted = [...timetableRes.data].sort(
        (a, b) => a.day_of_week - b.day_of_week || a.period_number - b.period_number
      );
      setSlots(sorted);

      const fMap = {};
      facultyRes.data.forEach((f) => { fMap[f.id] = f; });
      setFacultyMap(fMap);

      const sMap = {};
      subjectsRes.data.forEach((s) => { sMap[s.id] = s; });
      setSubjectMap(sMap);

      const aMap = {};
      allocationsRes.data.forEach((a) => { aMap[a.timetable_slot_id] = a; });
      setTodayAllocationMap(aMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const sections = [...new Set(slots.map((s) => s.section))].sort();

  const visibleSlots = slots
    .filter((s) => s.day_of_week === activeDay)
    .filter((s) => sectionFilter === "all" || s.section === sectionFilter);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-4xl font-bold text-cyan-400">
            {isAdmin ? "College Timetable" : "My Timetable"}
          </h1>
          <p className="text-gray-400 mt-1">
            {isAdmin
              ? "Every scheduled class across the college."
              : `Welcome, ${profile?.full_name || "..."}`}
          </p>
        </div>
        <button
          onClick={() => navigate(isAdmin ? "/admin" : "/faculty")}
          className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg h-fit"
        >
          ← Back to Dashboard
        </button>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        Status reflects live substitute coverage for today ({DAY_LABELS[todayDayOfWeek] || "Sunday"}) only.
      </p>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              activeDay === day
                ? "bg-cyan-500 text-slate-900"
                : "bg-slate-800 text-gray-300 hover:bg-slate-700"
            } ${day === todayDayOfWeek ? "ring-2 ring-cyan-400" : ""}`}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {isAdmin && sections.length > 0 && (
        <div className="mb-6">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
          >
            <option value="all">All Sections</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full bg-slate-800 rounded-xl overflow-hidden">
          <thead className="bg-cyan-600">
            <tr>
              <th className="p-4 text-left">Period</th>
              <th className="p-4 text-left">Section</th>
              <th className="p-4 text-left">Subject</th>
              <th className="p-4 text-left">Faculty</th>
              <th className="p-4 text-left">Room</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">Loading...</td>
              </tr>
            ) : visibleSlots.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No classes scheduled for {DAY_LABELS[activeDay]}.
                </td>
              </tr>
            ) : (
              visibleSlots.map((slot, idx) => {
                const allocation = todayAllocationMap[slot.id];
                const isToday = activeDay === todayDayOfWeek;

                return (
                  <tr
                    key={slot.id}
                    className={`border-b border-slate-700 ${idx % 2 === 1 ? "bg-slate-700/40" : ""}`}
                  >
                    <td className="p-4">{slot.period_number}</td>
                    <td className="p-4">{slot.section}</td>
                    <td className="p-4">{subjectMap[slot.subject_id]?.name || "—"}</td>
                    <td className="p-4">{facultyMap[slot.faculty_id]?.full_name || "—"}</td>
                    <td className="p-4">{slot.room || "—"}</td>
                    <td className="p-4">
                      {!isToday ? (
                        <span className="text-gray-500">Scheduled</span>
                      ) : !allocation ? (
                        <span className="flex items-center gap-2 text-green-400">
                          <CheckCircle2 size={18} /> Normal
                        </span>
                      ) : allocation.substitute_faculty_id ? (
                        <span className="flex items-center gap-2 text-yellow-400">
                          <Bot size={18} />
                          {facultyMap[allocation.substitute_faculty_id]?.full_name || "Substitute"} covering
                          {" "}({allocation.allocation_score}/100)
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-orange-400">
                          <AlertTriangle size={18} /> Needs manual assignment
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Timetable;