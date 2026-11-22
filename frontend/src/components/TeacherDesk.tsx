import React, { useState, useEffect } from "react";
import { 
  Plus, CheckCircle, FileText, Calendar, Bell, ClipboardCheck, 
  BookOpen, Clock, AlertOctagon, ShieldCheck, Award, 
  Trash2, PlusCircle, Save, X, Lock, Play, Terminal, Code, AlertCircle
} from "lucide-react";
import { Exam, Question, QuestionType, TestCase, Submission } from "../types";

const MultiSelect = ({ options, selected, onChange, placeholder }: { options: {id: string, label: string}[], selected: string[], onChange: (selected: string[]) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };
  return (
    <div className="relative inline-block w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 cursor-pointer flex justify-between items-center focus:outline-indigo-500"
      >
        <span className="truncate">{selected.length === 0 ? placeholder : selected.length === 1 ? options.find(o => o.id === selected[0])?.label : `${selected.length} Selected`}</span>
        <span className="text-[10px] ml-2">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {options.map(opt => (
            <label key={opt.id} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
              <input type="checkbox" checked={selected.includes(opt.id)} onChange={() => toggle(opt.id)} className="rounded text-indigo-600 focus:ring-indigo-500"/>
              <span className="text-xs font-medium text-slate-700 truncate">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function TeacherDesk({ 
  exams, 
  onCreateExam,
}: { 
  exams: Exam[], 
  onCreateExam: (exam: Exam) => void,
}) {
  const [targetDepts, setTargetDepts] = useState<Record<string, string[]>>({});
  const [targetYears, setTargetYears] = useState<Record<string, string[]>>({});
  const [targetClasses, setTargetClasses] = useState<Record<string, string[]>>({});

  const getDepts = (widget: string) => targetDepts[widget] || [];
  const getYears = (widget: string) => targetYears[widget] || [];
  const getClasses = (widget: string) => targetClasses[widget] || [];

  const setWidgetDepts = (widget: string, val: string[]) => setTargetDepts(prev => ({...prev, [widget]: val}));
  const setWidgetYears = (widget: string, val: string[]) => setTargetYears(prev => ({...prev, [widget]: val}));
  const setWidgetClasses = (widget: string, val: string[]) => setTargetClasses(prev => ({...prev, [widget]: val}));

  const [activeWidget, setActiveWidget] = useState<"draft" | "notice" | "attendance" | "grades" | "settings" | "none">("draft");
  
  // Class Provisioning State
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassDepartment, setNewClassDepartment] = useState("");
  const [newClassYear, setNewClassYear] = useState("");
  const [rosterInputMode, setRosterInputMode] = useState<"manual" | "csv">("manual");
  const [newClassStudents, setNewClassStudents] = useState<Array<{name: string, email: string}>>([]);

  // Exam Drafting State
  const [examTitle, setExamTitle] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examStartDate, setExamStartDate] = useState("");
  const [examStartTimeOfDay, setExamStartTimeOfDay] = useState("");
  const [examDuration, setExamDuration] = useState<number>(60);
  const [examIntegrityThreshold, setExamIntegrityThreshold] = useState<number>(50);
  const [examRequireCamera, setExamRequireCamera] = useState(true);
  const [examLockdownBrowsing, setExamLockdownBrowsing] = useState(true);
  const [examEntryPassword, setExamEntryPassword] = useState("password123");
  const [examAdminExitPassword, setExamAdminExitPassword] = useState("admin");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  // Current Question Drafting State
  const [draftQType, setDraftQType] = useState<QuestionType>("mcq");
  const [draftQTitle, setDraftQTitle] = useState("");
  const [draftQPoints, setDraftQPoints] = useState(10);
  const [draftQText, setDraftQText] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [correctMcqIndex, setCorrectMcqIndex] = useState(0);
  const [codeBoilerplate, setCodeBoilerplate] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "", isHidden: false }]);

  // Real-Time Backend Compiler Workbench State for Coding Questions
  const [compilerLanguage, setCompilerLanguage] = useState<"javascript" | "python">("javascript");
  const [solutionCodeToTest, setSolutionCodeToTest] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compileResults, setCompileResults] = useState<
    { index: number; passed: boolean; actual: string; expected: string; timeMs: number; error?: string }[]
  >([]);
  const [compilerOutputLogs, setCompilerOutputLogs] = useState<string>("");

  const runCompilerValidation = async () => {
    const codeToExecute = solutionCodeToTest.trim() || codeBoilerplate.trim();
    if (!codeToExecute) {
      alert("Please provide code in the editor to run and validate.");
      return;
    }
    const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
    if (validTestCases.length === 0) {
      alert("Please add at least one test case with input and expected output.");
      return;
    }

    setIsCompiling(true);
    setCompileResults([]);
    setCompilerOutputLogs(`[Compiler] Dispatching ${validTestCases.length} test cases to isolated backend sandbox...\n`);

    try {
      const results: typeof compileResults = [];
      let logs = "";

      for (let i = 0; i < validTestCases.length; i++) {
        const tc = validTestCases[i];
        const start = performance.now();
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: codeToExecute,
            input: tc.input,
            language: compilerLanguage,
          }),
        });

        const data = await res.json();
        const duration = Math.round(performance.now() - start);

        let actual = "";
        let passed = false;
        let errorMsg = undefined;

        if (data.error) {
          actual = "Error: " + data.error;
          errorMsg = data.error;
          logs += `✖ [Test Case ${i + 1}] FAILED: ${data.error}\n`;
        } else {
          actual = String(data.output ?? data.result ?? "").trim();
          const cleanExpected = tc.expectedOutput.trim();
          passed = actual === cleanExpected || JSON.stringify(actual) === JSON.stringify(cleanExpected);
          logs += `${passed ? "✔" : "✖"} [Test Case ${i + 1}] ${passed ? "PASSED" : "FAILED"} (${duration}ms)\n  Input: ${tc.input || "(none)"}\n  Expected: ${cleanExpected}\n  Actual:   ${actual}\n\n`;
        }

        results.push({
          index: i,
          passed,
          actual,
          expected: tc.expectedOutput,
          timeMs: duration,
          error: errorMsg,
        });
      }

      setCompileResults(results);
      setCompilerOutputLogs(logs);
    } catch (err: any) {
      setCompilerOutputLogs((prev) => prev + "\nBackend execution failure: " + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  // Data fetching state
  const [notices, setNotices] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const fetchData = async () => {
    try {
      const [nRes, cRes, aRes, sRes] = await Promise.all([
        fetch("/api/notices").then(r => r.ok ? r.json() : []),
        fetch("/api/classes").then(r => r.ok ? r.json() : []),
        fetch("/api/attendance").then(r => r.ok ? r.json() : []),
        fetch("/api/submissions").then(r => r.ok ? r.json() : [])
      ]);
      setNotices(Array.isArray(nRes) ? nRes : []);
      setClasses(Array.isArray(cRes) ? cRes : []);
      setAttendanceSessions(Array.isArray(aRes) ? aRes : []);
      setSubmissions(Array.isArray(sRes) ? sRes : []);
    } catch (e) {
      console.warn("Failed to fetch teacher desk data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Exam Composer Actions
  const handleSelectPaletteQuestion = (idx: number) => {
    setEditingQuestionIndex(idx);
    const q = questions[idx];
    if (q) {
      setDraftQType(q.type);
      setDraftQTitle(q.title);
      setDraftQPoints(q.points || 10);
      setDraftQText(q.questionText || "");
      if (q.type === "mcq" && q.options) {
        setMcqOptions([...q.options]);
        setCorrectMcqIndex(q.correctOptionIndex ?? 0);
      }
      if (q.type === "coding") {
        setCodeBoilerplate(q.codeBoilerplate || "");
        setTestCases(
          q.testCases && q.testCases.length > 0
            ? [...q.testCases]
            : [{ input: "", expectedOutput: "", isHidden: false }]
        );
      }
    }
  };

  const handleAddNewQuestionToPalette = () => {
    setEditingQuestionIndex(null);
    setDraftQTitle("");
    setDraftQText("");
    setDraftQPoints(10);
    setDraftQType("mcq");
    setMcqOptions(["", "", "", ""]);
    setCorrectMcqIndex(0);
    setCodeBoilerplate("");
    setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
  };

  const handleSaveAndNextQuestion = () => {
    if (!draftQTitle.trim()) {
      alert("Please provide a question title before proceeding.");
      return;
    }
    const q: Question = {
      id: editingQuestionIndex !== null ? questions[editingQuestionIndex].id : "q-" + Date.now(),
      type: draftQType,
      title: draftQTitle,
      points: draftQPoints,
      questionText: draftQText,
    };
    if (draftQType === "mcq") {
      q.options = [...mcqOptions];
      q.correctOptionIndex = correctMcqIndex;
    } else if (draftQType === "coding") {
      q.language = compilerLanguage;
      q.codeBoilerplate = codeBoilerplate;
      q.testCases = testCases.filter((tc) => tc.input.trim() || tc.expectedOutput.trim());
    }

    let updatedQuestions = [...questions];
    if (editingQuestionIndex !== null) {
      updatedQuestions[editingQuestionIndex] = q;
    } else {
      updatedQuestions.push(q);
    }
    setQuestions(updatedQuestions);

    if (editingQuestionIndex !== null && editingQuestionIndex < updatedQuestions.length - 1) {
      handleSelectPaletteQuestion(editingQuestionIndex + 1);
    } else {
      handleAddNewQuestionToPalette();
    }
  };

  const handleDeleteQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (editingQuestionIndex === idx) {
      handleAddNewQuestionToPalette();
    } else if (editingQuestionIndex !== null && editingQuestionIndex > idx) {
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  };

  const handleAddQuestion = () => {
    handleSaveAndNextQuestion();
  };

  const handleGenerateExam = async () => {
    if (!examTitle.trim() || questions.length === 0) {
      alert("Validation Error: Exam requires a title and at least one question.");
      return;
    }
    const payload: Omit<Exam, "id" | "createdAt" | "author"> & { author: string } = {
      title: examTitle,
      description: examDescription,
      subject: examSubject,
      targetDepartments: getDepts("draft"),
      targetYears: getYears("draft"),
      targetClasses: getClasses("draft"),
      startTime: examStartDate && examStartTimeOfDay ? `${examStartDate}T${examStartTimeOfDay}` : undefined,
      durationMinutes: examDuration,
      integrityThreshold: examIntegrityThreshold,
      requireCamera: examRequireCamera,
      lockdownBrowsing: examLockdownBrowsing,
      entryPassword: examEntryPassword || "password123",
      adminExitPassword: examAdminExitPassword || "admin",
      questions,
      author: "Teacher",
    };
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newerExam = await res.json();
        onCreateExam(newerExam);
        alert("Exam Successfully Published!");
        setQuestions([]);
        setExamTitle("");
        setExamDescription("");
        setExamSubject("");
        setExamStartDate("");
        setExamStartTimeOfDay("");
      } else {
        alert("Failed to publish exam on the backend.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create exam. Network error.");
    }
  };

  // Notice Actions
  const handlePostNotice = async () => {
    const t = (document.getElementById("noticeTitle") as HTMLInputElement).value;
    const x = (document.getElementById("noticeText") as HTMLTextAreaElement).value;
    if(!t || !x) return;
    try {
      await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, text: x, department: getDepts("notice")[0] || "", year: getYears("notice")[0] || "", targetClasses: getClasses("notice"), date: new Date().toISOString() })
      });
      (document.getElementById("noticeTitle") as HTMLInputElement).value = "";
      (document.getElementById("noticeText") as HTMLTextAreaElement).value = "";
      fetchData(); // refresh
    } catch (e) {
      alert("Failed to post notice");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await fetch(`/api/notices/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      alert("Failed to delete notice");
    }
  };

  // Class Actions
  const handleOpenClassModal = () => {
    setNewClassName("");
    setNewClassDepartment("");
    setNewClassYear("");
    setRosterInputMode("manual");
    setNewClassStudents([]);
    setIsCreatingClass(true);
  };

  const handleAddClass = async () => {
    if (!newClassName.trim() || !newClassDepartment || !newClassYear) return alert("Class name, department, and year are required.");
    if (newClassStudents.length === 0) return alert("Please add at least one student.");
    
    // Prepare students array
    const students = newClassStudents.map((s, i) => {
      return {
        id: "std-" + Date.now() + i,
        name: s.name.trim() || s.email.split("@")[0],
        email: s.email.trim()
      };
    });

    try {
      await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newClassName, 
          department: newClassDepartment, 
          year: newClassYear, 
          targetDepartments: [newClassDepartment], 
          targetYears: [newClassYear], 
          students 
        })
      });
      setIsCreatingClass(false);
      fetchData(); // refresh
    } catch (e) {
      alert("Failed to add class");
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;
    try {
      await fetch(`/api/classes/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      alert("Failed to delete class");
    }
  };

  // Attendance Actions
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendancePeriod, setAttendancePeriod] = useState<number>(1);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, "present"|"absent"|"late">>({});
  
  const handleSaveAttendance = async (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    const recordsArray = cls.students.map((student: any) => ({
      studentEmail: student.email,
      status: attendanceRecords[student.id] || "present"
    }));

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, date: attendanceDate, period: attendancePeriod, records: recordsArray, department: getDepts("attendance")[0] || "", year: getYears("attendance")[0] || "" })
      });
      alert("Attendance successfully saved!");
      setSelectedAttendanceClass("");
      setAttendanceRecords({});
      fetchData();
    } catch (e) {
      alert("Failed to save attendance");
    }
  };

  // Grades Actions
  const [selectedGradeExam, setSelectedGradeExam] = useState<string>("");
  const [gradeInputs, setGradeInputs] = useState<Record<string, { marks: string, grade: string }>>({});

  useEffect(() => {
    if (getClasses("grades").length > 0 && selectedGradeExam) {
      Promise.all(getClasses("grades").map(clsId => fetch(`/api/grades/${selectedGradeExam}/${clsId}`).then(r => r.json())))
        .then(results => {
          const newInputs: any = {};
          results.flat().forEach((d: any) => {
            newInputs[d.student_email] = { marks: String(d.marks), grade: d.grade };
          });
          setGradeInputs(newInputs);
        });
    } else {
      setGradeInputs({});
    }
  }, [targetClasses["grades"], selectedGradeExam]);

  const handleSaveGrades = async () => {
    if (getClasses("grades").length === 0 || !selectedGradeExam) return;
    
    try {
      for (const classId of getClasses("grades")) {
        // filter gradeInputs to only include students in this class
        const cls = classes.find(c => c.id === classId);
        if (!cls) continue;
        const classStudentEmails = cls.students?.map((s: any) => s.email) || [];
        
        const gradesArray = Object.entries(gradeInputs)
          .filter(([studentEmail]) => classStudentEmails.includes(studentEmail))
          .map(([studentEmail, vals]) => ({
            studentEmail,
            marks: parseInt(vals.marks) || 0,
            grade: vals.grade
          }));

        if (gradesArray.length > 0) {
          await fetch("/api/grades", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classId, examId: selectedGradeExam, grades: gradesArray })
          });
        }
      }
      alert("Grades successfully published for all selected classes!");
      setWidgetClasses("grades", []);
      setSelectedGradeExam("");
      setGradeInputs({});
    } catch (e) {
      alert("Failed to save grades.");
    }
  };

  // View state helpers
  const filteredNotices = notices.filter(n => (getDepts("notice").length === 0 || getDepts("notice").includes(n.department)) && (getYears("notice").length === 0 || getYears("notice").includes(n.year)));
  const filteredClassesForSettings = classes.filter(c => (getDepts("settings").length === 0 || getDepts("settings").includes(c.department)) && (getYears("settings").length === 0 || getYears("settings").includes(c.year)));
  const filteredClassesForAttendance = classes.filter(c => (getDepts("attendance").length === 0 || getDepts("attendance").includes(c.department)) && (getYears("attendance").length === 0 || getYears("attendance").includes(c.year)));
  const filteredClassesForGrades = classes.filter(c => (getDepts("grades").length === 0 || getDepts("grades").includes(c.department)) && (getYears("grades").length === 0 || getYears("grades").includes(c.year)));
  const filteredAttendance = attendanceSessions.filter(a => {
      const cls = classes.find(c => c.id === a.classId);
      return cls && (getDepts("attendance").length === 0 || getDepts("attendance").includes(cls.department)) && (getYears("attendance").length === 0 || getYears("attendance").includes(cls.year));
  });

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Context Selector */}
      <div className="glass p-5 rounded-2xl border border-white/60 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100/50 p-2 rounded-xl text-indigo-700">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-sans text-slate-800 tracking-tight">Teacher Desk Command Hub</h2>
            <p className="text-xs text-slate-500 font-medium">Global Scope Targeting</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { id: "draft", icon: Plus, label: "Draft Exam", color: "indigo" },
          { id: "notice", icon: Bell, label: "Notice Board", color: "fuchsia" },
          { id: "attendance", icon: ClipboardCheck, label: "Attendance", color: "emerald" },
          { id: "grades", icon: FileText, label: "Grades", color: "amber" },
          { id: "settings", icon: BookOpen, label: "Classes", color: "sky" }
        ].map((widget) => {
          const isActive = activeWidget === widget.id;
          const Icon = widget.icon;
          return (
            <button
              key={widget.id}
              onClick={() => setActiveWidget(widget.id as any)}
              className={`glass p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${isActive ? `border-${widget.color}-500 bg-${widget.color}-50/30 ring-2 ring-${widget.color}-500/20` : "border-white/60 hover:bg-white/40"} text-slate-700`}
            >
              <div className={`p-2 rounded-lg ${isActive ? `bg-${widget.color}-500 text-white shadow-md` : "bg-slate-100 text-slate-500"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? `text-${widget.color}-700` : ""}`}>{widget.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. DRAFT EXAM & QUESTION CREATOR IN PROFESSIONAL TEST SUITE DESIGN */}
      {activeWidget === "draft" && (
        <div className="flex flex-col gap-5 text-left animate-[fadeIn_0.3s_ease-out]">
          {/* Top Header Bar matching Test Series breadcrumb style */}
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
                {examTitle || "New Assessment Draft"}
              </span>
              <span className="text-slate-300 font-bold">&gt;</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                Question Composer
              </span>
              <span className="hidden md:inline text-xs text-slate-400 font-mono">
                ({questions.length} Questions Defined)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddNewQuestionToPalette}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 transition-colors cursor-pointer"
              >
                Clear Form
              </button>
              <button
                type="button"
                onClick={handleGenerateExam}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-extrabold px-5 py-2 rounded-full shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Finalize & Publish Exam</span>
              </button>
            </div>
          </div>

          {/* Main 3-Column Layout */}
          <div className="grid grid-cols-12 gap-5 items-start">
            {/* ============================================================ */}
            {/* LEFT COLUMN: Question Palette (Grid of Question Numbers)    */}
            {/* ============================================================ */}
            <div className="col-span-12 lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3.5 order-2 lg:order-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Question Palette
                </span>
                <button
                  type="button"
                  onClick={handleAddNewQuestionToPalette}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" /> Add
                </button>
              </div>

              {/* 3-Column Question Numbers Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-[460px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const isActive = editingQuestionIndex === idx;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSelectPaletteQuestion(idx)}
                      className={`h-9 w-full rounded-lg border text-xs font-bold font-mono flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500 ring-offset-1 font-extrabold shadow-xs"
                          : "bg-[#22c55e] text-white border-[#16a34a] hover:opacity-90"
                      }`}
                    >
                      {(idx + 1).toString().padStart(2, "0")}
                    </button>
                  );
                })}

                {/* Add New Question Tile */}
                <button
                  type="button"
                  onClick={handleAddNewQuestionToPalette}
                  className={`h-9 w-full rounded-lg border-2 border-dashed flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    editingQuestionIndex === null
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-400"
                      : "border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 bg-slate-50"
                  }`}
                  title="Add Question"
                >
                  +
                </button>
              </div>

              {/* Legend & Stats */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 text-[11px] font-bold text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#22c55e]" /> Saved Questions
                  </span>
                  <span className="font-mono text-slate-800">{questions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Marks:</span>
                  <span className="font-mono text-indigo-600">
                    {questions.reduce((acc, q) => acc + (q.points || 0), 0)} pts
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* CENTER COLUMN: Question Composer Card (Matching Test Design) */}
            {/* ============================================================ */}
            <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col order-1 lg:order-2 min-h-[580px]">
              {/* Question Header: Q: Number on left, Type tabs & Points on right */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-black text-slate-900 font-sans">
                    Q: {editingQuestionIndex !== null ? editingQuestionIndex + 1 : questions.length + 1}
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Marks:</span>
                    <input
                      type="number"
                      value={draftQPoints}
                      onChange={(e) => setDraftQPoints(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-center text-xs font-bold text-indigo-700 bg-white border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {(["mcq", "coding", "written"] as QuestionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDraftQType(type)}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        draftQType === type
                          ? "bg-white text-indigo-600 shadow-xs border border-slate-200/60"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {type === "mcq" ? "Multiple Choice" : type === "coding" ? "Coding Sandbox" : "Written"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Title & Prompt Input Card */}
              <div className="mt-5 p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Question Headline / Topic
                  </label>
                  <input
                    type="text"
                    value={draftQTitle}
                    onChange={(e) => setDraftQTitle(e.target.value)}
                    placeholder="e.g., Arrange the jumbled sequence / Invert Binary Tree"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Directives / Complete Question Text
                  </label>
                  <textarea
                    value={draftQText}
                    onChange={(e) => setDraftQText(e.target.value)}
                    placeholder="Enter the complete question prompt, context, or paragraph instructions here..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 h-24 resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Type-Specific Composer Area */}
              {draftQType === "mcq" && (
                <div className="mt-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Multiple Choice Options
                    </span>
                    <button
                      type="button"
                      onClick={() => setMcqOptions([...mcqOptions, ""])}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Option
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {mcqOptions.map((opt, optIdx) => {
                      const letter = String.fromCharCode(97 + optIdx); // a, b, c, d
                      const isCorrect = correctMcqIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`w-full p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            isCorrect
                              ? "bg-slate-100/90 border-[#1e293b] text-slate-900 shadow-xs"
                              : "bg-white border-slate-200 text-slate-700"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setCorrectMcqIndex(optIdx)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer ${
                              isCorrect
                                ? "bg-[#0f172a] border-[#0f172a] text-white"
                                : "border-slate-300 text-slate-500 hover:border-slate-400"
                            }`}
                            title="Click to mark as correct answer"
                          >
                            {letter}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const n = [...mcqOptions];
                              n[optIdx] = e.target.value;
                              setMcqOptions(n);
                            }}
                            placeholder={`Enter Option ${letter.toUpperCase()} text...`}
                            className="flex-1 bg-transparent border-none text-xs font-medium text-slate-800 focus:outline-none"
                          />
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
                              Correct Key
                            </span>
                          )}
                          {mcqOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const n = mcqOptions.filter((_, i) => i !== optIdx);
                                setMcqOptions(n);
                                if (correctMcqIndex === optIdx) setCorrectMcqIndex(0);
                                else if (correctMcqIndex > optIdx) setCorrectMcqIndex(correctMcqIndex - 1);
                              }}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    💡 Click on a letter circle (a, b, c, d) to designate it as the official answer key.
                  </p>
                </div>
              )}

              {draftQType === "coding" && (
                <div className="mt-5 flex flex-col gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 text-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Real-Time Compiler & Sandbox Test Cases
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Language:</span>
                      <select
                        value={compilerLanguage}
                        onChange={(e) => setCompilerLanguage(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 font-mono"
                      >
                        <option value="javascript">JavaScript (Node.js vm)</option>
                        <option value="python">Python 3 (Sandbox)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Candidate Starter Boilerplate
                        </label>
                        <span className="text-[9px] text-slate-500">Provided to students</span>
                      </div>
                      <textarea
                        value={codeBoilerplate}
                        onChange={(e) => setCodeBoilerplate(e.target.value)}
                        placeholder={`function solution(args) {\n  // Write your code here\n  return args;\n}`}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono h-32 resize-none focus:outline-none focus:border-indigo-500 text-emerald-400"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Teacher Reference Solution (Optional to Test)
                        </label>
                        <span className="text-[9px] text-slate-500">To validate test cases</span>
                      </div>
                      <textarea
                        value={solutionCodeToTest}
                        onChange={(e) => setSolutionCodeToTest(e.target.value)}
                        placeholder={`// Reference code to test test cases\nfunction solution(args) {\n  return args;\n}`}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono h-32 resize-none focus:outline-none focus:border-indigo-500 text-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Test Cases List */}
                  <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      Test Cases Specification ({testCases.length})
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={runCompilerValidation}
                        disabled={isCompiling}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {isCompiling ? "Compiling..." : "Run Test Cases"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }])}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Case
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {testCases.map((tc, idx) => {
                      const res = compileResults.find((r) => r.index === idx);
                      return (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs items-center">
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={tc.input}
                              onChange={(e) => {
                                const n = [...testCases];
                                n[idx].input = e.target.value;
                                setTestCases(n);
                              }}
                              placeholder="Input: e.g. [2, 7, 11, 15]"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-200"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={tc.expectedOutput}
                              onChange={(e) => {
                                const n = [...testCases];
                                n[idx].expectedOutput = e.target.value;
                                setTestCases(n);
                              }}
                              placeholder="Expected: e.g. [0, 1]"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-emerald-400"
                            />
                          </div>
                          <div className="col-span-3">
                            {res ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                res.passed ? "bg-emerald-900/60 text-emerald-300" : "bg-rose-900/60 text-rose-300"
                              }`}>
                                {res.passed ? "✔ PASS" : "✖ FAIL"} ({res.timeMs}ms)
                              </span>
                            ) : (
                              <label className="text-[10px] text-slate-400 flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={tc.isHidden || false}
                                  onChange={(e) => {
                                    const n = [...testCases];
                                    n[idx].isHidden = e.target.checked;
                                    setTestCases(n);
                                  }}
                                />
                                Hidden
                              </label>
                            )}
                          </div>
                          <div className="col-span-1 text-right">
                            {testCases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {compilerOutputLogs && (
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 max-h-24 overflow-y-auto">
                      {compilerOutputLogs}
                    </pre>
                  )}
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
                {editingQuestionIndex !== null ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(editingQuestionIndex)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddNewQuestionToPalette}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Clear Form
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveAndNextQuestion}
                  className="px-6 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <span>Save and Next Question</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* ============================================================ */}
            {/* RIGHT COLUMN: Duration Timer, Security & Exam Overview      */}
            {/* ============================================================ */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 order-3">
              {/* Digital Duration Configurator */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center">
                <div className="flex items-center justify-center gap-2 font-mono text-2xl font-black text-slate-800">
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={Math.floor(examDuration / 60)}
                    onChange={(e) => {
                      const hrs = Math.max(0, Number(e.target.value));
                      const mins = examDuration % 60;
                      setExamDuration(hrs * 60 + mins);
                    }}
                    className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-2xl font-black focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-300">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={examDuration % 60}
                    onChange={(e) => {
                      const mins = Math.max(0, Math.min(59, Number(e.target.value)));
                      const hrs = Math.floor(examDuration / 60);
                      setExamDuration(hrs * 60 + mins);
                    }}
                    className="w-14 text-center bg-slate-50 border border-slate-200 rounded-lg py-1 text-2xl font-black focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-300">:</span>
                  <span className="w-14 text-slate-400 py-1 text-2xl font-black">00</span>
                </div>
                <div className="flex justify-between px-3 mt-1.5 text-[11px] font-bold text-slate-400">
                  <span className="w-14 text-center">Hrs</span>
                  <span className="w-14 text-center">Min</span>
                  <span className="w-14 text-center">Sec</span>
                </div>
              </div>

              {/* Security PINs and Camera Proctoring Settings */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" /> Exam Security PINs
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Invigilator Entry PIN</label>
                    <input
                      type="text"
                      value={examEntryPassword}
                      onChange={(e) => setExamEntryPassword(e.target.value)}
                      placeholder="e.g. password123"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Admin Exit PIN</label>
                    <input
                      type="text"
                      value={examAdminExitPassword}
                      onChange={(e) => setExamAdminExitPassword(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-600">AI Video Proctoring</span>
                    <input
                      type="checkbox"
                      checked={examRequireCamera}
                      onChange={(e) => setExamRequireCamera(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-600">Strict App Lockdown</span>
                    <input
                      type="checkbox"
                      checked={examLockdownBrowsing}
                      onChange={(e) => setExamLockdownBrowsing(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </div>

              {/* Overview Breakdown Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2.5 mb-3">
                  Overview
                </h4>
                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Total Questions</span>
                    <span className="font-bold text-slate-800">{questions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Marks</span>
                    <span className="font-bold text-slate-800">
                      {questions.reduce((acc, q) => acc + (q.points || 0), 0)} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>MCQ Questions</span>
                    <span className="font-bold text-emerald-600">
                      {questions.filter((q) => q.type === "mcq").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Coding Sandbox</span>
                    <span className="font-bold text-indigo-600">
                      {questions.filter((q) => q.type === "coding").length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pass Threshold</span>
                    <span className="font-bold text-slate-800">{examIntegrityThreshold}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Target Departments</label>
                    <MultiSelect
                      options={[
                        { id: "Computer Science", label: "Computer Science" },
                        { id: "Mathematics", label: "Mathematics" },
                        { id: "Physics", label: "Physics" },
                      ]}
                      selected={getDepts("draft")}
                      onChange={(val) => setWidgetDepts("draft", val)}
                      placeholder="Select Departments"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Target Years</label>
                    <MultiSelect
                      options={[
                        { id: "First Year", label: "First Year" },
                        { id: "Second Year", label: "Second Year" },
                        { id: "Third Year", label: "Third Year" },
                        { id: "Fourth Year", label: "Fourth Year" },
                      ]}
                      selected={getYears("draft")}
                      onChange={(val) => setWidgetYears("draft", val)}
                      placeholder="Select Years"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NOTICE BOARD COMPONENT */}
      {activeWidget === "notice" && (
         <div className="glass p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-fuchsia-100 rounded-2xl text-fuchsia-600">
                     <Bell className="h-6 w-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">Notice Board Center</h3>
                     <p className="text-xs text-slate-500 font-medium">Broadcast announcements to {getDepts("notice").join(", ") || "targeted cohorts"}</p>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-4">
                 <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-fuchsia-500"/> Draft New Broadcast</h4>
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                     <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Departments</label>
                       <MultiSelect options={[{id: "Computer Science", label: "Computer Science"}, {id: "Mathematics", label: "Mathematics"}, {id: "Physics", label: "Physics"}]} selected={getDepts("notice")} onChange={(val) => setWidgetDepts("notice", val)} placeholder="Select Departments" />
                     </div>
                     <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Years</label>
                       <MultiSelect options={[{id: "First Year", label: "First Year"}, {id: "Second Year", label: "Second Year"}, {id: "Third Year", label: "Third Year"}, {id: "Fourth Year", label: "Fourth Year"}]} selected={getYears("notice")} onChange={(val) => setWidgetYears("notice", val)} placeholder="Select Years" />
                     </div>
                     <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Classes</label>
                       <MultiSelect options={classes.filter(c => getDepts("notice").includes(c.department) && getYears("notice").includes(c.year)).map(c => ({id: c.id, label: c.name}))} selected={getClasses("notice")} onChange={(val) => setWidgetClasses("notice", val)} placeholder="Select Classes" />
                     </div>
                     <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Headline</label>
                       <input type="text" id="noticeTitle" placeholder="e.g., Campus closure on Friday" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 transition-all"/>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Message Body</label>
                       <textarea id="noticeText" placeholder="Detailed information goes here..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 h-32 resize-none transition-all"/>
                    </div>
                    <button onClick={handlePostNotice} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-2">
                       Broadcast Notice <Bell className="w-4 h-4"/>
                    </button>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400"/> Recent Broadcasts for Cohort</h4>
                 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-4 h-[22rem] overflow-y-auto">
                    {notices.filter(n => getClasses("notice").some(cId => n.targetClasses.includes(cId))).length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-slate-400">
                         <Bell className="w-8 h-8 opacity-20"/>
                         <div>
                            <p className="text-sm font-bold">No Active Notices</p>
                            <p className="text-xs mt-1">Broadcasts for targeted cohorts will appear here.</p>
                         </div>
                      </div>
                    ) : (
                      notices.filter(n => getClasses("notice").some(cId => n.targetClasses.includes(cId))).map(n => (
                        <div key={n.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group text-left hover:border-fuchsia-200 transition-colors">
                          <h5 className="text-sm font-bold text-slate-800 pr-16">{n.title}</h5>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{n.text}</p>
                          <span className="text-[10px] font-bold text-slate-400 absolute top-4 right-4 bg-slate-50 px-2 py-1 rounded-md">{new Date(n.date).toLocaleDateString()}</span>
                          <button onClick={() => handleDeleteNotice(n.id)} className="absolute bottom-4 right-4 text-[10px] text-rose-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 px-2 py-1 rounded-md hover:bg-rose-100">Remove</button>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </div>
         </div>
      )}

      {/* 3. ATTENDANCE LOG COMPONENT */}
      {activeWidget === "attendance" && (
         <div className="glass p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                     <ClipboardCheck className="h-6 w-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">Class Attendance Log</h3>
                     <p className="text-xs text-slate-500 font-medium">Record and track daily presence</p>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
               <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center justify-between">
                     Track New Session
                  </h4>
                  
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                     <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Department</label>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:outline-emerald-500" value={getDepts("attendance")[0] || ""} onChange={(e) => setWidgetDepts("attendance", e.target.value ? [e.target.value] : [])}>
                         <option value="">Select Department</option>
                         <option value="Computer Science">Computer Science</option>
                         <option value="Mathematics">Mathematics</option>
                         <option value="Physics">Physics</option>
                       </select>
                     </div>
                     <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Year</label>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:outline-emerald-500" value={getYears("attendance")[0] || ""} onChange={(e) => setWidgetYears("attendance", e.target.value ? [e.target.value] : [])}>
                         <option value="">Select Year</option>
                         <option value="First Year">First Year</option>
                         <option value="Second Year">Second Year</option>
                         <option value="Third Year">Third Year</option>
                         <option value="Fourth Year">Fourth Year</option>
                       </select>
                     </div>
                     <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Class</label>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 focus:outline-emerald-500" value={getClasses("attendance")[0] || ""} onChange={(e) => setWidgetClasses("attendance", e.target.value ? [e.target.value] : [])}>
                         <option value="">Select Class</option>
                         {filteredClassesForAttendance.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                     </div>

                     {getClasses("attendance").length === 0 ? (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center h-48 gap-3 mt-2">
                           <p className="text-sm font-bold text-slate-500">Awaiting Context Selection</p>
                           <p className="text-xs text-slate-400">Please choose Target Classes above to start tracking attendance.</p>
                        </div>
                     ) : (
                        <div className="flex flex-col gap-4 mt-2">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                              <div>
                                 <h5 className="font-bold text-slate-800">Class Roster</h5>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{classes.find(c => c.id === getClasses("attendance")[0])?.students?.length || 0} Students Enrolled</p>
                              </div>
                              <div className="flex gap-2 items-center">
                                 <select value={attendancePeriod} onChange={e => setAttendancePeriod(Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 focus:outline-emerald-500">
                                   {[1,2,3,4,5,6,7,8].map(p => <option key={p} value={p}>Period {p}</option>)}
                                 </select>
                                 <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-emerald-500" />
                                 <button onClick={() => { getClasses("attendance").forEach(c => handleSaveAttendance(c)); }} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center gap-1 shadow-md">
                                    <Save className="w-4 h-4"/> Save
                                 </button>
                              </div>
                           </div>
                           
                           <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                              {classes.filter(c => getClasses("attendance").includes(c.id)).flatMap(c => (c.students || []).map((s: any) => ({...s, className: c.name}))).map((student: any) => {
                                 const status = attendanceRecords[student.id] || "present";
                                 return (
                                    <div key={`${student.className}-${student.id}`} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                                       <div className="flex flex-col">
                                          <span className="text-sm font-bold text-slate-800">{student.name} <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 ml-1">{student.className}</span></span>
                                          <span className="text-[10px] text-slate-400 font-mono">{student.email}</span>
                                       </div>
                                       <div className="flex gap-1 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                                          <button onClick={() => setAttendanceRecords({...attendanceRecords, [student.id]: "present"})} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${status === "present" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>Present</button>
                                          <button onClick={() => setAttendanceRecords({...attendanceRecords, [student.id]: "absent"})} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${status === "absent" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>Absent</button>
                                          <button onClick={() => setAttendanceRecords({...attendanceRecords, [student.id]: "late"})} className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${status === "late" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}>Late</button>
                                       </div>
                                    </div>
                                 )
                              })}
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400"/> Past Sessions History</h4>
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-4 h-[35rem] overflow-y-auto custom-scrollbar">
                     {filteredAttendance.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-slate-400">
                           <Clock className="w-8 h-8 opacity-20"/>
                           <div>
                              <p className="text-sm font-bold">No Past Records</p>
                              <p className="text-xs mt-1">Saved attendance logs will populate here.</p>
                           </div>
                        </div>
                     ) : (
                        filteredAttendance.map(sess => {
                           const cls = classes.find(c => c.id === sess.classId);
                           const presentCount = sess.records.filter((r:any)=>r.status==="present").length;
                           const absentCount = sess.records.filter((r:any)=>r.status==="absent").length;
                           return (
                              <div key={sess.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                                 <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                                    <div>
                                       <h5 className="text-sm font-bold text-slate-800">{cls?.name || "Unknown Class"}</h5>
                                       <div className="flex gap-2 mt-1">
                                          <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md w-max">{new Date(sess.date).toLocaleDateString()}</p>
                                          <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-max">Period {sess.period || 1}</p>
                                       </div>
                                    </div>
                                    <div className="flex gap-2">
                                       <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">P: {presentCount}</span>
                                       <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">A: {absentCount}</span>
                                    </div>
                                 </div>
                                 <div className="flex flex-wrap gap-1.5 mt-1">
                                    {sess.records.map((r:any) => {
                                       const studentName = cls?.students?.find((s:any) => s.email === r.studentEmail)?.name || "Student";
                                       let bg = "bg-emerald-50 border-emerald-200 text-emerald-700";
                                       if(r.status==="absent") bg="bg-rose-50 border-rose-200 text-rose-700";
                                       if(r.status==="late") bg="bg-amber-50 border-amber-200 text-amber-700";
                                       return (
                                          <span key={r.studentEmail} className={`text-[9px] font-bold px-2 py-1 border rounded-md ${bg}`}>{studentName}</span>
                                       )
                                    })}
                                 </div>
                              </div>
                           )
                        })
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* 4. GRADES WIDGET COMPONENT */}
      {activeWidget === "grades" && (
         <div className="glass p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                     <FileText className="h-6 w-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">Grade Tracking & Entry</h3>
                     <p className="text-xs text-slate-500 font-medium">Manually enter marks and letter grades</p>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col gap-6">
               <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Department</label>
                     <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-amber-500" value={getDepts("grades")[0] || ""} onChange={(e) => setWidgetDepts("grades", e.target.value ? [e.target.value] : [])}>
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Year</label>
                     <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-amber-500" value={getYears("grades")[0] || ""} onChange={(e) => setWidgetYears("grades", e.target.value ? [e.target.value] : [])}>
                        <option value="">Select Year</option>
                        <option value="First Year">First Year</option>
                        <option value="Second Year">Second Year</option>
                        <option value="Third Year">Third Year</option>
                        <option value="Fourth Year">Fourth Year</option>
                     </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Class</label>
                     <select className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-amber-500" value={getClasses("grades")[0] || ""} onChange={(e) => setWidgetClasses("grades", e.target.value ? [e.target.value] : [])}>
                        <option value="">Select Class</option>
                        {filteredClassesForGrades.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Assessment</label>
                     <select value={selectedGradeExam} onChange={e => setSelectedGradeExam(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-amber-500">
                        <option value="">-- Choose Exam --</option>
                        {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
                     </select>
                  </div>
                  <button 
                     onClick={handleSaveGrades}
                     disabled={getClasses("grades").length === 0 || !selectedGradeExam}
                     className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md h-[42px]"
                  >
                     <Save className="w-4 h-4"/> Publish Grades
                  </button>
               </div>
               
               {(getClasses("grades").length === 0 || !selectedGradeExam) ? (
                  <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center gap-3">
                     <Award className="w-12 h-12 text-slate-200" />
                     <p className="text-sm font-bold text-slate-500">Awaiting Context Selection</p>
                     <p className="text-xs text-slate-400">Please choose a Target Class and an Exam above to start entering grades.</p>
                  </div>
               ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                 <th className="p-4 w-1/2">Student Roster</th>
                                 <th className="p-4">Marks (Score)</th>
                                 <th className="p-4">Letter Grade</th>
                              </tr>
                           </thead>
                           <tbody className="text-sm">
                              {classes.filter(c => getClasses("grades").includes(c.id)).flatMap(c => (c.students || []).map((s: any) => ({...s, className: c.name}))).map((student: any) => {
                                 const currentVals = gradeInputs[student.email] || { marks: "", grade: "A" };
                                 return (
                                    <tr key={`${student.className}-${student.id}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                       <td className="p-4">
                                          <div className="flex flex-col">
                                             <span className="font-bold text-slate-800">{student.name} <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500 ml-1">{student.className}</span></span>
                                             <span className="text-[10px] text-slate-500 font-mono mt-0.5">{student.email}</span>
                                          </div>
                                       </td>
                                       <td className="p-4">
                                          <input 
                                             type="number" 
                                             value={currentVals.marks}
                                             onChange={(e) => setGradeInputs({...gradeInputs, [student.email]: { ...currentVals, marks: e.target.value }})}
                                             className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-amber-500"
                                             placeholder="e.g. 95"
                                          />
                                       </td>
                                       <td className="p-4">
                                          <select 
                                             value={currentVals.grade}
                                             onChange={(e) => setGradeInputs({...gradeInputs, [student.email]: { ...currentVals, grade: e.target.value }})}
                                             className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-amber-500"
                                          >
                                             <option value="A+">A+</option>
                                             <option value="A">A</option>
                                             <option value="B">B</option>
                                             <option value="C">C</option>
                                             <option value="D">D</option>
                                             <option value="F">F</option>
                                          </select>
                                       </td>
                                    </tr>
                                 )
                              })}
                              {(classes.filter(c => getClasses("grades").includes(c.id)).reduce((acc, c) => acc + (c.students?.length || 0), 0) === 0) && (
                                 <tr><td colSpan={3} className="p-8 text-center text-slate-400 text-sm font-medium">No students enrolled in this class.</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
         </div>
      )}

      {/* 5. SETTINGS / CLASSES COMPONENT */}
      {activeWidget === "settings" && (
         <div className="glass p-8 rounded-[2rem] border border-white/60 shadow-sm flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-100 rounded-2xl text-sky-600">
                     <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-800">Class & Cohort Directory</h3>
                     <p className="text-xs text-slate-500 font-medium">Manage your teaching structure for {getDepts("settings").join(", ") || "targeted cohorts"}</p>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col gap-8 text-left pt-2">
               {/* View Classes Info */}
               <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                     <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-500"/> View Classes</h4>
                     <button onClick={handleOpenClassModal} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md flex items-center gap-2">
                        <PlusCircle className="w-4 h-4"/> Provision New Class
                     </button>
                  </div>
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col md:flex-row gap-6">
                     <div className="flex flex-col gap-1.5 flex-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Departments</label>
                       <MultiSelect options={[{id: "Computer Science", label: "Computer Science"}, {id: "Mathematics", label: "Mathematics"}, {id: "Physics", label: "Physics"}]} selected={getDepts("settings")} onChange={(val) => setWidgetDepts("settings", val)} placeholder="Select Departments" />
                     </div>
                     <div className="flex flex-col gap-1.5 flex-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase">Target Years</label>
                       <MultiSelect options={[{id: "First Year", label: "First Year"}, {id: "Second Year", label: "Second Year"}, {id: "Third Year", label: "Third Year"}, {id: "Fourth Year", label: "Fourth Year"}]} selected={getYears("settings")} onChange={(val) => setWidgetYears("settings", val)} placeholder="Select Years" />
                     </div>
                  </div>
               </div>

               {/* Live Class Management */}
               <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2"><BookOpen className="w-4 h-4 text-sky-500"/> Configured Classes</h4>
                  
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-inner flex flex-col gap-4 min-h-[16rem] max-h-[30rem] overflow-y-auto custom-scrollbar">
                     {filteredClassesForSettings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center gap-2 text-slate-400">
                           <BookOpen className="w-8 h-8 opacity-30 mb-2"/>
                           <p className="text-sm font-bold">No Classes Yet</p>
                           <p className="text-xs max-w-[200px]">Provision a new class to start tracking attendance and notices for this cohort.</p>
                        </div>
                     ) : (
                        filteredClassesForSettings.map(c => (
                           <div key={c.id} className="flex flex-col bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-3 group transition-all hover:border-sky-200">
                              <div className="flex items-center justify-between">
                                 <span className="text-sm font-bold text-slate-800">{c.name}</span>
                                 <button onClick={() => handleDeleteClass(c.id)} className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100">Remove</button>
                              </div>
                              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                 <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{c.students?.length || 0} Enrolled Students</span>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Provision Class Modal */}
      {isCreatingClass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-[slideUp_0.3s_ease-out]">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base leading-tight">Provision New Class</h3>
                        <p className="text-xs text-slate-500 font-medium">Add a new class and enroll student accounts.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCreatingClass(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Class Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Computer Science A1"
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-sky-100 outline-none shadow-sm"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Department</label>
                       <div className="flex flex-col gap-2">
                         {["Computer Science", "Mathematics", "Physics"].map(dept => (
                           <label key={dept} onClick={() => setNewClassDepartment(dept)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${newClassDepartment === dept ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300' : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-slate-50'}`}>
                             <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${newClassDepartment === dept ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'}`}>
                                {newClassDepartment === dept && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                             </div>
                             <span className={`text-sm font-bold ${newClassDepartment === dept ? 'text-sky-700' : 'text-slate-700'}`}>{dept}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Year</label>
                       <div className="grid grid-cols-2 gap-2">
                         {["First Year", "Second Year", "Third Year", "Fourth Year"].map(yr => (
                           <label key={yr} onClick={() => setNewClassYear(yr)} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${newClassYear === yr ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-300' : 'bg-white border-slate-200 hover:border-sky-200 hover:bg-slate-50'}`}>
                             <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${newClassYear === yr ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'}`}>
                                {newClassYear === yr && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                             </div>
                             <span className={`text-xs font-bold ${newClassYear === yr ? 'text-sky-700' : 'text-slate-700'}`}>{yr}</span>
                           </label>
                         ))}
                       </div>
                     </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-4 mb-4 border-b border-slate-200 pb-2">
                       <button onClick={() => setRosterInputMode("manual")} className={`text-sm font-bold pb-2 transition-all relative ${rosterInputMode === "manual" ? "text-sky-600" : "text-slate-400 hover:text-slate-600"}`}>
                          Manual Entry
                          {rosterInputMode === "manual" && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
                       </button>
                       <button onClick={() => setRosterInputMode("csv")} className={`text-sm font-bold pb-2 transition-all relative ${rosterInputMode === "csv" ? "text-sky-600" : "text-slate-400 hover:text-slate-600"}`}>
                          CSV Upload
                          {rosterInputMode === "csv" && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-sky-600 rounded-full" />}
                       </button>
                    </div>

                    {rosterInputMode === "manual" && (
                       <div className="flex flex-col gap-3">
                          {newClassStudents.map((student, idx) => (
                             <div key={idx} className="flex items-center gap-3">
                                <input type="text" placeholder="Full Name" value={student.name} onChange={(e) => {
                                   const newArr = [...newClassStudents];
                                   newArr[idx].name = e.target.value;
                                   setNewClassStudents(newArr);
                                }} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                                <input type="email" placeholder="Email Address" value={student.email} onChange={(e) => {
                                   const newArr = [...newClassStudents];
                                   newArr[idx].email = e.target.value;
                                   setNewClassStudents(newArr);
                                }} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-100 outline-none" />
                                <button onClick={() => {
                                   setNewClassStudents(newClassStudents.filter((_, i) => i !== idx));
                                }} className="text-slate-400 hover:text-rose-500 p-2"><X className="w-4 h-4" /></button>
                             </div>
                          ))}
                          <button onClick={() => setNewClassStudents([...newClassStudents, {name: "", email: ""}])} className="text-sky-600 font-bold text-xs flex items-center gap-1 w-fit mt-1 hover:text-sky-700">
                             <PlusCircle className="w-3 h-3"/> Add Student
                          </button>
                       </div>
                    )}

                    {rosterInputMode === "csv" && (
                       <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-sky-50 hover:border-sky-300 transition-colors relative">
                          <input type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if(!file) return;
                             const reader = new FileReader();
                             reader.onload = (event) => {
                                const text = event.target?.result as string;
                                const lines = text.split('\n').filter(l => l.trim() !== '');
                                let startIdx = 0;
                                if (lines[0].toLowerCase().includes('email') || lines[0].toLowerCase().includes('name')) {
                                   startIdx = 1;
                                }
                                const parsed = [];
                                for(let i = startIdx; i < lines.length; i++) {
                                   const parts = lines[i].split(',').map(p => p.trim());
                                   if(parts.length >= 2) parsed.push({name: parts[0], email: parts[1]});
                                   else if(parts.length === 1 && parts[0].includes('@')) parsed.push({name: parts[0].split('@')[0], email: parts[0]});
                                }
                                setNewClassStudents(prev => [...prev, ...parsed]);
                                setRosterInputMode("manual"); // Switch back to manual to show imported rows
                             };
                             reader.readAsText(file);
                          }}/>
                          <FileText className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="font-bold text-sm text-slate-700">Drag & Drop CSV file</p>
                          <p className="text-xs text-slate-500 mt-1">Format: Name, Email</p>
                       </div>
                    )}
                  </div>
              </div>
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button onClick={handleAddClass} className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">
                    Create & Enroll
                  </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
