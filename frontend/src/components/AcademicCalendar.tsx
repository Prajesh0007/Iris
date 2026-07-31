import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Clock,
  MapPin,
  Flag,
} from "lucide-react";
import { AcademicEvent } from "../types";

export default function AcademicCalendar({
  userRole,
}: {
  userRole?: "student" | "teacher";
}) {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<AcademicEvent["type"]>("deadline");
  const [department, setDepartment] = useState("Computer Science");
  const [year, setYear] = useState("Year 1");
  const [description, setDescription] = useState("");

  const [filterDept, setFilterDept] = useState("All");
  const [filterYear, setFilterYear] = useState("All");

  const fetchEvents = () => {
    fetch("/api/academic-events")
      .then((r) => r.json())
      .then(setEvents)
      .catch(console.error);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!title || !date) return alert("Title and date are required");

    const newEvent: Partial<AcademicEvent> = {
      title,
      date: new Date(date).toISOString(),
      type,
      department,
      year,
      description,
    };

    try {
      const res = await fetch("/api/academic-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        fetchEvents();
        setTitle("");
        setDate("");
        setDescription("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await fetch(`/api/academic-events/${id}`, { method: "DELETE" });
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredEvents = events
    .filter((e) => {
      if (filterDept !== "All" && e.department && e.department !== filterDept)
        return false;
      if (filterYear !== "All" && e.year && e.year !== filterYear) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group events by month for timeline view
  const groupedEvents: Record<string, AcademicEvent[]> = filteredEvents.reduce(
    (acc: Record<string, AcademicEvent[]>, event: AcademicEvent) => {
      const month = new Date(event.date).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!acc[month]) acc[month] = [];
      acc[month].push(event);
      return acc;
    },
    {}
  );

  const getTypeColor = (t: string) => {
    switch (t) {
      case "exam":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "deadline":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "holiday":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="glass p-6 sm:p-8 rounded-3xl border border-white/70">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans text-slate-800 tracking-tight leading-tight">
                Academic Calendar
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Important semester dates, exams, and holidays
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none shadow-xs"
            >
              <option value="All">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="General Dept">General Dept</option>
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none shadow-xs"
            >
              <option value="All">All Years</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {userRole === "teacher" && (
            <div className="lg:w-[400px] shrink-0 flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-24">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-500" /> Add New Event
                </h3>

                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Event Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-slate-700"
                  />

                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 outline-none font-semibold text-slate-700 font-sans"
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Event Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { val: "exam", label: "Exam", color: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-300" },
                        { val: "deadline", label: "Assignment", color: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-300" },
                        { val: "holiday", label: "Holiday", color: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-300" },
                        { val: "other", label: "Other", color: "bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-300" }
                      ].map(opt => (
                        <label key={opt.val} onClick={() => setType(opt.val as any)} className={`flex items-center justify-center py-2 px-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${type === opt.val ? opt.color + ' ring-1' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Department Target</label>
                    <div className="flex flex-wrap gap-2">
                      {["Computer Science", "Mathematics", "Physics", "General Dept"].map(dept => (
                        <label key={dept} onClick={() => setDepartment(dept)} className={`flex items-center gap-2 py-1.5 px-3 rounded-full border text-[10px] font-bold cursor-pointer transition-all ${department === dept ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          {dept}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Year Target</label>
                    <div className="flex flex-wrap gap-2">
                      {["Year 1", "Year 2", "Year 3", "Year 4"].map(yr => (
                        <label key={yr} onClick={() => setYear(yr)} className={`flex items-center gap-2 py-1.5 px-3 rounded-full border text-[10px] font-bold cursor-pointer transition-all ${year === yr ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                          {yr}
                        </label>
                      ))}
                    </div>
                  </div>

                  <textarea
                    placeholder="Event Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-100 outline-none h-20 resize-none font-semibold text-slate-700"
                  />

                  <button
                    onClick={handleCreateEvent}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all mt-2"
                  >
                    Add to Calendar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1">
            {Object.keys(groupedEvents).length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 bg-white/50 border border-slate-200 rounded-2xl border-dashed">
                <CalendarIcon className="h-8 w-8 mb-3 opacity-20" />
                <span className="text-sm font-semibold text-slate-500">
                  No academic events scheduled.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-8 relative">
                {/* Vertical timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 hidden sm:block"></div>

                {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                  <div key={month} className="relative z-10">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 pl-0 sm:pl-12 flex items-center gap-2">
                      <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm text-indigo-700 whitespace-nowrap">
                        {month}
                      </span>
                    </h3>

                    <div className="flex flex-col gap-4 pl-0 sm:pl-12">
                      {monthEvents.map((event) => {
                        const eventDate = new Date(event.date);
                        return (
                          <div
                            key={event.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between group transition-all hover:shadow-md relative"
                          >
                            {/* Timeline dot */}
                            <div className="absolute -left-9 sm:-left-12 top-1/2 -mt-2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full hidden sm:block"></div>

                            <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center">
                              <div className="flex flex-col items-center justify-center sm:w-16 bg-slate-50 border border-slate-100 rounded-xl p-2 shrink-0">
                                <span className="text-xs font-bold text-slate-500 uppercase">
                                  {eventDate.toLocaleDateString("en-US", {
                                    weekday: "short",
                                  })}
                                </span>
                                <span className="text-xl font-black text-slate-800 leading-none my-0.5">
                                  {eventDate.getDate()}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {eventDate.toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="flex flex-col items-start gap-1">
                                <div className="flex gap-2 items-center flex-wrap">
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getTypeColor(event.type)}`}
                                  >
                                    {event.type}
                                  </span>
                                  {(event.department || event.year) && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                      {event.department} • {event.year}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-base font-bold text-slate-800">
                                  {event.title}
                                </h4>
                                {event.description && (
                                  <p className="text-xs text-slate-500 font-medium">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {userRole === "teacher" && (
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg self-end sm:self-auto shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
