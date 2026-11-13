/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Award,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Flame,
  Lock,
  Compass,
  Check,
  Download,
  BarChart2,
  Presentation,
  Search,
  Filter,
  SortDesc,
  ChevronDown,
  ClipboardList
} from "lucide-react";
import { Submission, Violation } from "../types";
import {
  exportCertificateToPDF,
  exportDetailedReportPDF,
} from "../utils/pdfExport";
import { exportDiagnosticReportPDF } from "../utils/diagnosticReport";
import PerformanceOverview from "./PerformanceOverview";
import LiveProctorGrid from "./LiveProctorGrid";

interface LogsReviewProps {
  submissions: Submission[];
  onBack: () => void;
  onRefresh: () => void;
}

export default function LogsReview({
  submissions,
  onBack,
  onRefresh,
}: LogsReviewProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [subTab, setSubTab] = useState<"submissions" | "analytics">(
    "submissions",
  );

  const selectedSubmission = submissions.find(
    (s) => s.id === selectedSubmissionId,
  );

  // Advanced Table Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "score" | "integrity">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Get unique exams for the filter
  const uniqueExams = Array.from(new Set(submissions.map(s => s.examId))).map(id => {
    return { id, title: submissions.find(s => s.examId === id)?.examTitle || id };
  });

  // Filter & Sort Logic
  const filteredSubmissions = submissions.filter(sub => {
    if (examFilter !== "all" && sub.examId !== examFilter) return false;
    if (statusFilter !== "all" && sub.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!sub.candidateName.toLowerCase().includes(q) && !sub.candidateEmail.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    let diff = 0;
    if (sortField === "date") {
      const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      diff = timeA - timeB;
    } else if (sortField === "score") {
      const pctA = Math.round((a.score / a.maxScore) * 100) || 0;
      const pctB = Math.round((b.score / b.maxScore) * 100) || 0;
      diff = pctA - pctB;
    } else if (sortField === "integrity") {
      diff = a.integrityScore - b.integrityScore;
    }
    return sortOrder === "asc" ? diff : -diff;
  });

  const exportToCSV = () => {
    const headers = ["Candidate Name", "Email", "Exam ID", "Exam Title", "Score", "Max Score", "Score %", "Integrity %", "Status", "Date"];
    const rows = filteredSubmissions.map(s => [
      s.candidateName,
      s.candidateEmail,
      s.examId,
      s.examTitle,
      s.score,
      s.maxScore,
      Math.round((s.score / s.maxScore) * 100) || 0,
      s.integrityScore,
      s.status,
      new Date(s.submittedAt || Date.now()).toLocaleString()
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submissions_ledger_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectSubmission = (id: string) => {
    setSelectedSubmissionId(id);
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      {/* Header navbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard Portal
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Security Audits & Smart Grading Desk
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Review detailed student integrity timelines, multiple violation
            alerts, and instant visual webcam results.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 py-2 px-3.5 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
          Synchronize Log Feeds
        </button>
      </div>

      {/* Sub-Tab Selector for main view */}
      {!selectedSubmission && (
        <div className="flex bg-slate-250/55 p-1 rounded-2xl border border-slate-200/60 self-start shadow-inner">
          <button
            onClick={() => setSubTab("submissions")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center gap-2 cursor-pointer ${
              subTab === "submissions"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-105/50"
            }`}
          >
            <Users className="h-4 w-4" /> Student Submissions Ledger
          </button>
          <button
            onClick={() => setSubTab("analytics")}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center gap-2 cursor-pointer ${
              subTab === "analytics"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-105/50"
            }`}
          >
            <BarChart2 className="h-4 w-4" /> Cohort Performance
          </button>
          <button
            onClick={() => setSubTab("live" as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center gap-2 cursor-pointer ${
              subTab === ("live" as any)
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-105/50"
            }`}
          >
            <Eye className="h-4 w-4 text-emerald-500" /> Live Proctor Grid
          </button>
        </div>
      )}

      {!selectedSubmission ? (
        subTab === "analytics" ? (
          <PerformanceOverview submissions={submissions} />
        ) : subTab === ("live" as any) ? (
          <LiveProctorGrid />
        ) : (
          // Primary stats table layout
          <div className="flex flex-col gap-6">
            {/* Advanced Filters Toolbar */}
            <div className="glass p-5 rounded-3xl border border-white/60 flex flex-col xl:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                {/* Search */}
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-150/70 transition-all placeholder:text-slate-400"
                  />
                </div>
                
                {/* Exam Filter */}
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-150/70 transition-all text-slate-700"
                >
                  <option value="all">All Exams</option>
                  {uniqueExams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-150/70 transition-all text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="passed">Passed (Trusted)</option>
                  <option value="review">Needs Review</option>
                  <option value="failed">Failed (Compromised)</option>
                </select>

                {/* Sort Filter */}
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortField(field as any);
                    setSortOrder(order as any);
                  }}
                  className="bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-150/70 transition-all text-slate-700"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="score-desc">Highest Score</option>
                  <option value="score-asc">Lowest Score</option>
                  <option value="integrity-desc">Highest Integrity</option>
                  <option value="integrity-asc">Lowest Integrity</option>
                </select>
              </div>

              <button
                onClick={exportToCSV}
                className="w-full xl:w-auto bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <Download className="h-4 w-4" /> Export CSV Ledger
              </button>
            </div>

            {/* Active candidates submissions grid */}
            <div className="glass rounded-3xl border border-white/60 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 bg-white/40 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-indigo-500" /> Completed
                  Exam Transactions
                </h3>
                <span className="text-xs text-slate-500 font-medium font-mono bg-white px-3 py-1 rounded-lg border border-slate-200">
                  {filteredSubmissions.length} Displayed Logs
                </span>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-3">Candidate Metadata</th>
                      <th className="px-6 py-3">Completed Exam</th>
                      <th className="px-6 py-3 text-center margin-0">
                        Academic Integrity Index
                      </th>
                      <th className="px-6 py-3 text-center">
                        Score / Grade Ratio
                      </th>
                      <th className="px-6 py-3 text-center">Outcome Status</th>
                      <th className="px-6 py-3 text-right">Auditing File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60 font-medium text-xs text-slate-600">
                    {filteredSubmissions.map((sub) => {
                      const pct =
                        Math.round((sub.score / sub.maxScore) * 100) || 0;
                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-indigo-50/20 transition-all"
                        >
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 text-sm">
                                {sub.candidateName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {sub.candidateEmail}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="text-slate-700 font-medium">
                              {sub.examTitle}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-center">
                            <div
                              className="inline-flex items-center gap-1.5 justify-center px-2.5 py-1 rounded-full text-[11px] font-bold font-mono shadow-xs border"
                              style={{
                                backgroundColor:
                                  sub.integrityScore >= 80
                                    ? "rgba(16,185,129,0.06)"
                                    : sub.integrityScore >= 50
                                      ? "rgba(245,158,11,0.06)"
                                      : "rgba(244,63,94,0.06)",
                                color:
                                  sub.integrityScore >= 80
                                    ? "#059669"
                                    : sub.integrityScore >= 50
                                      ? "#d97706"
                                      : "#e11d48",
                                borderColor:
                                  sub.integrityScore >= 80
                                    ? "rgba(16,185,129,0.15)"
                                    : sub.integrityScore >= 50
                                      ? "rgba(245,158,11,0.15)"
                                      : "rgba(244,63,94,0.15)",
                              }}
                            >
                              {sub.integrityScore}%
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-center font-semibold text-slate-800">
                            <div className="flex flex-col items-center justify-center">
                              <span className="font-bold text-slate-900">
                                {sub.score} / {sub.maxScore}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                Ratio: {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                                sub.status === "passed"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : sub.status === "review"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : "bg-rose-50 text-rose-700 border border-rose-100"
                              }`}
                            >
                              {sub.status === "passed" && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {sub.status === "review" && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {sub.status === "failed" && (
                                <XCircle className="h-3 w-3" />
                              )}
                              {sub.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right">
                            <button
                              onClick={() => handleSelectSubmission(sub.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5" /> Analyze Sheet
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredSubmissions.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center p-16 text-slate-400"
                        >
                          <Users className="h-10 w-10 mx-auto mb-3 opacity-40 text-slate-500" />
                          <span className="font-bold text-sm block mb-1">No Submissions Found</span>
                          <span className="text-xs">Adjust your search or filters to see more logs.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        // Secondary detail card screen (Detailed Submission breakdown)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 glass p-4 rounded-2xl border border-white/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-1 rounded-md uppercase border border-slate-200 block w-max mb-1.5">
                Detailed Diagnostic Audit File
              </span>
              <h2 className="text-xl font-bold text-slate-900 font-sans">
                {selectedSubmission.candidateName}
              </h2>
              <span className="text-xs text-slate-500 font-mono block mt-0.5">
                {selectedSubmission.candidateEmail} &bull; Exam ID:{" "}
                {selectedSubmission.examId}
              </span>
            </div>

            <div className="flex gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => exportDiagnosticReportPDF(selectedSubmission, submissions)}
                className="bg-rose-700 hover:bg-rose-800 active:scale-95 transition-all text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-200"
              >
                <ClipboardList className="h-4 w-4" /> Diagnostic Report
              </button>
              <button
                onClick={() => exportDetailedReportPDF(selectedSubmission)}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-150"
              >
                <Download className="h-4 w-4" /> Export Detailed Report
              </button>
              <button
                onClick={() => exportCertificateToPDF(selectedSubmission)}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-150"
              >
                <Download className="h-4 w-4" /> Export Certificate
              </button>
              <button
                onClick={() => setSelectedSubmissionId(null)}
                className="bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Back to List
              </button>
            </div>
          </div>

          {/* Left panel metrics (violations checklist + webcam visual timeline summaries) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Academic Integrity Index circular card */}
            <div className="glass p-5 rounded-2xl border border-white/60 text-center flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-3 right-3 text-[10px] font-bold font-mono uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-indigo-600">
                Score Rank
              </div>

              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">
                Exam Integrity Index
              </span>

              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="stroke-slate-100 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    className="fill-none transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={
                      2 *
                      Math.PI *
                      46 *
                      (1 - selectedSubmission.integrityScore / 100)
                    }
                    stroke={
                      selectedSubmission.integrityScore >= 75
                        ? "#10b981"
                        : selectedSubmission.integrityScore >= 50
                          ? "#f59e0b"
                          : "#f43f5e"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-slate-800 font-sans tracking-tight">
                    {selectedSubmission.integrityScore}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                    Rating
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-left w-full text-xs text-slate-600 leading-relaxed font-medium">
                {selectedSubmission.integrityScore >= 75 ? (
                  <div className="flex gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>High Trust Index.</strong> Gaze patterns,
                      fullscreen state, and focus behaviors aligned cleanly
                      within standard confidence limits.
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Integrity Warnings Flags.</strong> Candidate
                      demonstrated repeated out-of-bounds focus switches or
                      anomalous proctoring signals. Recommend complete review.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Complete logs of violations during taking */}
            <div className="glass p-5 rounded-2xl border border-white/60 flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Activity & Lockdown Violations List
              </span>

              <div className="flex flex-col gap-3.5">
                {selectedSubmission.violations.map((v, i) => (
                  <div
                    key={i}
                    className="flex gap-3 items-start border-l-2 pl-3.5 py-0.5 text-left border-red-400"
                  >
                    <div className="shrink-0 mt-1">
                      {v.type === "tab-switch" && (
                        <Lock className="h-4 w-4 text-rose-500" />
                      )}
                      {v.type === "blur" && (
                        <Eye className="h-4 w-4 text-amber-500" />
                      )}
                      {v.type === "fullscreen-exit" && (
                        <Flame className="h-4 w-4 text-rose-600" />
                      )}
                      {v.type === "proctor-warning" && (
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 uppercase font-mono">
                          {v.type.replace("-", " ")}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            v.severity === "high"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {v.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {v.description}
                      </p>
                      <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Logged: {new Date(v.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}

                {selectedSubmission.violations.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <ShieldCheck className="h-7 w-7 text-emerald-500 mx-auto mb-1 opacity-70" />
                    No violations detected. Exceptional academic trust!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel detailed content (Answers + AI Reports logs) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Proctor Reports list feedback from AI evaluation models */}
            <div className="glass p-5 rounded-2xl border border-white/60 flex flex-col gap-5">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4.5">
                  AI Webcam Image Proctoring Intelligence Logs
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSubmission.aiReports.map((report, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col gap-2.5 text-left ${
                        report.status === "clean"
                          ? "bg-emerald-50/20 border-emerald-100/60"
                          : report.status === "warning"
                            ? "bg-amber-50/20 border-amber-100/60"
                            : "bg-rose-50/20 border-rose-100/60"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            report.status === "clean"
                              ? "bg-emerald-100 text-emerald-800"
                              : report.status === "warning"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          Report #{idx + 1} &bull; {report.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">
                          Index: {idx + 1}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug font-medium">
                        &ldquo;{report.summary}&rdquo;
                      </p>

                      <div className="border-t border-slate-100 pt-2.5 mt-1 grid grid-cols-2 gap-y-1.5 gap-x-3 text-[10px] font-sans font-medium text-slate-500">
                        <div className="flex gap-1.5 items-center">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${report.faceDetected ? "bg-emerald-500" : "bg-rose-500"}`}
                          />
                          <span>
                            Face detected: {report.faceDetected ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>
                            Gaze Pattern:{" "}
                            <strong className="text-slate-700">
                              {report.eyeContactStatus}
                            </strong>
                          </span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${report.phoneDetected ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`}
                          />
                          <span>
                            Mobile cell phone:{" "}
                            {report.phoneDetected ? "Detected" : "Clean"}
                          </span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>
                            Accuracy Confidence:{" "}
                            <strong>
                              {Math.round(report.confidence * 100)}%
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedSubmission.aiReports.length === 0 && (
                    <div className="col-span-2 text-center p-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      No snap webcam insights compiled during this period.
                    </div>
                  )}
                </div>
              </div>

              {/* Screen Captures Periodic Audit */}
              <div className="mt-4 border-t border-slate-200/50 pt-5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4.5 text-left">
                  Periodic Silent Screen Captures
                </span>

                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                  {selectedSubmission.screenCaptures &&
                  selectedSubmission.screenCaptures.length > 0 ? (
                    selectedSubmission.screenCaptures.map((capture, idx) => (
                      <div
                        key={idx}
                        className="shrink-0 flex flex-col gap-2 w-72 snap-start"
                      >
                        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/60 shadow-sm bg-black group relative">
                          <img
                            src={capture}
                            alt={`Screen Capture ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono font-bold backdrop-blur-sm">
                            Frame T+{(idx + 1) * 30}s
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-full text-center p-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      No progressive screenshare captures recorded for this
                      submission.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Answer details comparisons */}
            <div className="glass p-5 rounded-2xl border border-white/60">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4.5">
                Answer sheets & Code evaluation reports
              </span>

              <div className="flex flex-col gap-6">
                {selectedSubmission.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    className="border-b border-slate-100 pb-5.5 last:border-0 last:pb-0 text-left"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold font-mono">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Question Ref: {ans.questionId}
                      </h4>
                    </div>

                    {/* MCQ details */}
                    {ans.mcqAnswer !== undefined && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-sans">
                        <span className="text-slate-400 font-semibold block mb-0.5">
                          Selected Option Index
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                          Option #{ans.mcqAnswer}
                        </div>
                      </div>
                    )}

                    {/* Coding challenge submissions and assertion metrics check */}
                    {ans.codingCode !== undefined && (
                      <div className="flex flex-col gap-3 font-sans">
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed max-h-56 overflow-y-auto relative shadow-md">
                          <span className="absolute top-2 right-2 text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded uppercase border border-indigo-500/30 font-sans tracking-wide">
                            Candidate Implemented Script
                          </span>
                          <pre className="whitespace-pre">{ans.codingCode}</pre>
                        </div>

                        {ans.testCasesResults &&
                          ans.testCasesResults.length > 0 && (
                            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                                Assertion Results Trace (
                                {
                                  ans.testCasesResults.filter((t) => t.passed)
                                    .length
                                }{" "}
                                / {ans.testCasesResults.length} passed)
                              </span>

                              <div className="flex flex-col gap-1.5">
                                {ans.testCasesResults.map((tc, tcIdx) => (
                                  <div
                                    key={tcIdx}
                                    className="bg-white p-2.5 rounded-lg border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-2"
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1.5">
                                        {tc.passed ? (
                                          <Check className="h-3.5 w-3.5 text-emerald-500 bg-emerald-100/40 p-0.5 rounded-full" />
                                        ) : (
                                          <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                        )}
                                        <span className="font-bold text-slate-600">
                                          Case #{tcIdx + 1} Input:
                                        </span>
                                        <code className="font-mono text-[10px] text-slate-500 bg-slate-50 px-1.5 rounded">
                                          {tc.input}
                                        </code>
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        Expected output:{" "}
                                        <code className="font-mono">
                                          {tc.expected}
                                        </code>
                                      </div>
                                    </div>
                                    <div className="bg-slate-50 px-2 py-1 rounded text-right font-mono text-[10px]">
                                      Received:{" "}
                                      <span
                                        className={
                                          tc.passed
                                            ? "text-emerald-600 font-bold"
                                            : "text-rose-500"
                                        }
                                      >
                                        {tc.actual}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
