import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Book,
  FileText,
  Upload,
  Download,
  Trash2,
  Calendar,
  FolderOpen,
  FolderPlus,
  Search,
  Filter,
  LayoutGrid,
  List,
  FileImage,
  FileCode,
  FileVideo,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  HardDrive,
  ArrowDownWideNarrow,
  Loader2,
  ChevronDown,
  X,
  MoreVertical,
  Edit2
} from "lucide-react";
import { NoteFile, CourseFolder } from "../types";

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
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <span className="text-slate-600 truncate mr-2">
          {selected.length === 0 ? placeholder : selected.join(", ")}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </div>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto p-2 flex flex-col gap-1">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs font-bold text-slate-600">
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

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return <FileText className="h-5 w-5" />;
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return <FileImage className="h-5 w-5 text-pink-500" />;
  if (["mp4", "webm", "mov"].includes(ext)) return <FileVideo className="h-5 w-5 text-red-500" />;
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext)) return <FileArchive className="h-5 w-5 text-amber-600" />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  if (["ppt", "pptx"].includes(ext)) return <Presentation className="h-5 w-5 text-orange-500" />;
  if (["js", "ts", "py", "java", "cpp", "html", "css", "json"].includes(ext)) return <FileCode className="h-5 w-5 text-slate-700" />;
  if (ext === "pdf") return <FileText className="h-5 w-5 text-rose-500" />;
  return <FileText className="h-5 w-5 text-indigo-500" />;
};

