function Reports() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">

      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        Reports
      </h1>

      <div className="grid md:grid-cols-4 gap-6">

        <div className="bg-slate-800 p-6 rounded-xl">
          <h2>Total Leaves</h2>
          <p className="text-4xl text-cyan-400 mt-4">25</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h2>Approved</h2>
          <p className="text-4xl text-green-400 mt-4">20</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h2>Rejected</h2>
          <p className="text-4xl text-red-400 mt-4">5</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <h2>AI Accuracy</h2>
          <p className="text-4xl text-yellow-400 mt-4">96%</p>
        </div>

      </div>

    </div>
  );
}

export default Reports;