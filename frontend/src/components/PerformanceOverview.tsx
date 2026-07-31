/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  ShieldAlert,
  BarChart3,
  LineChart as LucideLineChart,
  Calendar,
  RotateCcw,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Submission } from "../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface PerformanceOverviewProps {
  submissions: Submission[];
}

export default function PerformanceOverview({
  submissions,
}: PerformanceOverviewProps) {
  // States for search and filter configurations
  const [selectedExamId, setSelectedExamId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "7days" | "30days">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 1. Get unique exams loaded in memory from existing submissions
  const examsList = useMemo(() => {
    const map = new Map<string, string>();
    submissions.forEach((s) => {
      map.set(s.examId, s.examTitle);
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [submissions]);

  // 2. Filter submissions list based on selections
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Exam ID check
      if (selectedExamId !== "all" && sub.examId !== selectedExamId) {
        return false;
      }
      // Search query check (name or email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = sub.candidateName.toLowerCase().includes(query);
        const emailMatch = sub.candidateEmail.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch) return false;
      }
      // Date range filter
      if (dateRange !== "all") {
        const subDate = sub.submittedAt
          ? new Date(sub.submittedAt)
          : new Date();
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - subDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (dateRange === "7days" && diffDays > 7) return false;
        if (dateRange === "30days" && diffDays > 30) return false;
      }
      return true;
    });
  }, [submissions, selectedExamId, searchQuery, dateRange]);

  // 3. Aggregate performance statistics grouped by Exam Title
  const aggregatedExamData = useMemo(() => {
    const groups: {
      [examId: string]: {
        id: string;
        title: string;
        scores: number[];
        integrities: number[];
        counts: number;
      };
    } = {};

    filteredSubmissions.forEach((sub) => {
      if (!groups[sub.examId]) {
        groups[sub.examId] = {
          id: sub.examId,
          title: sub.examTitle,
          scores: [],
          integrities: [],
          counts: 0,
        };
      }
      const scorePct = Math.round((sub.score / sub.maxScore) * 100) || 0;
      groups[sub.examId].scores.push(scorePct);
      groups[sub.examId].integrities.push(sub.integrityScore);
      groups[sub.examId].counts += 1;
    });

    return Object.values(groups).map((g) => {
      const avgScore = g.scores.length
        ? Math.round(g.scores.reduce((a, b) => a + b, 0) / g.scores.length)
        : 0;
      const avgIntegrity = g.integrities.length
        ? Math.round(
            g.integrities.reduce((a, b) => a + b, 0) / g.integrities.length,
          )
        : 0;
      return {
        id: g.id,
        name: g.title.length > 25 ? g.title.slice(0, 22) + "..." : g.title,
        fullName: g.title,
        "Average Score %": avgScore,
        "Average Integrity Score %": avgIntegrity,
        "Submission Count": g.counts,
      };
    });
  }, [filteredSubmissions]);

  // 4. Chronological Trend Lines Over Time (Sorted Submissions)
  const chronologicalTrendData = useMemo(() => {
    // Sort submissions chronologically
    const sorted = [...filteredSubmissions].sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateA - dateB;
    });

    // Group elements by Date string (YYYY-MM-DD or readable local format) to prevent plotting too many clustered nodes
    const dailyGroups: {
      [date: string]: { scores: number[]; integrities: number[] };
    } = {};

    sorted.forEach((sub) => {
      const d = sub.submittedAt ? new Date(sub.submittedAt) : new Date();
      const dateStr = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      if (!dailyGroups[dateStr]) {
        dailyGroups[dateStr] = { scores: [], integrities: [] };
      }
      const scorePct = Math.round((sub.score / sub.maxScore) * 100) || 0;
      dailyGroups[dateStr].scores.push(scorePct);
      dailyGroups[dateStr].integrities.push(sub.integrityScore);
    });

    return Object.entries(dailyGroups).map(([dateLabel, data]) => {
      const avgScore =
        Math.round(
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        ) || 0;
      const avgIntegrity =
        Math.round(
          data.integrities.reduce((a, b) => a + b, 0) / data.integrities.length,
        ) || 0;
      return {
        date: dateLabel,
        "Average Academic Score %": avgScore,
        "Average Proctor Integrity %": avgIntegrity,
      };
    });
  }, [filteredSubmissions]);

  // 5. Cohort Metrics & Chart C: Exam Score Distribution (Histogram)
  const scoreDistributionData = useMemo(() => {
    const bins = [
      "0-10%",
      "11-20%",
      "21-30%",
      "31-40%",
      "41-50%",
      "51-60%",
      "61-70%",
      "71-80%",
      "81-90%",
      "91-100%",
    ];
    const buckets = bins.map((bin) => ({ name: bin, Submissions: 0 }));

    filteredSubmissions.forEach((sub) => {
      const pct = Math.round((sub.score / sub.maxScore) * 100) || 0;
      let idx = Math.floor((pct - 1) / 10);
      if (pct === 0) idx = 0;
      if (idx > 9) idx = 9;
      if (idx < 0) idx = 0;
      buckets[idx].Submissions++;
    });

    return buckets;
  }, [filteredSubmissions]);

  // 6. Violations Breakdown
  const violationsBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSubmissions.forEach(sub => {
      sub.violations.forEach(v => {
        counts[v.type] = (counts[v.type] || 0) + 1;
      });
    });
    
    return Object.entries(counts).map(([type, count]) => ({
      name: type.replace(/-/g, ' ').toUpperCase(),
      Count: count
    })).sort((a, b) => b.Count - a.Count);
  }, [filteredSubmissions]);
  
  const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#06b6d4'];

  // Overall cohort metrics
  const cohortMetrics = useMemo(() => {
    if (!filteredSubmissions.length) {
      return { avgScore: 0, avgIntegrity: 0, reviewRate: 0, totalCount: 0 };
    }
    let totalScorePct = 0;
    let totalIntegrity = 0;
    let reviewCount = 0;

    filteredSubmissions.forEach((sub) => {
      totalScorePct += Math.round((sub.score / sub.maxScore) * 100) || 0;
      totalIntegrity += sub.integrityScore;
      if (sub.status === "review" || sub.status === "failed") {
        reviewCount += 1;
      }
    });

    return {
      avgScore: Math.round(totalScorePct / filteredSubmissions.length),
      avgIntegrity: Math.round(totalIntegrity / filteredSubmissions.length),
      reviewRate: Math.round((reviewCount / filteredSubmissions.length) * 100),
      totalCount: filteredSubmissions.length,
    };
  }, [filteredSubmissions]);

  // Clear filters handler
  const resetFilters = () => {
    setSelectedExamId("all");
    setDateRange("all");
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Search & Filter Toolbar */}
      <div className="glass p-5 rounded-3xl border border-white/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm text-slate-950 font-sans">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-150/70 transition-all placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>

          {/* Exam dropdown */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-150/70 transition-all"
          >
            <option value="all">📊 All Exams List</option>
            {examsList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>

          {/* Date range filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100/75 p-1 rounded-xl border border-slate-200/50">
            {(["all", "7days", "30days"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                  dateRange === range
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {range === "all" ? "All" : range === "7days" ? "7D" : "30D"}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filter state */}
        <button
          onClick={resetFilters}
          className="flex items-center justify-center gap-1.5 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer active:scale-95 transition-all self-start md:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5 text-indigo-500" /> Reset Selection
        </button>
      </div>

      {/* Cohort aggregated key indicators (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Exam attempts count card */}
        <div className="glass p-5 rounded-3xl border border-white/60 text-left shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">
              Cohort Attempts Checked
            </span>
            <span className="text-2xl font-extrabold text-slate-950 font-sans tracking-tight">
              {cohortMetrics.totalCount}
            </span>
            <span className="text-[10px] font-medium text-slate-500 leading-none">
              submissions currently matching grid filters
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Average score ratio achievement */}
        <div className="glass p-5 rounded-3xl border border-white/60 text-left shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">
              Average Exam Score
            </span>
            <span className="text-2xl font-extrabold text-[#059669] font-sans tracking-tight">
              {cohortMetrics.avgScore}%
            </span>
            <span className="text-[10px] font-medium text-emerald-600 leading-none">
              average academic performance metric
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
        </div>

        {/* Average integrity compliance */}
        <div className="glass p-5 rounded-3xl border border-white/60 text-left shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">
              Average Integrity Index
            </span>
            <span className="text-2xl font-extrabold text-indigo-700 font-sans tracking-tight">
              {cohortMetrics.avgIntegrity}%
            </span>
            <span className="text-[10px] font-medium text-indigo-500 leading-none">
              compliance camera/tab focus level
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Action/Fail Proctored Alert Rate */}
        <div className="glass p-5 rounded-3xl border border-white/60 text-left shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">
              Flagged / Review Rate
            </span>
            <span
              className={`text-2xl font-extrabold font-sans tracking-tight ${cohortMetrics.reviewRate > 30 ? "text-rose-600" : "text-amber-600"}`}
            >
              {cohortMetrics.reviewRate}%
            </span>
            <span className="text-[10px] font-medium text-slate-500 leading-none">
              of submissions with high violations count
            </span>
          </div>
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${cohortMetrics.reviewRate > 30 ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-amber-50 border-amber-100 text-amber-600"}`}
          >
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Recharts charts row comparison rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Double line chronologic trends overall */}
        <div className="glass p-6 rounded-3xl border border-white/60 text-left shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest block">
                System Chronology Analytics
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <LucideLineChart className="h-4 w-4 text-indigo-600" /> Academic
                vs. Integrity Trend Line
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-lg border border-slate-200">
              Timeline view
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            This graph tracks how student grade percentages correlate with
            overall proctor security compliance. Use this timeline to review if
            academic stress or higher exam weight triggers a sharp reduction in
            integrity parameters.
          </p>

          <div className="h-72 w-full mt-2">
            {chronologicalTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chronologicalTrendData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(15,23,42,0.04)"
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={10}
                    fontWeight="bold"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    fontWeight="bold"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      paddingTop: "10px",
                    }}
                  />
                  <Line
                    type="monotone"
                    name="Academic Score %"
                    dataKey="Average Academic Score %"
                    stroke="#10b981"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    name="Security Integrity %"
                    dataKey="Average Proctor Integrity %"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    activeDot={{ r: 6 }}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 rounded-2xl flex flex-col justify-center items-center gap-1 border border-dashed border-slate-200">
                <AlertTriangle className="h-6 w-6 text-slate-400" />
                <span className="text-xs text-slate-400 font-bold">
                  No trend data found for current filters
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Grouped Exam Comparison Bar chart */}
        <div className="glass p-6 rounded-3xl border border-white/60 text-left shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest block">
                Cohort Distribution Analysis
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <BarChart3 className="h-4 w-4 text-emerald-600" /> Metrics
                Distribution Grouped by Exam
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-lg border border-slate-200">
              Cross comparison
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            This barchart maps individual averages for all active exams. Verify
            which subjects suffer from higher anomalies or security risk flags,
            and configure tighter threshold settings for upcoming exam
            authorizations.
          </p>

          <div className="h-72 w-full mt-2">
            {aggregatedExamData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={aggregatedExamData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(15,23,42,0.04)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    fontWeight="bold"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    fontWeight="bold"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      paddingTop: "10px",
                    }}
                  />
                  <Bar
                    dataKey="Average Score %"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="Average Integrity Score %"
                    fill="#4f46e5"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 rounded-2xl flex flex-col justify-center items-center gap-1 border border-dashed border-slate-200">
                <AlertTriangle className="h-6 w-6 text-slate-400" />
                <span className="text-xs text-slate-400 font-bold">
                  No aggregated statistics matching filters
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart C: Distribution of Exam Scores */}
      <div className="glass p-6 rounded-3xl border border-white/60 text-left shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest block">
              Cohort Distribution Analysis
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <BarChart3 className="h-4 w-4 text-emerald-600" /> Distribution of
              Exam Scores
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-lg border border-slate-200">
            Histogram format
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Visualize the distribution of exam scores for every submitted test,
          helping educators identify trends in student performance and overall
          grade distribution.
        </p>

        <div className="h-72 w-full mt-2">
          {scoreDistributionData.some((d) => d.Submissions > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={scoreDistributionData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(15,23,42,0.04)"
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  fontWeight="bold"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  fontWeight="bold"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    backgroundColor: "rgba(15,23,42,0.95)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                  cursor={{ fill: "rgba(15,23,42,0.02)" }}
                />
                <Bar
                  dataKey="Submissions"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-slate-50 rounded-2xl flex flex-col justify-center items-center gap-1 border border-dashed border-slate-200">
              <AlertTriangle className="h-6 w-6 text-slate-400" />
              <span className="text-xs text-slate-400 font-bold">
                No distribution statistics matching filters
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart D: Violations Breakdown */}
      <div className="glass p-6 rounded-3xl border border-white/60 text-left shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest block">
              Security Anomaly Analytics
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 mt-0.5">
              <ShieldAlert className="h-4 w-4 text-rose-500" /> Violations Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-lg border border-slate-200">
            Categorical Split
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Identify the most common proctoring anomalies across your selected cohort, allowing you to fine-tune exam restrictions or inform students of strict rules.
        </p>

        <div className="h-72 w-full mt-2">
          {violationsBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationsBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="Count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {violationsBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    backgroundColor: "rgba(15,23,42,0.95)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-slate-50 rounded-2xl flex flex-col justify-center items-center gap-1 border border-dashed border-slate-200">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <span className="text-xs text-slate-400 font-bold">
                No security violations recorded for these exams!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cohort Performance Grade Book details panel */}
      <div className="glass rounded-3xl border border-white/60 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 bg-white/40 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500" /> Matching
            Student Cohort Analytics Ledger
          </h3>
          <span className="text-[10px] text-slate-500 font-bold font-mono bg-slate-100 px-3 py-1 rounded-xl">
            {filteredSubmissions.length} Registered Attempt logs
          </span>
        </div>

        {filteredSubmissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-3.5">Candidate Details</th>
                  <th className="px-6 py-3.5">Exam Completed</th>
                  <th className="px-6 py-3.5 text-center">Score Grade Ratio</th>
                  <th className="px-6 py-3.5 text-center">Security Score</th>
                  <th className="px-6 py-3.5 text-center">Audit Assessment</th>
                  <th className="px-6 py-3.5 text-right">Submitted Hour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 font-bold text-xs text-slate-800">
                {filteredSubmissions.map((sub) => {
                  const pct = Math.round((sub.score / sub.maxScore) * 100) || 0;
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-indigo-50/10 transition-colors"
                    >
                      <td className="px-6 py-4 border-slate-100/80">
                        <div className="flex flex-col">
                          <span className="text-slate-950 font-bold">
                            {sub.candidateName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">
                            {sub.candidateEmail}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {sub.examTitle}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-950 font-extrabold">
                          {sub.score} / {sub.maxScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold font-mono ml-1">
                          ({pct}%)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-extrabold ${
                            sub.integrityScore >= 80
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                              : sub.integrityScore >= 50
                                ? "bg-amber-50 text-amber-800 border border-amber-100"
                                : "bg-rose-50 text-rose-800 border border-rose-100"
                          }`}
                        >
                          {sub.integrityScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] rounded-lg tracking-wide uppercase font-bold ${
                            sub.status === "passed"
                              ? "bg-emerald-100 text-emerald-800 font-sans"
                              : sub.status === "review"
                                ? "bg-amber-100 text-amber-850 font-sans"
                                : "bg-rose-100 text-rose-850 font-sans"
                          }`}
                        >
                          {sub.status === "passed"
                            ? "TRUSTED PASS"
                            : sub.status === "review"
                              ? "MANUAL REVIEW"
                              : "COMPROMISED"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 font-mono font-semibold text-[10px]">
                        {sub.submittedAt
                          ? new Date(sub.submittedAt).toLocaleDateString()
                          : "Just Now"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 flex flex-col justify-center items-center gap-2 border-t border-slate-100">
            <span className="text-slate-400 text-xs font-bold">
              No registration logs fit search query filters
            </span>
            <button
              onClick={resetFilters}
              className="text-indigo-600 hover:text-indigo-700 font-extrabold text-[11px] uppercase tracking-wide flex items-center gap-1 mt-1 cursor-pointer"
            >
              Reset view criteria <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
