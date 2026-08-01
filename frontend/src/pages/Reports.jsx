import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { apiFetch } from "../lib/api";

const COLORS = {
  cyan: "#22d3ee",
  green: "#4ade80",
  red: "#f87171",
  yellow: "#facc15",
  purple: "#c084fc",
  orange: "#fb923c",
  grid: "#334155",
  axis: "#94a3b8",
};

const STATUS_COLORS = { approved: COLORS.green, rejected: COLORS.red, pending: COLORS.yellow };

const chartTooltipStyle = {
  contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" },
  labelStyle: { color: "#fff" },
};

function SummaryCard({ label, value, accent }) {
  return (
    <div className="bg-slate-800 p-6 rounded-xl">
      <h2 className="text-gray-400">{label}</h2>
      <p className={`text-4xl font-bold mt-4 ${accent}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-200 mb-6">{title}</h2>
      <div style={{ width: "100%", height: 320 }}>{children}</div>
    </div>
  );
}

function Reports() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/reports/summary")
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-cyan-400">Reports</h1>
        <button
          onClick={() => navigate("/admin")}
          className="bg-slate-700 hover:bg-slate-600 px-5 py-2 rounded-lg h-fit"
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : !report ? (
        <p className="text-gray-400">No data available.</p>
      ) : (
        <div className="space-y-8">
          <div className="grid md:grid-cols-4 gap-6">
            <SummaryCard label="Total Leaves" value={report.leave_summary.total} accent="text-cyan-400" />
            <SummaryCard label="Approved" value={report.leave_summary.approved} accent="text-green-400" />
            <SummaryCard label="Rejected" value={report.leave_summary.rejected} accent="text-red-400" />
            <SummaryCard
              label="AI Substitute Match Rate"
              value={`${report.substitute_stats.success_rate}%`}
              accent="text-yellow-400"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <ChartCard title="Leave Requests by Status">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Approved", value: report.leave_summary.approved },
                      { name: "Rejected", value: report.leave_summary.rejected },
                      { name: "Pending", value: report.leave_summary.pending },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    <Cell fill={STATUS_COLORS.approved} />
                    <Cell fill={STATUS_COLORS.rejected} />
                    <Cell fill={STATUS_COLORS.pending} />
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                  <Legend wrapperStyle={{ color: COLORS.axis }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Trend">
              <ResponsiveContainer>
                <LineChart data={report.monthly_trend}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke={COLORS.axis} />
                  <YAxis stroke={COLORS.axis} allowDecimals={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Legend wrapperStyle={{ color: COLORS.axis }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke={COLORS.cyan} strokeWidth={2} />
                  <Line type="monotone" dataKey="approved" name="Approved" stroke={COLORS.green} strokeWidth={2} />
                  <Line type="monotone" dataKey="rejected" name="Rejected" stroke={COLORS.red} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <ChartCard title="Faculty with Most Leaves">
              {report.leave_by_faculty.length === 0 ? (
                <p className="text-gray-500">No leave requests yet.</p>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={report.leave_by_faculty} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke={COLORS.axis} allowDecimals={false} />
                    <YAxis type="category" dataKey="full_name" stroke={COLORS.axis} width={120} />
                    <Tooltip {...chartTooltipStyle} />
                    <Bar dataKey="total" name="Leave Requests" fill={COLORS.purple} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Department-wise Statistics">
              {report.leave_by_department.length === 0 ? (
                <p className="text-gray-500">No leave requests yet.</p>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={report.leave_by_department}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="department" stroke={COLORS.axis} tick={{ fontSize: 12 }} />
                    <YAxis stroke={COLORS.axis} allowDecimals={false} />
                    <Tooltip {...chartTooltipStyle} />
                    <Legend wrapperStyle={{ color: COLORS.axis }} />
                    <Bar dataKey="approved" name="Approved" fill={COLORS.green} stackId="a" />
                    <Bar dataKey="rejected" name="Rejected" fill={COLORS.red} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <ChartCard title="Workload Distribution (weekly classes vs. capacity)">
            {report.workload.length === 0 ? (
              <p className="text-gray-500">No timetable data yet.</p>
            ) : (
              <ResponsiveContainer height={Math.max(320, report.workload.length * 36)}>
                <BarChart data={report.workload} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" stroke={COLORS.axis} unit="%" />
                  <YAxis type="category" dataKey="full_name" stroke={COLORS.axis} width={120} />
                  <Tooltip
                    {...chartTooltipStyle}
                    formatter={(value, name, props) => [
                      `${props.payload.weekly_classes} / ${props.payload.max_weekly_hours} classes (${value}%)`,
                      "Load",
                    ]}
                  />
                  <Bar dataKey="load_pct" name="Load %" fill={COLORS.orange} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-200 mb-4">AI Substitute Allocation</h2>
            <div className="grid sm:grid-cols-4 gap-6">
              <div>
                <p className="text-gray-400 text-sm">Total Allocations</p>
                <p className="text-2xl font-bold text-cyan-400">{report.substitute_stats.total_allocations}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Matched</p>
                <p className="text-2xl font-bold text-green-400">{report.substitute_stats.matched}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Unmatched</p>
                <p className="text-2xl font-bold text-red-400">{report.substitute_stats.unmatched}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Avg. Match Score</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {report.substitute_stats.avg_score ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;