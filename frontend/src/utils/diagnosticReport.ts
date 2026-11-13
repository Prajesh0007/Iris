/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { Submission } from "../types";

// ─── Color Constants ───
const MAROON = [139, 0, 0] as const;      // Dark maroon for headers
const DARK_RED = [153, 0, 0] as const;     // Header backgrounds
const WHITE = [255, 255, 255] as const;
const LIGHT_GRAY = [245, 245, 245] as const;
const MEDIUM_GRAY = [200, 200, 200] as const;
const DARK_GRAY = [80, 80, 80] as const;
const BLACK = [30, 30, 30] as const;
const GREEN_PASS = [34, 139, 34] as const;
const RED_FAIL = [220, 20, 20] as const;
const BLUE_LINK = [0, 90, 180] as const;
const AMBER_WARN = [200, 130, 0] as const;
const INDIGO = [79, 70, 229] as const;
const TEAL = [0, 128, 128] as const;

// ─── Stats Interface ───
interface ClassStats {
  totalStudents: number;
  classAverage: number;
  classMedian: number;
  highestScore: number;
  lowestScore: number;
  stdDeviation: number;
  maxPossible: number;
  scoreDistribution: { range: string; count: number }[];
  perQuestionAverages: { [questionId: string]: { avgEarned: number; maxPoints: number; totalAttempts: number } };
}

// ─── Helper: safe page check ───
function ensureSpace(doc: jsPDF, y: number, needed: number, margin: number = 15): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - margin) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ─── Helper: draw a filled rounded rectangle ───
function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fillColor: readonly [number, number, number]) {
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  doc.roundedRect(x, y, w, h, r, r, "F");
}

// ─── Helper: draw horizontal line ───
function drawLine(doc: jsPDF, x1: number, y1: number, x2: number, color: readonly [number, number, number] = MEDIUM_GRAY, width: number = 0.3) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y1);
}

