/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Comprehensive Interview Preparation & AI Mock Interview Suite
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  Sparkles,
  Award,
  BookOpen,
  Code2,
  Users,
  Video,
  ExternalLink,
  Play,
  CheckCircle2,
  Clock,
  Mic,
  MicOff,
  Send,
  RefreshCw,
  TrendingUp,
  FileText,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers,
  Building2,
  Compass,
} from "lucide-react";
import { User } from "../types";

interface InterviewTopic {
  id: string;
  title: string;
  category: "dsa" | "system-design" | "cs-fundamentals" | "behavioral";
  description: string;
  keyConcepts: string[];
  docUrl?: string;
  videoUrl?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface CompanyTrack {
  id: string;
  name: string;
  tier: string;
  rounds: string[];
  hiringFocus: string;
  topQuestions: string[];
  tips: string[];
  resources: { name: string; url: string; type: "doc" | "video" | "practice" }[];
}

interface RoleTrack {
  id: string;
  role: string;
  summary: string;
  requiredSkills: string[];
  coreTopics: string[];
  sampleTechnicalQuestions: {
    question: string;
    expectedApproach: string;
    optimalComplexity: string;
  }[];
}

interface MockQuestion {
  id: string;
  type: "technical" | "hr";
  role?: string;
  company?: string;
  question: string;
  context: string;
  sampleFollowUps: string[];
  evaluationCriteria: string[];
  modelAnswerOutline: string;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  followUpQuestion?: string;
}

interface InterviewHistoryItem {
  id: string;
  round_type: string;
  role: string;
  company: string;
  score: number;
  created_at: string;
  feedback: any;
  transcript: any;
}

export default function InterviewPrep({
  user,
  userRole,
}: {
  user: User;
  userRole: "student" | "teacher";
}) {
  const [activeSection, setActiveSection] = useState<
    "tracks" | "topics" | "mock" | "history"
  >("tracks");

  // Catalog state loaded from backend
  const [topics, setTopics] = useState<InterviewTopic[]>([]);
  const [companies, setCompanies] = useState<CompanyTrack[]>([]);
  const [roles, setRoles] = useState<RoleTrack[]>([]);
  const [mockQuestions, setMockQuestions] = useState<MockQuestion[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Selected filters
  const [selectedCompany, setSelectedCompany] = useState<CompanyTrack | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleTrack | null>(null);
  const [topicCategory, setTopicCategory] = useState<string>("all");

  // Mock Interview State
  const [mockRound, setMockRound] = useState<"technical" | "hr">("technical");
  const [mockTargetCompany, setMockTargetCompany] = useState<string>("Google");
  const [mockTargetRole, setMockTargetRole] = useState<string>("Software Engineer");
  const [interviewState, setInterviewState] = useState<
    "idle" | "ongoing" | "evaluating" | "completed"
  >("idle");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeInterviewQuestions, setActiveInterviewQuestions] = useState<MockQuestion[]>([]);
  const [candidateResponse, setCandidateResponse] = useState("");
  const [interviewTranscript, setInterviewTranscript] = useState<
    { question: string; answer: string; evaluation: EvaluationResult }[]
  >([]);
  const [finalScorecard, setFinalScorecard] = useState<{
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  // Voice Speech-to-Text state
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<any>(null);

  // Past Sessions
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);

  // Fetch catalog from backend API
  useEffect(() => {
    fetch("/api/interview/tracks")
      .then((res) => res.json())
      .then((data) => {
        setTopics(data.topics || []);
        setCompanies(data.companies || []);
        setRoles(data.roles || []);
        setMockQuestions(data.mockQuestions || []);
        if (data.companies?.length > 0) setSelectedCompany(data.companies[0]);
        if (data.roles?.length > 0) setSelectedRole(data.roles[0]);
        setLoadingCatalog(false);
      })
      .catch((err) => {
        console.error("Failed to load interview tracks:", err);
        setLoadingCatalog(false);
      });

    loadHistory();
  }, [user]);

  const loadHistory = () => {
    if (!user?.email) return;
    fetch(`/api/interview/history/${encodeURIComponent(user.email)}`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch(() => {});
  };

  // Setup Web Speech Recognition for voice answering
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCandidateResponse((prev) => prev + " " + transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechRecognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please type your response.");
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechRecognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Start Live Mock Interview Session
  const startMockInterview = () => {
    const filtered = mockQuestions.filter((q) => q.type === mockRound);
    const chosenQuestions = filtered.length > 0 ? filtered : mockQuestions;
    setActiveInterviewQuestions(chosenQuestions.slice(0, 3));
    setCurrentQuestionIndex(0);
    setCandidateResponse("");
    setInterviewTranscript([]);
    setFinalScorecard(null);
    setInterviewState("ongoing");
  };

  // Submit Answer to AI for Evaluation
  const submitAnswer = async () => {
    if (!candidateResponse.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    setInterviewState("evaluating");
    const activeQ = activeInterviewQuestions[currentQuestionIndex];

    try {
      const res = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: activeQ.id,
          question: activeQ.question,
          answer: candidateResponse,
          roundType: mockRound,
          role: mockTargetRole,
          company: mockTargetCompany,
        }),
      });

      const evalData: EvaluationResult = await res.json();

      const newTranscript = [
        ...interviewTranscript,
        {
          question: activeQ.question,
          answer: candidateResponse,
          evaluation: evalData,
        },
      ];
      setInterviewTranscript(newTranscript);
      setCandidateResponse("");

      if (currentQuestionIndex + 1 < activeInterviewQuestions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setInterviewState("ongoing");
      } else {
        // Complete interview and compile report
        finishMockInterview(newTranscript);
      }
    } catch (err) {
      console.error(err);
      alert("Evaluation communication error. Advancing to next step.");
      setInterviewState("ongoing");
    }
  };

