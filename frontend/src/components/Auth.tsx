import React, { useState, useEffect } from "react";
import { User } from "../types";
import { ShieldCheck, Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

export function Auth({
  onLogin,
}: {
  onLogin: (user: User, role: "student" | "teacher") => void;
}) {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Google Sign-In prompt modal for seamless institutional / personal google login
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");

  const googleClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";

  // Initialize official Google Identity Services button if Client ID is configured
  useEffect(() => {
    if (googleClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
        const googleBtnElem = document.getElementById("googleOfficialBtn");
        if (googleBtnElem) {
          window.google.accounts.id.renderButton(googleBtnElem, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "pill",
          });
        }
      } catch (err) {
        console.warn("Notice: Google Identity Services init notice:", err);
      }
    }
  }, [googleClientId, role]);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response.credential) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: response.credential,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }
      processAuthSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes("@")) {
      setErrorMsg("Please enter a valid Google account email address.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail.trim().toLowerCase(),
          name: (googleName || googleEmail.split("@")[0]).trim(),
          role,
          googleId: "google-" + Date.now(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google authentication failed");
      }
      setShowGoogleModal(false);
      processAuthSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setErrorMsg("Full name is required to create an account.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp
        ? { name: name.trim(), email: email.trim().toLowerCase(), password, role }
        : { email: email.trim().toLowerCase(), password, role };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      processAuthSuccess(data);
    } catch (error: any) {
      setErrorMsg(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const processAuthSuccess = (data: { token: string; user: any }) => {
    localStorage.setItem("iris_token", data.token);
    localStorage.setItem("iris_user", JSON.stringify(data.user));

    const authenticatedUser: User = {
      id: data.user.id,
      app_metadata: {},
      user_metadata: {
        role: data.user.role,
        full_name: data.user.name,
      },
      aud: "authenticated",
      created_at: new Date().toISOString(),
      email: data.user.email,
      role: "authenticated",
    };

    onLogin(authenticatedUser, data.user.role);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden px-4 py-8">
      {/* Decorative Brand Header */}
      <div className="text-center mb-6 z-10 w-full max-w-md">
        <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-md border border-slate-200/60 mb-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
          Iris Academic Integrity Suite
        </h1>
        <p className="text-xs font-semibold text-slate-500">
          Proctored Assessments, Class Management & Secure Examinations
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white p-7 rounded-3xl shadow-xl border border-slate-200/80 max-w-md w-full z-10 relative">
        {/* Role Portal Selection Tabs */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              role === "student"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🎓</span> Student Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("teacher");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              role === "teacher"
                ? "bg-white text-fuchsia-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>🏫</span> Teacher Desk
          </button>
        </div>

        {/* Dynamic Context Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2 bg-slate-100 text-slate-700">
            {role === "student" ? "Student Access" : "Faculty Desk"}
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {isSignUp
              ? `Register New ${role === "student" ? "Student" : "Teacher"} Account`
              : `Sign in to ${role === "student" ? "Student Portal" : "Teacher Desk"}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSignUp
              ? "Create your institutional credentials to get started"
              : "Enter your verified credentials to access your dashboard"}
          </p>
        </div>

        {/* Error and Success Notices */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1">{successMsg}</div>
          </div>
        )}

        {/* Google One-Click Sign-In Options */}
        <div className="mb-5">
          {googleClientId ? (
            <div id="googleOfficialBtn" className="w-full flex justify-center mb-2"></div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                setShowGoogleModal(true);
              }}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer hover:border-slate-400 active:scale-[0.99]"
            >
              {/* Google 4-Color SVG Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google ({role === "student" ? "Student" : "Teacher"})</span>
            </button>
          )}

          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or with Institutional Email
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
        </div>

        {/* Standard Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                placeholder={role === "student" ? "e.g. Marcus Aurelius" : "e.g. Prof. Jane Doe"}
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{role === "student" ? "Student Email" : "Teacher / Faculty Email"}</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
              placeholder={role === "student" ? "student@university.edu" : "teacher@university.edu"}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono text-slate-800"
              placeholder="••••••••"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono text-slate-800"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-white ${
              role === "teacher"
                ? "bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-200"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : isSignUp ? (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create {role === "student" ? "Student" : "Teacher"} Account</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In as {role === "student" ? "Student" : "Teacher"}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle between Register and Login */}
        <div className="mt-6 text-center border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="text-xs text-slate-600 hover:text-indigo-600 font-bold transition-colors cursor-pointer"
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Need an account? Register here"}
          </button>
        </div>
      </div>

      {/* Google Modal for Direct Google Account Entry */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full relative">
            <div className="text-center mb-4">
              <div className="inline-flex p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Sign In with Google
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Authenticate your {role === "student" ? "Student" : "Teacher"} account with Google SSO
              </p>
            </div>

            <form onSubmit={handleCustomGoogleSignIn} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your.name@gmail.com or university.edu"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Aesthetic grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      ></div>
    </div>
  );
}
