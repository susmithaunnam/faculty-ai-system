import { useNavigate } from "react-router-dom";

function FacultyDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-slate-800 shadow-lg">

        <div>
          <h1 className="text-3xl font-bold text-cyan-400">
            Faculty Dashboard
          </h1>

          <p className="text-gray-400">
            Welcome back, Priya 👋
          </p>
        </div>

        <button className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg">
          Logout
        </button>

      </header>

      {/* Dashboard Cards */}

      <section className="grid md:grid-cols-3 gap-6 p-8">

        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg text-gray-300">
            Pending Leaves
          </h2>

          <p className="text-5xl mt-4 font-bold text-cyan-400">
            3
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg text-gray-300">
            Approved Leaves
          </h2>

          <p className="text-5xl mt-4 font-bold text-green-400">
            12
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg text-gray-300">
            Classes Today
          </h2>

          <p className="text-5xl mt-4 font-bold text-yellow-400">
            5
          </p>
        </div>

      </section>

      {/* AI Recommendation */}

      <section className="mx-8 bg-cyan-900 rounded-2xl p-6 shadow-lg">

        <h2 className="text-2xl font-bold">
          🤖 AI Recommendation
        </h2>

        <p className="mt-4 text-lg">

          Dr. Kumar is the best substitute for your DBMS class because:

        </p>

        <ul className="mt-4 space-y-2 list-disc ml-6">

          <li>Same Department</li>

          <li>Teaches DBMS</li>

          <li>Available in Period 3</li>

          <li>Lowest Workload Today</li>

        </ul>

      </section>

      {/* Quick Actions */}

      <section className="grid md:grid-cols-2 gap-6 p-8">

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

      </section>

    </div>
  );
}

export default FacultyDashboard;