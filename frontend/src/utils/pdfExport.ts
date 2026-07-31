/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { Submission } from "../types";

/**
 * Generates and downloads a beautifully styled, high-trust
 * landscape Certificate of Verified Examination as a PDF.
 */
export function exportCertificateToPDF(submission: Submission) {
  // Create PDF in landscape format (A4 dimensions: 297mm x 210mm)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth(); // 297mm
  const height = doc.internal.pageSize.getHeight(); // 210mm

  // 1. Draw elegant background colors (soft cream-indigo gradient feeling)
  // Since jsPDF doesn't natively do linear gradients easily on A4 without raw canvas streams,
  // we draw a beautiful border frame with solid colors to match the app UI's clean style.
  doc.setFillColor(253, 254, 255); // White/Ice-blue shade
  doc.rect(0, 0, width, height, "F");

  // 2. Double-line elegant border frame
  // Outer Border (Indigo Accent)
  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.setLineWidth(1.5);
  doc.rect(8, 8, width - 16, height - 16, "S");

  // Inner Thin Frame
  doc.setDrawColor(224, 231, 255); // indigo-100
  doc.setLineWidth(0.5);
  doc.rect(11, 11, width - 22, height - 22, "S");

  // Corner Accent lines (Modern Tech Look)
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(2);
  // Top-Left corner accent
  doc.line(6, 6, 20, 6);
  doc.line(6, 6, 6, 20);
  // Top-Right
  doc.line(width - 6, 6, width - 20, 6);
  doc.line(width - 6, 6, width - 6, 20);
  // Bottom-Left
  doc.line(6, height - 6, 20, height - 6);
  doc.line(6, height - 6, 6, height - 20);
  // Bottom-Right
  doc.line(width - 6, height - 6, width - 20, height - 6);
  doc.line(width - 6, height - 6, width - 6, height - 20);

  // 3. Header Branding Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175); // gray-400
  doc.text("SECURE LOCKDOWN SURVEILLANCE & HONESTY PORTAL", width / 2, 22, {
    align: "center",
  });

  // 4. Verification Checkmark Badge
  const badgeX = width / 2;
  const badgeY = 36;
  const badgeVal = submission.status === "passed";

  doc.setFillColor(
    badgeVal ? 209 : 254,
    badgeVal ? 250 : 243,
    badgeVal ? 229 : 199,
  ); // green-50/amber-50
  doc.circle(badgeX, badgeY, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(
    badgeVal ? 5 : 220,
    badgeVal ? 150 : 38,
    badgeVal ? 105 : 38,
  ); // green-600/amber-600
  doc.text(badgeVal ? "✓" : "!", badgeX, badgeY + 1.5, { align: "center" });

  // 5. Title of Certificate
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("CERTIFICATE OF ACADEMIC COMPLIANCE", width / 2, 54, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    "This credential is officially logged and verified for individual performance under active camera proctoring:",
    width / 2,
    62,
    { align: "center" },
  );

  // 6. Recipient Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(submission.candidateName, width / 2, 78, { align: "center" });

  // Recipient Email
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(submission.candidateEmail, width / 2, 85, { align: "center" });

  // Thin separator under name
  doc.setDrawColor(241, 245, 249); // slate-100
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 60, 92, width / 2 + 60, 92);

  // 7. Exam Information Details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("For completing the verified assessment titled:", width / 2, 101, {
    align: "center",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`"${submission.examTitle}"`, width / 2, 110, { align: "center" });

  // 8. Bento-style Metric Score Cards at the bottom
  const cardY = 124;
  const cardHeight = 30;
  const cardWidth = 72;
  const totalCardsWidth = cardWidth * 3 + 12; // 3 cards + 2 gaps of 6mm
  const startX = (width - totalCardsWidth) / 2;

  // Compute grading percentage
  const gradePct =
    Math.round((submission.score / submission.maxScore) * 100) || 0;

  // -- Card 1: Evaluation Score
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(241, 245, 249);
  doc.rect(startX, cardY, cardWidth, cardHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // gray-400
  doc.text("ACADEMIC GRADE RATIO", startX + 5, cardY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${submission.score} / ${submission.maxScore}`,
    startX + 5,
    cardY + 18,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text(`Grade Percentile: ${gradePct}%`, startX + 5, cardY + 25);

  // -- Card 2: integrity Score
  const x2 = startX + cardWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.rect(x2, cardY, cardWidth, cardHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("LOCKDOWN INTEGRITY INDEX", x2 + 5, cardY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(
    submission.integrityScore >= 75
      ? 16
      : submission.integrityScore >= 50
        ? 217
        : 225,
  ); // emerald/amber/rose
  doc.text(`${submission.integrityScore}%`, x2 + 5, cardY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    submission.integrityScore >= 75
      ? "Excellent compliance trust"
      : "Integrity review recommended",
    x2 + 5,
    cardY + 25,
  );

  // -- Card 3: Proctor status
  const x3 = x2 + cardWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.rect(x3, cardY, cardWidth, cardHeight, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("PROCTORING AUDIT RATING", x3 + 5, cardY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const statusStr =
    submission.status === "passed"
      ? "TRUSTED PASS"
      : submission.status === "review"
        ? "MANUAL REVIEW"
        : "COMPROMISED";
  doc.text(statusStr, x3 + 5, cardY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${submission.violations.length} violations recorded`,
    x3 + 5,
    cardY + 25,
  );

  // 9. Bottom Metadata (Verification QR Code replacement text, Date, Signatures)
  const metaY = 175;

  // Left: Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const dateStr = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleString()
    : new Date().toLocaleDateString();
  doc.text(`Completion Date & Time: ${dateStr}`, startX, metaY);

  // Center: Certification Verification Hash
  const hashKey = `SECURE_HASH-${submission.id.slice(-6).toUpperCase()}`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);

  const hashWidth = 80;
  doc.rect(width / 2 - hashWidth / 2, metaY - 5, hashWidth, 7, "FD");
  doc.setTextColor(71, 85, 105);
  doc.text(`Verification ID: ${hashKey}`, width / 2, metaY, {
    align: "center",
  });

  // Right: Signature simulation
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text("Autonomous AI Proctor Engine", startX + cardWidth * 3 + 12, metaY, {
    align: "right",
  });

  // Signature line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(
    startX + cardWidth * 3 + 12 - 50,
    metaY + 3,
    startX + cardWidth * 3 + 12,
    metaY + 3,
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Surveillance Authority Seal",
    startX + cardWidth * 3 + 12,
    metaY + 7,
    { align: "right" },
  );

  // 10. Generate the filename & trigger standard client download save
  const cleanedName = submission.candidateName.replace(/\s+/g, "_");
  const filename = `Certificate_${cleanedName}_${submission.id.slice(-6)}.pdf`;
  doc.save(filename);
}

