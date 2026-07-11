function Timetable() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">

      <h1 className="text-4xl font-bold text-cyan-400 mb-8">
        Updated Timetable
      </h1>

      <div className="overflow-x-auto">

        <table className="w-full bg-slate-800 rounded-xl overflow-hidden">

          <thead className="bg-cyan-600">

            <tr>

              <th className="p-4">Period</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Faculty</th>
              <th className="p-4">Status</th>

            </tr>

          </thead>

          <tbody>

            <tr className="border-b border-slate-700">

              <td className="p-4">1</td>
              <td className="p-4">DBMS</td>
              <td className="p-4">Dr. Priya</td>
              <td className="p-4 text-green-400">
                Normal
              </td>

            </tr>

            <tr className="border-b border-slate-700 bg-slate-700">

              <td className="p-4">2</td>
              <td className="p-4">DBMS Lab</td>
              <td className="p-4">Dr. Kumar</td>
              <td className="p-4 text-yellow-400">
                AI Substitute
              </td>

            </tr>

            <tr>

              <td className="p-4">3</td>
              <td className="p-4">Operating Systems</td>
              <td className="p-4">Dr. Ravi</td>
              <td className="p-4 text-green-400">
                Normal
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default Timetable;