// ─── Helper: draw a table row ───
function drawTableRow(
  doc: jsPDF,
  y: number,
  cells: { text: string; x: number; width: number; align?: "left" | "center" | "right" }[],
  isHeader: boolean,
  rowHeight: number = 8
) {
  const pageW = doc.internal.pageSize.getWidth();
  if (isHeader) {
    doc.setFillColor(DARK_RED[0], DARK_RED[1], DARK_RED[2]);
    doc.rect(15, y, pageW - 30, rowHeight, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...BLACK);
  }

  cells.forEach((cell) => {
    const textX =
      cell.align === "center"
        ? cell.x + cell.width / 2
        : cell.align === "right"
          ? cell.x + cell.width - 2
          : cell.x + 2;
    doc.text(cell.text, textX, y + rowHeight / 2 + 1.5, {
      align: cell.align || "left",
    });
  });
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ══════════════════════════════════════════════════════════════
export async function exportDiagnosticReportPDF(
  submission: Submission,
  allSubmissionsForExam?: Submission[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();  // 210
  const pageH = doc.internal.pageSize.getHeight(); // 297
  const margin = 15;
  const contentW = pageW - margin * 2;

  // ─── Fetch class stats from API ───
  let stats: ClassStats = {
    totalStudents: 1,
    classAverage: submission.score,
    classMedian: submission.score,
    highestScore: submission.score,
    lowestScore: submission.score,
    stdDeviation: 0,
    maxPossible: submission.maxScore,
    scoreDistribution: [],
    perQuestionAverages: {},
  };

  try {
    const res = await fetch(`/api/submissions/stats/${submission.examId}`);
    if (res.ok) {
      stats = await res.json();
    }
  } catch (e) {
    console.warn("Failed to fetch class stats, using defaults");
  }

  // If we have all submissions passed in, compute rank & percentile from them
  let classRank = 1;
  let percentile = 100;
  const allScores = allSubmissionsForExam
    ? allSubmissionsForExam.filter((s) => s.examId === submission.examId).map((s) => s.score)
    : [];

  if (allScores.length > 0) {
    const sorted = [...allScores].sort((a, b) => b - a);
    classRank = sorted.indexOf(submission.score) + 1;
    // If not found (shouldn't happen), default to last
    if (classRank === 0) classRank = sorted.length;
    percentile = Math.round(((sorted.length - classRank) / sorted.length) * 100);
  } else if (stats.totalStudents > 1) {
    // Estimate from stats
    const betterCount = Math.round(
      (1 - (submission.score - stats.lowestScore) / Math.max(stats.highestScore - stats.lowestScore, 1)) * stats.totalStudents
    );
    classRank = Math.max(1, Math.min(betterCount, stats.totalStudents));
    percentile = Math.round(((stats.totalStudents - classRank) / stats.totalStudents) * 100);
  }

  const scorePct = submission.maxScore > 0 ? Math.round((submission.score / submission.maxScore) * 100) : 0;
  const formatDate = (d?: string) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A";

  // ══════════════════════════════════════════════════════════
  // PAGE 1: Cover / Message Page
  // ══════════════════════════════════════════════════════════

  // Header bar
  drawRoundedRect(doc, 0, 0, pageW, 28, 0, DARK_RED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text("Iris Integrity Monitor", margin, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Diagnostic Performance Report", margin, 22);

  // Decorative line
  drawLine(doc, 0, 28.5, pageW, MAROON, 1.5);

  let y = 45;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...MAROON);
  doc.text("A Message from the Iris Team", pageW / 2, y, { align: "center" });

  drawLine(doc, margin + 20, y + 4, pageW - margin - 20, MAROON, 0.8);

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK_GRAY);

  const msgLines = [
    `Dear ${submission.candidateName},`,
    "",
    "Thank you for participating in this assessment.",
    "",
    "This assessment has been designed as a diagnostic and developmental tool to help you",
    "understand your current level of technical knowledge, analytical ability, and problem-solving",
    "readiness. Its purpose is to provide meaningful insights into your strengths and identify",
    "areas where focused improvement can help you progress.",
    "",
    "Please view your results with a positive and growth-oriented mindset. This report represents",
    "your current level of preparedness based on the competencies assessed and is not a measure",
    "of your overall academic ability, intelligence, or future potential.",
    "",
    "Use this report to:",
    "   •  Build on your strengths.",
    "   •  Identify areas that need improvement.",
    "   •  Plan your preparation for future assessments.",
    "   •  Track your progress over time.",
    "",
    "This report is intended solely for diagnostic and developmental purposes.",
    "It is not an academic evaluation, grading mechanism, or selection criterion.",
    "",
    "We encourage you to review your results carefully, revisit the questions you answered",
    "incorrectly, and use this report as a roadmap for continuous improvement.",
    "",
    "We wish you every success in your learning journey.",
  ];

  msgLines.forEach((line) => {
    if (line.startsWith("Dear ") || line.startsWith("This report is intended") || line.startsWith("We wish")) {
      doc.setFont("helvetica", "bold");
    } else if (line.startsWith("   •")) {
      doc.setFont("helvetica", "normal");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.text(line, margin + 5, y);
    y += 5.5;
  });

  y += 3;
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(10);
  doc.setTextColor(...INDIGO);
  doc.text("Iris Team", margin + 5, y);
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...DARK_GRAY);
  doc.text("Iris Integrity Monitor Platform", margin + 5, y);

  // ══════════════════════════════════════════════════════════
  // PAGE 2: Performance Summary
  // ══════════════════════════════════════════════════════════
  doc.addPage();

  // Header bar
  drawRoundedRect(doc, 0, 0, pageW, 20, 0, DARK_RED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text("EXAM PERFORMANCE REPORT", pageW / 2, 13, { align: "center" });

  y = 28;

  // ─── Student & Exam Info Cards ───
  const infoCardH = 28;
  // Student info (left)
  drawRoundedRect(doc, margin, y, contentW / 2 - 2, infoCardH, 1, DARK_RED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("STUDENT INFORMATION", margin + 3, y + 5);

  drawRoundedRect(doc, margin, y + 7, contentW / 2 - 2, infoCardH - 7, 0, WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);

  const studentInfoY = y + 12;
  doc.setFont("helvetica", "bold"); doc.text("Full Name", margin + 3, studentInfoY);
  doc.setFont("helvetica", "normal"); doc.text(submission.candidateName, margin + 30, studentInfoY);
  doc.setFont("helvetica", "bold"); doc.text("Email", margin + 3, studentInfoY + 5);
  doc.setFont("helvetica", "normal");
  const emailText = submission.candidateEmail.length > 26 ? submission.candidateEmail.substring(0, 24) + "..." : submission.candidateEmail;
  doc.text(emailText, margin + 30, studentInfoY + 5);
  doc.setFont("helvetica", "bold"); doc.text("Status", margin + 3, studentInfoY + 10);
  doc.setTextColor(submission.status === "passed" ? GREEN_PASS[0] : RED_FAIL[0], submission.status === "passed" ? GREEN_PASS[1] : RED_FAIL[1], submission.status === "passed" ? GREEN_PASS[2] : RED_FAIL[2]);
  doc.setFont("helvetica", "bold"); doc.text(submission.status.toUpperCase(), margin + 30, studentInfoY + 10);

  // Exam info (right)
  const rightX = margin + contentW / 2 + 2;
  drawRoundedRect(doc, rightX, y, contentW / 2 - 2, infoCardH, 1, [0, 128, 0]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text("EXAM INFORMATION", rightX + 3, y + 5);

  drawRoundedRect(doc, rightX, y + 7, contentW / 2 - 2, infoCardH - 7, 0, WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);

  const examInfoY = y + 12;
  doc.setFont("helvetica", "bold"); doc.text("Exam Title", rightX + 3, examInfoY);
  doc.setFont("helvetica", "normal");
  const titleText = submission.examTitle.length > 22 ? submission.examTitle.substring(0, 20) + "..." : submission.examTitle;
  doc.text(titleText, rightX + 28, examInfoY);
  doc.setFont("helvetica", "bold"); doc.text("Date", rightX + 3, examInfoY + 5);
  doc.setFont("helvetica", "normal"); doc.text(formatDate(submission.submittedAt), rightX + 28, examInfoY + 5);
  doc.setFont("helvetica", "bold"); doc.text("Submitted", rightX + 3, examInfoY + 10);
  doc.setFont("helvetica", "normal"); doc.text(formatDate(submission.submittedAt), rightX + 28, examInfoY + 10);

  y += infoCardH + 6;

  // ─── Performance Summary Boxes ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...MAROON);
  doc.text("Performance Summary", margin, y);
  drawLine(doc, margin, y + 2, pageW - margin, MAROON, 0.5);
  y += 8;

  const boxW = contentW / 4 - 3;
  const boxH = 22;
  const boxes = [
    { label: "Score", value: `${submission.score}/${submission.maxScore}`, color: DARK_RED },
    { label: "Percentage", value: `${scorePct}%`, color: [0, 100, 0] as const },
    { label: "Class Rank", value: `#${classRank}`, color: BLUE_LINK },
    { label: "Percentile", value: `${percentile}th`, color: INDIGO },
  ];

  boxes.forEach((box, i) => {
    const bx = margin + i * (boxW + 4);
    // Border
    doc.setDrawColor(box.color[0], box.color[1], box.color[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(bx, y, boxW, boxH, 1.5, 1.5, "S");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(box.color[0], box.color[1], box.color[2]);
    doc.text(box.label, bx + boxW / 2, y + 6, { align: "center" });

    // Value
    doc.setFontSize(16);
    doc.text(box.value, bx + boxW / 2, y + 17, { align: "center" });
  });

  y += boxH + 4;

  // Sub-stats line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK_GRAY);
  doc.text(
    `Class Average: ${stats.classAverage}/${stats.maxPossible} (${stats.maxPossible > 0 ? Math.round((stats.classAverage / stats.maxPossible) * 100) : 0}%)  |  Total Students: ${stats.totalStudents}`,
    margin,
    y
  );
  y += 8;

  // ─── Score Comparison Bar Chart (drawn manually) ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...MAROON);
  doc.text("Analytics Overview", margin, y);
  drawLine(doc, margin, y + 2, pageW - margin, MAROON, 0.5);
  y += 8;

  // Simple bar chart: Your Score, Class Avg, Class Max
  const chartH = 45;
  const chartW = contentW / 2 - 8;
  const chartX = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("Score Comparison", chartX + chartW / 2, y, { align: "center" });
  y += 4;

  const barData = [
    { label: "Your Score", value: submission.score, color: INDIGO },
    { label: "Class Avg", value: stats.classAverage, color: AMBER_WARN },
    { label: "Class Max", value: stats.highestScore, color: GREEN_PASS },
    { label: "Class Min", value: stats.lowestScore, color: RED_FAIL },
  ];
  const maxVal = Math.max(stats.maxPossible, submission.score, stats.highestScore, 1);
  const barW = (chartW - 20) / barData.length - 4;

  barData.forEach((bar, i) => {
    const bx = chartX + 10 + i * (barW + 4);
    const barH = Math.max((bar.value / maxVal) * (chartH - 15), 2);
    const by = y + chartH - 10 - barH;

    doc.setFillColor(bar.color[0], bar.color[1], bar.color[2]);
    doc.roundedRect(bx, by, barW, barH, 1, 1, "F");

    // Value on top
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(bar.color[0], bar.color[1], bar.color[2]);
    doc.text(String(bar.value), bx + barW / 2, by - 2, { align: "center" });

    // Label below
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...DARK_GRAY);
    doc.text(bar.label, bx + barW / 2, y + chartH - 4, { align: "center" });
  });

  // X-axis line
  drawLine(doc, chartX + 5, y + chartH - 10, chartX + chartW - 5, MEDIUM_GRAY, 0.3);

  // ─── Score Distribution (right side) ───
  const distX = pageW / 2 + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("Score Distribution", distX + chartW / 2 - 5, y - 4, { align: "center" });

  if (stats.scoreDistribution.length > 0) {
    const distMaxCount = Math.max(...stats.scoreDistribution.map((b) => b.count), 1);
    const distBarW = Math.max((chartW - 20) / stats.scoreDistribution.length - 2, 3);

    stats.scoreDistribution.forEach((bin, i) => {
      const bx = distX + 5 + i * (distBarW + 2);
      const barH = Math.max((bin.count / distMaxCount) * (chartH - 18), 1);
      const by = y + chartH - 10 - barH;

      // Color: highlight the bin containing this student's score
      const [low, high] = bin.range.split("-").map(Number);
      const isMyBin = submission.score >= low && submission.score <= high;

      doc.setFillColor(
        isMyBin ? INDIGO[0] : 180,
        isMyBin ? INDIGO[1] : 200,
        isMyBin ? INDIGO[2] : 220
      );
      doc.roundedRect(bx, by, distBarW, barH, 0.5, 0.5, "F");

      // Count
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(...DARK_GRAY);
      doc.text(String(bin.count), bx + distBarW / 2, by - 1, { align: "center" });

      // Range label
      doc.setFontSize(4.5);
      doc.text(bin.range, bx + distBarW / 2, y + chartH - 5, { align: "center" });
    });

    drawLine(doc, distX, y + chartH - 10, distX + chartW - 5, MEDIUM_GRAY, 0.3);

    // Legend
    doc.setFontSize(6);
    doc.setTextColor(...INDIGO);
    doc.text("■ Your score bin", distX + chartW - 30, y + chartH + 1);
  }

  y += chartH + 8;

  // ─── Class Statistics Table ───
  y = ensureSpace(doc, y, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...MAROON);
  doc.text("Class Statistics", margin, y);
  drawLine(doc, margin, y + 2, pageW - margin, MAROON, 0.5);
  y += 6;

  const statsData = [
    ["Class Average", `${stats.classAverage} / ${stats.maxPossible}`, "Class Median", `${stats.classMedian} / ${stats.maxPossible}`],
    ["Highest Score", `${stats.highestScore} / ${stats.maxPossible}`, "Lowest Score", `${stats.lowestScore} / ${stats.maxPossible}`],
    ["Std Deviation", `${stats.stdDeviation}`, "Total Students", `${stats.totalStudents}`],
    ["Your Score", `${submission.score} / ${submission.maxScore}`, "Your Percentile", `${percentile}th percentile`],
  ];

  // Table header
  const colW = contentW / 4;
  drawRoundedRect(doc, margin, y, contentW / 2, 7, 0, DARK_RED);
  drawRoundedRect(doc, margin + contentW / 2, y, contentW / 2, 7, 0, DARK_RED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text("Metric", margin + 3, y + 5);
  doc.text("", margin + colW + 3, y + 5);
  doc.text("Metric", margin + contentW / 2 + 3, y + 5);
  y += 8;

  statsData.forEach((row, idx) => {
    const rowY = y + idx * 7;
    const bgColor = idx % 2 === 0 ? LIGHT_GRAY : WHITE;
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.rect(margin, rowY, contentW, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...BLACK);
    doc.text(row[0], margin + 3, rowY + 5);

    // Highlight "Your" rows
    if (row[0].startsWith("Your")) {
      doc.setTextColor(...INDIGO);
    } else {
      doc.setTextColor(...DARK_GRAY);
    }
    doc.setFont("helvetica", "bold");
    doc.text(row[1], margin + colW + 3, rowY + 5);

    doc.setTextColor(...BLACK);
    doc.setFont("helvetica", "bold");
    doc.text(row[2], margin + contentW / 2 + 3, rowY + 5);

    if (row[2].startsWith("Your")) {
      doc.setTextColor(...INDIGO);
    } else {
      doc.setTextColor(...DARK_GRAY);
    }
    doc.setFont("helvetica", "bold");
    doc.text(row[3], margin + contentW / 2 + colW + 3, rowY + 5);
  });

  y += statsData.length * 7 + 8;

  // ══════════════════════════════════════════════════════════
  // PAGES 3+: Question-by-Question Breakdown
  // ══════════════════════════════════════════════════════════
  doc.addPage();
  y = 8;

  // Header
  drawRoundedRect(doc, 0, 0, pageW, 20, 0, INDIGO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text("Question-by-Question Breakdown", pageW / 2, 13, { align: "center" });
  y = 28;

  // Categorize answers
  const mcqAnswers = submission.answers.filter((a) => a.questionSnapshot?.type === "mcq");
  const codingAnswers = submission.answers.filter((a) => a.questionSnapshot?.type === "coding");
  const writtenAnswers = submission.answers.filter((a) => a.questionSnapshot?.type === "written");
  // Also include answers without snapshots for backward compatibility
  const unknownAnswers = submission.answers.filter((a) => !a.questionSnapshot);

  let qNumber = 0;

  // ─── MCQ Section ───
  if (mcqAnswers.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...MAROON);
    doc.text("MCQ Questions", margin, y);
    drawLine(doc, margin, y + 2, pageW - margin, MAROON, 0.5);
    y += 8;

    mcqAnswers.forEach((ans) => {
      qNumber++;
      const snap = ans.questionSnapshot!;
      const isCorrect = ans.mcqAnswer === snap.correctOptionIndex;
      const classAvg = stats.perQuestionAverages[ans.questionId];

      // Need ~45mm per MCQ question
      y = ensureSpace(doc, y, 50);

      // Question header bar
      drawRoundedRect(doc, margin, y, contentW, 8, 1, isCorrect ? GREEN_PASS : RED_FAIL);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...WHITE);
      doc.text(`Q${qNumber}: ${snap.title}`, margin + 3, y + 5.5);

      // Score badge
      const scoreText = `${isCorrect ? "CORRECT" : "INCORRECT"} ${ans.earnedPoints || 0}/${snap.points} pts`;
      doc.text(scoreText, pageW - margin - 3, y + 5.5, { align: "right" });

      y += 11;

      // Points and class avg
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...DARK_GRAY);
      doc.text(`Max Marks: ${snap.points}`, margin + 3, y);
      if (classAvg) {
        doc.text(`Class Avg: ${classAvg.avgEarned} pts`, margin + 40, y);
      }
      y += 5;

      // Question text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BLACK);
      const qLines = doc.splitTextToSize(snap.questionText, contentW - 10);
      qLines.forEach((line: string) => {
        y = ensureSpace(doc, y, 6);
        doc.text(line, margin + 3, y);
        y += 4;
      });
      y += 2;

      // Options
      if (snap.options) {
        snap.options.forEach((opt, optIdx) => {
          y = ensureSpace(doc, y, 7);
          const isSelected = ans.mcqAnswer === optIdx;
          const isCorrectOpt = snap.correctOptionIndex === optIdx;

          // Background
          if (isCorrectOpt) {
            drawRoundedRect(doc, margin + 3, y - 2.5, contentW - 6, 6, 1, [230, 255, 230]);
          } else if (isSelected && !isCorrectOpt) {
            drawRoundedRect(doc, margin + 3, y - 2.5, contentW - 6, 6, 1, [255, 230, 230]);
          }

          // Icon
          doc.setFontSize(8);
          if (isCorrectOpt) {
            doc.setTextColor(...GREEN_PASS);
            doc.text("✓", margin + 5, y);
          } else if (isSelected) {
            doc.setTextColor(...RED_FAIL);
            doc.text("✗", margin + 5, y);
          } else {
            doc.setTextColor(...DARK_GRAY);
            doc.text("○", margin + 5, y);
          }

          // Option text
          doc.setFont("helvetica", isSelected || isCorrectOpt ? "bold" : "normal");
          doc.setTextColor(isSelected && !isCorrectOpt ? RED_FAIL[0] : isCorrectOpt ? GREEN_PASS[0] : BLACK[0], isSelected && !isCorrectOpt ? RED_FAIL[1] : isCorrectOpt ? GREEN_PASS[1] : BLACK[1], isSelected && !isCorrectOpt ? RED_FAIL[2] : isCorrectOpt ? GREEN_PASS[2] : BLACK[2]);
          const optText = `${String.fromCharCode(65 + optIdx)}) ${opt}`;
          doc.text(optText, margin + 11, y);
          y += 5.5;
        });
      }
      y += 2;

      // Diagnosis
      y = ensureSpace(doc, y, 10);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      if (isCorrect) {
        doc.setTextColor(...GREEN_PASS);
        doc.text("✓ Correct — Demonstrates solid understanding of this concept.", margin + 3, y);
      } else {
        doc.setTextColor(...RED_FAIL);
        const correctLabel = snap.options && snap.correctOptionIndex !== undefined
          ? `${String.fromCharCode(65 + snap.correctOptionIndex)}) ${snap.options[snap.correctOptionIndex]}`
          : "N/A";
        doc.text(`✗ Incorrect — The correct answer was: ${correctLabel}. Review this topic.`, margin + 3, y);
      }
      y += 8;

      drawLine(doc, margin, y, pageW - margin, MEDIUM_GRAY, 0.2);
      y += 4;
    });
  }

  // ─── Coding Section ───
  if (codingAnswers.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...MAROON);
    doc.text("Coding Questions", margin, y);
    drawLine(doc, margin, y + 2, pageW - margin, MAROON, 0.5);
    y += 8;

    codingAnswers.forEach((ans) => {
      qNumber++;
      const snap = ans.questionSnapshot!;
      const passedCount = ans.testCasesResults?.filter((t) => t.passed).length || 0;
      const totalCases = ans.testCasesResults?.length || 0;
      const allPassed = totalCases > 0 && passedCount === totalCases;
      const classAvg = stats.perQuestionAverages[ans.questionId];

      y = ensureSpace(doc, y, 30);

      // Question header bar
      drawRoundedRect(doc, margin, y, contentW, 8, 1, allPassed ? GREEN_PASS : passedCount > 0 ? AMBER_WARN : RED_FAIL);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...WHITE);
      doc.text(`Q${qNumber}: ${snap.title}`, margin + 3, y + 5.5);
      doc.text(
        `${allPassed ? "PASS" : "PARTIAL"} ${ans.earnedPoints || 0}/${snap.points} pts  |  ${passedCount}/${totalCases} cases`,
        pageW - margin - 3, y + 5.5, { align: "right" }
      );
      y += 11;

      // Meta info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...DARK_GRAY);
      doc.text(`Language: ${snap.language || "N/A"}`, margin + 3, y);
      doc.text(`Max Marks: ${snap.points}`, margin + 50, y);
      if (classAvg) {
        doc.text(`Class Avg: ${classAvg.avgEarned} pts`, margin + 90, y);
      }
      y += 5;

      // Problem statement (truncated for PDF)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...BLACK);
      const problemLines = doc.splitTextToSize(snap.questionText, contentW - 10).slice(0, 6);
      problemLines.forEach((line: string) => {
        y = ensureSpace(doc, y, 5);
        doc.text(line, margin + 3, y);
        y += 3.8;
      });
      if (doc.splitTextToSize(snap.questionText, contentW - 10).length > 6) {
        doc.setTextColor(...BLUE_LINK);
        doc.text("... (see full problem statement in exam)", margin + 3, y);
        y += 4;
      }
      y += 3;

      // Test Case Results Table
      if (ans.testCasesResults && ans.testCasesResults.length > 0) {
        y = ensureSpace(doc, y, 15 + ans.testCasesResults.length * 7);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...BLACK);
        doc.text("Test Case Results", margin + 3, y);
        y += 4;

        // Table header
        const tcCols = [
          { text: "#", x: margin, width: 8, align: "center" as const },
          { text: "Type", x: margin + 8, width: 18, align: "center" as const },
          { text: "Expected", x: margin + 26, width: 45, align: "left" as const },
          { text: "Got", x: margin + 71, width: 45, align: "left" as const },
          { text: "Status", x: margin + 116, width: 20, align: "center" as const },
        ];
        drawTableRow(doc, y, tcCols, true, 7);
        y += 7;

        ans.testCasesResults.forEach((tc, tcIdx) => {
          y = ensureSpace(doc, y, 8);

          // Alternating row bg
          if (tcIdx % 2 === 0) {
            doc.setFillColor(...LIGHT_GRAY);
            doc.rect(margin, y, contentW, 7, "F");
          }

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...BLACK);
          doc.text(String(tcIdx + 1), margin + 4, y + 5, { align: "center" });

          // Check if hidden
          const isHidden = snap.testCases?.[tcIdx]?.isHidden;
          doc.text(isHidden ? "Hidden" : "Visible", margin + 17, y + 5, { align: "center" });

          doc.setFont("helvetica", "normal");
          const expectedTrunc = tc.expected.length > 28 ? tc.expected.substring(0, 26) + "..." : tc.expected;
          const actualTrunc = tc.actual.length > 28 ? tc.actual.substring(0, 26) + "..." : tc.actual;
          doc.text(expectedTrunc, margin + 28, y + 5);
          doc.text(actualTrunc, margin + 73, y + 5);

          // Status
          doc.setFont("helvetica", "bold");
          if (tc.passed) {
            doc.setTextColor(...GREEN_PASS);
            doc.text("✓ Pass", margin + 126, y + 5, { align: "center" });
          } else {
            doc.setTextColor(...RED_FAIL);
            doc.text("✗ Fail", margin + 126, y + 5, { align: "center" });
          }

          y += 7;
        });
        y += 3;
      }

      // Source Code
      if (ans.codingCode) {
        y = ensureSpace(doc, y, 25);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...BLACK);
        doc.text("Submitted Source Code", margin + 3, y);
        y += 4;

        // Code box
        const codeLines = ans.codingCode.split("\n").slice(0, 15);
        const codeBoxH = Math.min(codeLines.length * 3.8 + 6, 65);
        y = ensureSpace(doc, y, codeBoxH + 4);

        drawRoundedRect(doc, margin + 2, y, contentW - 4, codeBoxH, 1.5, [40, 40, 50]);

        doc.setFont("courier", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(220, 220, 220);

        let codeY = y + 5;
        codeLines.forEach((line) => {
          const safeLine = line.replace(/[^\x20-\x7E]/g, "").substring(0, 80);
          doc.text(safeLine, margin + 6, codeY);
          codeY += 3.8;
        });

        if (ans.codingCode.split("\n").length > 15) {
          doc.setTextColor(150, 150, 180);
          doc.setFont("courier", "italic");
          doc.text(`... (${ans.codingCode.split("\n").length - 15} more lines)`, margin + 6, codeY);
        }

        y += codeBoxH + 4;
      }

      // Diagnosis for coding
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      if (allPassed) {
        doc.setTextColor(...GREEN_PASS);
        doc.text("✓ All test cases passed — Excellent problem-solving and implementation.", margin + 3, y);
      } else if (passedCount > 0) {
        doc.setTextColor(...AMBER_WARN);
        doc.text(`△ Partial pass (${passedCount}/${totalCases}) — Review edge cases and boundary conditions.`, margin + 3, y);
      } else {
        doc.setTextColor(...RED_FAIL);
        doc.text("✗ No test cases passed — Revisit the problem logic and solution approach.", margin + 3, y);
      }
      y += 8;

      drawLine(doc, margin, y, pageW - margin, MEDIUM_GRAY, 0.2);
      y += 5;
    });
  }

  // ─── Written Section ───
  if (writtenAnswers.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...MAROON);
    doc.text("Written Questions", margin, y);
    drawLine(doc, margin, y + 2, pageW - margin, MAROON, 0.5);
    y += 8;

    writtenAnswers.forEach((ans) => {
      qNumber++;
      const snap = ans.questionSnapshot!;
      const passed = (ans.earnedPoints || 0) > 0;

      y = ensureSpace(doc, y, 25);

      drawRoundedRect(doc, margin, y, contentW, 8, 1, passed ? GREEN_PASS : RED_FAIL);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...WHITE);
      doc.text(`Q${qNumber}: ${snap.title}`, margin + 3, y + 5.5);
      doc.text(`${ans.earnedPoints || 0}/${snap.points} pts`, pageW - margin - 3, y + 5.5, { align: "right" });
      y += 11;

      // Answer text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BLACK);
      const ansText = ans.writtenAnswer || "(No answer provided)";
      const ansLines = doc.splitTextToSize(ansText, contentW - 10).slice(0, 8);
      ansLines.forEach((line: string) => {
        y = ensureSpace(doc, y, 5);
        doc.text(line, margin + 3, y);
        y += 4;
      });
      y += 6;
    });
  }

  // ─── Backward-compatible: questions without snapshots ───
  if (unknownAnswers.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK_GRAY);
    doc.text("Additional Questions (Legacy Data)", margin, y);
    y += 6;

    unknownAnswers.forEach((ans, idx) => {
      y = ensureSpace(doc, y, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...BLACK);
      const label = ans.mcqAnswer !== undefined
        ? `MCQ Answer: Option #${ans.mcqAnswer}`
        : ans.codingCode
          ? `Coding: ${ans.codingCode.substring(0, 60)}...`
          : ans.writtenAnswer
            ? `Written: ${ans.writtenAnswer.substring(0, 60)}...`
            : "No answer";
      doc.text(`Q: ${ans.questionId} — ${label}`, margin + 3, y);
      y += 6;
    });
  }

  // ══════════════════════════════════════════════════════════
  // FINAL PAGE: Strengths & Areas for Improvement
  // ══════════════════════════════════════════════════════════
  doc.addPage();

  drawRoundedRect(doc, 0, 0, pageW, 20, 0, TEAL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text("Strengths & Areas for Improvement", pageW / 2, 13, { align: "center" });
  y = 30;

  // Compute strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Analyze MCQ performance
  const mcqCorrect = mcqAnswers.filter((a) => a.earnedPoints && a.earnedPoints > 0).length;
  const mcqTotal = mcqAnswers.length;
  if (mcqTotal > 0) {
    const mcqPct = Math.round((mcqCorrect / mcqTotal) * 100);
    if (mcqPct >= 80) {
      strengths.push(`Strong MCQ performance (${mcqCorrect}/${mcqTotal} correct, ${mcqPct}%). Solid theoretical knowledge.`);
    } else if (mcqPct >= 50) {
      weaknesses.push(`MCQ accuracy could improve (${mcqCorrect}/${mcqTotal} correct, ${mcqPct}%). Some conceptual gaps detected.`);
      recommendations.push("Review theoretical concepts, especially in topics where you selected incorrect options.");
    } else {
      weaknesses.push(`Low MCQ accuracy (${mcqCorrect}/${mcqTotal} correct, ${mcqPct}%). Significant conceptual review needed.`);
      recommendations.push("Focus on building foundational theoretical knowledge before attempting advanced problems.");
    }

    // Identify specific weak MCQ topics
    mcqAnswers.forEach((ans) => {
      if (ans.earnedPoints === 0 && ans.questionSnapshot) {
        weaknesses.push(`Missed: "${ans.questionSnapshot.title}" — Review this topic.`);
      }
    });
  }

  // Analyze Coding performance
  if (codingAnswers.length > 0) {
    const allCodingPassed = codingAnswers.every((a) => {
      const total = a.testCasesResults?.length || 0;
      const passed = a.testCasesResults?.filter((t) => t.passed).length || 0;
      return total > 0 && passed === total;
    });

    if (allCodingPassed) {
      strengths.push("Excellent coding skills — All test cases passed across all problems.");
      strengths.push("Strong algorithmic thinking and edge case handling.");
    } else {
      codingAnswers.forEach((ans) => {
        const total = ans.testCasesResults?.length || 0;
        const passed = ans.testCasesResults?.filter((t) => t.passed).length || 0;
        if (total > 0 && passed === total) {
          strengths.push(`"${ans.questionSnapshot?.title}" — All ${total} test cases passed. Well implemented.`);
        } else if (passed > 0) {
          weaknesses.push(`"${ans.questionSnapshot?.title}" — ${passed}/${total} test cases passed. Edge cases need attention.`);
          recommendations.push(`Practice similar problems to "${ans.questionSnapshot?.title}" focusing on boundary conditions.`);
        } else {
          weaknesses.push(`"${ans.questionSnapshot?.title}" — 0/${total} test cases passed. Solution logic needs rework.`);
          recommendations.push(`Revisit the fundamentals for "${ans.questionSnapshot?.title}" problem type.`);
        }
      });
    }
  }

  // Overall assessment
  if (scorePct >= 80) {
    strengths.push(`Outstanding overall performance (${scorePct}%). Above class average.`);
  } else if (scorePct >= 60) {
    strengths.push(`Good overall performance (${scorePct}%). Room for improvement in specific areas.`);
  }

  if (scorePct < 50) {
    recommendations.push("Dedicate more study time to both theoretical and practical aspects.");
    recommendations.push("Consider forming study groups or seeking mentorship for challenging topics.");
  }

  if (strengths.length === 0) {
    strengths.push("Completed the exam and submitted answers — effort recognized.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Continue practicing to maintain and improve your current performance level.");
  }

  // ─── Strengths Section ───
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(34, 139, 34);
  doc.text("★ Strengths (Pros)", margin, y);
  drawLine(doc, margin, y + 2, pageW - margin, GREEN_PASS, 0.5);
  y += 7;

  strengths.forEach((s) => {
    y = ensureSpace(doc, y, 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BLACK);
    const lines = doc.splitTextToSize(`  •  ${s}`, contentW - 10);
    lines.forEach((line: string) => {
      doc.text(line, margin + 3, y);
      y += 4.5;
    });
    y += 1;
  });

  y += 6;

  // ─── Weaknesses Section ───
  y = ensureSpace(doc, y, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...RED_FAIL);
  doc.text("△ Areas for Improvement (Cons)", margin, y);
  drawLine(doc, margin, y + 2, pageW - margin, RED_FAIL, 0.5);
  y += 7;

  if (weaknesses.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...GREEN_PASS);
    doc.text("  No significant weaknesses detected. Excellent work!", margin + 3, y);
    y += 6;
  } else {
    weaknesses.forEach((w) => {
      y = ensureSpace(doc, y, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...BLACK);
      const lines = doc.splitTextToSize(`  •  ${w}`, contentW - 10);
      lines.forEach((line: string) => {
        doc.text(line, margin + 3, y);
        y += 4.5;
      });
      y += 1;
    });
  }

  y += 6;

  // ─── Recommendations Section ───
  y = ensureSpace(doc, y, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...INDIGO);
  doc.text("Recommendations", margin, y);
  drawLine(doc, margin, y + 2, pageW - margin, INDIGO, 0.5);
  y += 7;

  recommendations.forEach((r) => {
    y = ensureSpace(doc, y, 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BLACK);
    const lines = doc.splitTextToSize(`  ➜  ${r}`, contentW - 10);
    lines.forEach((line: string) => {
      doc.text(line, margin + 3, y);
      y += 4.5;
    });
    y += 1;
  });

  y += 10;

  // ─── Overall Verdict ───
  y = ensureSpace(doc, y, 30);
  drawRoundedRect(doc, margin, y, contentW, 22, 2, scorePct >= 50 ? GREEN_PASS : RED_FAIL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  const verdictText = scorePct >= 80
    ? "EXCELLENT — Outstanding performance across all sections."
    : scorePct >= 60
      ? "GOOD — Solid performance with minor areas for improvement."
      : scorePct >= 50
        ? "SATISFACTORY — Passed with areas requiring focused study."
        : "NEEDS IMPROVEMENT — Significant study required across multiple topics.";
  doc.text("Overall Verdict", margin + 5, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(verdictText, margin + 5, y + 16);

  y += 30;

  // Footer
  y = ensureSpace(doc, y, 15);
  drawLine(doc, margin, y, pageW - margin, MEDIUM_GRAY, 0.3);
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...DARK_GRAY);
  doc.text(
    `Generated by Iris Integrity Monitor  •  ${new Date().toLocaleString()}  •  Report ID: ${submission.id}`,
    pageW / 2,
    y,
    { align: "center" }
  );

  // ─── Save ───
  const cleanName = submission.candidateName.replace(/\s+/g, "_");
  doc.save(`Diagnostic_Report_${cleanName}_${submission.id.slice(-6)}.pdf`);
}
