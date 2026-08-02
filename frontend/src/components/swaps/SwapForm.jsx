import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { DAY_LABELS_SHORT } from "../../lib/constants";
import { useToast } from "../../context/ToastContext";

function slotLabel(slot) {
  return `${DAY_LABELS_SHORT[slot.day_of_week] || slot.day_of_week} • Period ${slot.period_number} • ${slot.section}`;
}

function SwapForm({ mySlots, facultyList, currentUserId, onSubmit }) {
  const toast = useToast();

  const [requesterSlotId, setRequesterSlotId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [targetSlotId, setTargetSlotId] = useState("");
  const [targetSlots, setTargetSlots] = useState([]);
  const [loadingTargetSlots, setLoadingTargetSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const otherFaculty = facultyList.filter((f) => f.id !== currentUserId);

  // Whenever the target faculty changes, load their timetable so the
  // person can pick which of that faculty's classes they want in return.
  useEffect(() => {
    setTargetSlotId("");
    setTargetSlots([]);

    if (!targetId) return;

    let cancelled = false;
    setLoadingTargetSlots(true);

    apiFetch(`/timetable/faculty/${targetId}`)
      .then((res) => {
        if (!cancelled) setTargetSlots(res.data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingTargetSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetId]);

  const canSubmit = requesterSlotId && targetId && targetSlotId && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit({
        requester_slot_id: requesterSlotId,
        target_id: targetId,
        target_slot_id: targetSlotId,
      });
      setRequesterSlotId("");
      setTargetId("");
      setTargetSlotId("");
      setTargetSlots([]);
      toast.success("Swap request sent.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 rounded-2xl p-6 shadow-lg space-y-5"
    >
      <h2 className="text-2xl font-bold text-cyan-400">Propose a Swap</h2>

      <div>
        <label className="block text-gray-400 mb-2">Your class to give up</label>
        <select
          value={requesterSlotId}
          onChange={(e) => setRequesterSlotId(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600"
          required
        >
          <option value="">Select one of your classes</option>
          {mySlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slotLabel(slot)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Swap with</label>
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600"
          required
        >
          <option value="">Select a faculty member</option>
          {otherFaculty.map((f) => (
            <option key={f.id} value={f.id}>
              {f.full_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-gray-400 mb-2">Their class you want</label>
        <select
          value={targetSlotId}
          onChange={(e) => setTargetSlotId(e.target.value)}
          className="w-full p-3 rounded-xl bg-slate-700 border border-slate-600"
          disabled={!targetId || loadingTargetSlots}
          required
        >
          <option value="">
            {!targetId
              ? "Pick a faculty member first"
              : loadingTargetSlots
              ? "Loading their timetable..."
              : targetSlots.length === 0
              ? "No classes found for this faculty member"
              : "Select their class"}
          </option>
          {targetSlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slotLabel(slot)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition p-4 rounded-xl text-lg font-bold"
      >
        {submitting ? "Sending..." : "Send Swap Request"}
      </button>
    </form>
  );
}

export default SwapForm;