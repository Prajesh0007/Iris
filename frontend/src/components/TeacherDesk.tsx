import React, { useState, useEffect } from "react";
import { 
  Plus, CheckCircle, FileText, Calendar, Bell, ClipboardCheck, 
  BookOpen, Clock, AlertOctagon, ShieldCheck, Award, 
  Trash2, PlusCircle, Save, X
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
  const [questions, setQuestions] = useState<Question[]>([]);

  // Current Question Drafting State
  const [draftQType, setDraftQType] = useState<QuestionType>("mcq");
  const [draftQTitle, setDraftQTitle] = useState("");
  const [draftQPoints, setDraftQPoints] = useState(10);
  const [draftQText, setDraftQText] = useState("");
  const [mcqOptions, setMcqOptions] = useState<string[]>(["", "", "", ""]);
  const [correctMcqIndex, setCorrectMcqIndex] = useState(0);
  const [codeBoilerplate, setCodeBoilerplate] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "", isHidden: false }]);

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
  const handleAddQuestion = () => {
    if (!draftQTitle.trim()) {
      alert("Please provide a question title.");
      return;
    }
    const nq: Question = {
      id: "q-" + Date.now(),
      type: draftQType,
      title: draftQTitle,
      points: draftQPoints,
      questionText: draftQText,
    };

    if (draftQType === "mcq") {
      nq.options = [...mcqOptions];
      nq.correctOptionIndex = correctMcqIndex;
    } else if (draftQType === "coding") {
      nq.language = "javascript";
      nq.codeBoilerplate = codeBoilerplate;
      nq.testCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
    }

    setQuestions([...questions, nq]);
    
    // Reset draft fields
    setDraftQTitle("");
    setDraftQText("");
    setCodeBoilerplate("");
    setMcqOptions(["", "", "", ""]);
    setCorrectMcqIndex(0);
    setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
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

      {/* 1. DRAFT EXAM COMPOSER */}
      {activeWidget === "draft" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left">
          {/* Metadata Configuration Matrix */}
          <div className="xl:col-span-1 glass p-6 rounded-3xl border border-white/60 flex flex-col gap-5 h-max shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-150 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" /> Configuration Matrix
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Departments</label>
              <MultiSelect 
                options={[
                  {id: "Computer Science", label: "Computer Science"},
                  {id: "Mathematics", label: "Mathematics"},
                  {id: "Physics", label: "Physics"}
                ]} 
                selected={getDepts("draft")} 
                onChange={(val) => setWidgetDepts("draft", val)} 
                placeholder="Select Departments" 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Years</label>
              <MultiSelect 
                options={[
                  {id: "First Year", label: "First Year"},
                  {id: "Second Year", label: "Second Year"},
                  {id: "Third Year", label: "Third Year"},
                  {id: "Fourth Year", label: "Fourth Year"}
                ]} 
                selected={getYears("draft")} 
                onChange={(val) => setWidgetYears("draft", val)} 
                placeholder="Select Years" 
              />
            </div>

            <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Target Classes</label>
              <MultiSelect 
                options={classes.filter(c => getDepts("draft").includes(c.department) && getYears("draft").includes(c.year)).map(c => ({id: c.id, label: c.name}))} 
                selected={getClasses("draft")} 
                onChange={(val) => setWidgetClasses("draft", val)} 
                placeholder="Select Classes" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Exam Title</label>
              <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Algorithms & Logic structures exam" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Description summary</label>
              <textarea value={examDescription} onChange={(e) => setExamDescription(e.target.value)} placeholder="Provides key structural parameters evaluating logic algorithms." className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-24 resize-none font-medium" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Identifier</label>
              <input type="text" value={examSubject} onChange={(e) => setExamSubject(e.target.value)} placeholder="CSC-101" className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar className="w-3 h-3 text-indigo-400" /> Start Date</label>
                <input type="date" value={examStartDate} onChange={(e) => setExamStartDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock className="w-3 h-3 text-indigo-400" /> Start Time</label>
                <input type="time" value={examStartTimeOfDay} onChange={(e) => setExamStartTimeOfDay(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> Time (Min)</label>
                <input type="number" value={examDuration} onChange={(e) => setExamDuration(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><AlertOctagon className="w-3 h-3 text-rose-400" /> Integrity Req.</label>
                <input type="number" value={examIntegrityThreshold} onChange={(e) => setExamIntegrityThreshold(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-3 border-t border-slate-100">
              <label className="relative flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={examRequireCamera} onChange={(e) => setExamRequireCamera(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                <span className="text-sm font-bold text-slate-700 transition-colors">Require AI Camera Proctor</span>
              </label>

              <label className="relative flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={examLockdownBrowsing} onChange={(e) => setExamLockdownBrowsing(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-rose-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                <span className="text-sm font-bold text-slate-700 transition-colors">Strict App Lockdown</span>
              </label>
            </div>

            <button type="button" onClick={handleGenerateExam} className="mt-6 w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl mt-auto">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> Finalize Exam Generation
            </button>
          </div>

          {/* Question Composer & Active Pile */}
          <div className="col-span-1 xl:col-span-2 flex flex-col gap-6 h-max">
            {/* Dynamic Question Composer */}
            <div className="glass p-6 rounded-3xl border border-white/60 flex flex-col gap-5 shadow-sm bg-gradient-to-br from-white/60 to-white/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/60 pb-4 gap-4">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">Question Composer</h3>
                <div className="flex bg-slate-200/50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                  {(["mcq", "coding", "written"] as QuestionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDraftQType(type)}
                      className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${draftQType === type ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-300/50"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Question Title</label>
                  <input type="text" value={draftQTitle} onChange={(e) => setDraftQTitle(e.target.value)} placeholder="e.g., Explain the Big O complexity" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm" />
                </div>
                <div className="md:col-span-1 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase"><Award className="inline h-3 w-3" /> Points</label>
                  <input type="number" value={draftQPoints} onChange={(e) => setDraftQPoints(Number(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm text-center" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Directives / Prompt</label>
                <textarea value={draftQText} onChange={(e) => setDraftQText(e.target.value)} placeholder="Enter the main question body here..." className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium h-24 resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm" />
              </div>

              {/* Dynamic MCQ Options */}
              {draftQType === "mcq" && (
                <div className="flex flex-col gap-3 p-5 bg-white/80 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                     <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> Multiple Choice Options</label>
                     <button onClick={() => setMcqOptions([...mcqOptions, ""])} className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors"><PlusCircle className="w-3 h-3"/> Add Option</button>
                  </div>
                  <div className="flex flex-col gap-2 mt-2">
                     {mcqOptions.map((opt, optIdx) => (
                        <div key={optIdx} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${correctMcqIndex === optIdx ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-300' : 'border-slate-200 bg-white'}`}>
                           <div onClick={() => setCorrectMcqIndex(optIdx)} className={`w-4 h-4 rounded-full border flex items-center justify-center cursor-pointer shrink-0 ml-2 ${correctMcqIndex === optIdx ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'}`}>
                              {correctMcqIndex === optIdx && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                           </div>
                           <input
                              type="text"
                              placeholder={`Option ${optIdx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                 const n = [...mcqOptions];
                                 n[optIdx] = e.target.value;
                                 setMcqOptions(n);
                              }}
                              className="flex-1 bg-transparent border-none text-sm font-medium focus:outline-none px-2"
                           />
                           {mcqOptions.length > 2 && (
                              <button onClick={() => {
                                 const n = mcqOptions.filter((_, i) => i !== optIdx);
                                 setMcqOptions(n);
                                 if(correctMcqIndex === optIdx) setCorrectMcqIndex(0);
                                 else if (correctMcqIndex > optIdx) setCorrectMcqIndex(correctMcqIndex - 1);
                              }} className="p-2 text-rose-400 hover:text-rose-600 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           )}
                        </div>
                     ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">Select the radio button next to the correct answer.</p>
                </div>
              )}

              {/* Dynamic Coding Test Cases */}
              {draftQType === "coding" && (
                <div className="flex flex-col gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-700 shadow-sm text-slate-300">
                  <div className="flex flex-col gap-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase">Javascript Boilerplate</label>
                     <textarea value={codeBoilerplate} onChange={(e) => setCodeBoilerplate(e.target.value)} placeholder="function solution(args) {\n  // your code here\n}" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono h-32 resize-none focus:outline-none focus:border-indigo-500 text-emerald-400" />
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-700 pt-4 mt-2">
                     <label className="text-xs font-bold text-slate-300 uppercase">Test Cases Validation</label>
                     <button onClick={() => setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }])} className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors"><PlusCircle className="w-3 h-3"/> Add Test Case</button>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                     {testCases.map((tc, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-800 p-3 rounded-xl border border-slate-600">
                           <div className="col-span-5 flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Input Params</label>
                              <input type="text" value={tc.input} onChange={e => { const n = [...testCases]; n[idx].input = e.target.value; setTestCases(n); }} placeholder="e.g. 2, 4" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none" />
                           </div>
                           <div className="col-span-5 flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expected Output</label>
                              <input type="text" value={tc.expectedOutput} onChange={e => { const n = [...testCases]; n[idx].expectedOutput = e.target.value; setTestCases(n); }} placeholder="e.g. 6" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-emerald-400 focus:border-indigo-500 focus:outline-none" />
                           </div>
                           <div className="col-span-2 flex items-center justify-end h-full pt-4">
                              <button onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 hover:text-rose-300 transition-colors">
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
                </div>
              )}

              <button onClick={handleAddQuestion} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-colors self-end shadow-md flex items-center gap-2">
                 <Plus className="w-5 h-5"/> Add to Exam Draft
              </button>
            </div>

            {/* Active Questions Pile */}
            <div className="glass p-6 rounded-3xl border border-white/60 flex flex-col gap-4 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200/60 pb-3 flex items-center justify-between">
                 Active Question Pile
                 <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{questions.length} Questions</span>
              </h3>
              
              {questions.length === 0 ? (
                 <div className="bg-white/50 border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
                    <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                       <FileText className="w-8 h-8" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-600">Draft is empty</p>
                       <p className="text-xs text-slate-400 mt-1">Add questions from the composer above to build your exam.</p>
                    </div>
                 </div>
              ) : (
                 <div className="flex flex-col gap-3">
                   {questions.map((q, i) => (
                     <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4 sm:items-center hover:border-indigo-200 transition-colors group">
                       <div className="flex gap-4 items-center">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm">{i+1}</div>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-800">{q.title}</span>
                            <div className="flex gap-2 items-center mt-1">
                               <span className="text-[9px] font-bold uppercase tracking-wide bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{q.type}</span>
                               <span className="text-[10px] font-bold text-slate-500">{q.points} Points</span>
                               {q.type === 'coding' && <span className="text-[10px] font-bold text-slate-500">• {q.testCases?.length || 0} Test Cases</span>}
                            </div>
                          </div>
                       </div>
                       <button onClick={() => setQuestions(questions.filter(x => x.id !== q.id))} className="text-xs text-rose-500 font-bold bg-rose-50 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 self-start sm:self-auto hover:bg-rose-100">
                          <Trash2 className="w-4 h-4"/> Remove
                       </button>
                     </div>
                   ))}
                 </div>
              )}
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
