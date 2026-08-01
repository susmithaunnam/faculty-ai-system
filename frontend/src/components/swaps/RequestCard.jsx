import StatusBadge from "./StatusBadge";

function RequestCard({
  request,
  currentUserId,
  onAccept,
  onReject,
}) {
  const incoming = request.target_id === currentUserId;

  const otherPerson = incoming
    ? request.requester?.full_name
    : request.target?.full_name;

  return (
    <div className="bg-slate-800 rounded-xl p-5 shadow-md space-y-4">

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-cyan-400">
          {incoming ? "From" : "To"} {otherPerson}
        </h3>

        <StatusBadge status={request.status} />
      </div>

      <div className="space-y-2">

        <div className="bg-slate-700 rounded-lg p-3">

          <p className="font-semibold">
            {request.requester_slot?.section}
          </p>

          <p>
            Day {request.requester_slot?.day_of_week}
            {" • "}
            Period {request.requester_slot?.period_number}
          </p>

        </div>

        <div className="text-center text-2xl">
          ⇅
        </div>

        <div className="bg-slate-700 rounded-lg p-3">

          <p className="font-semibold">
            {request.target_slot?.section}
          </p>

          <p>
            Day {request.target_slot?.day_of_week}
            {" • "}
            Period {request.target_slot?.period_number}
          </p>

        </div>

      </div>

      {incoming && request.status === "pending" && (

        <div className="flex gap-3">

          <button
            onClick={() => onAccept(request.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg py-2"
          >
            Accept
          </button>

          <button
            onClick={() => onReject(request.id)}
            className="flex-1 bg-red-600 hover:bg-red-700 rounded-lg py-2"
          >
            Reject
          </button>

        </div>

      )}

    </div>
  );
}

export default RequestCard;