  // Compile Final Report Card & Save to Database
  const finishMockInterview = async (
    transcriptData: { question: string; answer: string; evaluation: EvaluationResult }[]
  ) => {
    const totalScore = Math.round(
      transcriptData.reduce((acc, curr) => acc + (curr.evaluation.score || 75), 0) /
        transcriptData.length
    );

    const scorecard = {
      overallScore: totalScore,
      technicalScore: mockRound === "technical" ? totalScore : Math.min(100, totalScore + 5),
      communicationScore: mockRound === "hr" ? totalScore : Math.max(60, totalScore - 5),
      strengths: Array.from(new Set(transcriptData.flatMap((t) => t.evaluation.strengths || []))),
      improvements: Array.from(new Set(transcriptData.flatMap((t) => t.evaluation.improvements || []))),
    };

    setFinalScorecard(scorecard);
    setInterviewState("completed");

    // Save session to MySQL
    try {
      await fetch("/api/interview/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateEmail: user.email,
          candidateName: user.user_metadata?.full_name || user.email?.split("@")[0] || "Candidate",
          roundType: mockRound,
          role: mockTargetRole,
          company: mockTargetCompany,
          score: totalScore,
          feedback: scorecard,
          transcript: transcriptData,
        }),
      });
      loadHistory();
    } catch (e) {
      console.warn("Could not save session to MySQL:", e);
    }
  };

  const filteredTopics =
    topicCategory === "all"
      ? topics
      : topics.filter((t) => t.category === topicCategory);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full animate-[fadeIn_0.3s_ease-out]">
      {/* Hero Header */}
      <div className="glass p-8 rounded-3xl border border-white/60 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/60">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100/80 text-indigo-700 w-max border border-indigo-200/50">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            AI Career Suite & Mock Interviews
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Interview Preparation Portal
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
            Master Technical Coding & HR Behavioral rounds with curated company tracks, topic roadmaps,
            and real-time interactive AI mock interviews.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveSection("mock");
            startMockInterview();
          }}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch AI Mock Interview</span>
        </button>
      </div>

      {/* Primary Section Switcher */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveSection("tracks")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "tracks"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>Company & Role Tracks</span>
          {activeSection === "tracks" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSection("topics")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "topics"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>Topic Roadmaps & Guides</span>
          {activeSection === "topics" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSection("mock")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "mock"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-fuchsia-500" />
          <span>AI Mock Interview Chamber</span>
          {activeSection === "mock" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSection("history")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "history"
              ? "text-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-500" />
          <span>Performance History ({history.length})</span>
          {activeSection === "history" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* SECTION 1: Company & Role Tracks */}
      {activeSection === "tracks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Chooser Sidebar */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Target Company
            </h3>
            {companies.map((comp) => (
              <button
                key={comp.id}
                onClick={() => setSelectedCompany(comp)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedCompany?.id === comp.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 border-indigo-600"
                    : "bg-white border-slate-200 hover:border-indigo-300 text-slate-800"
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm">{comp.name}</h4>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      selectedCompany?.id === comp.id ? "text-indigo-100" : "text-slate-400"
                    }`}
                  >
                    {comp.tier}
                  </span>
                </div>
                <ChevronRight
                  className={`w-4 h-4 ${
                    selectedCompany?.id === comp.id ? "text-white" : "text-slate-400"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Selected Company Deep Dive Details */}
          {selectedCompany && (
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass p-6 rounded-3xl border border-white/60 bg-white/70 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedCompany.name} Hiring Track</h2>
                    <span className="text-xs font-semibold text-indigo-600">
                      Tier: {selectedCompany.tier}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMockTargetCompany(selectedCompany.name);
                      setActiveSection("mock");
                      startMockInterview();
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> Practice {selectedCompany.name} Mock
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Hiring Focus & Culture Bar
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedCompany.hiringFocus}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Interview Rounds Breakdown
                  </h4>
                  <div className="flex flex-col gap-2">
                    {selectedCompany.rounds.map((round, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        <span className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{round}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    High-Frequency Interview Problems
                  </h4>
                  <ul className="list-disc list-inside text-xs font-medium text-slate-700 flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedCompany.topQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Recommended Study Resources & Links
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCompany.resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 transition-all shadow-xs"
                      >
                        <span>{res.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Topic Roadmaps & Curated Materials */}
      {activeSection === "topics" && (
        <div className="flex flex-col gap-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Topics" },
              { id: "dsa", label: "Data Structures & Algorithms" },
              { id: "system-design", label: "System Design & Architecture" },
              { id: "cs-fundamentals", label: "Core CS (OS & DBMS)" },
              { id: "behavioral", label: "HR & Behavioral (STAR)" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setTopicCategory(cat.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  topicCategory === cat.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {topic.category.toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        topic.difficulty === "beginner"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : topic.difficulty === "intermediate"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {topic.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">
                    {topic.description}
                  </p>

                  <div className="mb-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Core Concepts
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {topic.keyConcepts.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold bg-slate-50 text-slate-700 px-2 py-1 rounded-md border border-slate-200/60"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {topic.videoUrl && (
                  <a
                    href={topic.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full mt-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-600" /> Watch Curated Video Guide
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: Live AI Mock Interview Simulator */}
      {activeSection === "mock" && (
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          {interviewState === "idle" && (
            <div className="glass p-8 rounded-3xl border border-white/60 bg-white/80 shadow-md flex flex-col gap-6 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Configure Your Mock Interview
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Select your round type and target organization. The AI interviewer adapts in real time.
                </p>
              </div>

              {/* Round Type Switcher */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
                <button
                  type="button"
                  onClick={() => setMockRound("technical")}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    mockRound === "technical"
                      ? "bg-indigo-600 text-white shadow-md border-indigo-600"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Code2 className="w-6 h-6 mx-auto mb-1.5" />
                  <span className="font-bold text-xs uppercase tracking-wider block">
                    Technical Round
                  </span>
                  <span className="text-[10px] opacity-80 font-normal">
                    Algorithms, System Architecture & Code
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMockRound("hr")}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    mockRound === "hr"
                      ? "bg-violet-600 text-white shadow-md border-violet-600"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-1.5" />
                  <span className="font-bold text-xs uppercase tracking-wider block">
                    HR & Behavioral Round
                  </span>
                  <span className="text-[10px] opacity-80 font-normal">
                    STAR Framework & Leadership
                  </span>
                </button>
              </div>

              {/* Target Company & Role Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto w-full text-left">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Target Company
                  </label>
                  <select
                    value={mockTargetCompany}
                    onChange={(e) => setMockTargetCompany(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Target Engineering Role
                  </label>
                  <select
                    value={mockTargetRole}
                    onChange={(e) => setMockTargetRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Frontend Engineer">Frontend Engineer (React)</option>
                    <option value="Backend Systems Engineer">Backend Systems Engineer</option>
                    <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                    <option value="Full-Stack Developer">Full-Stack Developer</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={startMockInterview}
                className="mt-2 mx-auto bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-8 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Begin Assessment Chamber</span>
              </button>
            </div>
          )}

          {/* Active Interview Chamber */}
          {(interviewState === "ongoing" || interviewState === "evaluating") && (
            <div className="flex flex-col gap-6">
              {/* Question Banner */}
              <div className="glass p-6 rounded-3xl border border-white/60 bg-white/90 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Live AI Interrogation • Question {currentQuestionIndex + 1} of{" "}
                      {activeInterviewQuestions.length}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
                    {mockTargetCompany} • {mockRound.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {activeInterviewQuestions[currentQuestionIndex]?.question}
                </h3>

                <p className="text-xs text-slate-500 font-medium">
                  {activeInterviewQuestions[currentQuestionIndex]?.context}
                </p>
              </div>

              {/* Response Workspace */}
              <div className="glass p-6 rounded-3xl border border-white/60 bg-white/90 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> Your Structured Answer
                  </span>

                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isListening
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Mic className="w-3.5 h-3.5" /> Recording Live Voice...
                      </>
                    ) : (
                      <>
                        <MicOff className="w-3.5 h-3.5" /> Enable Voice Dictation
                      </>
                    )}
                  </button>
                </div>

                <textarea
                  value={candidateResponse}
                  onChange={(e) => setCandidateResponse(e.target.value)}
                  disabled={interviewState === "evaluating"}
                  placeholder={
                    mockRound === "technical"
                      ? "Explain your algorithmic approach, edge cases, time/space complexity, or write boilerplate code..."
                      : "Structure your response using the STAR format:\n- Situation: Describe the context\n- Task: What needed to be done?\n- Action: What steps did you personally take?\n- Result: Quantified impact..."
                  }
                  rows={8}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 leading-relaxed"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={interviewState === "evaluating"}
                    onClick={submitAnswer}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    {interviewState === "evaluating" ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> AI Analyzing Evaluation Rubric...
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit for Real-Time AI Grading</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Final Completed Scorecard */}
          {interviewState === "completed" && finalScorecard && (
            <div className="glass p-8 rounded-3xl border border-white/60 bg-white shadow-xl flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-200">
                  <Award className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  Mock Interview Scorecard
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Role: {mockTargetRole} • Target: {mockTargetCompany} • Round: {mockRound.toUpperCase()}
                </p>
              </div>

              {/* Main Score Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">
                    Overall Performance
                  </span>
                  <p className="text-3xl font-black text-indigo-700 mt-1">
                    {finalScorecard.overallScore}%
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">
                    Technical Depth
                  </span>
                  <p className="text-3xl font-black text-emerald-700 mt-1">
                    {finalScorecard.technicalScore}%
                  </p>
                </div>
                <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-violet-600 uppercase">
                    Communication & STAR
                  </span>
                  <p className="text-3xl font-black text-violet-700 mt-1">
                    {finalScorecard.communicationScore}%
                  </p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Strengths
                  </h4>
                  <ul className="list-disc list-inside text-xs font-medium text-emerald-950 flex flex-col gap-1.5">
                    {finalScorecard.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-2xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" /> Actionable Improvements
                  </h4>
                  <ul className="list-disc list-inside text-xs font-medium text-amber-950 flex flex-col gap-1.5">
                    {finalScorecard.improvements.map((im, i) => (
                      <li key={i}>{im}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setInterviewState("idle")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  Start Another Round
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("history")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  View Performance History
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: Past Mock History */}
      {activeSection === "history" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">
              Recorded Mock Interview History
            </h3>
            <button
              onClick={loadHistory}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <div className="glass p-12 rounded-3xl border border-white/60 text-center flex flex-col items-center gap-3 text-slate-400">
              <Award className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No mock interviews recorded yet.</p>
              <p className="text-xs text-slate-400">
                Launch your first AI mock interview session above to generate verified feedback.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.round_type.toUpperCase()} ROUND
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        Score: {item.score}%
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.role}</h4>
                    <p className="text-xs text-slate-500 font-medium">Company: {item.company}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Completed: {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
