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
} from "lucide-react";
import {
  Exam,
  ExamAnswer,
  Violation,
  AIProctorReport,
  Question,
} from "../types";

import CodeEditor from "./CodeEditor";

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

  // SEB Passwords Authentication state
  const [entryPasswordInput, setEntryPasswordInput] = useState<string>("");
  const [isEntryLocked, setIsEntryLocked] = useState<boolean>(
    !!liveExam.entryPassword,
  );
  const [entryPasswordError, setEntryPasswordError] = useState<boolean>(false);

  const [exitPasswordInput, setExitPasswordInput] = useState<string>("");
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);
  const [exitPasswordError, setExitPasswordError] = useState<boolean>(false);

  const activeQuestion = liveExam.questions[activeQuestionIndex];

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

      const initAnswers = exam.questions.map((q) => {
        const ans: ExamAnswer = { questionId: q.id };
        if (q.type === "coding") ans.codingCode = q.codeBoilerplate || "";
        return ans;
      });
      setAnswers(initAnswers);
    };
    initStore();
  }, [exam, candidateEmail]);

  useEffect(() => {
    if (answers.length === 0) return;
    const key = `seb_autosave_${exam.id}_${candidateEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const autoSaveData = {
      answers,
      timeLeftSeconds,
      violations,
      aiReports,
      integrityScore,
      testCaseProgress,
    };
    openDB("ExamSystems", 1)
      .then((db) => db.put("autosave", autoSaveData, key))
      .catch((e) => {
        // fallback
        localStorage.setItem(key, JSON.stringify(autoSaveData));
      });
  }, [
    answers,
    timeLeftSeconds,
    violations,
    aiReports,
    integrityScore,
    testCaseProgress,
    exam.id,
    candidateEmail,
  ]);

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

  const formatTimerString = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isSEB = navigator.userAgent.includes("SafeExamBrowser") || navigator.userAgent.includes("SEB");

  // Render initialization fullscreen demand page before accessing test sheets
  if (!isFullscreenEnforced) {
    if (isEntryLocked) {
      return (
        <div className="max-w-md mx-auto glass p-8 rounded-3xl border border-white/60 text-center flex flex-col items-center gap-6 animate-[fadeIn_0.3s_ease-out] relative">
          <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
            <ShieldAlert className="h-6 w-6 text-slate-500" />
          </div>
          <div className="flex flex-col gap-2 w-full">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
              Secured Exam Access
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Please enter the invigilator password to access this assessment.
            </p>

            <input
              type="password"
              value={entryPasswordInput}
              onChange={(e) => {
                setEntryPasswordInput(e.target.value);
                setEntryPasswordError(false);
              }}
              placeholder="Enter exam password"
              className={`mt-4 w-full px-4 py-3 bg-white border ${entryPasswordError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-indigo-500"} rounded-xl text-sm outline-none transition-all placeholder:text-slate-400 font-mono`}
            />
            {entryPasswordError && (
              <span className="text-[10px] text-rose-500 font-bold text-left mt-1">
                Incorrect password
              </span>
            )}
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={() => onCancel()}
              className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-2xl text-xs active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (entryPasswordInput === exam.entryPassword) {
                  setIsEntryLocked(false);
                } else {
                  setEntryPasswordError(true);
                }
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-indigo-100 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              Unlock Exam
            </button>
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
                    if (exitPasswordInput === exam.adminExitPassword) {
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
                      if (exitPasswordInput === exam.adminExitPassword) {
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

      {/* Top bar controls dashboard */}
      <div className="glass-header px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/80 shadow-md">
        {/* Exam stats details */}
        <div className="flex items-center gap-4 text-left">
          <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <FileText className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-md font-bold text-slate-900 font-sans tracking-tight leading-tight">
              {exam.title}
            </h2>
            <span className="text-[10px] text-slate-400 font-bold font-mono">
              COMPILING ANSWERS FOR:{" "}
              <span className="text-slate-600 font-sans uppercase">
                {candidateName} &lt;{candidateEmail}&gt;
              </span>
            </span>
          </div>
        </div>

        {/* Live integrity indicator widgets */}
        <div className="flex items-center gap-4">
          {/* Real-time LocalStorage Auto-saved state indicator badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs">
            <CheckCircle className="h-3.5 w-3.5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Sync Active
            </span>
          </div>

          {/* Integrity core index gauge */}
          <div className="flex items-center gap-2 bg-white/60 py-2 px-3.5 rounded-xl border border-slate-200/50 shadow-xs relative group cursor-help">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              Integrity Score:
            </span>
            <div
              className={`text-sm font-black font-mono transition-colors ${
                integrityScore >= 80
                  ? "text-emerald-600"
                  : integrityScore >= 50
                    ? "text-amber-500"
                    : "text-rose-600"
              }`}
            >
              {integrityScore}%
            </div>
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  integrityScore >= 80
                    ? "#10b981"
                    : integrityScore >= 50
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            />
            <div className="absolute top-10 right-0 w-72 bg-slate-900 text-white text-[10px] p-4 rounded-xl shadow-xl hidden group-hover:block z-50 animate-[fadeIn_0.2s_ease-out]">
              <div className="font-bold text-slate-300 mb-2 uppercase tracking-widest border-b border-slate-700 pb-1.5">
                Integrity Computation Engine
              </div>
              <ul className="space-y-1.5 font-medium">
                <li className="flex justify-between">
                  <span>Base Starting Score:</span>{" "}
                  <span className="text-emerald-400">100%</span>
                </li>
                <li className="flex justify-between">
                  <span>Low Penalty (No Face):</span>{" "}
                  <span className="text-amber-400">-5%</span>
                </li>
                <li className="flex justify-between border-t border-slate-800 pt-1 mt-1">
                  <span>Med Penalty (Tab Blur, Shortcuts):</span>{" "}
                  <span className="text-rose-400">-12%</span>
                </li>
                <li className="flex justify-between">
                  <span>High Penalty (Tab Switch):</span>{" "}
                  <span className="text-rose-500">-25%</span>
                </li>
                <li className="flex justify-between">
                  <span>High Penalty (Exited SEB Fullscreen):</span>{" "}
                  <span className="text-rose-500">-25%</span>
                </li>
              </ul>
              <div className="mt-2 text-slate-400 border-t border-slate-700 pt-1 leading-tight">
                Warning: Leaving lockdown fullscreen or switching tabs triggers
                penalties immediately and requires Admin Override to exit.
              </div>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-slate-900 text-slate-100 py-2 px-3.5 rounded-xl shadow-md border border-slate-800">
            <Clock
              className={`h-4.5 w-4.5 ${timeLeftSeconds < 120 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}
            />
            <span className="text-xs font-bold font-mono tracking-wider">
              {formatTimerString(timeLeftSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Main split dashboard view (Floating camera/navigator sidebar on left + Questions hub on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT COMPONENT (Camera + navigation checklist indicators) */}
        <div className="lg:col-span-1 flex flex-col gap-6 order-2 lg:order-1">


          {/* Answer check sheets quick index navigator */}
          <div className="glass p-5 rounded-3xl border border-white/60 text-left flex flex-col gap-3.5 shadow-sm">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block border-b border-slate-100 pb-2">
              Question Navigator check sheet
            </span>

            <div className="grid grid-cols-4 gap-2">
              {exam.questions.map((q, idx) => {
                const ans = answers.find((a) => a.questionId === q.id);
                // MCQ complete status
                let answered = false;
                if (q.type === "mcq") answered = ans?.mcqAnswer !== undefined;
                if (q.type === "coding") {
                  const cleanedCode = (ans?.codingCode || "").replace(
                    /\s+/g,
                    "",
                  );
                  const cleanedBoiler = q.codeBoilerplate.replace(/\s+/g, "");
                  answered =
                    cleanedCode !== cleanedBoiler && cleanedCode.length > 30;
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-11 rounded-xl border flex items-center justify-center font-extrabold font-mono text-xs cursor-pointer transition-all ${
                      activeQuestionIndex === idx
                        ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-150/80 shadow-md scale-105"
                        : answered
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5 mt-1.5 text-[10px] font-medium text-slate-400 font-sans leading-relaxed">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-indigo-600 shrink-0" />
                <span>Currently Active workspace</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-100 border border-emerald-350 shrink-0" />
                <span>Question answered and solved</span>
              </div>
            </div>
          </div>

          {/* Fast Exit Emergency Button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to exit the exam environment? Doing so will permanently lock any solved answers and submit immediately.",
                )
              ) {
                handleSubmitAnswers(true);
              }
            }}
            className="w-full bg-slate-900 text-slate-100 hover:bg-black py-3.5 rounded-2xl text-[10px] font-bold font-sans tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-lg shadow-slate-200/50"
          >
            <LogOut className="h-4 w-4" /> Finish & Submit Attempt
          </button>
        </div>

        {/* RIGHT COMPONENT (Questions answers sheet) */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-1 lg:order-2">
          {/* Prominent Countdown Progress Bar banner */}
          <div className="glass p-5 rounded-3xl border border-white/60 text-left flex flex-col gap-3 shadow-xs bg-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock
                  className={`h-4.5 w-4.5 ${timeLeftSeconds < 120 ? "text-rose-600 animate-pulse font-black" : "text-slate-800"}`}
                />
                <span className="text-[10px] font-extrabold text-slate-800 tracking-wider uppercase">
                  Exam Time Remaining Monitor
                </span>
              </div>
              <span
                className={`text-sm font-extrabold font-mono tracking-wider px-3 py-1 rounded-xl shadow-inner border transition-all ${
                  timeLeftSeconds < 120
                    ? "bg-rose-50 border-rose-250 text-rose-700 animate-pulse"
                    : "bg-slate-900 border-slate-800 text-white"
                }`}
              >
                {formatTimerString(timeLeftSeconds)}
              </span>
            </div>

            {/* Dynamic visual slider */}
            <div className="w-full bg-slate-200/65 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  timeLeftSeconds < 120
                    ? "bg-rose-500 animate-pulse"
                    : timeLeftSeconds < 300
                      ? "bg-amber-500"
                      : "bg-indigo-600"
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, (timeLeftSeconds / (exam.durationMinutes * 60)) * 100))}%`,
                }}
              />
            </div>

            {timeLeftSeconds <= 120 && (
              <p className="text-[10px] text-rose-650 font-black animate-pulse leading-none flex items-center gap-1.5 mt-0.5">
                ⚠ WARNING: Under two minutes remaining. Exam paper sheet
                validates and locks immediately upon zero timeout!
              </p>
            )}
          </div>

          {/* Active Question Title Card header */}
          <div className="glass p-6 sm:p-7 rounded-3xl border border-white/65 text-left flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100 tracking-wider">
                Question {activeQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span className="text-xs text-slate-500 font-bold font-mono bg-slate-100 px-2 py-0.5 rounded">
                Weight: {activeQuestion.points} points
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-950 font-sans tracking-tight">
              {activeQuestion.title}
            </h3>

            {/* Render question details description */}
            <div className="bg-white/55 p-4 rounded-2xl border border-slate-150 text-xs font-semibold text-slate-650 whitespace-pre-wrap leading-relaxed font-sans">
              {activeQuestion.questionText}
            </div>

            {/* Format-dependent inputs selection fields */}
            {activeQuestion.type === "mcq" && activeQuestion.options && (
              <div className="flex flex-col gap-2.5 mt-2.5">
                {activeQuestion.options.map((opt, oIdx) => {
                  const savedAnswer = answers.find(
                    (a) => a.questionId === activeQuestion.id,
                  );
                  const isChecked = savedAnswer?.mcqAnswer === oIdx;

                  return (
                    <button
                      key={oIdx}
                      disabled={isSubmitting || timeLeftSeconds <= 0}
                      onClick={() => handleMCQSelect(oIdx)}
                      className={`text-left p-4 rounded-xl border transition-all text-xs font-semibold flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? "bg-indigo-50 border-indigo-300 text-indigo-950 shadow-xs"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] border transition-colors ${
                            isChecked
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        {opt}
                      </span>
                      {isChecked && (
                        <CheckCircle className="h-4.5 w-4.5 text-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Code challenges implementation cockpit selection */}
            {activeQuestion.type === "coding" && (
              <div className="mt-2.5 flex flex-col gap-3">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-700">
                      Test Cases Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(activeQuestion.testCases || []).map((tc, idx) => {
                      const passing =
                        testCaseProgress[activeQuestion.id]?.[idx];
                      return (
                        <div
                          key={idx}
                          title={tc.name || `Test Case ${idx + 1}`}
                          className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                            passing === true
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                              : passing === false
                                ? "bg-rose-500"
                                : "bg-slate-300"
                          }`}
                        />
                      );
                    })}
                    <span className="text-[10px] font-bold text-slate-500 ml-2">
                      {testCaseProgress[activeQuestion.id]?.filter(Boolean)
                        .length || 0}{" "}
                      / {(activeQuestion.testCases || []).length} Passed
                    </span>
                  </div>
                </div>

                <CodeEditor
                  questionId={activeQuestion.id}
                  code={
                    answers.find((a) => a.questionId === activeQuestion.id)
                      ?.codingCode || ""
                  }
                  onChange={handleCodingEdit}
                  language={activeQuestion.language || "javascript"}
                  boilerplate={activeQuestion.codeBoilerplate || ""}
                  testCases={activeQuestion.testCases || []}
                  readOnly={isSubmitting || timeLeftSeconds <= 0}
                  onCodeExecuted={(passed, tcIndex) => {
                    setTestCaseProgress((prev) => {
                      const currentProgress = prev[activeQuestion.id] || [];
                      const nextProgress = [...currentProgress];
                      nextProgress[tcIndex] = passed;
                      return { ...prev, [activeQuestion.id]: nextProgress };
                    });
                  }}
                />
              </div>
            )}
          </div>

          {/* Navigation sliders back to next bar */}
          <div className="flex justify-between items-center">
            <button
              onClick={() =>
                setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))
              }
              disabled={activeQuestionIndex === 0}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Previous Question
            </button>

            <div className="flex gap-2">
              {activeQuestionIndex < exam.questions.length - 1 ? (
                <button
                  onClick={() =>
                    setActiveQuestionIndex(
                      Math.min(
                        exam.questions.length - 1,
                        activeQuestionIndex + 1,
                      ),
                    )
                  }
                  className="bg-indigo-650 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  Next Question <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitAnswers(false)}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  Submit Exam Paper
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
