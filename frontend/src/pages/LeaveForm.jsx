import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../lib/api";

const LEAVE_TYPES = ["Casual Leave", "Medical Leave", "Emergency Leave", "On Duty"];

function LeaveForm() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const toast = useToast();

  const [leaveType, setLeaveType] = useState(LEAVE_TYPES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const resetForm = () => {
    setLeaveType(LEAVE_TYPES[0]);
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please select both a start and end date.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date can't be before the start date.");
      return;
    }

    setSubmitting(true);
    try {
      // Backend only stores start_date, end_date, and a single reason field
      // (no dedicated leave_type column), so we fold the type into the reason.
      const combinedReason = reason.trim()
        ? `[${leaveType}] ${reason.trim()}`
        : `[${leaveType}]`;

      await apiFetch("/leave-requests", {
        method: "POST",
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          reason: combinedReason,
        }),
      });

      setSubmitted(true);
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-10">
      <div className="max-w-3xl mx-auto bg-slate-800 rounded-3xl shadow-xl p-8">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-4xl font-bold text-cyan-400">Apply Leave</h1>
          <button
            onClick={() => navigate("/faculty")}
            className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg text-sm h-fit"
          >
            ← Back to Dashboard
          </button>
        </div>

        <p className="text-gray-400 mb-8">
          {profile?.full_name ? `${profile.full_name}, fill` : "Fill"} in the details below to
          submit your leave request.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
          >
            {LEAVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
                required
              />
            </div>
          </div>

          <textarea
            rows="5"
            placeholder="Reason for leave"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-700 border border-slate-600"
          ></textarea>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition p-4 rounded-xl text-xl font-bold"
          >
            {submitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>

        {submitted && (
          <div className="mt-8 bg-green-600 p-5 rounded-xl">
            <h2 className="text-2xl font-bold">✅ Leave Request Submitted</h2>
            <p className="mt-3">
              Your request is now pending admin approval. Once it's approved, the substitute
              allocation engine will assign coverage automatically — you'll see it on your
              dashboard.
            </p>
            <button
              onClick={() => navigate("/faculty")}
              className="mt-4 bg-slate-900 hover:bg-slate-950 px-5 py-2 rounded-lg text-sm font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeaveForm;
