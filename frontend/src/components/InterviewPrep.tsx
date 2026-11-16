/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Comprehensive Interview Preparation & Real-Time AI Agent Mock Interview Suite
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
  Volume2,
  VolumeX,
  Cpu,
  Globe,
  Binary,
  Calculator,
  Check,
  Terminal,
  RotateCcw,
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
  type: "technical" | "hr" | "aptitude";
  category: "coding" | "dsa" | "system_design" | "os" | "networking" | "numerical" | "hr";
  role?: string;
  company?: string;
  difficulty?: "easy" | "medium" | "hard";
  question: string;
  context: string;
  spokenPrompt?: string;
  starterCode?: string;
  testCases?: { input: string; expectedOutput: string }[];
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
    "mock" | "tracks" | "topics" | "history"
  >("mock");

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

  // Mock Interview Chamber State
  const [mockRound, setMockRound] = useState<
    "comprehensive" | "technical" | "hr" | "aptitude"
  >("comprehensive");
  const [mockTargetCompany, setMockTargetCompany] = useState<string>("Google");
  const [mockTargetRole, setMockTargetRole] = useState<string>(
    "Fullstack Software Engineer"
  );
  const [interviewerPersona, setInterviewerPersona] = useState<
    "dr_vance" | "alex_rivera"
  >("dr_vance");

  const [interviewState, setInterviewState] = useState<
    "idle" | "ongoing" | "evaluating" | "completed"
  >("idle");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeInterviewQuestions, setActiveInterviewQuestions] = useState<
    MockQuestion[]
  >([]);
  const [candidateResponse, setCandidateResponse] = useState("");
  const [inInterviewCode, setInInterviewCode] = useState("");
  const [codeExecutionLogs, setCodeExecutionLogs] = useState("");
  const [isExecutingCode, setIsExecutingCode] = useState(false);

  const [interviewTranscript, setInterviewTranscript] = useState<
    { question: string; answer: string; evaluation: EvaluationResult; category: string }[]
  >([]);

  const [finalScorecard, setFinalScorecard] = useState<{
    overallScore: number;
    categoryScores: Record<string, number>;
    strengths: string[];
    improvements: string[];
    readinessRating: string;
  } | null>(null);

  // Text-to-Speech (AI Agent Voice Synthesis)
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);

  // Voice Speech-to-Text (Microphone)
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
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
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
        setCandidateResponse((prev) => (prev ? prev + " " + transcript : transcript));
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
      alert("Speech recognition is not supported in this browser. You can type directly in the response box.");
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

  // Text-to-Speech Engine for Virtual Interviewer Speaking
  const speakInterviewerPrompt = (text: string) => {
    if (!speechEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = interviewerPersona === "dr_vance" ? 1.05 : 0.95;

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsInterviewerSpeaking(true);
    utterance.onend = () => setIsInterviewerSpeaking(false);
    utterance.onerror = () => setIsInterviewerSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Start Live Mock Interview Session tailored for the student
  const startMockInterview = async () => {
    setInterviewState("ongoing");
    setCurrentQuestionIndex(0);
    setCandidateResponse("");
    setCodeExecutionLogs("");
    setInterviewTranscript([]);
    setFinalScorecard(null);

    try {
      const res = await fetch(
        `/api/interview/questions?email=${encodeURIComponent(user?.email || "student@university.edu")}&role=${encodeURIComponent(mockTargetRole)}&round=${mockRound}`
      );
      const questions: MockQuestion[] = await res.json();
      const finalQuestions = questions && questions.length > 0 ? questions : mockQuestions.slice(0, 4);

      setActiveInterviewQuestions(finalQuestions);

      if (finalQuestions.length > 0) {
        const firstQ = finalQuestions[0];
        setInInterviewCode(firstQ.starterCode || "");

        // Spoken agent greeting & question delivery
        const studentName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Candidate";
        const agentGreeting = `Hello ${studentName}! I am ${
          interviewerPersona === "dr_vance" ? "Dr. Evelyn Vance" : "Alex Rivera"
        }, and I'll be conducting your ${mockRound} interview for the ${mockTargetRole} position. Let's begin with our first question. ${
          firstQ.spokenPrompt || firstQ.question
        }`;

        setTimeout(() => {
          speakInterviewerPrompt(agentGreeting);
        }, 300);
      }
    } catch {
      setActiveInterviewQuestions(mockQuestions.slice(0, 4));
      if (mockQuestions.length > 0) {
        setInInterviewCode(mockQuestions[0].starterCode || "");
        speakInterviewerPrompt(mockQuestions[0].spokenPrompt || mockQuestions[0].question);
      }
    }
  };

  // Run Code in Sandbox for coding/dsa questions
  const executeInInterviewCode = async () => {
    const activeQ = activeInterviewQuestions[currentQuestionIndex];
    if (!inInterviewCode.trim()) {
      alert("Please write code in the editor to execute.");
      return;
    }

    setIsExecutingCode(true);
    setCodeExecutionLogs("Executing code on backend sandbox...\n");

    try {
      const testCases = activeQ.testCases || [{ input: "", expectedOutput: "" }];
      let logs = "";

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: inInterviewCode,
            input: tc.input,
            language: "javascript",
          }),
        });

        const data = await res.json();
        if (data.error) {
          logs += `✖ [Test Case ${i + 1}] Error: ${data.error}\n`;
        } else {
          const out = String(data.output ?? data.result ?? "").trim();
          const cleanExp = tc.expectedOutput.trim();
          const passed = out === cleanExp || JSON.stringify(out) === JSON.stringify(cleanExp);
          logs += `${passed ? "✔" : "✖"} [Test Case ${i + 1}] ${passed ? "PASSED" : "FAILED"}\n  Input: ${tc.input}\n  Output: ${out}\n  Expected: ${cleanExp}\n\n`;
        }
      }

      setCodeExecutionLogs(logs);
      setCandidateResponse((prev) =>
        prev ? prev + "\n\n[Code Solution Provided & Executed in Sandbox]" : "[Code Solution Provided & Executed in Sandbox]"
      );
    } catch (err: any) {
      setCodeExecutionLogs("Sandbox execution error: " + err.message);
    } finally {
      setIsExecutingCode(false);
    }
  };

  // Submit Answer to AI Interviewer for Evaluation
  const submitAnswer = async () => {
    const fullAnswer = candidateResponse.trim()
      ? inInterviewCode
        ? `${candidateResponse}\n\n// Candidate Code Implementation:\n${inInterviewCode}`
        : candidateResponse
      : inInterviewCode
      ? inInterviewCode
      : "";

    if (!fullAnswer.trim()) {
      alert("Please provide an answer (verbal, written, or code) before submitting.");
      return;
    }

    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsInterviewerSpeaking(false);
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
          answer: fullAnswer,
          roundType: mockRound,
          role: mockTargetRole,
          company: mockTargetCompany,
          category: activeQ.category,
        }),
      });

      const evalData: EvaluationResult = await res.json();

      const newTranscript = [
        ...interviewTranscript,
        {
          question: activeQ.question,
          answer: fullAnswer,
          evaluation: evalData,
          category: activeQ.category,
        },
      ];
      setInterviewTranscript(newTranscript);
      setCandidateResponse("");
      setCodeExecutionLogs("");

      if (currentQuestionIndex + 1 < activeInterviewQuestions.length) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setInterviewState("ongoing");

        const nextQ = activeInterviewQuestions[nextIndex];
        setInInterviewCode(nextQ.starterCode || "");

        // Virtual interviewer speaks transition & next question
        const transition = `Thank you. ${evalData.feedback.slice(0, 100)} Let's proceed to question ${
          nextIndex + 1
        }. ${nextQ.spokenPrompt || nextQ.question}`;
        setTimeout(() => speakInterviewerPrompt(transition), 400);
      } else {
        finishMockInterview(newTranscript);
      }
    } catch (err) {
      console.error(err);
      alert("Evaluation communication error. Moving forward.");
      setInterviewState("ongoing");
    }
  };

  // Compile Final Scorecard & Save to Database
  const finishMockInterview = async (
    transcriptData: { question: string; answer: string; evaluation: EvaluationResult; category: string }[]
  ) => {
    const totalScore = Math.round(
      transcriptData.reduce((acc, curr) => acc + (curr.evaluation.score || 75), 0) /
        transcriptData.length
    );

    // Compute category breakdowns
    const categoryScores: Record<string, number> = {};
    transcriptData.forEach((item) => {
      const cat = item.category || "general";
      categoryScores[cat] = item.evaluation.score || totalScore;
    });

    const strengths = Array.from(
      new Set(transcriptData.flatMap((t) => t.evaluation.strengths || []))
    );
    const improvements = Array.from(
      new Set(transcriptData.flatMap((t) => t.evaluation.improvements || []))
    );

    const readinessRating =
      totalScore >= 88
        ? "Strong Hire Recommendation (Top 5%)"
        : totalScore >= 75
        ? "Hire - Solid Engineering Competence"
        : totalScore >= 60
        ? "Lean Hire - Additional Core Revisions Recommended"
        : "Needs Intensive Foundation Practice";

    const scorecard = {
      overallScore: totalScore,
      categoryScores,
      strengths,
      improvements,
      readinessRating,
    };

    setFinalScorecard(scorecard);
    setInterviewState("completed");

    // Virtual Interviewer speaks conclusion
    speakInterviewerPrompt(
      `Great job completing this interview! Your final performance score is ${totalScore} percent, with a rating of ${readinessRating}. I have compiled your full scorecard.`
    );

    // Persist to MySQL database
    try {
      await fetch("/api/interview/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: user.email,
          userRole: userRole,
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

  const activeQ = activeInterviewQuestions[currentQuestionIndex];
  const isCodingQuestion =
    activeQ?.category === "coding" || (activeQ?.category === "dsa" && !!activeQ?.starterCode);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full animate-[fadeIn_0.3s_ease-out]">
      {/* Top Banner Header */}
      <div className="glass p-7 rounded-3xl border border-white/60 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/70">
        <div className="flex flex-col gap-1.5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-100 text-violet-800 w-max border border-violet-200/60">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
            AI Interview Agent & Career Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            AI Mock Interview Chamber & Prep
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl font-medium leading-relaxed">
            Real-time conversational AI interviewer assessing Coding, Numerical Aptitude, DSA, System Design, OS, Networking, and HR Behavioral rounds.
          </p>
        </div>

        {interviewState === "idle" && (
          <button
            type="button"
            onClick={startMockInterview}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Live Mock Interview</span>
          </button>
        )}
      </div>

      {/* Primary Section Switcher Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveSection("mock")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "mock" ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span>Live AI Interview Chamber</span>
          {activeSection === "mock" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("history")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "history" ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-500" />
          <span>My Performance History ({history.length})</span>
          {activeSection === "history" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("tracks")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "tracks" ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>Company & Role Tracks</span>
          {activeSection === "tracks" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("topics")}
          className={`pb-3.5 px-4 text-sm font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
            activeSection === "topics" ? "text-indigo-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>Curated Roadmaps & Guides</span>
          {activeSection === "topics" && (
            <div className="absolute bottom-0 inset-x-2 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* SECTION 1: LIVE AI MOCK INTERVIEW CHAMBER */}
      {activeSection === "mock" && (
        <div className="w-full flex flex-col gap-6">
          {/* Chamber Configuration State */}
          {interviewState === "idle" && (
            <div className="glass p-8 rounded-3xl border border-white/60 bg-white/80 shadow-md flex flex-col gap-6 text-center max-w-3xl mx-auto w-full">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Configure Your Mock Interview Simulation
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Select your target role, round format, and AI interviewer persona. Questions will be dynamically tailored for your profile.
                </p>
              </div>

              {/* Round Type Switcher */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {[
                  {
                    id: "comprehensive",
                    title: "Full Loop",
                    desc: "Coding, DSA, OS, Net, Aptitude & HR",
                    icon: <Layers className="w-4 h-4 text-indigo-600" />,
                  },
                  {
                    id: "technical",
                    title: "Technical & Code",
                    desc: "Algorithms, Live Coding & Systems",
                    icon: <Code2 className="w-4 h-4 text-emerald-600" />,
                  },
                  {
                    id: "aptitude",
                    title: "Numerical Aptitude",
                    desc: "Probability, Work/Time & Logic",
                    icon: <Calculator className="w-4 h-4 text-amber-600" />,
                  },
                  {
                    id: "hr",
                    title: "Behavioral & HR",
                    desc: "STAR Scenarios & Leadership",
                    icon: <Users className="w-4 h-4 text-violet-600" />,
                  },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setMockRound(r.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      mockRound === r.id
                        ? "bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200"
                        : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {r.icon}
                      <span className="font-bold text-xs text-slate-900">{r.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight block">
                      {r.desc}
                    </span>
                  </button>
                ))}
              </div>

              {/* Role & Persona Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Target Role
                  </label>
                  <select
                    value={mockTargetRole}
                    onChange={(e) => setMockTargetRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Fullstack Software Engineer">Fullstack Software Engineer</option>
                    <option value="Frontend Engineer">Frontend Engineer (React / TypeScript)</option>
                    <option value="Backend Systems Engineer">Backend Systems Engineer (Node / Go)</option>
                    <option value="DevOps & Cloud Engineer">DevOps & Cloud Infrastructure</option>
                    <option value="Campus Placement Core">Campus Placement Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Target Company Culture
                  </label>
                  <select
                    value={mockTargetCompany}
                    onChange={(e) => setMockTargetCompany(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    AI Interviewer Persona
                  </label>
                  <select
                    value={interviewerPersona}
                    onChange={(e) => setInterviewerPersona(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="dr_vance">Dr. Evelyn Vance (Bar Raiser)</option>
                    <option value="alex_rivera">Alex Rivera (Staff Architect)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={startMockInterview}
                className="mt-2 mx-auto bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-8 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Enter Live Interview Studio</span>
              </button>
            </div>
          )}

          {/* ACTIVE LIVE INTERVIEW STUDIO */}
          {(interviewState === "ongoing" || interviewState === "evaluating") && activeQ && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: REAL AI AGENT INTERVIEWER STUDIO (4 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="glass p-5 rounded-3xl border border-white/60 bg-slate-900 text-white shadow-xl flex flex-col gap-4 relative overflow-hidden">
                  {/* Persona Identity Bar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {interviewerPersona === "dr_vance" ? "EV" : "AR"}
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-slate-100">
                          {interviewerPersona === "dr_vance" ? "Dr. Evelyn Vance" : "Alex Rivera"}
                        </h4>
                        <span className="text-[10px] text-indigo-400 font-medium">
                          Principal AI Interview Bar Raiser
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSpeechEnabled(!speechEnabled)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-all"
                      title={speechEnabled ? "Mute Spoken Questions" : "Unmute Audio Questions"}
                    >
                      {speechEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>

                  {/* Virtual Interviewer Avatar Display */}
                  <div className="relative h-44 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                    {/* Animated Aura Glow when speaking */}
                    {isInterviewerSpeaking && (
                      <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none" />
                    )}

                    {/* Interviewer Persona Graphic */}
                    <div className="relative mb-2">
                      <div
                        className={`w-20 h-20 rounded-full bg-slate-800 border-2 flex items-center justify-center transition-all ${
                          isInterviewerSpeaking
                            ? "border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105"
                            : interviewState === "evaluating"
                            ? "border-amber-400 animate-spin"
                            : "border-indigo-500"
                        }`}
                      >
                        <span className="text-2xl">
                          {interviewerPersona === "dr_vance" ? "👩‍💼" : "👨‍💼"}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-800/80 border border-slate-700 text-slate-200">
                      {isInterviewerSpeaking ? (
                        <>
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-emerald-300">Interviewer Speaking Question...</span>
                        </>
                      ) : interviewState === "evaluating" ? (
                        <>
                          <RefreshCw className="h-2.5 w-2.5 animate-spin text-amber-400" />
                          <span className="text-amber-300">Evaluating Algorithmic Depth...</span>
                        </>
                      ) : isListening ? (
                        <>
                          <Mic className="h-2.5 w-2.5 text-rose-400 animate-pulse" />
                          <span className="text-rose-300">Listening to Student Voice...</span>
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 rounded-full bg-indigo-400" />
                          <span>Attentive & Ready</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Question Spoken Prompt & Context */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>
                        Question {currentQuestionIndex + 1} of {activeInterviewQuestions.length}
                      </span>
                      <span className="bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800">
                        {activeQ.category?.toUpperCase() || "TECHNICAL"}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-100 leading-relaxed font-sans">
                      {activeQ.question}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 mt-1">
                      <button
                        type="button"
                        onClick={() => speakInterviewerPrompt(activeQ.spokenPrompt || activeQ.question)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <Volume2 className="w-3 h-3" /> Replay Question Audio
                      </button>

                      <span className="text-[10px] text-slate-500 font-mono">
                        {mockTargetCompany} • {mockTargetRole}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evaluation Rubric Quick Guide */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-left flex flex-col gap-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> AI Rubric Standards
                  </h5>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                    {activeQ.evaluationCriteria.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* RIGHT: STUDENT ANSWER & LIVE CODE WORKBENCH (7 Cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4 text-left">
                {/* Live Coding Sandbox Panel (if question involves coding / algorithms) */}
                {isCodingQuestion && (
                  <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow-md text-slate-300 flex flex-col gap-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200">Live Coding Editor</span>
                      </div>
                      <button
                        type="button"
                        onClick={executeInInterviewCode}
                        disabled={isExecutingCode}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        {isExecutingCode ? "Running Code..." : "Run in Sandbox"}
                      </button>
                    </div>

                    <textarea
                      value={inInterviewCode}
                      onChange={(e) => setInInterviewCode(e.target.value)}
                      placeholder="// Write your code implementation here"
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono h-40 resize-none focus:outline-none focus:border-indigo-500 text-emerald-400"
                    />

                    {/* Console Output Drawer */}
                    {codeExecutionLogs && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                        {codeExecutionLogs}
                      </div>
                    )}
                  </div>
                )}

                {/* Verbal / Written Response Chamber */}
                <div className="glass p-5 rounded-2xl border border-white/60 bg-white/90 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Candidate Explanation & Rationale
                    </span>

                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`py-1 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                          <Mic className="w-3.5 h-3.5 text-slate-500" /> Answer with Microphone
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    value={candidateResponse}
                    onChange={(e) => setCandidateResponse(e.target.value)}
                    disabled={interviewState === "evaluating"}
                    placeholder={
                      activeQ.category === "numerical"
                        ? "Show your step-by-step formula derivation, calculations, and final numerical solution..."
                        : activeQ.category === "coding" || activeQ.category === "dsa"
                        ? "Explain your algorithmic approach, Big-O Time & Space complexity tradeoffs, and edge cases handled..."
                        : activeQ.category === "system_design"
                        ? "Discuss throughput, latency, bottlenecks, database partitioning, and caching layers..."
                        : activeQ.category === "os" || activeQ.category === "networking"
                        ? "Walk through the underlying kernel structures, lifecycle transitions, or packet protocols..."
                        : "Structure your response using the STAR format:\n- Situation: Context\n- Task: Responsibilities\n- Action: Decisions taken\n- Result: Quantified impact..."
                    }
                    rows={6}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 leading-relaxed"
                  />

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      Press Submit when finished speaking or typing.
                    </span>

                    <button
                      type="button"
                      disabled={interviewState === "evaluating"}
                      onClick={submitAnswer}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    >
                      {interviewState === "evaluating" ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Evaluating with AI...
                        </span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit to Interviewer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FINAL COMPLETED SCORECARD & TRACKING */}
          {interviewState === "completed" && finalScorecard && (
            <div className="glass p-8 rounded-3xl border border-white/60 bg-white shadow-xl flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out] max-w-4xl mx-auto w-full text-left">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-200">
                  <Award className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  AI Mock Interview Performance Scorecard
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Candidate: {user.email} • Role: {mockTargetRole} • Format: {mockRound.toUpperCase()}
                </p>
                <div className="inline-flex mt-2 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  {finalScorecard.readinessRating}
                </div>
              </div>

              {/* Overall Score Gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">
                    Overall Interview Score
                  </span>
                  <p className="text-3xl font-black text-indigo-700 mt-1">
                    {finalScorecard.overallScore}%
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">
                    Coding & Algorithms
                  </span>
                  <p className="text-3xl font-black text-emerald-700 mt-1">
                    {finalScorecard.categoryScores["coding"] || finalScorecard.categoryScores["dsa"] || finalScorecard.overallScore}%
                  </p>
                </div>

                <div className="p-4 bg-violet-50 border border-violet-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-violet-600 uppercase">
                    Core CS & Systems
                  </span>
                  <p className="text-3xl font-black text-violet-700 mt-1">
                    {finalScorecard.categoryScores["os"] || finalScorecard.categoryScores["system_design"] || finalScorecard.overallScore}%
                  </p>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">
                    Behavioral & STAR
                  </span>
                  <p className="text-3xl font-black text-amber-700 mt-1">
                    {finalScorecard.categoryScores["hr"] || finalScorecard.overallScore}%
                  </p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Demonstrated Strengths
                  </h4>
                  <ul className="list-disc list-inside text-xs font-medium text-emerald-950 flex flex-col gap-1.5">
                    {finalScorecard.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" /> Critical Areas for Elevation
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
                  Start Another Mock Interview
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

      {/* SECTION 2: PERFORMANCE HISTORY */}
      {activeSection === "history" && (
        <div className="flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">
              Recorded Mock Interview History
            </h3>
            <button
              type="button"
              onClick={loadHistory}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Sessions
            </button>
          </div>

          {history.length === 0 ? (
            <div className="glass p-12 rounded-3xl border border-white/60 text-center flex flex-col items-center gap-3 text-slate-400">
              <Award className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No mock interviews recorded yet.</p>
              <p className="text-xs text-slate-400">
                Launch your first AI mock interview session in the chamber above to track your historical progress.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3 text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.round_type.toUpperCase()} ROUND
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        Score: {item.score}%
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{item.role}</h4>
                    <p className="text-xs text-slate-500 font-medium">Culture: {item.company}</p>
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

      {/* SECTION 3: COMPANY TRACKS */}
      {activeSection === "tracks" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Target Organization
            </h3>
            {companies.map((comp) => (
              <button
                key={comp.id}
                type="button"
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
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
          </div>

          {selectedCompany && (
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="glass p-6 rounded-3xl border border-white/60 bg-white/70 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedCompany.name} Track</h2>
                    <span className="text-xs font-semibold text-indigo-600">
                      Tier: {selectedCompany.tier}
                    </span>
                  </div>
                  <button
                    type="button"
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
                    Interview Rounds
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCompany.rounds.map((r, i) => (
                      <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Top Questions Frequently Asked
                  </h4>
                  <div className="flex flex-col gap-2">
                    {selectedCompany.topQuestions.map((q, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-medium text-slate-800">
                        {q}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: CURATED ROADMAPS & GUIDES */}
      {activeSection === "topics" && (
        <div className="flex flex-col gap-6 text-left">
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            {[
              { id: "all", label: "All Topics" },
              { id: "dsa", label: "Data Structures & Algorithms" },
              { id: "system-design", label: "System Design" },
              { id: "cs-fundamentals", label: "Core CS (OS/DBMS)" },
              { id: "behavioral", label: "Behavioral & STAR" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setTopicCategory(cat.id)}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  topicCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(topicCategory === "all" ? topics : topics.filter((t) => t.category === topicCategory)).map((topic) => (
              <div key={topic.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {topic.category}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {topic.difficulty}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{topic.title}</h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                    {topic.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {topic.keyConcepts.map((c, i) => (
                      <span key={i} className="text-[10px] font-medium bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {topic.videoUrl && (
                  <a
                    href={topic.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-600" /> Watch Curated Video Guide
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
