/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Mail,
  FileText,
  Server,
  GraduationCap,
  ShieldCheck,
  Lock,
  Camera,
  AlertOctagon,
  User,
  BookOpen,
  Clock,
  ChevronRight,
  CheckCircle2,
  Eye,
  Award,
} from "lucide-react";
import { Exam, Question, TestCase, QuestionType } from "../types";
import NotesPortal from "./NotesPortal";
import TaskPortal from "./TaskPortal";
import AcademicCalendar from "./AcademicCalendar";
import TeacherDesk from "./TeacherDesk";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

function StudentAttendance({ email }: { email: string }) {
  const [records, setRecords] = useState<any[]>([]);
  useEffect(() => {
    if (!email) return;
    fetch(`/api/attendance/student/${email}`)
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(err => console.error(err));
  }, [email]);

  const presentCount = records.filter(r => r.status === 'present').length;
  const lateCount = records.filter(r => r.status === 'late').length;
  const absentCount = records.filter(r => r.status === 'absent').length;
  const total = presentCount + lateCount + absentCount;

  const data = [
    { name: 'Present', value: presentCount, color: '#10B981' }, 
    { name: 'Late', value: lateCount, color: '#F59E0B' },       
    { name: 'Absent', value: absentCount, color: '#F43F5E' },     
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full animate-[fadeIn_0.3s_ease-out]">
      <div className="glass p-6 rounded-2xl border border-white/60 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-between">
         <div className="flex-1 w-full flex flex-col gap-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500"/> My Attendance Overview</h2>
            <p className="text-sm text-slate-500">Track your overall academic presence across all registered classes.</p>
            <div className="mt-4 flex gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex-1 text-center">
                 <p className="text-xs font-bold text-emerald-600 uppercase">Present</p>
                 <p className="text-2xl font-black text-emerald-700">{presentCount}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex-1 text-center">
                 <p className="text-xs font-bold text-amber-600 uppercase">Late</p>
                 <p className="text-2xl font-black text-amber-700">{lateCount}</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex-1 text-center">
                 <p className="text-xs font-bold text-rose-600 uppercase">Absent</p>
                 <p className="text-2xl font-black text-rose-700">{absentCount}</p>
              </div>
            </div>
         </div>
         <div className="w-64 h-64 flex-shrink-0">
           {total > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
           ) : (
             <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-full text-slate-400 text-xs font-bold text-center p-8">No Data Available</div>
           )}
         </div>
      </div>
      
      <div className="glass p-6 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-4">
         <h3 className="text-base font-bold text-slate-800">Recent Attendance History</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-slate-200">
                     <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                     <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Period</th>
                     <th className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  </tr>
               </thead>
               <tbody>
                  {records.map((r, i) => (
                     <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-medium text-slate-700">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-700">Period {r.period || 1}</td>
                        <td className="py-3 px-4 text-sm font-bold">
                           {r.status === 'present' && <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Present</span>}
                           {r.status === 'absent' && <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">Absent</span>}
                           {r.status === 'late' && <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Late</span>}
                        </td>
                     </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">No attendance records found for your account.</td></tr>}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

interface DashboardProps {
  userRole: "student" | "teacher";
  userEmail?: string;
  studentContext?: {
    depts: string[];
    years: string[];
    classes: string[];
  };
  exams: Exam[];
  onCreateExam: (exam: Exam) => void;
  onSelectExam: (exam: Exam, name: string, email: string) => void;
  onViewLogs: () => void;
}

export default function Dashboard({
  userRole,
  userEmail,
  studentContext,
  exams,
  onCreateExam,
  onSelectExam,
  onViewLogs,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "take" | "desk" | "notes" | "tasks" | "calendar" | "attendance"
  >(userRole === "student" ? "take" : "desk");

  // Derived filtered exams for student
  const filteredExams = userRole === "student" && studentContext
    ? exams.filter(e => {
        const matchesDept = !e.targetDepartments?.length || e.targetDepartments.some(d => studentContext.depts.includes(d));
        const matchesYear = !e.targetYears?.length || e.targetYears.some(y => studentContext.years.includes(y));
        const matchesClass = !e.targetClasses?.length || e.targetClasses.some(c => studentContext.classes.includes(c));
        
        if (!(matchesDept && matchesYear && matchesClass)) return false;
        
        // Filter out completed exams
        if (e.startTime) {
           const start = new Date(e.startTime).getTime();
           const end = start + (e.durationMinutes || 0) * 60000;
           if (Date.now() > end) return false;
        }
        
        return true;
      })
    : exams;

  useEffect(() => {
    if (userRole === "student" && activeTab === "desk") {
      setActiveTab("take");
    } else if (userRole === "teacher" && activeTab === "take") {
      setActiveTab("desk");
    }
  }, [userRole, activeTab]);

  // Safe Exam Browser (SEB) simulation flags and controllers
  const [isSebMode, setIsSebMode] = useState<boolean>(true);
  const [sebHandshakeKey, setSebHandshakeKey] = useState<string>(
    "SEB_CONFIG_AES256_ACTIVE_SECURE_TOKEN_55829",
  );
  const [browserExamKey, setBrowserExamKey] = useState<string>(
    "BEK_SHA256_STRICT_ENVIRONMENT_LOCKDOWN_88412",
  );
  const [diagnosticStatus, setDiagnosticStatus] = useState<
    "idle" | "testing" | "success" | "warn"
  >("idle");
  const [activeStepIdx, setActiveStepIdx] = useState<number>(-1);
  const [diagnosticSteps, setDiagnosticSteps] = useState<
    { name: string; status: "pending" | "success" }[]
  >([
    { name: "Verifying SEB wrapper handshake token...", status: "pending" },
    {
      name: "Intercepting native system clipboard hooks...",
      status: "pending",
    },
    {
      name: "Probing integrated webcam media constraints...",
      status: "pending",
    },
    { name: "Binding HTML5 frame-lock boundary rules...", status: "pending" },
  ]);

  const runSebDiagnostics = () => {
    setDiagnosticStatus("testing");
    setActiveStepIdx(0);
    setDiagnosticSteps([
      { name: "Verifying SEB wrapper handshake token...", status: "pending" },
      {
        name: "Intercepting native system clipboard hooks...",
        status: "pending",
      },
      {
        name: "Probing integrated webcam media constraints...",
        status: "pending",
      },
      { name: "Binding HTML5 frame-lock boundary rules...", status: "pending" },
    ]);

    let step = 0;
    const interval = setInterval(() => {
      setDiagnosticSteps((prev) => {
        const next = [...prev];
        if (next[step]) {
          next[step].status = "success";
        }
        return next;
      });
      step += 1;
      setActiveStepIdx(step);
      if (step >= 4) {
        clearInterval(interval);
        setDiagnosticStatus("success");
      }
    }, 600);
  };

  // Student taking metadata variables
  const [candidateName, setCandidateName] = useState<string>(
    "Prajesh Ramamoorthy",
  );
  const [candidateEmail, setCandidateEmail] = useState<string>(
    "prajeshramamoorthy2007@gmail.com",
  );
  const [selectedExamForTake, setSelectedExamForTake] = useState<Exam | null>(
    null,
  );

  const handleStartExamFlow = async (exam: Exam) => {
    const finalName = candidateName.trim() || "Prajesh Ramamoorthy";
    const finalEmail =
      candidateEmail.trim() || "prajeshramamoorthy2007@gmail.com";

    if (exam.allowedIps && exam.allowedIps.length > 0) {
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        if (!exam.allowedIps.includes(data.ip)) {
          alert(
            `ACCESS DENIED: Your Client IP Address (${data.ip}) is not registered in the institutional whitelist proxy bypass for this specific assessment.`,
          );
          return;
        }
      } catch (err) {
        alert(
          "Could not verify client internet IP address for whitelist security. Assessment access restricted.",
        );
        return;
      }
    }

    if (!candidateName.trim()) {
      setCandidateName("Prajesh Ramamoorthy");
    }
    if (!candidateEmail.trim()) {
      setCandidateEmail("prajeshramamoorthy2007@gmail.com");
    }

    onSelectExam(exam, finalName, finalEmail);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Banner top hero card */}
      <div className="relative overflow-hidden glass p-6 sm:p-8 rounded-3xl border border-white/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_12px_44px_-10px_rgba(0,0,0,0.03)] selection:bg-indigo-100">
        <div className="flex-1 text-left relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="glass-pill text-[10px] px-2.5 py-1 text-indigo-700 font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 fill-emerald-100" />{" "}
              Proctor Shield Verification Core v2.4
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans leading-tight mt-1">
            Iris Integrity Portal
          </h1>
          <p className="text-sm text-slate-600 font-medium max-w-[580px] leading-relaxed">
            Conduct coding exams and quizzes with robust Safe-Exam Browser (SEB)
            lockouts, instant JS stack compilation, and live Web Camera face
            analyzer proctoring models.
          </p>
        </div>

        <div className="shrink-0 flex gap-3 relative z-10 w-full sm:w-auto">
          {userRole === "teacher" && (
            <button
              onClick={onViewLogs}
              className="flex-1 sm:flex-initial bg-white hover:bg-slate-50 border border-slate-200 py-3 px-5 rounded-2xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Server className="h-4.5 w-4.5 text-indigo-500" />
              Teacher Audit Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation panels */}
      <div className="flex border-b border-slate-200">
        {userRole === "student" && (
          <>
            <button
              onClick={() => setActiveTab("take")}
              className={`pb-3.5 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
                activeTab === "take"
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Scheduled Academic Exams
              {activeTab === "take" && (
                <div className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`pb-3.5 px-4 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === "attendance"
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500"/> My Attendance
              {activeTab === "attendance" && (
                <div className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </>
        )}

        {userRole === "teacher" && (
          <button
            onClick={() => {
              setActiveTab("desk");
              setSelectedExamForTake(null);
            }}
            className={`pb-3.5 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === "desk"
                ? "text-indigo-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-emerald-500" /> Teacher Desk
            </div>
            {activeTab === "desk" && (
              <div className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-600 rounded-full" />
            )}
          </button>
        )}

        <button
          onClick={() => {
            setActiveTab("notes");
            setSelectedExamForTake(null);
          }}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "notes"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-amber-500" /> Syllabus Library
          </div>
          {activeTab === "notes" && (
            <div className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("tasks");
            setSelectedExamForTake(null);
          }}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "tasks"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-fuchsia-500" /> Assignments Base
          </div>
          {activeTab === "tasks" && (
            <div className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab("calendar");
            setSelectedExamForTake(null);
          }}
          className={`pb-3.5 px-4 text-sm font-semibold transition-all relative cursor-pointer ${
            activeTab === "calendar"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-blue-500" /> Academic Calendar
          </div>
          {activeTab === "calendar" && (
            <div className="absolute bottom-0 inset-x-4 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "notes" && (
        <NotesPortal 
          userRole={userRole}
          studentContext={studentContext}
        />
      )}

      {activeTab === "tasks" && (
        <TaskPortal 
          userRole={userRole}
          studentContext={studentContext}
        />
      )}

      {activeTab === "calendar" && (
        <AcademicCalendar 
          userRole={userRole} 
        />
      )}

      {/* Main Content area according to selected tab */}
      {activeTab === "take" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {filteredExams.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white/50 border border-slate-200 border-dashed rounded-[2rem]">
               <BookOpen className="h-10 w-10 mb-4 text-slate-300" />
               <p className="font-bold text-slate-500 text-lg">No Exams Scheduled</p>
               <p className="text-sm font-medium mt-1">There are no assessments currently targeting your enrolled classes.</p>
            </div>
          ) : (
            filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="glass p-6 rounded-3xl border border-white/60 hover:border-indigo-200/60 hover:shadow-lg transition-all duration-300 flex flex-col justify-between gap-5 relative group"
              >
              {/* Exam metadata cards tags */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />{" "}
                    {exam.subject}
                  </span>
                  <span className="font-mono text-slate-400">
                    Date: {exam.createdAt}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight font-sans mt-1">
                  {exam.title}
                </h2>

                <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1">
                  {exam.description}
                </p>
              </div>

              {/* Status and proctor parameters indicators bar */}
              <div className="flex flex-wrap gap-2 pt-2.5 border-t border-slate-100/60">
                <div className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-indigo-500" />{" "}
                  {exam.durationMinutes} Minutes duration
                </div>

                {exam.lockdownBrowsing && (
                  <div className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-semibold text-red-600 bg-red-500/5 border-red-200/50 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Fully Lockdown Enforced
                  </div>
                )}

                {exam.requireCamera && (
                  <div className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-semibold text-indigo-600 bg-indigo-500/5 border-indigo-200/50 flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Webcam active AI Proctors
                  </div>
                )}

                <div className="glass-pill px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold text-slate-500 ml-auto">
                  Questions: {exam.questions.length}
                </div>
              </div>

              {/* Start triggers CTA */}
              <button
                onClick={() => handleStartExamFlow(exam)}
                className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-1.5 group-hover:shadow-md cursor-pointer transition-all active:scale-98"
              >
                Initiate Secure Exam Session
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))
          )}
        </div>
      )}

      {activeTab === "desk" && (
        <TeacherDesk 
          exams={exams} 
          onCreateExam={onCreateExam}
        />
      )}

      {activeTab === "attendance" && (
        <StudentAttendance email={
          JSON.parse(localStorage.getItem("iris_user") || "{}").email || candidateEmail
        } />
      )}

    </div>
  );
}