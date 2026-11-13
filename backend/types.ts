/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TestCase {
  name?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  isCustom?: boolean;
}

export type QuestionType = "mcq" | "coding" | "written";

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  points: number;
  questionText: string;
  // MCQ specific
  options?: string[];
  correctOptionIndex?: number;
  // Coding specific
  language?:
    | "javascript"
    | "typescript"
    | "python"
    | "cpp"
    | "java"
    | "rust"
    | "go"
    | "ruby"
    | "swift"
    | "php";
  codeBoilerplate?: string;
  testCases?: TestCase[];
}

export interface NoteFile {
  id: string;
  title: string;
  description?: string;
  courseFolder?: string;
  department?: string;
  year?: string;
  fileUrl: string; // Fake URL for demonstration, or data URI
  filename: string;
  uploadDate: string;
  uploadedBy: string;
  sizeBytes: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO date string
  department?: string;
  year?: string;
  createdAt: string;
  createdBy: string;
  type: "certification" | "assignment" | "lab";
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentName: string;
  studentEmail: string;
  submittedAt: string; // ISO date string
  fileUrl: string; // Base64 or object URL mock
  filename: string;
  status: "pending" | "accepted" | "rejected" | "late";
  feedback?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  department?: string;
  year?: string;
  durationMinutes: number;
  integrityThreshold: number; // minimum integrity index before locking (0-100)
  requireCamera: boolean;
  lockdownBrowsing: boolean;
  entryPassword?: string;
  adminExitPassword?: string;
  allowedIps?: string[];
  shuffleQuestions?: boolean;
  questions: Question[];
  createdAt: string;
  author: string;
}

export interface Violation {
  timestamp: string;
  type:
    | "tab-switch"
    | "blur"
    | "fullscreen-exit"
    | "keyboard-shortcut"
    | "proctor-warning";
  description: string;
  severity: "low" | "medium" | "high";
}

export interface AIProctorReport {
  timestamp: string;
  status: "clean" | "flagged" | "warning";
  summary: string;
  faceDetected: boolean;
  eyeContactStatus: string;
  phoneDetected: boolean;
  multiplePeople: boolean;
  confidence: number;
}

export interface ExamAnswer {
  questionId: string;
  mcqAnswer?: number;
  codingCode?: string;
  writtenAnswer?: string;
  testCasesResults?: {
    passed: boolean;
    input: string;
    expected: string;
    actual: string;
  }[];
  // Full question snapshot stored at submission time for self-contained reports
  questionSnapshot?: {
    title: string;
    type: QuestionType;
    questionText: string;
    points: number;
    options?: string[];
    correctOptionIndex?: number;
    language?: string;
    testCases?: { input: string; expectedOutput: string; isHidden?: boolean; name?: string }[];
    codeBoilerplate?: string;
  };
  // Grading result for this specific question
  earnedPoints?: number;
}

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  candidateName: string;
  candidateEmail: string;
  answers: ExamAnswer[];
  violations: Violation[];
  aiReports: AIProctorReport[];
  screenCaptures?: string[];
  integrityScore: number; // 0 to 100
  score: number; // graded total points
  maxScore: number;
  status: "passed" | "review" | "failed" | "in-progress";
  startedAt: string;
  submittedAt?: string;
}

export interface AcademicEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  startDate?: string;
  endDate?: string;
  type: "exam" | "holiday" | "deadline" | "other" | "notice";
  department?: string;
  year?: string;
  description?: string;
}

export interface Notice {
  id: string;
  title: string;
  text: string;
  department: string;
  year: string;
  date: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
}

export interface AcademicClass {
  id: string;
  name: string;
  department: string;
  year: string;
  students: Student[];
}

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late";
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string;
  records: AttendanceRecord[];
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
}

export interface ProctorTelemetry {
  timestamp: string;
  integrityValue: number;
  gazeDeviation: number; // percentage deviating
  noiseLevel: number; // audio db index
}
