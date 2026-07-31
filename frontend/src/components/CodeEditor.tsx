/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Sparkles,
  Terminal,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  RefreshCcw,
  Maximize2,
  Minimize2,
  Clock,
} from "lucide-react";
import { TestCase } from "../types";

import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/themes/prism.css"; // We'll add dark mode overrides in index.css

interface CodeEditorProps {
  questionId?: string;
  code: string;
  onChange: (newCode: string) => void;
  language:
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
  boilerplate: string;
  testCases: TestCase[];
  onCodeExecuted?: (passed: boolean, testCaseIndex: number) => void;
  readOnly?: boolean;
}

const LANGUAGES_LIST = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python (3.10+)" },
  { value: "cpp", label: "C++ (GCC 11)" },
  { value: "java", label: "Java (OpenJDK 17)" },
  { value: "rust", label: "Rust (Cargo)" },
  { value: "go", label: "Go (1.20)" },
  { value: "ruby", label: "Ruby (3.2)" },
  { value: "swift", label: "Swift (5.8)" },
  { value: "php", label: "PHP (8.2)" },
] as const;

export default function CodeEditor({
  questionId,
  code,
  onChange,
  language,
  boilerplate,
  testCases,
  onCodeExecuted,
  readOnly = false,
}: CodeEditorProps) {
  const [localCode, setLocalCode] = useState<string>(code);
  const [lineCount, setLineCount] = useState<number>(1);
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [activeTab, setActiveTab] = useState<"latest" | "history">("latest");
  const [executionLogs, setExecutionLogs] = useState<
    {
      timestamp: Date;
      testCaseName: string;
      success?: boolean;
      result?: string;
      error?: string;
      logMessage?: string;
      consoleOutput?: string;
      timeComplexity?: string;
      spaceComplexity?: string;
    }[]
  >([]);
  const [terminalOutput, setTerminalOutput] = useState<{
    success?: boolean;
    result?: string;
    error?: string;
    logMessage?: string;
    consoleOutput?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
  } | null>(null);

  const lastQuestionId = useRef(questionId);

  const allTestCases = [...testCases, ...customTestCases];

  // Synchronize internal draft on external question switch, reset, or initial load
  useEffect(() => {
    if (questionId !== lastQuestionId.current) {
      setLocalCode(code);
      lastQuestionId.current = questionId;
      setAutoSaveStatus("idle");
      setCustomTestCases([]);
      setActiveTestCaseIndex(0);
    } else if (autoSaveStatus === "idle") {
      // Sync on initial mount or force reset template (where autoSave is idle)
      setLocalCode(code);
    }
  }, [code, questionId, autoSaveStatus]);

  // Debounced Auto-Save
  useEffect(() => {
    if (localCode === code) return;

    setAutoSaveStatus("saving");

    // Auto-save triggers every 5 seconds
    const handler = setTimeout(() => {
      onChange(localCode);
      setAutoSaveStatus("saved");

      // Reset saved status message after 2s
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 5000);

    return () => clearTimeout(handler);
  }, [localCode, code, onChange]);

  const [selectedLanguage, setSelectedLanguage] =
    useState<typeof language>(language);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Synchronize selected language on question change
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  // Synchronize line numbers on edit
  useEffect(() => {
    const lines = localCode.split("\n").length;
    setLineCount(lines || 1);
  }, [localCode]);

  const generateDynamicBoilerplate = (lang: string): string => {
    const funcMatch =
      boilerplate.match(/(?:function|def|fn|func)\s+(\w+)/) ||
      boilerplate.match(/class\s+(\w+)/);
    const funcName = funcMatch ? funcMatch[1] : "solution";

    switch (lang) {
      case "javascript":
        return `function ${funcName}(s) {\n  // Write your JavaScript here\n  return s.split('').reverse().join('');\n}`;
      case "typescript":
        return `function ${funcName}(s: string): string {\n  // Write your TypeScript here\n  return s.split('').reverse().join('');\n}`;
      case "python":
        return `def ${funcName}(s):\n    # Write your Python here\n    return s[::-1]`;
      case "cpp":
        return `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    string ${funcName}(string s) {\n        // Write your C++ here\n        reverse(s.begin(), s.end());\n        return s;\n    }\n};`;
      case "java":
        return `import java.util.*;\n\npublic class Solution {\n    public static String ${funcName}(String s) {\n        // Write your Java here\n        return new StringBuilder(s).reverse().toString();\n    }\n}`;
      case "rust":
        return `fn ${funcName}(s: String) -> String {\n    // Write your Rust here\n    s.chars().rev().collect()\n}`;
      case "go":
        return `package main\n\nfunc ${funcName}(s string) string {\n    // Write your Go here\n    runes := []rune(s)\n    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n        runes[i], runes[j] = runes[j], runes[i]\n    }\n    return string(runes)\n}`;
      case "ruby":
        return `def ${funcName}(s)\n  # Write your Ruby here\n  s.reverse\nend`;
      case "swift":
        return `import Foundation\n\nfunc ${funcName}(_ s: String) -> String {\n    // Write your Swift here\n    return String(s.reversed())\n}`;
      case "php":
        return `<?php\nfunction ${funcName}($s) {\n    // Write your PHP here\n    return strrev($s);\n}`;
      default:
        return boilerplate;
    }
  };

  const resetBoilerplate = () => {
    if (
      window.confirm(
        "Are you sure you want to reset your code to the starter boilerplate? All current modifications will be lost.",
      )
    ) {
      const resetContent = generateDynamicBoilerplate(selectedLanguage);
      setLocalCode(resetContent);
      onChange(resetContent);
      setAutoSaveStatus("idle");
      setTerminalOutput(null);
    }
  };

  const handleRunCode = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTerminalOutput(null);

    // Force flush if unsaved
    if (localCode !== code) {
      onChange(localCode);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }

    const activeTC = allTestCases[activeTestCaseIndex];

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: localCode,
          input: activeTC?.input,
          language: selectedLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // check match with expected output if it exists (custom testcases might not care, but standard ones do)
        let match = true;
        let logMsg = "";

        if (
          activeTC?.expectedOutput !== undefined &&
          activeTC?.expectedOutput !== ""
        ) {
          const cleanExpected = activeTC.expectedOutput
            .replace(/\s+/g, "")
            .replace(/['"]/g, "");
          const cleanActual =
            data.success && data.result
              ? String(data.result).replace(/\s+/g, "").replace(/['"]/g, "")
              : "";
          match = data.success && cleanExpected === cleanActual;

          logMsg = match
            ? "🚀 ASSERTION PASSED: Actual output match expected test format."
            : data.success
              ? "❌ ASSERTION FAILED: Value returned does not match expected output."
              : "⚠️ RUNTIME EXCEPTION: System halted due to stack tracing.";
        } else {
          match = data.success;
          logMsg = data.success
            ? "✅ EXECUTION COMPLETE: Custom output printed successfully."
            : "⚠️ RUNTIME EXCEPTION: System halted due to stack tracing.";
        }

        const newOutput = {
          success: data.success,
          result: data.result,
          error: data.error,
          logMessage: logMsg,
          consoleOutput: data.consoleOutput,
          timeComplexity: data.timeComplexity,
          spaceComplexity: data.spaceComplexity,
        };
        setTerminalOutput(newOutput);
        setExecutionLogs((prev) => [
          {
            timestamp: new Date(),
            testCaseName: activeTC?.name || `Case ${activeTestCaseIndex + 1}`,
            ...newOutput,
          },
          ...prev,
        ]);
        setActiveTab("latest");

        if (onCodeExecuted && !activeTC?.isCustom) {
          onCodeExecuted(match, activeTestCaseIndex);
        }
      }
    } catch (e: any) {
      const errorOutput = {
        success: false,
        error: e.message || "Connection interrupted",
      };
      setTerminalOutput(errorOutput);
      setExecutionLogs((prev) => [
        {
          timestamp: new Date(),
          testCaseName: activeTC?.name || `Case ${activeTestCaseIndex + 1}`,
          ...errorOutput,
        },
        ...prev,
      ]);
      setActiveTab("latest");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-4 z-50 bg-white/95 backdrop-blur-xl shadow-2xl"
          : "bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] h-[740px]"
      }`}
    >
      {/* Cockpit top header */}
      <div className="glass-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-500 hidden xl:inline">
            Language Compiler:
          </span>
          <select
            value={selectedLanguage}
            disabled={readOnly}
            onChange={(e) => {
              const newLang = e.target.value as any;
              setSelectedLanguage(newLang);
              const resetContent = generateDynamicBoilerplate(newLang);
              setLocalCode(resetContent);
              onChange(resetContent);
              setAutoSaveStatus("idle");
              setTerminalOutput(null);
            }}
            className="text-[10px] sm:text-xs font-bold font-mono bg-indigo-50 hover:bg-indigo-100 text-indigo-700 uppercase px-2.5 py-1 rounded-md border border-indigo-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {LANGUAGES_LIST.map((item) => (
              <option
                key={item.value}
                value={item.value}
                className="text-slate-800 bg-white"
              >
                {item.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-400 font-mono hidden md:inline">
            IDE Active &bull; Cloud Compilation Core
            {autoSaveStatus === "saving" && (
              <span className="text-amber-500 ml-2 animate-pulse">
                Auto-saving...
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-emerald-500 ml-2">Draft saved</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Font Sizes controls */}
          <div className="flex items-center border border-slate-200/60 rounded-lg p-0.5 bg-white/40">
            <button
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              className="text-[10px] w-6 h-6 hover:bg-slate-100 rounded text-slate-600 font-bold active:scale-90"
            >
              A-
            </button>
            <span className="text-[10px] px-1.5 font-mono font-medium text-slate-500">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
              className="text-[10px] w-6 h-6 hover:bg-slate-100 rounded text-slate-600 font-bold active:scale-90"
            >
              A+
            </button>
          </div>

          <button
            onClick={resetBoilerplate}
            disabled={readOnly}
            title="Reset to Template"
            className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-colors border border-slate-200/50 cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle fullscreen IDE"
            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors border border-slate-200/50 cursor-pointer active:scale-95"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main editor split view */}
      <div className="flex flex-col flex-1 min-h-0 divide-y divide-slate-200/60">
        {/* Code Input area (Editor with line numbers) */}
        <div className="flex-1 flex min-h-[300px] relative bg-slate-50/20 dark:bg-slate-900/40 overflow-y-auto">
          {/* Column Line indicators */}
          <div className="w-12 select-none pr-2.5 py-4 text-right text-slate-400/80 font-mono text-xs select-none border-r border-slate-200/60 dark:border-slate-700/60 flex flex-col items-end gap-[1px]">
            {Array.from({ length: lineCount }).map((_, i) => (
              <span
                key={i}
                className="leading-5 h-5 block"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.5,
                  height: `${fontSize * 1.5}px`,
                }}
              >
                {i + 1}
              </span>
            ))}
          </div>

          <div className="flex-1 min-h-full">
            <Editor
              value={localCode}
              onValueChange={(code) => {
                if (!readOnly) setLocalCode(code);
              }}
              disabled={readOnly}
              highlight={(code) => {
                const langMap: Record<string, string> = {
                  typescript: "typescript",
                  javascript: "javascript",
                  python: "python",
                  cpp: "cpp",
                  java: "java",
                  rust: "rust",
                  go: "go",
                  ruby: "ruby",
                  swift: "swift",
                  php: "php",
                };
                const grammar =
                  Prism.languages[langMap[selectedLanguage]] ||
                  Prism.languages.javascript;
                return Prism.highlight(code, grammar, selectedLanguage);
              }}
              padding={16}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                minHeight: "100%",
                outline: "none",
              }}
              className="editor-container min-h-full text-slate-800 dark:text-slate-200 focus:outline-none"
              textareaClassName="focus:outline-none"
            />
          </div>
        </div>

        {/* Dynamic Sandbox Output Panel */}
        <div className="flex flex-col h-[280px] shrink-0 bg-slate-50/40">
          {/* Test cases panel selector */}
          <div className="p-3.5 border-b border-slate-200/60 bg-white/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Test Assertions & Console Output
            </span>
            <div className="flex flex-row overflow-x-auto gap-2 pb-1 snap-x">
              {allTestCases.map((tc, index) => {
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setActiveTestCaseIndex(index);
                      setTerminalOutput(null);
                    }}
                    className={`flex-shrink-0 min-w-[220px] max-w-[280px] snap-center text-left p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-2 cursor-pointer ${
                      activeTestCaseIndex === index
                        ? "bg-indigo-50 border-indigo-200/70 text-indigo-900 shadow-xs"
                        : "bg-white hover:bg-slate-50 border-slate-200/50 text-slate-600"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full gap-3">
                      <div className="flex flex-col gap-0.5 truncate flex-1">
                        <span className="font-semibold text-[10px] text-slate-500">
                          {tc.name || `Case ${index + 1}`}{" "}
                          {tc.isHidden && "(Hidden)"}{" "}
                          {tc.isCustom && "(Custom)"}
                        </span>
                        {!tc.isCustom ? (
                          <code className="font-mono text-[10px] truncate block text-slate-700">
                            {tc.isHidden ? "********" : tc.input}
                          </code>
                        ) : (
                          <input
                            value={tc.input}
                            disabled={readOnly}
                            onChange={(e) => {
                              const newCustomTestCases = [...customTestCases];
                              const customIdx = index - testCases.length;
                              if (customIdx >= 0) {
                                newCustomTestCases[customIdx].input =
                                  e.target.value;
                                setCustomTestCases(newCustomTestCases);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Input args..."
                            className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] font-mono mt-1"
                          />
                        )}
                      </div>
                      {!tc.isCustom ? (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold self-start mt-0.5">
                          {tc.isHidden
                            ? "********"
                            : `Expected: ${tc.expectedOutput}`}
                        </span>
                      ) : (
                        <input
                          value={tc.expectedOutput || ""}
                          disabled={readOnly}
                          onChange={(e) => {
                            const newCustomTestCases = [...customTestCases];
                            const customIdx = index - testCases.length;
                            if (customIdx >= 0) {
                              newCustomTestCases[customIdx].expectedOutput =
                                e.target.value;
                              setCustomTestCases(newCustomTestCases);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Expected out (opt)"
                          className="w-1/3 bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] font-mono mt-1"
                        />
                      )}
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setCustomTestCases([
                    ...customTestCases,
                    {
                      input: "",
                      expectedOutput: "",
                      isCustom: true,
                      name: `Custom ${customTestCases.length + 1}`,
                    },
                  ]);
                  setActiveTestCaseIndex(allTestCases.length);
                  setTerminalOutput(null);
                }}
                disabled={readOnly}
                className="flex-shrink-0 min-w-[150px] snap-center flex items-center justify-center text-[10px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 py-2 px-3 rounded-lg border border-indigo-100 border-dashed transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                + Add Custom Test Case
              </button>
            </div>
          </div>

          {/* Terminal stream panel */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
            <div className="px-3.5 pt-2 border-b border-slate-200/60 bg-white/40 flex items-end gap-3 text-[10px] font-semibold">
              <button
                onClick={() => setActiveTab("latest")}
                className={`pb-2 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${activeTab === "latest" ? "border-indigo-500 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                <Terminal className="h-3 w-3" /> Console Execution Output
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2 px-1 flex items-center gap-1.5 border-b-2 transition-colors ${activeTab === "history" ? "border-indigo-500 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                <Clock className="h-3 w-3" /> Session Logs (
                {executionLogs.length})
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs flex flex-col gap-3">
              {activeTab === "latest" ? (
                terminalOutput ? (
                  <div className="flex flex-col gap-2">
                    {/* Status Indicator */}
                    <div
                      className={`p-2.5 rounded-xl border flex gap-2 items-start ${
                        terminalOutput.success
                          ? "bg-emerald-500/5 border-emerald-100 text-emerald-800"
                          : "bg-rose-500/5 border-rose-100 text-rose-800"
                      }`}
                    >
                      {terminalOutput.success ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <span className="font-medium leading-normal text-[11px]">
                        {terminalOutput.logMessage}
                      </span>
                    </div>

                    {/* Program values output */}
                    {terminalOutput.success && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                          Returned Value
                        </span>
                        <code className="text-emerald-600 font-bold block whitespace-pre-wrap select-all font-mono">
                          {terminalOutput.result}
                        </code>
                      </div>
                    )}

                    {/* Standard output/console output */}
                    {terminalOutput.consoleOutput && (
                      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                          Standard Output (Console)
                        </span>
                        <code className="text-slate-200 block whitespace-pre-wrap select-all font-mono">
                          {terminalOutput.consoleOutput}
                        </code>
                      </div>
                    )}

                    {/* Complexity Analysis */}
                    {(terminalOutput.timeComplexity ||
                      terminalOutput.spaceComplexity) && (
                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 mt-2">
                        <span className="text-[10px] text-indigo-500 font-semibold uppercase block mb-2 flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5" /> Runtime Analysis
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {terminalOutput.timeComplexity && (
                            <div className="bg-white p-2 rounded-lg border border-indigo-50 shadow-xs flex flex-col gap-0.5">
                              <span className="text-slate-400 font-medium">
                                Time Complexity
                              </span>
                              <span className="font-bold text-indigo-700 font-mono">
                                {terminalOutput.timeComplexity}
                              </span>
                            </div>
                          )}
                          {terminalOutput.spaceComplexity && (
                            <div className="bg-white p-2 rounded-lg border border-indigo-50 shadow-xs flex flex-col gap-0.5">
                              <span className="text-slate-400 font-medium">
                                Space Complexity
                              </span>
                              <span className="font-bold text-indigo-700 font-mono">
                                {terminalOutput.spaceComplexity}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exception print mapping */}
                    {terminalOutput.error && (
                      <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100 text-rose-700">
                        <span className="text-[10px] text-rose-500 font-semibold uppercase block mb-1">
                          Compilation Stacktrace
                        </span>
                        <pre className="font-mono text-[10px] whitespace-pre-wrap">
                          {terminalOutput.error}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="my-auto text-center flex flex-col items-center justify-center p-6 text-slate-400 gap-1.5 select-none">
                    <Terminal className="h-5 w-5 text-slate-300" />
                    <span className="text-[11px] font-medium leading-snug">
                      Terminal dormant. Press "Execute Assertion" to query your
                      function against the active test case.
                    </span>
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-3">
                  {executionLogs.length === 0 ? (
                    <div className="text-center p-6 text-slate-400 my-auto text-[11px]">
                      No execution logs yet.
                    </div>
                  ) : (
                    executionLogs.map((log, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-slate-300"
                      >
                        <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-600 text-[10px] truncate max-w-[60%]">
                            {log.testCaseName}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div
                          className={`p-1.5 rounded text-[10px] font-medium flex gap-1.5 items-start leading-snug ${
                            log.success ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {log.success ? (
                            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          )}
                          {log.logMessage ||
                            (log.success
                              ? "Execution succeeded"
                              : "Execution failed")}
                        </div>
                        {log.success && log.result && (
                          <div className="px-1.5 text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 mt-0.5 whitespace-pre-wrap">
                            <span className="text-slate-400 mr-1 uppercase text-[9px] font-bold">
                              OUT:
                            </span>{" "}
                            <code className="text-emerald-600 font-bold">
                              {log.result}
                            </code>
                          </div>
                        )}
                        {!log.success && log.error && (
                          <div className="px-1.5 text-[10px] text-rose-500 border-t border-slate-100 pt-1.5 mt-0.5 line-clamp-3">
                            <span className="text-rose-300 mr-1 uppercase text-[9px] font-bold">
                              ERR:
                            </span>{" "}
                            <code>{log.error}</code>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Run triggers tab bar */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200/60 flex items-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={isRunning || readOnly}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white py-2 px-3 rounded-xl text-xs font-semibold shadow-md hover:shadow-indigo-500/10 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {isRunning ? (
                  <>
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
                    Running Thread...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Execute Assertion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
