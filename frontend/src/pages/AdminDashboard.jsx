function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">

      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        Admin Dashboard
      </h1>

      <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">

        <h2 className="text-2xl font-bold mb-6">
          Pending Leave Requests
        </h2>

        <div className="bg-slate-700 rounded-xl p-5 mb-5">

          <h3 className="text-xl font-bold">
            Dr. Priya
          </h3>

          <p>Department : CSE</p>
          <p>Leave Date : 12 July 2026</p>
          <p>Reason : Medical Leave</p>

          <div className="mt-5 bg-slate-900 p-4 rounded-xl">

            <h3 className="text-cyan-400 text-xl font-bold">

              🤖 AI Suggested Substitute

            </h3>

            <p className="mt-3">

              Dr. Kumar

            </p>

            <p>

              Confidence Score : 96%

            </p>

          </div>

          <div className="flex gap-4 mt-6">

            <button className="bg-green-600 px-6 py-3 rounded-xl">

              Approve

            </button>

            <button className="bg-red-600 px-6 py-3 rounded-xl">

              Reject

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;