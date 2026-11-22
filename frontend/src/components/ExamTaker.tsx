/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  HelpCircle,
  FileText,
  CheckCircle,
  X,
  HelpCircle as HelpIcon,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Maximize,
  Award,
  LogOut,
  Clock,
  Terminal,
  Camera,
  Mic,
  Lock,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Bookmark,
  BookOpen,
  Flag,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  Exam,
  ExamAnswer,
  Violation,
  AIProctorReport,
  Question,
} from "../types";

import CodeEditor from "./CodeEditor";
import ProctorCamera from "./ProctorCamera";
import { Panel, Group, Separator } from "react-resizable-panels";

interface ExamTakerProps {
  exam: Exam;
  candidateName: string;
  candidateEmail: string;
  onSubmitted: (submissionId: string) => void;
  onCancel: () => void;
}

import { openDB } from "idb";

export default function ExamTaker({
  exam: propExam,
  candidateName,
  candidateEmail,
  onSubmitted,
  onCancel,
}: ExamTakerProps) {
  const [liveExam] = useState<Exam>(() => {
    if (!propExam.shuffleQuestions) return propExam;
    const qs = JSON.parse(JSON.stringify(propExam.questions)) as Question[];
    qs.sort(() => Math.random() - 0.5);
    qs.forEach((q) => {
      if (q.type === "mcq" && q.options) {
        const withIndex = q.options.map((opt, i) => ({
          opt,
          originalIndex: i,
        }));
        withIndex.sort(() => Math.random() - 0.5);
        q.options = withIndex.map((x) => x.opt);
        if (q.correctOptionIndex !== undefined) {
          q.correctOptionIndex = withIndex.findIndex(
            (x) => x.originalIndex === q.correctOptionIndex,
          );
        }
      }
    });
    return { ...propExam, questions: qs };
  });

  const exam = liveExam;

  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [aiReports, setAiReports] = useState<AIProctorReport[]>([]);
  const [testCaseProgress, setTestCaseProgress] = useState<
    Record<string, boolean[]>
  >({});
  const [integrityScore, setIntegrityScore] = useState<number>(100);

  // Lockdown & Environment states
  const [isFullscreenEnforced, setIsFullscreenEnforced] =
    useState<boolean>(false);
  const [fullscreenError, setFullscreenError] = useState<boolean>(false);
  // Fullscreen error recovery
  const [secondsToRecoverFullscreen, setSecondsToRecoverFullscreen] =
    useState<number>(15);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [screenCaptures, setScreenCaptures] = useState<string[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);

  // Timing settings
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    liveExam.durationMinutes * 60,
  );

  // Warnings system
  const [alertNotification, setAlertNotification] = useState<string | null>(
    null,
  );

  // SEB Passwords Authentication state - ALWAYS locked by default
  const [entryPasswordInput, setEntryPasswordInput] = useState<string>("");
  const [isEntryLocked, setIsEntryLocked] = useState<boolean>(true);
  const [entryPasswordError, setEntryPasswordError] = useState<boolean>(false);

  const [exitPasswordInput, setExitPasswordInput] = useState<string>("");
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);
  const [exitPasswordError, setExitPasswordError] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [pendingExitAction, setPendingExitAction] = useState<"submit" | "quit">("submit");

  const promptExitAuthorization = (action: "submit" | "quit") => {
    setExitPasswordInput("");
    setExitPasswordError(false);
    setPendingExitAction(action);
    setShowExitModal(true);
  };

  // Real-Time Cloud Database Synchronization & Offline Recovery State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<"synced" | "saving" | "offline" | "error">("synced");
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Active");

  // Question navigation & review states (Palette & Status Overview)
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(() => new Set([0]));
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set());
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<number>>(new Set());
  const [showAboutTestModal, setShowAboutTestModal] = useState<boolean>(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>("");
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  const activeQuestion = liveExam.questions[activeQuestionIndex];

  // Auto-mark question as visited when active index changes
  useEffect(() => {
    setVisitedQuestions((prev) => new Set([...prev, activeQuestionIndex]));
  }, [activeQuestionIndex]);

  // WebRTC socket streaming
  useEffect(() => {
    if (!isFullscreenEnforced) return;

    import("socket.io-client").then(({ io }) => {
      import("simple-peer").then((module) => {
        const Peer = module.default;
        const socket = io();

        socket.emit("join-room", "live-exams", candidateEmail, false);

        socket.on(
          "user-connected",
          (userId: string, isTeacher: boolean, socketId: string) => {
            if (isTeacher) {
              // A teacher joined, we should send them our stream
              if (
                screenStreamRef.current &&
                screenVideoRef.current?.srcObject
              ) {
                // Need to get the camera stream too
                const peer = new Peer({
                  initiator: true,
                  trickle: false,
                  stream: screenVideoRef.current.srcObject as MediaStream, // we will pass webcam later
                });

                peer.on("signal", (data) => {
                  socket.emit("signal", socketId, data);
                });
              }
            }
          },
        );
      });
    });
  }, [isFullscreenEnforced]);

  useEffect(() => {
    const key = `seb_autosave_${exam.id}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const initStore = async () => {
      const db = await openDB("ExamSystems", 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("autosave")) {
            db.createObjectStore("autosave");
          }
        },
      });
      const savedSync = await db.get("autosave", key);
      const saved = savedSync
        ? JSON.stringify(savedSync)
        : localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (
            Array.isArray(parsed.answers) &&
            parsed.answers.length === exam.questions.length
          ) {
            if (
              typeof parsed.timeLeftSeconds === "number" &&
              parsed.timeLeftSeconds <= 0
            ) {
              await db.delete("autosave", key);
              localStorage.removeItem(key);
            } else {
              setAnswers(parsed.answers);
              if (typeof parsed.timeLeftSeconds === "number")
                setTimeLeftSeconds(parsed.timeLeftSeconds);
              if (Array.isArray(parsed.violations))
                setViolations(parsed.violations);
              if (Array.isArray(parsed.aiReports))
                setAiReports(parsed.aiReports);
              if (typeof parsed.integrityScore === "number")
                setIntegrityScore(parsed.integrityScore);
              if (
                parsed.testCaseProgress &&
                typeof parsed.testCaseProgress === "object"
              )
                setTestCaseProgress(parsed.testCaseProgress);
              setAlertNotification(
                "OFFLINE RESILIENCE RESTORED: Auto-saved answer sheets have been safely loaded from IndexedDB local cache.",
              );
              return;
            }
          }
        } catch (e) {}
      }

      // Check Cloud Database Autosave for seamless multi-device or crash recovery
      try {
        const cloudRes = await fetch(`/api/exams/autosave/${exam.id}/${encodeURIComponent(candidateEmail)}`);
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData.exists && cloudData.autosave) {
            const as = cloudData.autosave;
            if (Array.isArray(as.answers) && as.answers.length > 0) {
              setAnswers(as.answers);
              if (typeof as.timeLeftSeconds === "number" && as.timeLeftSeconds > 0) {
                setTimeLeftSeconds(as.timeLeftSeconds);
              }
              if (typeof as.integrityScore === "number") setIntegrityScore(as.integrityScore);
              if (Array.isArray(as.violations)) setViolations(as.violations);
              if (Array.isArray(as.aiReports)) setAiReports(as.aiReports);
              setCloudSyncStatus("synced");
              setAlertNotification("DATABASE RESILIENCE: Active exam progress seamlessly restored from cloud database.");
              return;
            }
          }
        }
      } catch (cloudErr) {}

      const initAnswers = exam.questions.map((q) => {
        const ans: ExamAnswer = { questionId: q.id };
        if (q.type === "coding") ans.codingCode = q.codeBoilerplate || "";
        return ans;
      });
      setAnswers(initAnswers);
    };
    initStore();
  }, [exam, candidateEmail]);

  // Real-Time Cloud Database Synchronizer & Offline Local Backup
  const triggerRealtimeAutosave = async () => {
    if (answers.length === 0 || isSubmitting) return;

    const key = `seb_autosave_${exam.id}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const autoSaveData = {
      answers,
      timeLeftSeconds,
      violations,
      aiReports,
      integrityScore,
      testCaseProgress,
    };

    // 1. Always back up to local IndexedDB / LocalStorage first
    try {
      const db = await openDB("ExamSystems", 1);
      await db.put("autosave", autoSaveData, key);
    } catch {
      localStorage.setItem(key, JSON.stringify(autoSaveData));
    }

    // 2. Real-time push to MySQL Database on backend
    if (!navigator.onLine) {
      setCloudSyncStatus("offline");
      return;
    }

    setCloudSyncStatus("saving");
    try {
      const res = await fetch("/api/exams/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          candidateEmail,
          candidateName,
          answers,
          violations,
          aiReports,
          integrityScore,
          timeLeftSeconds,
        }),
      });

      if (res.ok) {
        setCloudSyncStatus("synced");
        const now = new Date();
        setLastSyncedTime(
          `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
        );
      } else {
        setCloudSyncStatus("error");
      }
    } catch {
      setCloudSyncStatus("offline");
    }
  };

  // Continuous background auto-save interval (every 5 seconds)
  useEffect(() => {
    if (!isFullscreenEnforced || isSubmitting) return;

    const interval = setInterval(() => {
      triggerRealtimeAutosave();
    }, 5000);

    return () => clearInterval(interval);
  }, [answers, timeLeftSeconds, violations, aiReports, integrityScore, isFullscreenEnforced, isSubmitting]);

  // Network connection event listeners for seamless reconnect sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setAlertNotification("NETWORK RECONNECTED: Syncing offline answers to cloud database now...");
      triggerRealtimeAutosave();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setCloudSyncStatus("offline");
      setAlertNotification("NETWORK NOTICE: Connection lost. Local offline cache active; will auto-sync on reconnect.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [answers, timeLeftSeconds, violations, aiReports, integrityScore]);

  // Event-driven auto-save whenever answers or integrity change
  useEffect(() => {
    if (answers.length === 0) return;
    triggerRealtimeAutosave();
  }, [answers, violations, integrityScore]);

  // Handle active test countdown clock
  useEffect(() => {
    if (!isFullscreenEnforced || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFullscreenEnforced, isSubmitting]);

  // Handle countdown timeout auto-submit triggers
  useEffect(() => {
    if (timeLeftSeconds === 0 && isFullscreenEnforced && !isSubmitting) {
      setAlertNotification(
        "TIME EXPIRED: Automatically locking and submitting your assessment sheets now.",
      );
      handleSubmitAnswers(true);
    }
  }, [timeLeftSeconds, isFullscreenEnforced, isSubmitting]);

  const enterFullscreen = () => {
    setIsFullscreenEnforced(true);
    setFullscreenError(false);
  };

  // Clear alert notification banners after 4 seconds
  useEffect(() => {
    if (alertNotification) {
      const timer = setTimeout(() => {
        setAlertNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [alertNotification]);

  const triggerViolation = (
    type: any,
    desc: string,
    severity: "low" | "medium" | "high",
  ) => {
    const newViolation: Violation = {
      timestamp: new Date().toISOString(),
      type,
      description: desc,
      severity,
    };

    const updatedViolations = [...violations, newViolation];
    setViolations(updatedViolations);

    // Calc score offsets
    let deduction = 5;
    if (severity === "medium") deduction = 12;
    if (severity === "high") deduction = 25;

    const finalIntegrity = Math.max(0, integrityScore - deduction);
    setIntegrityScore(finalIntegrity);

    // Auto lockout if integrity drops past a threshold (e.g. 30%)
    if (finalIntegrity < exam.integrityThreshold) {
      alert(
        "EXAM TERMINATED: Your academic integrity rating dropped below the secure threshold. Test is locking down and submitting instantly.",
      );
      handleSubmitAnswers(true);
    }
  };

  const handleMCQSelect = (optionIndex: number) => {
    const updatedAnswers = [...answers];
    const itemIdx = updatedAnswers.findIndex(
      (a) => a.questionId === activeQuestion.id,
    );
    if (itemIdx !== -1) {
      updatedAnswers[itemIdx].mcqAnswer = optionIndex;
      setAnswers(updatedAnswers);
    }
  };

  const handleCodingEdit = (newCode: string) => {
    const updatedAnswers = [...answers];
    const itemIdx = updatedAnswers.findIndex(
      (a) => a.questionId === activeQuestion.id,
    );
    if (itemIdx !== -1) {
      updatedAnswers[itemIdx].codingCode = newCode;
      setAnswers(updatedAnswers);
    }
  };

  const handleProctorScanResult = (report: AIProctorReport) => {
    const updatedReports = [...aiReports, report];
    setAiReports(updatedReports);

    if (report.status === "warning") {
      triggerViolation(
        "proctor-warning",
        `Proctor gaze shift warning: ${report.summary}`,
        "medium",
      );
      setAlertNotification(
        `PROCTOR WARNING: Gaze deviation or bad positioning identified. Focus on your keyboard.`,
      );
    } else if (report.status === "flagged") {
      triggerViolation(
        "proctor-warning",
        `AI Proctors caught violation: ${report.summary}`,
        "high",
      );
      setAlertNotification(
        `CRITICAL ALARM: Multiple person profiles or mobile device suspected by camera sensors.`,
      );
    }
  };

  const handleNoiseSpikeAlert = (audioLevel: number) => {
    triggerViolation(
      "proctor-warning",
      `High acoustic noise spike recorded (${audioLevel}db volume index).`,
      "low",
    );
    setAlertNotification(
      "PROCTOR NOTICE: Maintain absolute silence. High background speaking registered.",
    );
  };

  const handleSubmitAnswers = async (forced: boolean = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (
      !forced &&
      !window.confirm(
        "Are you ready to submit your answers and terminate your exam session? Answers will be locked permanently.",
      )
    ) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Exit fullscreen gracefully on termination
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Cleanup screen bounds capture
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: exam.id,
          examTitle: exam.title,
          candidateName,
          candidateEmail,
          answers,
          violations,
          aiReports,
          screenCaptures,
          integrityScore,
          startedAt: new Date(
            Date.now() - (exam.durationMinutes * 60 - timeLeftSeconds) * 1000,
          ).toISOString(),
        }),
      });

      if (res.ok) {
        const payload = await res.json();
        // Clear secure local storage cache on successful submission matching current student keys
        const key = `seb_autosave_${exam.id}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
        localStorage.removeItem(key);
        openDB("ExamSystems", 1)
          .then((db) => db.delete("autosave", key))
          .catch(() => {});
        onSubmitted(payload.id);
      } else {
        const errorText = await res.text();
        alert(`Problem registering final score metrics catalog. Server response: ${res.status} ${errorText}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Communication crash during server grade computation. Details: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuestionAnswered = (idx: number) => {
    const q = liveExam.questions[idx];
    if (!q) return false;
    const ans = answers.find((a) => a.questionId === q.id);
    if (!ans) return false;
    if (q.type === "mcq") return ans.mcqAnswer !== undefined;
    if (q.type === "coding") {
      const cleanedCode = (ans.codingCode || "").replace(/\s+/g, "");
      const cleanedBoiler = (q.codeBoilerplate || "").replace(/\s+/g, "");
      return cleanedCode !== cleanedBoiler && cleanedCode.length > 20;
    }
    return false;
  };

  const formatTimerString = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isSEB = navigator.userAgent.includes("SafeExamBrowser") || navigator.userAgent.includes("SEB");

  // Render initialization fullscreen demand page before accessing test sheets
  if (!isFullscreenEnforced) {
    if (isEntryLocked) {
      const requiredPassword = exam.entryPassword || liveExam.entryPassword || "password123";
      return (
        <div className="max-w-md mx-auto glass p-8 rounded-3xl border border-white/60 text-center flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out] relative">
          <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm">
            <ShieldAlert className="h-7 w-7 text-indigo-600" />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 mx-auto">
              Password Protected Assessment
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
              {exam.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Please enter the invigilator access PIN or password provided by your proctor.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (entryPasswordInput.trim() === requiredPassword) {
                  setIsEntryLocked(false);
                } else {
                  setEntryPasswordError(true);
                }
              }}
              className="flex flex-col gap-3 mt-3 w-full"
            >
              <input
                type="password"
                value={entryPasswordInput}
                onChange={(e) => {
                  setEntryPasswordInput(e.target.value);
                  setEntryPasswordError(false);
                }}
                placeholder="Enter Invigilator Access PIN"
                className={`w-full px-4 py-3 bg-white border ${
                  entryPasswordError
                    ? "border-rose-400 focus:ring-rose-500"
                    : "border-slate-200 focus:ring-indigo-500"
                } rounded-xl text-sm outline-none transition-all placeholder:text-slate-400 font-mono text-center tracking-wider text-slate-800`}
                autoFocus
              />
              {entryPasswordError && (
                <span className="text-[11px] text-rose-500 font-bold text-center">
                  Incorrect PIN/Password. Please enter the password set by your teacher.
                </span>
              )}

              <div className="flex gap-3 w-full mt-2">
                <button
                  type="button"
                  onClick={() => onCancel()}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-2xl text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  Unlock Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto glass p-8 rounded-3xl border border-white/60 text-center flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out] relative">
        <div className="absolute top-4 right-4 bg-red-100 border border-red-200 text-rose-600 px-3 py-1 rounded-xl text-[10px] font-bold uppercase">
          Lockdown Active
        </div>

        <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-150">
          <ShieldAlert className="h-7 w-7 text-indigo-600" />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Ready to initiate secure exam?
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Exam Subject: {exam.subject} &bull; Author: {exam.author}
          </span>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold mt-2.5">
            {isSEB 
              ? "Your environment is secured by Safe Exam Browser. You may begin the exam."
              : "This exam requires Safe Exam Browser (SEB) for maximum security. Please download the configuration below, then open it to launch the secure environment."}
          </p>
        </div>

        <div className="w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 divide-y divide-slate-100 text-left font-sans text-xs text-slate-600 flex flex-col gap-2.5">
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-slate-700">Exam Title:</span>
            <span className="font-bold text-slate-900">{exam.title}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-slate-700">
              Allowed Duration:
            </span>
            <span className="font-bold text-slate-900 font-mono text-[13px]">
              {exam.durationMinutes} Minutes
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="font-semibold text-slate-700">
              Minimum Integrity Level:
            </span>
            <span className="font-bold text-rose-600 font-mono text-[13px]">
              {exam.integrityThreshold}% score required
            </span>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          {showExitDialog ? (
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="password"
                value={exitPasswordInput}
                onChange={(e) => {
                  setExitPasswordInput(e.target.value);
                  setExitPasswordError(false);
                }}
                placeholder="Enter admin password to exit"
                className={`w-full px-3 py-2 bg-white border ${exitPasswordError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"} rounded-xl text-xs outline-none transition-all placeholder:text-slate-400 font-mono`}
              />
              {exitPasswordError && (
                <span className="text-[10px] text-rose-500 font-bold">
                  Incorrect admin password
                </span>
              )}
              <div className="flex gap-2 w-full mt-1">
                <button
                  onClick={() => setShowExitDialog(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    const requiredExit = (liveExam.adminExitPassword || exam.adminExitPassword || "admin").trim();
                    if (exitPasswordInput.trim() === requiredExit) {
                      const key = `seb_autosave_${exam.id}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
                      localStorage.removeItem(key);
                      onCancel();
                    } else {
                      setExitPasswordError(true);
                    }
                  }}
                  className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl text-xs shadow-md shadow-rose-200 cursor-pointer"
                >
                  Confirm Exit
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (exam.adminExitPassword) {
                  setShowExitDialog(true);
                } else {
                  const key = `seb_autosave_${exam.id}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
                  localStorage.removeItem(key);
                  onCancel();
                }
              }}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-2xl text-xs active:scale-95 transition-all cursor-pointer"
            >
              Cancel & Return
            </button>
          )}

          {isSEB ? (
            <button
              onClick={enterFullscreen}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              Start Secure Exam
            </button>
          ) : (
            <a
              href={`/api/exams/${exam.id}/seb`}
              download
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer text-center"
            >
              Download SEB Configuration
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out] relative">
      {/* Absolute fullscreen escape guard cover warning banner */}
      {fullscreenError && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md glass bg-white/95 p-8 rounded-3xl border border-rose-200/50 shadow-2xl flex flex-col items-center gap-6">
            <div className="h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center border border-rose-200 animate-bounce">
              <ShieldAlert className="h-7 w-7 text-rose-600" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-black text-rose-700 font-sans">
                LOCKDOWN VIOLATION ALERT!
              </h2>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed mt-1">
                You exited the secure fullscreen testing context. This
                represents severe academic compromise. You must return to full
                screen immediately.
              </p>
            </div>

            <div className="text-3xl font-mono font-black text-rose-600 animate-pulse bg-rose-50 px-5 py-2.5 rounded-2xl border border-rose-100">
              {secondsToRecoverFullscreen}s Left
            </div>

            {showExitDialog ? (
              <div className="w-full flex flex-col gap-3 mt-2 text-left animate-[fadeIn_0.2s_ease-out]">
                <span className="text-xs font-bold text-slate-700">
                  Admin Override Required to Exit
                </span>
                <input
                  type="password"
                  value={exitPasswordInput}
                  onChange={(e) => {
                    setExitPasswordInput(e.target.value);
                    setExitPasswordError(false);
                  }}
                  placeholder="Enter admin password"
                  className={`w-full px-4 py-3 bg-white border ${exitPasswordError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-rose-500"} rounded-xl text-sm outline-none transition-all placeholder:text-slate-400 font-mono`}
                />
                {exitPasswordError && (
                  <span className="text-[10px] text-rose-500 font-bold mb-1">
                    Incorrect admin password
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const requiredExit = (liveExam.adminExitPassword || exam.adminExitPassword || "admin").trim();
                      if (exitPasswordInput.trim() === requiredExit) {
                        const key = `seb_autosave_${exam.id}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
                        localStorage.removeItem(key);
                        onCancel();
                      } else {
                        setExitPasswordError(true);
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    Force Exit Exam
                  </button>
                  <button
                    onClick={() => setShowExitDialog(false)}
                    className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl text-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={enterFullscreen}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  Exert Re-entry & Resume
                </button>
                {exam.adminExitPassword && (
                  <button
                    onClick={() => setShowExitDialog(true)}
                    className="w-full text-slate-500 hover:text-slate-700 font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Admin Override Exit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Red Warning Banner notifier for copy-paste blocking */}
      {alertNotification && (
        <div className="fixed top-20 inset-x-4 max-w-xl mx-auto z-40 bg-rose-500/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-rose-400 text-left animate-[slideDown_0.3s_ease-out]">
          <ShieldAlert className="h-5 w-5 shrink-0 text-white animate-pulse" />
          <span className="text-xs font-bold font-sans tracking-wide leading-snug">
            {alertNotification}
          </span>
        </div>
      )}

      {/* Top Header Bar matching Test Series layout */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
            {exam.title}
          </span>
          <span className="text-slate-300 font-bold">&gt;</span>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
            {exam.subject || "Reasoning"}
          </span>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-slate-400 ml-3">
            <span
              className={`w-2 h-2 rounded-full ${
                cloudSyncStatus === "synced"
                  ? "bg-emerald-500 animate-pulse"
                  : cloudSyncStatus === "saving"
                    ? "bg-amber-500 animate-spin"
                    : "bg-rose-500"
              }`}
            />
            <span>
              {cloudSyncStatus === "synced"
                ? `DB Synced (${lastSyncedTime})`
                : cloudSyncStatus === "saving"
                  ? "Syncing to DB..."
                  : "Offline Mode"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => promptExitAuthorization("quit")}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 transition-colors cursor-pointer"
          >
            Exit
          </button>
          <button
            type="button"
            onClick={() => promptExitAuthorization("submit")}
            className="bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-extrabold px-5 py-2 rounded-full shadow-md transition-all cursor-pointer active:scale-95"
          >
            Review and Submit
          </button>
        </div>
      </div>

      {/* Main 3-Column Test Interface */}
      <div className="max-w-[1700px] mx-auto p-4 sm:p-6 grid grid-cols-12 gap-5 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Question Palette (3-Columns Grid of Questions)  */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3.5 order-2 lg:order-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Question Palette
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {liveExam.questions.length} Questions
            </span>
          </div>

          {/* Palette Questions Grid (3 Columns) */}
          <div className="grid grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-1">
            {liveExam.questions.map((q, idx) => {
              const answered = isQuestionAnswered(idx);
              const marked = markedForReview.has(idx);
              const visited = visitedQuestions.has(idx);
              const isActive = activeQuestionIndex === idx;

              let style = "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
              if (answered && marked) {
                style = "bg-[#7c3aed] text-white border-[#6d28d9]";
              } else if (marked) {
                style = "bg-[#8b5cf6] text-white border-[#7c3aed]";
              } else if (answered) {
                style = "bg-[#22c55e] text-white border-[#16a34a]";
              } else if (visited && !answered) {
                style = "bg-[#f87171] text-white border-[#ef4444]";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveQuestionIndex(idx)}
                  className={`h-9 w-full rounded-lg border text-xs font-bold font-mono flex items-center justify-center transition-all cursor-pointer relative ${style} ${
                    isActive ? "ring-2 ring-indigo-600 ring-offset-2 scale-105 z-10 shadow-sm font-extrabold" : ""
                  }`}
                >
                  {(idx + 1).toString().padStart(2, "0")}
                  {answered && marked && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend Summary Badges beneath Palette */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-[11px] font-bold text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#22c55e]" /> Answered
              </span>
              <span className="font-mono text-slate-800">
                {liveExam.questions.filter((_, i) => isQuestionAnswered(i)).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#8b5cf6]" /> Marked to review
              </span>
              <span className="font-mono text-slate-800">{markedForReview.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#f87171]" /> Not Answered
              </span>
              <span className="font-mono text-slate-800">
                {Math.max(
                  0,
                  visitedQuestions.size - liveExam.questions.filter((_, i) => isQuestionAnswered(i)).length
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-white border border-slate-300" /> Not Visited
              </span>
              <span className="font-mono text-slate-800">
                {Math.max(0, liveExam.questions.length - visitedQuestions.size)}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER COLUMN: Active Question Display & Answering Workspace  */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col order-1 lg:order-2 min-h-[580px]">
          {/* Question Header: Q: Number on left, Report on right */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-base sm:text-lg font-black text-slate-900 font-sans">
                Q: {activeQuestionIndex + 1}
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                +{activeQuestion.points || 1.0} Marks
              </span>
              {activeQuestion.type === "coding" && (
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  Practical Coding Task
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setReportText("");
                setReportSuccess(false);
                setShowReportModal(true);
              }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report</span>
            </button>
          </div>

          {/* Question Prompt Content Card */}
          <div className="mt-5 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-slate-800 text-sm leading-relaxed font-sans">
            <div className="font-bold text-slate-900 mb-2">
              {activeQuestion.title}
            </div>
            <div className="whitespace-pre-wrap text-slate-700">
              {activeQuestion.questionText}
            </div>
          </div>

          {/* Answering Area: MCQ or Coding Sandbox */}
          {activeQuestion.type === "coding" ? (
            <div className="mt-5 flex-1 flex flex-col border border-slate-200 rounded-2xl overflow-hidden min-h-[420px]">
              <Group orientation="horizontal" className="w-full h-full">
                <Panel defaultSize={50} minSize={30} className="flex flex-col bg-slate-50 p-4 border-r border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase">Test Cases Specification</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {testCaseProgress[activeQuestion.id]?.filter(Boolean).length || 0} / {(activeQuestion.testCases || []).length} Passed
                    </span>
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[300px]">
                    {(activeQuestion.testCases || []).map((tc, idx) => {
                      const passing = testCaseProgress[activeQuestion.id]?.[idx];
                      return (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-700">Test Case {idx + 1}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              passing === true ? "bg-emerald-100 text-emerald-800" : passing === false ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"
                            }`}>
                              {passing === true ? "PASSED" : passing === false ? "FAILED" : "PENDING"}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-600">Input: {tc.input}</div>
                          <div className="font-mono text-[11px] text-slate-600">Expected: {tc.expectedOutput}</div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
                <Separator className="w-1.5 h-full bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-colors" />
                <Panel defaultSize={50} minSize={30} className="flex flex-col bg-white">
                  <CodeEditor
                    questionId={activeQuestion.id}
                    code={answers.find((a) => a.questionId === activeQuestion.id)?.codingCode || ""}
                    onChange={handleCodingEdit}
                    language={activeQuestion.language || "javascript"}
                    boilerplate={activeQuestion.codeBoilerplate || ""}
                    testCases={activeQuestion.testCases || []}
                    readOnly={isSubmitting || timeLeftSeconds <= 0}
                    onCodeExecuted={(passed, tcIndex) => {
                      setTestCaseProgress((prev) => {
                        const current = prev[activeQuestion.id] || [];
                        const next = [...current];
                        next[tcIndex] = passed;
                        return { ...prev, [activeQuestion.id]: next };
                      });
                    }}
                  />
                </Panel>
              </Group>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3 flex-1">
              {activeQuestion.options?.map((opt, oIdx) => {
                const savedAns = answers.find((a) => a.questionId === activeQuestion.id);
                const isSelected = savedAns?.mcqAnswer === oIdx;
                const letter = String.fromCharCode(97 + oIdx); // a, b, c, d

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleMCQSelect(oIdx)}
                    disabled={isSubmitting || timeLeftSeconds <= 0}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 cursor-pointer ${
                      isSelected
                        ? "bg-slate-100/90 border-[#1e293b] text-slate-900 shadow-sm"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <span className={`text-sm font-bold ${isSelected ? "text-slate-900 font-extrabold" : "text-slate-500"}`}>
                      {letter})
                    </span>
                    <span className="text-sm font-medium flex-1 leading-relaxed">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Action Bar: Bookmark on left, Clear Response / Prev / Save and Next on right */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMarkedForReview((prev) => {
                  const next = new Set(prev);
                  if (next.has(activeQuestionIndex)) next.delete(activeQuestionIndex);
                  else next.add(activeQuestionIndex);
                  return next;
                });
                setBookmarkedQuestions((prev) => {
                  const next = new Set(prev);
                  if (next.has(activeQuestionIndex)) next.delete(activeQuestionIndex);
                  else next.add(activeQuestionIndex);
                  return next;
                });
              }}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                markedForReview.has(activeQuestionIndex)
                  ? "bg-purple-50 text-purple-700 border-purple-300 shadow-xs"
                  : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              <Bookmark className={`w-4 h-4 ${markedForReview.has(activeQuestionIndex) ? "fill-purple-600 text-purple-600" : "text-slate-400"}`} />
              <span>{markedForReview.has(activeQuestionIndex) ? "Bookmarked" : "Bookmark"}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setAnswers((prev) => prev.filter((a) => a.questionId !== activeQuestion.id));
                }}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Response
              </button>

              {activeQuestionIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  ← Previous
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (activeQuestionIndex < liveExam.questions.length - 1) {
                    setActiveQuestionIndex(activeQuestionIndex + 1);
                  } else {
                    promptExitAuthorization("submit");
                  }
                }}
                className="px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <span>Save and Next</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Digital Timer, Utilities & Question Overview   */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 order-3">
          {/* Digital Countdown Timer Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
            <div className="flex items-center justify-center gap-3 font-mono text-3xl font-black text-slate-800">
              <span>{Math.floor(timeLeftSeconds / 3600).toString().padStart(2, "0")}</span>
              <span className="text-slate-300">:</span>
              <span>{Math.floor((timeLeftSeconds % 3600) / 60).toString().padStart(2, "0")}</span>
              <span className="text-slate-300">:</span>
              <span>{(timeLeftSeconds % 60).toString().padStart(2, "0")}</span>
            </div>
            <div className="flex justify-between px-3 mt-1.5 text-[11px] font-bold text-slate-400">
              <span className="w-12 text-center">Hrs</span>
              <span className="w-12 text-center">Min</span>
              <span className="w-12 text-center">Sec</span>
            </div>
          </div>

          {/* Utility Buttons: About Test & Read Instructions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowAboutTestModal(true)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              About Test
            </button>
            <button
              type="button"
              onClick={() => setShowInstructionsModal(true)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-slate-500" /> Read Instructions
            </button>
          </div>

          {/* Overview Status Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-3">
              Overview
            </h4>
            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between items-center">
                <span>Total Questions</span>
                <span className="font-bold text-slate-800">{liveExam.questions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Visited</span>
                <span className="font-bold text-slate-800">{visitedQuestions.size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Not Visited</span>
                <span className="font-bold text-slate-800">
                  {Math.max(0, liveExam.questions.length - visitedQuestions.size)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" /> Answered
                </span>
                <span className="font-bold text-emerald-600">
                  {liveExam.questions.filter((_, i) => isQuestionAnswered(i)).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]" /> Not Answered
                </span>
                <span className="font-bold text-rose-500">
                  {Math.max(
                    0,
                    visitedQuestions.size - liveExam.questions.filter((_, i) => isQuestionAnswered(i)).length
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Marked to review
                </span>
                <span className="font-bold text-purple-600">{markedForReview.size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-500" /> Bookmarked
                </span>
                <span className="font-bold text-indigo-600">{bookmarkedQuestions.size}</span>
              </div>
            </div>
          </div>

          {/* AI Proctoring Camera Stream Widget */}
          {liveExam.requireCamera && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-500" /> AI Proctor Feed
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  integrityScore >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
                  {integrityScore}% Integrity
                </span>
              </div>
              <ProctorCamera
                requireCamera={liveExam.requireCamera}
                isExamStarted={isFullscreenEnforced}
                onScanResult={(report) => {
                  setAiReports((prev) => [...prev, report]);
                  if (report.status === "flagged") {
                    triggerViolation(
                      "FACE_NOT_DETECTED",
                      report.summary || "AI Proctor flagged video anomaly",
                      "medium"
                    );
                  }
                }}
                onAudioAlert={(level) => {
                  if (level > 85) {
                    triggerViolation("AUDIO_ALERT", "Unusual speech or audio spike detected", "low");
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal: About Test */}
      {showAboutTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 max-w-md w-full text-left">
            <h3 className="text-base font-bold text-slate-900 mb-1">{exam.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{exam.description || "Secure invigilated online assessment"}</p>
            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between">
                <span className="font-bold">Subject:</span>
                <span>{exam.subject || "Reasoning / Technical"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Total Duration:</span>
                <span>{exam.durationMinutes} Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Total Questions:</span>
                <span>{liveExam.questions.length} Questions</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Security Level:</span>
                <span>{exam.lockdownBrowsing ? "Strict Lockdown Active" : "Standard"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">AI Video Proctoring:</span>
                <span>{exam.requireCamera ? "Active (Open-Weight Model)" : "Disabled"}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAboutTestModal(false)}
              className="mt-5 w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Read Instructions */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 max-w-lg w-full text-left">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Examination Instructions</h3>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 max-h-[350px] overflow-y-auto pr-2 leading-relaxed">
              <p><strong>1. Countdown Timer:</strong> The timer at the top right displays the remaining time. The assessment will auto-submit upon timer expiration.</p>
              <p><strong>2. Question Palette:</strong> Located on the left side, showing:</p>
              <ul className="pl-4 list-disc space-y-1 text-slate-500">
                <li><span className="text-emerald-600 font-bold">Green:</span> Answered</li>
                <li><span className="text-purple-600 font-bold">Purple:</span> Marked for Review / Bookmarked</li>
                <li><span className="text-rose-500 font-bold">Red:</span> Visited but not answered</li>
                <li><span className="text-slate-500 font-bold">White:</span> Not visited yet</li>
              </ul>
              <p><strong>3. Saving Responses:</strong> Select your option and click <em>"Save and Next"</em> to save your choice and proceed.</p>
              <p><strong>4. Clear Response:</strong> Click <em>"Clear Response"</em> to unselect your option.</p>
              <p><strong>5. Marking for Review:</strong> Click <em>"Bookmark"</em> to flag a question for later verification.</p>
              <p><strong>6. Fullscreen & Proctoring:</strong> Do not exit fullscreen or switch windows. All tab blurs and face absence are tracked by AI proctoring.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowInstructionsModal(false)}
              className="mt-5 w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Modal: Report Question Issue */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 max-w-sm w-full text-left">
            <h3 className="text-base font-bold text-slate-900 mb-1">Report Question Issue</h3>
            <p className="text-xs text-slate-500 mb-3">Notice an error in Question {activeQuestionIndex + 1}? Report it to your invigilator.</p>
            {reportSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl text-center mb-3">
                ✓ Report submitted to exam invigilator.
              </div>
            ) : (
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe the issue (e.g., incorrect options, typo)..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
              {!reportSuccess && (
                <button
                  type="button"
                  onClick={() => setReportSuccess(true)}
                  className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Submit Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Strict Invigilator Exit Authorization Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 max-w-md w-full relative text-center">
            <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-4">
              <Lock className="h-7 w-7" />
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 mb-2">
              Invigilator Authorization Required
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Exam Exit Verification
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              As configured by the teacher conducting this examination, your invigilator must enter their Exit PIN/Password to authorize {pendingExitAction === "quit" ? "quitting" : "submitting"} this exam session.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const requiredExitPw = (liveExam.adminExitPassword || exam.adminExitPassword || "admin").trim();
                if (exitPasswordInput.trim() === requiredExitPw) {
                  setShowExitModal(false);
                  handleSubmitAnswers(true);
                } else {
                  setExitPasswordError(true);
                }
              }}
              className="flex flex-col gap-3 text-left"
            >
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Teacher Exit Password / PIN
                </label>
                <input
                  type="password"
                  value={exitPasswordInput}
                  onChange={(e) => {
                    setExitPasswordInput(e.target.value);
                    setExitPasswordError(false);
                  }}
                  placeholder="Enter teacher exit password"
                  className={`w-full px-4 py-3 bg-slate-50 border ${
                    exitPasswordError
                      ? "border-rose-400 focus:ring-rose-500"
                      : "border-slate-200 focus:ring-indigo-500"
                  } rounded-xl text-sm focus:outline-none focus:bg-white transition-all font-mono text-slate-900`}
                  autoFocus
                  required
                />
                {exitPasswordError && (
                  <p className="text-xs font-bold text-rose-500 mt-1.5">
                    Incorrect exit password. Please consult your exam invigilator.
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 mt-3">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-all"
                >
                  Return to Exam
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Authorize & {pendingExitAction === "quit" ? "Quit" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
