import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock, FileCheck, X, Megaphone } from "lucide-react";
import { Task, TaskSubmission } from "../types";

export default function NotificationsPopover({ 
  userRole, 
  studentContext 
}: { 
  userRole?: "teacher" | "student";
  studentContext?: { depts: string[]; years: string[]; classes: string[] };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [lastCheckTime, setLastCheckTime] = useState<number>(Date.now());
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotificationsData = async () => {
    try {
      const [tasksRes, subsRes, notRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/task-submissions"),
        fetch("/api/notices"),
      ]);
      if (tasksRes.ok && subsRes.ok && notRes.ok) {
        const tasksData = await tasksRes.json();
        const subsData = await subsRes.json();
        const notData = await notRes.json();
        setTasks(tasksData);
        setSubmissions(subsData);
        setNotices(notData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotificationsData();
    const interval = setInterval(fetchNotificationsData, 15000); // 15 seconds polling
    return () => clearInterval(interval);
  }, []);

  // Compute notifications list
  const notifications: any[] = [];
  const now = new Date();

  // Upcoming deadlines (within 3 days)
  tasks.forEach((task) => {
    if (userRole === "student" && studentContext) {
      const matchesDept = !task.targetDepartments?.length || task.targetDepartments.some(d => studentContext.depts.includes(d));
      const matchesYear = !task.targetYears?.length || task.targetYears.some(y => studentContext.years.includes(y));
      const matchesClass = !task.targetClasses?.length || task.targetClasses.some(c => studentContext.classes.includes(c));
      if (!(matchesDept && matchesYear && matchesClass)) return;
    }

    const deadlineDate = new Date(task.deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    if (timeDiff > 0 && timeDiff < 3 * 24 * 60 * 60 * 1000) {
      notifications.push({
        id: `task-deadline-${task.id}`,
        type: "deadline",
        title: "Upcoming Deadline",
        message: `${task.title} is due on ${deadlineDate.toLocaleString()}`,
        time: task.createdAt, // Using creation time to order, or deadline
      });
    }
  });

  // New submissions (created after some last check time or just show all recent)
  // We'll show the top 5 most recent submissions
  const recentSubs = [...submissions]
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )
    .slice(0, 5);
  recentSubs.forEach((sub) => {
    const task = tasks.find((t) => t.id === sub.taskId);
    if (task) {
      notifications.push({
        id: `task-sub-${sub.id}`,
        type: "submission",
        title: "New Submission Received",
        message: `${sub.studentName} submitted "${task.title}"`,
        time: sub.submittedAt,
      });
    }
  });

  // Notices
  notices.forEach((notice) => {
    if (userRole === "student" && studentContext) {
      const matchesDept = !notice.targetDepartments?.length || notice.targetDepartments.some((d: string) => studentContext.depts.includes(d));
      const matchesYear = !notice.targetYears?.length || notice.targetYears.some((y: string) => studentContext.years.includes(y));
      const matchesClass = !notice.targetClasses?.length || notice.targetClasses.some((c: string) => studentContext.classes.includes(c));
      if (!(matchesDept && matchesYear && matchesClass)) return;
    }

    notifications.push({
      id: `notice-${notice.id}`,
      type: "notice",
      title: "New Announcement",
      message: notice.title,
      time: notice.createdAt,
    });
  });

  // Sort them so most recent events are top
  notifications.sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );

  useEffect(() => {
    if (isOpen) {
      setLastCheckTime(Date.now());
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const newCount = notifications.filter(
      (n) => new Date(n.time).getTime() > lastCheckTime,
    ).length;
    setUnreadCount(newCount);
  }, [notifications.length, lastCheckTime]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-850 p-2.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-xs relative"
      >
        <Bell className="h-4 w-4 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-80 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl z-50 overflow-hidden transform animate-[slideDown_0.2s_ease-out]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-500" /> Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[340px] overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs font-semibold text-slate-400">
                No active notifications
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${notif.type === "deadline" ? "bg-amber-50 text-amber-600" : notif.type === "notice" ? "bg-fuchsia-50 text-fuchsia-600" : "bg-emerald-50 text-emerald-600"}`}
                    >
                      {notif.type === "deadline" ? (
                        <Clock className="h-4 w-4" />
                      ) : notif.type === "notice" ? (
                        <Megaphone className="h-4 w-4" />
                      ) : (
                        <FileCheck className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-extrabold text-slate-800 leading-tight mb-0.5">
                        {notif.title}
                      </span>
                      <span className="text-xs text-slate-600 font-medium leading-snug">
                        {notif.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
