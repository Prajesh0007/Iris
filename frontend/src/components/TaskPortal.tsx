import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Calendar,
  FileCheck,
  CheckCircle2,
  Upload,
  BarChart,
  ChevronRight,
  Clock,
  Filter,
  Users,
  Paperclip,
  Download,
  Loader2,
  ChevronDown,
  X
} from "lucide-react";
import { Task, TaskSubmission } from "../types";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Inline MultiSelect Component for Target Selection
const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative">
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">
          {selected.length === 0 ? placeholder : `${selected.length} Selected`}
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <div className="absolute top-full mt-1 w-full z-50 bg-white border border-slate-200 shadow-xl rounded-xl p-2 flex flex-col gap-1 max-h-40 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-indigo-50 rounded-lg cursor-pointer text-xs font-semibold text-slate-600 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleOption(opt)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              {opt}
            </label>
          ))}
          {options.length === 0 && (
            <div className="text-xs text-slate-400 p-2 text-center">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function TaskPortal({
  userRole,
  studentContext,
  user
}: {
  userRole?: "student" | "teacher";
  studentContext?: {
    depts: string[];
    years: string[];
    classes: string[];
  };
  user?: any;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);

  // Teacher Task Creation
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [taskType, setTaskType] = useState<"certification" | "assignment" | "lab">("assignment");
  
  // Targeting
  const [targetClasses, setTargetClasses] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<string[]>([]);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Roster View Modal
  const [activeRosterTaskId, setActiveRosterTaskId] = useState<string | null>(null);

  // Teacher attachment
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string>("");
  const teacherFileRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filters (for teacher view only)
  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterClass, setFilterClass] = useState("All");

  // Student user info
  const studentName = user?.user_metadata?.name || "Student";
  const studentEmail = user?.email || "student@university.edu";

  const fetchData = () => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then(setTasks)
      .catch(console.error);
    fetch("/api/task-submissions")
      .then((r) => r.json())
      .then(setSubmissions)
      .catch(console.error);
    fetch("/api/classes")
      .then((r) => r.json())
      .then(setClasses)
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTeacherFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachmentFile(file);
      const reader = new FileReader();
      reader.onload = () => setAttachmentDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle || !taskDate || !taskTime) return alert("Task Title and a complete Deadline (Date & Time) are required.");
    setIsCreating(true);

    const deadlineIso = new Date(`${taskDate}T${taskTime}`).toISOString();

    const newTask = {
      title: taskTitle,
      description: taskDesc,
      deadline: deadlineIso,
      type: taskType,
      targetClasses,
      targetYears,
      targetDepartments,
      filename: attachmentFile?.name || null,
      fileUrl: attachmentDataUrl || null,
      createdBy: "Teacher Faculty",
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        fetchData();
        setTaskTitle("");
        setTaskDesc("");
        setTaskDate("");
        setTaskTime("");
        setTargetClasses([]);
        setTargetYears([]);
        setTargetDepartments([]);
        setAttachmentFile(null);
        setAttachmentDataUrl("");
        if (teacherFileRef.current) teacherFileRef.current.value = "";
        alert("New Assignment Task Created!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  const handleFileSubmission = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    setUploadingTaskId(taskId);

    reader.onload = async () => {
      const task = tasks.find((t) => t.id === taskId);
      const isLate = task ? new Date() > new Date(task.deadline) : false;

      const sub = {
        taskId,
        studentName,
        studentEmail,
        filename: file.name,
        fileUrl: reader.result as string,
        status: isLate ? "late" : "pending",
      };

      try {
        const res = await fetch("/api/task-submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub),
        });
        if (res.ok) {
          fetchData();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingTaskId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredTasks = tasks.filter((t) => {
    if (userRole === "student" && studentContext) {
      const matchesDept = !t.targetDepartments?.length || t.targetDepartments.some(d => studentContext.depts.includes(d));
      const matchesYear = !t.targetYears?.length || t.targetYears.some(y => studentContext.years.includes(y));
      const matchesClass = !t.targetClasses?.length || t.targetClasses.some(c => studentContext.classes.includes(c));
      return matchesDept && matchesYear && matchesClass;
    } else if (userRole === "teacher") {
      // Teacher sees what they want based on top filter
      if (filterDept !== "All" && t.targetDepartments && !t.targetDepartments.includes(filterDept)) return false;
      if (filterYear !== "All" && t.targetYears && !t.targetYears.includes(filterYear)) return false;
      if (filterClass !== "All" && t.targetClasses && !t.targetClasses.includes(filterClass)) return false;
    }
    return true;
  });

  const submissionStats = useMemo(() => {
    const data = filteredTasks.map((t) => {
      const subsForTask = submissions.filter((s) => s.taskId === t.id);
      const late = subsForTask.filter((s) => s.status === "late").length;
      const onTime = subsForTask.filter((s) => s.status !== "late").length;
      return {
        name: t.title.substring(0, 10) + "...",
        Submitted: onTime,
        Late: late,
      };
    });
    return data;
  }, [filteredTasks, submissions]);

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="glass p-6 sm:p-8 rounded-[2rem] border border-white/70 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-fuchsia-100/50 flex items-center justify-center text-fuchsia-600 shadow-sm">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight leading-tight">
                Academic Assignments{" "}
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {userRole === "teacher"
                  ? "Manage and analyze assignment distributions"
                  : "Track and submit your academic deadlines"}
              </p>
            </div>
          </div>


        </div>

        {userRole === "teacher" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 border-b border-slate-100 pb-8">
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-[2rem] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-5 uppercase tracking-widest flex items-center gap-2">
                Launch New Task
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Task Title</label>
                    <input
                      type="text"
                      placeholder="Task/Assignment Title"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Deadline Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none font-sans shadow-sm"
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Deadline Time</label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none font-sans shadow-sm"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Description / Instructions</label>
                  <textarea
                    placeholder="Description / Instructions"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none h-24 resize-none shadow-sm"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Type</label>
                    <select
                      value={taskType}
                      onChange={(e: any) => setTaskType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-700 shadow-sm"
                    >
                      <option value="assignment">Homework Assignment</option>
                      <option value="lab">Lab Execution</option>
                      <option value="certification">Certification</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Depts</label>
                    <MultiSelect
                      options={["Computer Science", "Mathematics", "Physics", "General Dept"]}
                      selected={targetDepartments}
                      onChange={setTargetDepartments}
                      placeholder="Select Depts"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Years</label>
                    <MultiSelect
                      options={["First Year", "Year 2", "Year 3", "Year 4"]}
                      selected={targetYears}
                      onChange={setTargetYears}
                      placeholder="Select Years"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Target Classes</label>
                    <MultiSelect
                      options={
                        classes
                          .filter(c => 
                            (targetDepartments.length === 0 || c.departments?.some((d: string) => targetDepartments.includes(d))) &&
                            (targetYears.length === 0 || c.years?.some((y: string) => targetYears.includes(y)))
                          )
                          .map(c => c.name)
                      }
                      selected={targetClasses}
                      onChange={setTargetClasses}
                      placeholder="Select Classes"
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Attach Brief / File (Optional)</label>
                   <div className="relative">
                      <input
                        type="file"
                        ref={teacherFileRef}
                        onChange={handleTeacherFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all ${attachmentFile ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                         <Paperclip className="h-4 w-4" />
                         {attachmentFile ? attachmentFile.name : "Attach File"}
                      </div>
                   </div>
                </div>

                <button
                  onClick={handleCreateTask}
                  disabled={isCreating}
                  className="mt-2 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Create & Publish Assignment
                </button>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl text-white flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 h-64 w-64 bg-fuchsia-500/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-64 w-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
              
              <h3 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-widest flex items-center gap-2 relative z-10">
                <BarChart className="h-4 w-4 text-fuchsia-400" /> Class Analytics Overview
              </h3>
              
              <div className="flex-1 min-h-[220px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={submissionStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "#1e293b" }} contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }} />
                    <Bar dataKey="Submitted" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Late" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white/50 border border-slate-200 border-dashed rounded-[2rem]">
               <FileCheck className="h-10 w-10 mb-4 text-slate-300" />
               <p className="font-bold text-slate-500 text-lg">No Tasks Found</p>
               <p className="text-sm font-medium mt-1">Assignments assigned to you will appear here.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const mySub = submissions.find((s) => s.taskId === task.id && s.studentEmail === studentEmail);
              const isLate = new Date() > new Date(task.deadline);
              const isApproaching = !isLate && new Date(task.deadline).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
              const taskSubs = submissions.filter((s) => s.taskId === task.id);
              const isUploading = uploadingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`bg-white border ${isApproaching && !mySub && userRole === "student" ? "border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]" : "border-slate-200 hover:border-indigo-300 hover:shadow-xl"} rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300`}
                >
                  {mySub && userRole === "student" && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                    </div>
                  )}
                  {isApproaching && !mySub && userRole === "student" && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1 animate-pulse">
                      <Clock className="h-3.5 w-3.5" /> Due Soon
                    </div>
                  )}

                  <div className="mb-5 text-left">
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-fuchsia-600 bg-fuchsia-50 px-2 py-1 rounded border border-fuchsia-100">
                        {task.type}
                      </span>
                      {task.targetDepartments?.map(d => (
                         <span key={d} className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                           {d}
                         </span>
                      ))}
                      {task.targetClasses?.map(c => (
                         <span key={c} className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                           {c}
                         </span>
                      ))}
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-lg mb-2 leading-snug group-hover:text-indigo-600 transition-colors pr-4">
                      {task.title}
                    </h4>
                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {task.description}
                    </p>
                    
                    {task.fileUrl && (
                      <div className="mt-3">
                         <a 
                           href={task.fileUrl} 
                           download={task.filename}
                           className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                         >
                            <Download className="w-3.5 h-3.5" /> Download Question Paper
                         </a>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-auto border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <Calendar className="h-4 w-4" /> Due Date
                      </span>
                      <span className={`${isLate && !mySub && userRole === "student" ? "text-rose-600 font-extrabold" : isApproaching && !mySub && userRole === "student" ? "text-amber-600 font-extrabold" : "text-slate-700 font-bold"}`}>
                        {new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    {userRole === "student" &&
                      (!mySub ? (
                        <div className="relative mt-1">
                          <input
                            type="file"
                            onChange={(e) => handleFileSubmission(e, task.id)}
                            disabled={isUploading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                          />
                          <div
                            className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 ${isUploading ? 'bg-indigo-50 border-indigo-200 text-indigo-500' : isLate ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" : isApproaching ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100 hover:border-amber-300" : "bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"}`}
                          >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {isUploading ? "Uploading..." : isLate ? "Upload Late Submission" : "Submit Assignment"}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-xs font-bold border border-emerald-100 mt-1 shadow-sm">
                          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full shrink-0">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div>Submitted Successfully</div>
                            <div className="font-medium text-[10px] opacity-80 mt-0.5 truncate max-w-full">
                              {mySub.filename}
                            </div>
                          </div>
                          
                          {mySub.fileUrl && (
                             <a 
                               href={mySub.fileUrl} 
                               download={mySub.filename}
                               className="ml-auto shrink-0 p-2 hover:bg-emerald-200 rounded-lg transition-colors text-emerald-600"
                               title="Download my submission"
                             >
                                <Download className="w-4 h-4" />
                             </a>
                          )}
                        </div>
                      ))}

                    {userRole === "teacher" && (
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-2 px-1 bg-slate-50 py-2 rounded-xl border border-slate-100">
                        <span className="flex items-center gap-1.5 ml-2">
                           <Users className="w-3.5 h-3.5" /> Received: {taskSubs.length}
                        </span>
                        <button 
                          onClick={() => setActiveRosterTaskId(task.id)}
                          className="text-indigo-600 hover:text-white hover:bg-indigo-600 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-lg mr-1"
                        >
                          View Roster <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* View Roster Modal */}
      {activeRosterTaskId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-[slideUp_0.3s_ease-out]">
            {(() => {
              const task = tasks.find(t => t.id === activeRosterTaskId);
              const taskSubs = submissions.filter(s => s.taskId === activeRosterTaskId);
              
              if (!task) return null;

              return (
                <>
                  {/* Modal Header */}
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base leading-tight">Assignment Roster</h3>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{task.title}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveRosterTaskId(null)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Modal Body - Submissions Table */}
                  <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                    {taskSubs.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <FileCheck className="h-8 w-8 text-slate-300" />
                        <span className="text-sm font-bold">No Submissions Yet</span>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                              <th className="px-4 py-3">Student Candidate</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Submitted At</th>
                              <th className="px-4 py-3 text-right">Answer File</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {taskSubs.map(sub => (
                              <tr key={sub.id} className="hover:bg-indigo-50/20 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="font-bold text-slate-900">{sub.studentName}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{sub.studentEmail}</div>
                                </td>
                                <td className="px-4 py-3">
                                  {sub.status === "late" ? (
                                    <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-1 rounded-md font-bold text-[10px] uppercase">Late</span>
                                  ) : (
                                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-md font-bold text-[10px] uppercase">On Time</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-500 text-[10px]">
                                  {new Date(sub.submittedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {sub.fileUrl ? (
                                    <a 
                                      href={sub.fileUrl} 
                                      download={sub.filename}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                                      title="Download student answer file"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download
                                    </a>
                                  ) : (
                                    <span className="text-slate-400 italic">No File</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
