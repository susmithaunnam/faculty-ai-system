import { useState } from "react";

function LeaveForm() {

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (

    <div className="min-h-screen bg-slate-900 text-white p-10">

      <div className="max-w-3xl mx-auto bg-slate-800 rounded-3xl shadow-xl p-8">

        <h1 className="text-4xl font-bold text-cyan-400 mb-2">
          Apply Leave
        </h1>

        <p className="text-gray-400 mb-8">
          Fill in the details below to submit your leave request.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          <input
            type="text"
            placeholder="Faculty Name"
            className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
            required
          />

          <input
            type="text"
            placeholder="Department"
            className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
            required
          />

          <select
            className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
          >
            <option>Casual Leave</option>
            <option>Medical Leave</option>
            <option>Emergency Leave</option>
            <option>On Duty</option>
          </select>

          <div className="grid md:grid-cols-2 gap-6">

            <input
              type="date"
              className="p-4 rounded-xl bg-slate-700 border border-slate-600"
              required
            />

            <input
              type="date"
              className="p-4 rounded-xl bg-slate-700 border border-slate-600"
              required
            />

          </div>

          <textarea
            rows="5"
            placeholder="Reason for Leave"
            className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
          ></textarea>

          <input
            type="file"
            className="w-full p-3 bg-slate-700 rounded-xl"
          />

          <button
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition p-4 rounded-xl text-xl font-bold"
          >
            Submit Leave Request
          </button>

        </form>

        {submitted && (

          <div className="mt-8 bg-green-600 p-5 rounded-xl">

            <h2 className="text-2xl font-bold">
              ✅ Leave Submitted Successfully
            </h2>

            <p className="mt-3">
              AI is finding the best substitute faculty...
            </p>

            <div className="mt-5 bg-slate-900 p-4 rounded-xl">

              <h3 className="text-cyan-400 text-xl font-bold">
                🤖 AI Recommendation
              </h3>

              <p className="mt-3">

                Recommended Faculty:
                <strong> Dr. Kumar</strong>

              </p>

              <p>
                Confidence Score:
                <strong> 96%</strong>
              </p>

              <p className="mt-3">

                Reason:

              </p>

              <ul className="list-disc ml-6 mt-2">

                <li>Same Department</li>

                <li>Same Subject</li>

                <li>Available During Period 3</li>

                <li>Lowest Workload Today</li>

              </ul>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}

export default LeaveForm;