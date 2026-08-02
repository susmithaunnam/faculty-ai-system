import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { apiFetch } from "../lib/api";
import SwapForm from "../components/swaps/SwapForm";
import RequestCard from "../components/swaps/RequestCard";

function SwapRequests() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadAll();
  }, [profile]);

  async function loadAll() {
    setLoading(true);
    try {
      const [requestsRes, slotsRes, facultyRes] = await Promise.all([
        apiFetch("/swap-requests/me"),
        apiFetch("/timetable/me"),
        apiFetch("/directory/faculty"),
      ]);
      setRequests(requestsRes.data);
      setMySlots(slotsRes.data);
      setFacultyList(facultyRes.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (payload) => {
    await apiFetch("/swap-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await loadAll();
  };

  const ACTION_MESSAGES = {
    accept: "Swap accepted — your timetable has been updated.",
    reject: "Swap request rejected.",
    cancel: "Swap request cancelled.",
  };

  const runAction = async (swapId, action) => {
    try {
      await apiFetch(`/swap-requests/${swapId}/${action}`, { method: "PATCH" });
      toast.success(ACTION_MESSAGES[action] || "Done.");
      await loadAll();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAccept = (swapId) => runAction(swapId, "accept");
  const handleReject = (swapId) => runAction(swapId, "reject");
  const handleCancel = (swapId) => runAction(swapId, "cancel");

  const pending = requests.filter((r) => r.status === "pending");
  const incomingPending = pending.filter((r) => r.target_id === profile?.id);
  const outgoingPending = pending.filter((r) => r.requester_id === profile?.id);
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-cyan-400">Swap Requests</h1>
          <p className="text-gray-400 mt-1">Trade a class hour with another faculty member.</p>
        </div>
        <button
          onClick={() => navigate("/faculty")}
          className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg h-fit"
        >
          ← Back to Dashboard
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          <SwapForm
            mySlots={mySlots}
            facultyList={facultyList}
            currentUserId={profile?.id}
            onSubmit={handleCreate}
          />

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-300 mb-4">
                Awaiting Your Response {incomingPending.length > 0 && `(${incomingPending.length})`}
              </h2>
              {incomingPending.length === 0 ? (
                <p className="text-gray-500">Nothing needs your response right now.</p>
              ) : (
                <div className="space-y-4">
                  {incomingPending.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      currentUserId={profile?.id}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-300 mb-4">
                Your Pending Requests {outgoingPending.length > 0 && `(${outgoingPending.length})`}
              </h2>
              {outgoingPending.length === 0 ? (
                <p className="text-gray-500">You haven't proposed any swaps that are still pending.</p>
              ) : (
                <div className="space-y-4">
                  {outgoingPending.map((request) => (
                    <div key={request.id} className="space-y-2">
                      <RequestCard
                        request={request}
                        currentUserId={profile?.id}
                        onAccept={handleAccept}
                        onReject={handleReject}
                      />
                      <button
                        onClick={() => handleCancel(request.id)}
                        className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm"
                      >
                        Cancel Request
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {resolved.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-300 mb-4">History</h2>
                <div className="space-y-4">
                  {resolved.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      currentUserId={profile?.id}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SwapRequests;