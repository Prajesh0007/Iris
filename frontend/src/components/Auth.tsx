import React, { useState, useEffect } from "react";
import { User } from "../types";
import {
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  X,
} from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Google Sign-In state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [dynamicGoogleClientId, setDynamicGoogleClientId] = useState<string>(
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || ""
  );

  // Fetch server configuration for Google Client ID if available
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.googleClientId && typeof cfg.googleClientId === "string" && cfg.googleClientId.includes(".apps.googleusercontent.com")) {
          setDynamicGoogleClientId(cfg.googleClientId);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize official Google Identity Services button only when a real client ID is present
  useEffect(() => {
    if (
      dynamicGoogleClientId &&
      dynamicGoogleClientId.includes(".apps.googleusercontent.com") &&
      window.google?.accounts?.id
    ) {
      try {
        window.google.accounts.id.initialize({
          client_id: dynamicGoogleClientId,
          callback: handleGoogleCredentialResponse,
        });
        const googleBtnElem = document.getElementById("googleOfficialBtn");
        if (googleBtnElem) {
          window.google.accounts.id.renderButton(googleBtnElem, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "rectangular",
          });
        }
      } catch (err) {
        console.warn("Google Identity Services initialization notice:", err);
      }
    }
  }, [dynamicGoogleClientId, role]);

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

  const submitGoogleAuth = async (payload: {
    email: string;
    name: string;
    role: string;
    picture?: string;
    googleId?: string;
  }) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const handleGoogleClick = () => {
    setErrorMsg("");
    // If a valid Google Client ID is configured in the environment, use GIS
    if (
      dynamicGoogleClientId &&
      dynamicGoogleClientId.includes(".apps.googleusercontent.com") &&
      window.google?.accounts?.oauth2
    ) {
      setLoading(true);
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: dynamicGoogleClientId,
          scope: "openid profile email",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                const userRes = await fetch(
                  "https://www.googleapis.com/oauth2/v3/userinfo",
                  {
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`,
                    },
                  }
                );
                const googleProfile = await userRes.json();
                if (googleProfile?.email) {
                  await submitGoogleAuth({
                    email: googleProfile.email,
                    name: googleProfile.name || googleProfile.email.split("@")[0],
                    picture: googleProfile.picture,
                    googleId: googleProfile.sub,
                    role,
                  });
                  return;
                }
              } catch (fetchErr: any) {
                console.warn("Failed fetching Google user profile:", fetchErr);
              }
            }
            setLoading(false);
          },
          error_callback: (err: any) => {
            console.warn("Google OAuth popup error:", err);
            setLoading(false);
            setShowGoogleModal(true);
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (oauthErr) {
        console.warn("Could not launch Google Token Client:", oauthErr);
      }
    }

    // Default clean fallback: Google email prompt
    setLoading(false);
    setShowGoogleModal(true);
  };

  const handleCustomGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes("@")) {
      setErrorMsg("Please enter a valid Google account email address.");
      return;
    }
    await submitGoogleAuth({
      email: googleEmail.trim().toLowerCase(),
      name: (googleName || googleEmail.split("@")[0]).trim(),
      role,
      googleId: "google-" + Date.now(),
    });
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
        throw new Error(data.error || "Authentication failed. Please verify your credentials.");
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

  const hasValidGis =
    dynamicGoogleClientId &&
    dynamicGoogleClientId.includes(".apps.googleusercontent.com");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100/70 relative overflow-hidden px-4 py-12">
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 max-w-[420px] w-full p-8 z-10 relative">
        {/* Brand Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isSignUp ? "Create an Account" : "Sign In to Iris"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isSignUp
              ? "Register your academic account to get started"
              : "Enter your credentials to access your academic portal"}
          </p>
        </div>

        {/* Role Toggle: Student vs Teacher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === "student"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🎓</span> Student
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("teacher");
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === "teacher"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🏫</span> Teacher / Faculty
          </button>
        </div>

        {/* Error and Success Notices */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
            <div className="flex-1 font-medium">{successMsg}</div>
          </div>
        )}

        {/* Google SSO Button */}
        <div className="mb-5">
          {hasValidGis ? (
            <div id="googleOfficialBtn" className="w-full flex justify-center mb-2" />
          ) : (
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 px-4 rounded-xl text-xs border border-slate-300 shadow-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              {/* Google 4-Color SVG Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>
          )}

          <div className="relative flex py-3.5 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              or
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
        </div>

        {/* Standard Email / Password Form */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3.5">
          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder={role === "student" ? "e.g. Marcus Aurelius" : "e.g. Prof. Jane Doe"}
                  required
                />
                <UserIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                placeholder={role === "student" ? "student@university.edu" : "teacher@university.edu"}
                required
              />
              <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                placeholder="Enter your password"
                required
              />
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900"
                  placeholder="Re-enter your password"
                  required
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 font-semibold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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
          <p className="text-xs text-slate-600">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline underline-offset-2 ml-1"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>

      {/* Clean Google Account Sign-In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full relative">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 mb-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <h3 className="text-base font-bold text-slate-900">
                Sign in with Google
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authenticate your {role === "student" ? "Student" : "Teacher"} account
              </p>
            </div>

            <form onSubmit={handleCustomGoogleSignIn} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name / Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