export default function NotesPortal({
  userRole,
  studentContext
}: {
  userRole?: "teacher" | "student";
  studentContext?: {
    depts: string[];
    years: string[];
    classes: string[];
  };
}) {
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [folders, setFolders] = useState<CourseFolder[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Targeting for folder creation / uploads
  const [targetClasses, setTargetClasses] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<string[]>([]);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<CourseFolder | null>(null);
  
  // UI States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "size">("newest");
  const [isDragging, setIsDragging] = useState(false);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{x: number, y: number} | null>(null);

  const [newFolderInput, setNewFolderInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [notesRes, foldersRes, classesRes] = await Promise.all([
        fetch("/api/notes"),
        fetch("/api/folders"),
        fetch("/api/classes")
      ]);
      const n = await notesRes.json();
      const f = await foldersRes.json();
      const c = await classesRes.json();
      setNotes(n);
      setFolders(f);
      setClasses(c);
      
      if (selectedFolder) {
        const stillExists = f.find((fold: CourseFolder) => fold.id === selectedFolder.id);
        if (!stillExists) setSelectedFolder(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (openFolderMenuId) {
        setOpenFolderMenuId(null);
        setMenuCoords(null);
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openFolderMenuId]);

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = async () => {
          const newNote = {
            title: title || file.name,
            description,
            courseFolderId: selectedFolder ? selectedFolder.id : null,
            targetDepartments: selectedFolder ? selectedFolder.targetDepartments : targetDepartments,
            targetYears: selectedFolder ? selectedFolder.targetYears : targetYears,
            targetClasses: selectedFolder ? selectedFolder.targetClasses : targetClasses,
            filename: file.name,
            sizeBytes: file.size,
            uploadedBy: "Teacher",
            fileUrl: reader.result as string,
          };

          try {
            await fetch("/api/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newNote),
            });
          } catch (err) {
            console.error(err);
          } finally {
            resolve();
          }
        };
        reader.readAsDataURL(file);
      });
    }

    fetchData();
    setTitle("");
    setDescription("");
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const createFolder = async () => {
    if (!newFolderInput.trim()) return;
    try {
      await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderInput.trim(),
          targetDepartments,
          targetYears,
          targetClasses
        })
      });
      setNewFolderInput("");
      fetchData();
    } catch(e) { console.error(e); }
  };

  const handleRenameFolder = async (folder: CourseFolder) => {
    const nn = prompt("Enter new folder name:", folder.name);
    if (!nn || nn === folder.name) return;
    try {
      await fetch(`/api/folders/${folder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nn }),
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder and ALL files inside it?")) return;
    try {
      await fetch(`/api/folders/${folderId}`, {
        method: "DELETE",
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleMoveFile = async (noteId: string, newFolderId: string) => {
    // Left empty for now, move not fully supported in new schema without an endpoint
  };

  const filteredAndSortedNotes = notes
    .filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.filename.toLowerCase().includes(searchQuery.toLowerCase());

      if (userRole === "student" && studentContext) {
        // If note is in a folder, it inherits folder targeting. If not, it uses its own.
        const matchesDept = !n.targetDepartments?.length || n.targetDepartments.some(d => studentContext.depts.includes(d));
        const matchesYear = !n.targetYears?.length || n.targetYears.some(y => studentContext.years.includes(y));
        const matchesClass = !n.targetClasses?.length || n.targetClasses.some(c => studentContext.classes.includes(c));
        return matchesSearch && matchesDept && matchesYear && matchesClass;
      }

      const matchesFolder = selectedFolder
        ? n.courseFolderId === selectedFolder.id
        : true;
      return matchesSearch && matchesFolder;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      if (sortBy === "oldest") return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      if (sortBy === "size") return b.sizeBytes - a.sizeBytes;
      if (sortBy === "name") return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="glass p-6 sm:p-8 rounded-[2rem] border border-white/60 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100/50 rounded-2xl text-indigo-600">
              <Book className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-sans text-slate-800 tracking-tight">
                Syllabus Library
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {userRole === "teacher" ? "Manage Course Materials" : "Access Your Study Resources"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>
                   <LayoutGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"}`}>
                   <List className="w-4 h-4" />
                </button>
             </div>
             <div className="relative">
                <ArrowDownWideNarrow className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as any)}
                  className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-indigo-500 shadow-sm appearance-none"
                >
                   <option value="newest">Newest First</option>
                   <option value="oldest">Oldest First</option>
                   <option value="name">Name (A-Z)</option>
                   <option value="size">Size (Large to Small)</option>
                </select>
             </div>
          </div>
        </div>

        {userRole === "student" && (
          <div className="mb-8 bg-white border border-slate-200 p-4 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <Search className="h-5 w-5 text-indigo-400 mr-3 ml-1" />
            <input
              type="text"
              placeholder="Search course code, folder name, or file title..."
              className="flex-1 bg-transparent border-none text-sm font-semibold outline-none text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {userRole === "teacher" && (
            <div className="flex-[0.8] lg:w-[400px] shrink-0 bg-slate-50/80 border border-slate-200/60 rounded-[2rem] p-6 flex flex-col gap-6 h-fit sticky top-24 shadow-sm">
              
              {/* CREATE FOLDER SECTION */}
              <div className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <FolderPlus className="h-4 w-4 text-emerald-500" /> Create Folder
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <MultiSelect
                    options={["Computer Science", "Mathematics", "Physics", "General Dept"]}
                    selected={targetDepartments}
                    onChange={setTargetDepartments}
                    placeholder="Depts"
                  />
                  <MultiSelect
                    options={["First Year", "Second Year", "Third Year", "Fourth Year"]}
                    selected={targetYears}
                    onChange={setTargetYears}
                    placeholder="Years"
                  />
                </div>
                <MultiSelect
                  options={classes.filter(c => {
                    const deptMatch = targetDepartments.length === 0 || targetDepartments.includes(c.department);
                    const yearMatch = targetYears.length === 0 || targetYears.includes(c.year);
                    return deptMatch && yearMatch;
                  }).map(c => c.name)}
                  selected={targetClasses}
                  onChange={setTargetClasses}
                  placeholder="Classes (Auto-filtered)"
                />

                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="New Folder Name"
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm"
                    value={newFolderInput}
                    onChange={(e) => setNewFolderInput(e.target.value)}
                  />
                  <button
                    onClick={createFolder}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl transition-all shadow-md text-xs font-bold whitespace-nowrap"
                  >
                    Create
                  </button>
                </div>
              </div>

              {/* COURSE FOLDERS SECTION */}
              <div className="pt-5 border-t border-slate-200/60 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-amber-500" /> Folders</span>
                </h3>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search folders..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                    value={folderSearchQuery}
                    onChange={(e) => setFolderSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${!selectedFolder ? "bg-indigo-600 text-white shadow-md" : "hover:bg-white text-slate-600"}`}
                  >
                    <HardDrive className="w-4 h-4" /> All Materials
                  </button>
                  {folders.filter(f => {
                    if (folderSearchQuery && !f.name.toLowerCase().includes(folderSearchQuery.toLowerCase())) return false;
                    return true;
                  }).map((f) => (
                    <div key={f.id} className="flex flex-col gap-1">
                      <div className="relative group">
                        <button
                          onClick={() => setSelectedFolder(f)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all truncate flex items-center gap-2 pr-10 ${selectedFolder?.id === f.id ? "bg-indigo-600 text-white shadow-md" : "hover:bg-white text-slate-600"}`}
                        >
                          <FolderOpen className={`w-4 h-4 shrink-0 ${selectedFolder?.id === f.id ? 'text-indigo-200' : 'text-amber-500'}`} /> 
                          <span className="truncate">{f.name}</span>
                        </button>
                        
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (openFolderMenuId === f.id) {
                                setOpenFolderMenuId(null);
                                setMenuCoords(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setOpenFolderMenuId(f.id);
                                setMenuCoords({ x: rect.right + 12, y: rect.top - 10 });
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${selectedFolder?.id === f.id ? "text-white/80 hover:bg-white/20" : "text-slate-400 hover:bg-slate-100"}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {openFolderMenuId === f.id && menuCoords && createPortal(
                        <div 
                          className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[9999] w-48 animate-[fadeIn_0.15s_ease-out]"
                          style={{ left: menuCoords.x, top: menuCoords.y }}
                        >
                          <button onClick={() => { setOpenFolderMenuId(null); handleRenameFolder(f); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Rename Folder
                          </button>
                          <button onClick={() => { setOpenFolderMenuId(null); alert("Edit Access logic can be linked to the modal"); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors">
                            <Search className="w-3.5 h-3.5" /> Edit Access
                          </button>
                          <button onClick={() => { setOpenFolderMenuId(null); alert("Downloading folder zip..."); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 transition-colors">
                            <Download className="w-3.5 h-3.5" /> Download Folder
                          </button>
                          <div className="h-px bg-slate-100 my-1 w-full" />
                          <button onClick={() => { setOpenFolderMenuId(null); handleDeleteFolder(f.id); }} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Folder
                          </button>
                        </div>,
                        document.body
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* UPLOAD SECTION */}
              <div className="pt-5 border-t border-slate-200/60 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-600" /> Upload to{" "}
                  {selectedFolder ? selectedFolder.name : "General"}
                </h3>
                
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document Title (optional)"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm"
                  />
                  
                  <div 
                    className={`relative w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                      isDragging 
                        ? "bg-indigo-50 border-indigo-400 scale-[1.02] shadow-inner" 
                        : isUploading 
                          ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" 
                          : "bg-white border-slate-300 hover:bg-indigo-50/30 hover:border-indigo-300"
                    }`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <input
                      type="file"
                      multiple
                      ref={fileInputRef}
                      onChange={(e) => e.target.files && handleFiles(e.target.files)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      disabled={isUploading}
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                        <span className="text-xs font-bold text-indigo-700">Uploading Files...</span>
                      </div>
                    ) : (
                      <>
                        <div className={`p-3 rounded-full mb-2 transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Upload className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Click or Drag Files</span>
                        <span className="text-[10px] font-semibold text-slate-400 mt-1">Supports PDF, PPT, DOC, ZIP</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              {userRole === "teacher"
                ? selectedFolder
                  ? `Materials in ${selectedFolder.name}`
                  : "All Course Materials"
                : "Available Resources"}
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                 {filteredAndSortedNotes.length} Items
              </span>
            </h3>

            {filteredAndSortedNotes.length === 0 ? (
              <div className="bg-white/50 border border-slate-200/60 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center text-center text-slate-400 h-64">
                <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <HardDrive className="h-8 w-8 text-slate-300" />
                </div>
                <span className="text-base font-bold text-slate-600">No materials found</span>
                <span className="text-sm mt-1">Try selecting a different folder or uploading new files.</span>
              </div>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                {filteredAndSortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group overflow-hidden ${viewMode === "list" ? "flex flex-row items-center p-3 gap-4" : "p-5 flex flex-col"}`}
                  >
                    <div className={`${viewMode === "list" ? "flex items-center gap-4 flex-1 min-w-0" : "flex flex-col mb-4 relative"}`}>
                      <div className={`shrink-0 ${viewMode === "grid" ? "mb-4 p-3 bg-slate-50 w-fit rounded-xl border border-slate-100" : ""}`}>
                        {getFileIcon(note.filename)}
                      </div>
                      
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 w-full">
                          <h4 className="font-bold text-slate-800 text-sm truncate pr-4 group-hover:text-indigo-600 transition-colors">
                            {note.title}
                          </h4>
                          {viewMode === "list" && note.courseFolderId && folders.find(f => f.id === note.courseFolderId) && (
                            <span className="hidden md:inline-flex shrink-0 px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase rounded-md border border-amber-100">
                              {folders.find(f => f.id === note.courseFolderId)?.name}
                            </span>
                          )}
                        </div>

                        {viewMode === "grid" && note.courseFolderId && folders.find(f => f.id === note.courseFolderId) && (
                          <span className="inline-block w-fit px-2 py-0.5 mt-2 bg-amber-50 text-amber-700 text-[9px] font-extrabold uppercase rounded-md border border-amber-100">
                            {folders.find(f => f.id === note.courseFolderId)?.name}
                          </span>
                        )}

                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 font-semibold truncate w-full">
                          <span className="truncate max-w-[150px]" title={note.filename}>{note.filename}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                          <span className="shrink-0">
                            {(note.sizeBytes / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`${viewMode === "list" ? "flex items-center gap-3 shrink-0 ml-auto pl-4 border-l border-slate-100" : "flex items-center justify-between border-t border-slate-100 pt-4 mt-auto"}`}>
                      <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase bg-slate-50 px-2 py-1 rounded-lg">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.uploadDate).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {userRole === "teacher" && (
                          <>
                            {viewMode === "list" ? (
                               <select
                                 className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-indigo-500 shadow-sm"
                                 value=""
                                 onChange={(e) => {
                                   if (e.target.value) handleMoveFile(note.id, e.target.value);
                                 }}
                               >
                                 <option value="">Move</option>
                                 <option value="General">General</option>
                                 {folders.map(f => (
                                   <option key={f.id} value={f.id}>{f.name}</option>
                                 ))}
                               </select>
                            ) : (
                               <select
                                 className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-indigo-500 shadow-sm"
                                 value=""
                                 onChange={(e) => {
                                   if (e.target.value) handleMoveFile(note.id, e.target.value);
                                 }}
                               >
                                 <option value="">Move to...</option>
                                 <option value="General">General</option>
                                 {folders.map(f => (
                                   <option key={f.id} value={f.id}>{f.name}</option>
                                 ))}
                               </select>
                            )}
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500 rounded-lg transition-colors ml-1"
                              title="Delete File"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <a
                          href={note.fileUrl}
                          download={note.filename}
                          className="p-1.5 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-colors ml-1"
                          title="Download File"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
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
