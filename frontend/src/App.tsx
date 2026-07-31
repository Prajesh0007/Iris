/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Compass,
  HelpCircle,
  Clock,
  RefreshCw,
  LogOut,
  ChevronRight,
  Check,
  Download,
  Sun,
  Moon,
} from "lucide-react";
import { Exam, Submission } from "./types";
import Dashboard from "./components/Dashboard";
import ExamTaker from "./components/ExamTaker";
import LogsReview from "./components/LogsReview";
import { exportCertificateToPDF } from "./utils/pdfExport";
import { Auth } from "./components/Auth";
import { User } from "./types";
import NotificationsPopover from "./components/NotificationsPopover";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"student" | "teacher">("student");
  const [page, setPage] = useState<
    "portal" | "taking" | "submitted" | "teacher-logs"
  >("portal");
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const storedToken = localStorage.getItem("iris_token");
    const storedUser = localStorage.getItem("iris_user");
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const dummyUser: User = {
          id: parsed.id,
          app_metadata: {},
          user_metadata: { role: parsed.role },
          aud: "authenticated",
          created_at: new Date().toISOString(),
          email: parsed.email,
          role: "authenticated",
        };
        setUser(dummyUser);
        setUserRole(parsed.role as "student" | "teacher");
      } catch (e) {
        localStorage.removeItem("iris_token");
        localStorage.removeItem("iris_user");
      }
    }
  }, []);

  // Theme state & synchronization
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Transition context variables
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [candidateName, setCandidateName] = useState<string>("");
  const [candidateEmail, setCandidateEmail] = useState<string>("");
  const [completedSubmissionId, setCompletedSubmissionId] = useState<
    string | null
  >(null);

  // Global Context for Authentic Student Filtering
  const [classes, setClasses] = useState<any[]>([]);
  const [studentContext, setStudentContext] = useState<{ depts: string[]; years: string[]; classes: string[] }>({ depts: [], years: [], classes: [] });

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => {
        setClasses(data);
        if (userRole === "student" && user?.email) {
          const enrolled = data.filter((c: any) => c.students?.some((s: any) => s.email === user.email));
          const years = new Set<string>();
          const depts = new Set<string>();
          enrolled.forEach((c: any) => {
            if (c.year) years.add(c.year);
            if (c.department) depts.add(c.department);
          });
          setStudentContext({
            classes: enrolled.map((c: any) => c.name),
            years: Array.from(years),
            depts: Array.from(depts)
          });
        }
      })
      .catch(console.error);
  }, [user, userRole]);

  // Synchronize dynamic schemas from active Express Server on mount
  const syncDatabase = async () => {
    try {
      const examsRes = await fetch("/api/exams");
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExams(examsData);
      }

      const subsRes = await fetch("/api/submissions");
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubmissions(subsData);
      }
    } catch (e) {
      console.warn(
        "API sync warn: Express server not fully initialized. Defaulting to preloaded memory schemas.",
      );
    }
  };

  useEffect(() => {
    syncDatabase();
  }, [page]);

  const handleCreateExam = async (newExam: Exam) => {
    // TeacherDesk already successfully posts the exam to /api/exams and returns the created exam.
    // We just need to sync the global state here to reflect it.
    await syncDatabase();
  };

  // Handle Safe Exam Browser deep link auto-routing
  useEffect(() => {
    if (user && exams.length > 0 && page === "portal") {
      const params = new URLSearchParams(window.location.search);
      const targetExamId = params.get("examId");
      if (targetExamId) {
        const targetExam = exams.find((e) => e.id === targetExamId);
        if (targetExam) {
          // Clear the URL parameter so returning to portal doesn't cause a loop
          window.history.replaceState({}, document.title, window.location.pathname);
          
          handleSelectExamToTake(
            targetExam,
            user.user_metadata?.full_name || user.email?.split("@")[0] || "Student Candidate",
            user.email || "student@university.edu"
          );
        }
      }
    }
  }, [user, exams, page]);

  const handleSelectExamToTake = (exam: Exam, name: string, email: string) => {
    setSelectedExam(exam);
    setCandidateName(name);
    setCandidateEmail(email);
    setPage("taking");
  };

  const handleExamSubmitted = async (submissionId: string) => {
    setCompletedSubmissionId(submissionId);
    setPage("submitted");
    await syncDatabase();
  };

  const activeSubmission = submissions.find(
    (s) => s.id === completedSubmissionId,
  );

  if (!user) {
    return (
      <Auth
        onLogin={(u, r) => {
          setUser(u);
          setUserRole(r);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 text-slate-800 selection:bg-indigo-150/75">
      {/* Background soft pastel glowing glass blobs */}
      <div className="absolute top-[10%] left-[8%] h-[340px] w-[340px] rounded-full bg-gradient-to-tr from-cyan-300/25 to-indigo-300/10 blur-[90px] animate-blob pointer-events-none" />
      <div className="absolute bottom-[15%] right-[10%] h-[380px] w-[380px] rounded-full bg-gradient-to-br from-indigo-300/15 to-rose-300/15 blur-[100px] animate-blob-reverse pointer-events-none" />
      <div className="absolute top-[50%] left-[45%] h-[280px] w-[280px] rounded-full bg-indigo-200/5 blur-[80px] pointer-events-none" />

      {/* Primary header toolbar */}
      <header className="glass-header sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/10 border border-indigo-400">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black text-slate-900 tracking-tight leading-tight">
                Iris
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                Integrity Monitor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 text-xs font-semibold text-slate-900">
            <div
              className={`py-2 px-3.5 rounded-xl font-bold border ${
                userRole === "teacher"
                  ? "bg-fuchsia-100 border-fuchsia-200 text-fuchsia-800"
                  : "bg-emerald-100 border-emerald-200 text-emerald-800"
              }`}
            >
              Role: {userRole === "student" ? "Student" : "Teacher"}
            </div>

            {/* High-contrast Eye strain Dark / Light mode toggle switch */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-850 p-2.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
              title={
                theme === "light"
                  ? "Enable reduced strain Dark Mode"
                  : "Enable Light Glassmorphic mode"
              }
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-4 w-4 text-slate-700" />
                  <span className="hidden md:inline text-[11px] font-extrabold text-slate-700 tracking-wide uppercase">
                    Dark Mode
                  </span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 text-amber-500 animate-[spin_8s_linear_infinite]" />
                  <span className="hidden md:inline text-[11px] font-extrabold text-amber-500 tracking-wide uppercase">
                    Light Mode
                  </span>
                </>
              )}
            </button>

            <NotificationsPopover userRole={userRole} studentContext={studentContext} />

            <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-white/50 border border-slate-200/40 px-3 py-1.5 rounded-full backdrop-blur-xs">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Active System Node
            </div>

            <button
              onClick={async () => {
                localStorage.removeItem("iris_token");
                localStorage.removeItem("iris_user");
                setUser(null);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-xs ml-2"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Core page layouts distributor */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {page === "portal" && (
          <Dashboard
            userRole={userRole}
            userEmail={user.email}
            studentContext={studentContext}
            exams={exams}
            onCreateExam={handleCreateExam}
            onSelectExam={handleSelectExamToTake}
            onViewLogs={() => setPage("teacher-logs")}
          />
        )}

        {page === "taking" && selectedExam && (
          <ExamTaker
            exam={selectedExam}
            candidateName={candidateName}
            candidateEmail={candidateEmail}
            onSubmitted={handleExamSubmitted}
            onCancel={() => {
              setSelectedExam(null);
              setPage("portal");
            }}
          />
        )}

        {page === "teacher-logs" && (
          <LogsReview
            submissions={submissions}
            onBack={() => setPage("portal")}
            onRefresh={syncDatabase}
          />
        )}

        {page === "submitted" && (
          <div className="max-w-2xl mx-auto flex flex-col gap-8 text-center py-6 animate-[fadeIn_0.4s_ease-out]">
            {/* Top alert tag */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-150 animate-bounce">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
                Exam Form Submitted Successfully
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Your coding scripts and multiple-choice answers have been safely
                delivered to academic assessment databases.
              </p>
            </div>

            {/* Academic Credential Certificate summary */}
            {activeSubmission ? (
              <div className="glass p-8 rounded-3xl border border-white/80 shadow-2xl relative text-left overflow-hidden flex flex-col gap-6">
                {/* Visual watermark check */}
                <div className="absolute top-2 right-2 text-[120px] font-black text-emerald-500/3 select-none pointer-events-none transform translate-x-12 translate-y-6">
                  PASS
                </div>

                <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Verification Certificate Code
                    </span>
                    <code className="text-xs font-mono font-bold text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-md">
                      SECURE_HASH-{activeSubmission.id.slice(-6)}
                    </code>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => exportCertificateToPDF(activeSubmission)}
                      title="Download Certificate PDF"
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 hover:border-indigo-200 p-2 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-bold font-mono text-slate-400">
                      Logged:{" "}
                      {new Date(
                        activeSubmission.submittedAt || "",
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block font-sans">
                    Academic Honesty & Integrity Report
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans leading-none">
                    {activeSubmission.candidateName}
                  </h2>
                  <span className="text-xs text-slate-500 font-mono italic">
                    {activeSubmission.candidateEmail}
                  </span>
                </div>

                <p className="text-xs text-slate-650 leading-relaxed font-semibold mt-1">
                  The candidate completed the examination title{" "}
                  <strong className="text-slate-800">
                    &ldquo;{activeSubmission.examTitle}&rdquo;
                  </strong>{" "}
                  completely under verified lockdown rules. Frame tracking
                  metrics compiled by the AI Proctoring engine confirmed
                  compliance.
                </p>

                {/* Score indicators grid bento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 mt-2">
                  {/* Grading score list */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Grading Total
                    </span>
                    <strong className="text-2xl font-extrabold text-slate-800">
                      {activeSubmission.score}{" "}
                      <span className="text-sm text-slate-400">
                        / {activeSubmission.maxScore}
                      </span>
                    </strong>
                    <div className="text-[10px] text-indigo-500 font-semibold mt-1">
                      Ratio Score:{" "}
                      {Math.round(
                        (activeSubmission.score / activeSubmission.maxScore) *
                          100,
                      )}
                      %
                    </div>
                  </div>

                  {/* Integrity score list */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Lockdown Integrity
                    </span>
                    <strong className="text-2xl font-extrabold text-emerald-600 font-mono">
                      {activeSubmission.integrityScore}%
                    </strong>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" /> Trust
                      ranking verified
                    </div>
                  </div>

                  {/* Proctor status metrics */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Webcam AI Reports
                    </span>
                    <strong className="text-sm font-black text-slate-800 inline-block uppercase bg-slate-50 border px-2 py-1.5 rounded-lg border-slate-150 mt-1">
                      {activeSubmission.status === "passed"
                        ? "Trusted Pass"
                        : activeSubmission.status === "review"
                          ? "Manual Audit"
                          : "Compromised"}
                    </strong>
                    <div className="text-[10px] text-slate-400 font-semibold mt-1">
                      Violations logged: {activeSubmission.violations.length}{" "}
                      total
                    </div>
                  </div>
                </div>

                {/* Listing of violations if any occurred */}
                {activeSubmission.violations.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col gap-2 scale-98">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 text-slate-500">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />{" "}
                      Recorded Deviations
                    </span>
                    <div className="flex flex-col gap-1.5 mt-1 font-sans text-xs">
                      {activeSubmission.violations.map((v, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-rose-500 font-bold font-mono shrink-0">
                            &bull;
                          </span>
                          <span className="text-slate-600 font-medium">
                            {v.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass p-6 rounded-2xl text-slate-400 text-xs">
                Synchroning grade logs...
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => {
                  setCompletedSubmissionId(null);
                  setPage("portal");
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-black active:scale-95 text-white font-bold py-3.5 px-6 rounded-2xl text-xs transition-all cursor-pointer shadow-md"
              >
                Return to Portal Dashboard Screen
              </button>

              {activeSubmission && (
                <button
                  onClick={() => exportCertificateToPDF(activeSubmission)}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-3.5 px-6 rounded-2xl text-xs shadow-lg shadow-indigo-150 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" /> Export Certificate PDF
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
