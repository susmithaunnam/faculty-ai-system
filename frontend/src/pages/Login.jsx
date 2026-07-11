import { useState } from "react";
import { User, Lock, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Login() {

  const navigate = useNavigate();

  const [role, setRole] = useState("faculty");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const handleLogin = (e) => {

    e.preventDefault();

    if(role==="faculty"){
      navigate("/faculty");
    }
    else{
      navigate("/admin");
    }

  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 flex items-center justify-center p-6">

      <div className="absolute top-8 left-10">

        <h1 className="text-4xl font-bold text-cyan-400">
          FacultyAI
        </h1>

        <p className="text-gray-300 mt-2">
          Smart Faculty Leave Management
        </p>

      </div>

      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8">

        <div className="flex justify-center mb-5">

          <div className="bg-cyan-500 p-4 rounded-full">

            <GraduationCap size={40} color="white"/>

          </div>

        </div>

        <h2 className="text-3xl font-bold text-center text-white">

          Welcome Back

        </h2>

        <p className="text-center text-gray-300 mt-2">

          Login to continue

        </p>

        <div className="flex mt-8 rounded-xl overflow-hidden">

          <button

          onClick={()=>setRole("faculty")}

          className={`w-1/2 py-3 font-semibold transition ${
            role==="faculty"
            ?
            "bg-cyan-500 text-white"
            :
            "bg-slate-700 text-gray-300"
          }`}>

            Faculty

          </button>

          <button

          onClick={()=>setRole("admin")}

          className={`w-1/2 py-3 font-semibold transition ${
            role==="admin"
            ?
            "bg-cyan-500 text-white"
            :
            "bg-slate-700 text-gray-300"
          }`}>

            Admin

          </button>

        </div>

        <form
        onSubmit={handleLogin}
        className="mt-8">

          <div className="relative mb-5">

            <User
            className="absolute left-4 top-4 text-gray-400"
            size={20}/>

            <input

            type="email"

            placeholder="Email"

            value={email}

            onChange={(e)=>setEmail(e.target.value)}

            className="w-full pl-12 py-4 rounded-xl bg-slate-800 text-white border border-slate-600 focus:border-cyan-400 outline-none"

            required

            />

          </div>

          <div className="relative mb-6">

            <Lock
            className="absolute left-4 top-4 text-gray-400"
            size={20}/>

            <input

            type="password"

            placeholder="Password"

            value={password}

            onChange={(e)=>setPassword(e.target.value)}

            className="w-full pl-12 py-4 rounded-xl bg-slate-800 text-white border border-slate-600 focus:border-cyan-400 outline-none"

            required

            />

          </div>
                    <button
            type="submit"
            className="w-full bg-cyan-500 hover:bg-cyan-600 transition duration-300 py-4 rounded-xl text-white font-bold text-lg shadow-lg"
          >
            Login
          </button>

        </form>

        <div className="mt-6 text-center">

          <p className="text-gray-400 text-sm">
            Demo Credentials
          </p>

          <p className="text-cyan-300 mt-2">
            Faculty → faculty@college.com
          </p>

          <p className="text-cyan-300">
            Admin → admin@college.com
          </p>

          <p className="text-gray-500 text-xs mt-4">
            Password can be anything for now.
          </p>

        </div>

      </div>

    </div>

  );

}

export default Login;