export function exportDetailedReportPDF(submission: Submission) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("DETAILED INTEGRITY & ANALYTICS REPORT", width / 2, 20, {
    align: "center",
  });

  doc.setFontSize(12);
  doc.text(`Candidate Name: ${submission.candidateName}`, 20, 35);
  doc.text(`Candidate Email: ${submission.candidateEmail}`, 20, 42);
  doc.text(`Exam Title: ${submission.examTitle}`, 20, 49);
  doc.text(`Submission ID: ${submission.id}`, 20, 56);

  doc.text(
    `Final Score: ${submission.score} / ${submission.maxScore}`,
    140,
    35,
  );
  doc.text(`Integrity Score: ${submission.integrityScore}%`, 140, 42);
  doc.text(`Status: ${submission.status.toUpperCase()}`, 140, 49);

  const formatDate = (d: string | undefined) =>
    d ? new Date(d).toLocaleString() : "N/A";
  doc.text(`Started At: ${formatDate(submission.startedAt)}`, 20, 68);
  doc.text(`Submitted At: ${formatDate(submission.submittedAt)}`, 20, 75);

  doc.setFontSize(14);
  doc.text("Integrity Violations & Warnings Timeline", 20, 95);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let y = 105;
  if (submission.violations && submission.violations.length > 0) {
    submission.violations.forEach((v: any, index: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(
        `${formatDate(v.timestamp)} - [${v.severity.toUpperCase()}] ${v.type}:`,
        20,
        y,
      );
      y += 5;
      const textLines = doc.splitTextToSize(v.description, width - 40);
      doc.text(textLines, 25, y);
      y += textLines.length * 5 + 5;
    });
  } else {
    doc.text("No integrity violations recorded. Clean session.", 20, y);
    y += 15;
  }

  y += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.text("AI Proctor Webcam & Audio Diagnostics", 20, y);

  y += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (submission.aiReports && submission.aiReports.length > 0) {
    submission.aiReports.forEach((r: any, index: number) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(
        `${formatDate(r.timestamp)} - Audio/Camera Ping: [${r.status.toUpperCase()}]`,
        20,
        y,
      );
      y += 5;
      doc.text(`  Summary: ${r.summary}`, 20, y);
      y += 5;
      doc.text(
        `  Faces: ${r.faceDetected ? "Yes" : "No"} | Gaze: ${r.eyeContactStatus} | Phone: ${r.phoneDetected ? "Yes" : "No"} | Multiple: ${r.multiplePeople ? "Yes" : "No"}`,
        20,
        y,
      );
      y += 10;
    });
  } else {
    doc.text("No AI proctor diagnostics recorded in this session.", 20, y);
  }

  doc.save(
    `Detailed_Report_${submission.candidateName.replace(/\s+/g, "_")}_${submission.id.slice(-6)}.pdf`,
  );
}
