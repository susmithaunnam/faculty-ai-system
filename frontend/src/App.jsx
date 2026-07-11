import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import FacultyDashboard from "./pages/FacultyDashboard";
import LeaveForm from "./pages/LeaveForm";
import AdminDashboard from "./pages/AdminDashboard";
import Timetable from "./pages/Timetable";
import Reports from "./pages/Reports";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/faculty" element={<FacultyDashboard />} />
      <Route path="/leave" element={<LeaveForm />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/timetable" element={<Timetable />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
}

export default App;