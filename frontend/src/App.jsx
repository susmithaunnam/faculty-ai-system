import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import FacultyDashboard from "./pages/FacultyDashboard";
import LeaveForm from "./pages/LeaveForm";
import AdminDashboard from "./pages/AdminDashboard";
import Timetable from "./pages/Timetable";
import SwapRequests from "./pages/SwapRequests";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/faculty"
        element={
          <ProtectedRoute requireRole="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leave"
        element={
          <ProtectedRoute requireRole="faculty">
            <LeaveForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/timetable"
        element={
          <ProtectedRoute>
            <Timetable />
          </ProtectedRoute>
        }
      />

      <Route
        path="/swaps"
        element={
          <ProtectedRoute requireRole="faculty">
            <SwapRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute requireRole="admin">
            <Reports />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;