import { useState } from "react";
import { User, Lock, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: loginError } = await login(email, password);

    if (loginError) {
      setError(loginError.message);
      setSubmitting(false);
      return;
    }

    try {
      const me = await apiFetch("/me");
      navigate(me.data.role === "admin" ? "/admin" : "/faculty");
    } catch (err) {
      setError("Logged in, but couldn't load your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-6">
      <div className="absolute top-8 left-10">
        <h1 className="text-4xl font-bold text-cyan-400">FacultyAI</h1>
        <p className="text-gray-300 mt-2">Smart Faculty Leave Management</p>
      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex justify-center mb-5">
          <div className="bg-cyan-500 p-4 rounded-full">
            <GraduationCap size={40} color="white" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-white">Welcome Back</h2>
        <p className="text-center text-gray-300 mt-2">Login to continue</p>

        <form onSubmit={handleLogin} className="mt-8">
          <div className="relative mb-5">
            <User className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 py-4 rounded-xl bg-slate-800 text-white border border-slate-600 focus:border-cyan-400 outline-none"
              required
            />
          </div>

          <div className="relative mb-6">
            <Lock className="absolute left-4 top-4 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 py-4 rounded-xl bg-slate-800 text-white border border-slate-600 focus:border-cyan-400 outline-none"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition duration-300 py-4 rounded-xl text-white font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;