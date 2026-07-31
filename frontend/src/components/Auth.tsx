import React, { useState } from "react";
import { User } from "../types";

export function Auth({
  onLogin,
}: {
  onLogin: (user: User, role: "student" | "teacher") => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      
      // Save JWT token securely
      localStorage.setItem("iris_token", data.token);
      localStorage.setItem("iris_user", JSON.stringify(data.user));
      
      const dummyUser: User = {
        id: data.user.id,
        app_metadata: {},
        user_metadata: { role: data.user.role },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        email: data.user.email,
        role: "authenticated",
      };
      onLogin(dummyUser, data.user.role);
    } catch (error: any) {
      setErrorMsg(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: "student" | "teacher") => {
    // Generate valid looking dummy user object
    const dummyUser: User = {
      id: "demo-user-id-5542",
      app_metadata: {},
      user_metadata: { role: demoRole },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email:
        demoRole === "student"
          ? "student@university.edu"
          : "teacher@university.edu",
      role: "authenticated",
    };
    onLogin(dummyUser, demoRole);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden px-4">
      <div className="text-center mb-6 z-10 w-full max-w-sm">
        <h1 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900 mb-2 flex items-center justify-center gap-2">
          🛡️ Iris Live
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Secure Academic Assessment & Proctor Suite
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full z-10 relative">
        {/* Portal Switching Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setErrorMsg("");
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              role === "student"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🎓 Student Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("teacher");
              setErrorMsg("");
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
              role === "teacher"
                ? "bg-white text-fuchsia-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🏫 Teacher Desk
          </button>
        </div>

        {role === "student" ? (
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-lg font-bold text-slate-800">Student Sign-In</h2>
              <p className="text-xs text-slate-400">Access scheduled exams & assignments</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Student Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  placeholder="student@university.edu"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-indigo-200 transition-all flex items-center justify-center cursor-pointer"
              >
                {loading ? "Verifying..." : isSignUp ? "Register as Student" : "Secure Student Login"}
              </button>
            </form>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                Instant Sandbox Access
              </span>
              <button
                type="button"
                onClick={() => handleDemoLogin("student")}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                🎓 Bypass with Student Demo Account
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-lg font-bold text-slate-800">Teacher Sign-In</h2>
              <p className="text-xs text-slate-400">Manage assessments, classes & proctoring</p>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Teacher Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:bg-white transition-all"
                  placeholder="teacher@university.edu"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:bg-white transition-all font-mono"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-fuchsia-100 transition-all flex items-center justify-center cursor-pointer"
              >
                {loading ? "Verifying..." : isSignUp ? "Register as Teacher" : "Secure Teacher Login"}
              </button>
            </form>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                Instant Sandbox Access
              </span>
              <button
                type="button"
                onClick={() => handleDemoLogin("teacher")}
                className="w-full bg-fuchsia-950 hover:bg-fuchsia-900 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                🏫 Bypass with Teacher Demo Account
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-500 text-xs font-medium rounded-lg text-center">
            {errorMsg}
          </div>
        )}

        {true && (
          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
              }}
              className="text-xs text-slate-500 hover:text-indigo-600 font-bold transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "No account? Need to register?"}
            </button>
          </div>
        )}
      </div>

      {/* Aesthetic grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>
    </div>
  );
}
