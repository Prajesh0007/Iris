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
  Moon,
  Sun,
  GripHorizontal
} from "lucide-react";
import { TestCase } from "../types";
import { Editor } from "@monaco-editor/react";
import { Panel, Group, Separator } from "react-resizable-panels";

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
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [activeTab, setActiveTab] = useState<"latest" | "history">("latest");
  
  // Monaco specific states
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");
  const [fontSize, setFontSize] = useState<number>(14);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
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

  useEffect(() => {
    if (questionId !== lastQuestionId.current) {
      setLocalCode(code);
      lastQuestionId.current = questionId;
      setAutoSaveStatus("idle");
      setCustomTestCases([]);
      setActiveTestCaseIndex(0);
      setTerminalOutput(null);
    } else if (autoSaveStatus === "idle") {
      setLocalCode(code);
    }
  }, [code, questionId, autoSaveStatus]);

  useEffect(() => {
    if (localCode === code) return;
    setAutoSaveStatus("saving");
    const handler = setTimeout(() => {
      onChange(localCode);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 2000);
    return () => clearTimeout(handler);
  }, [localCode, code, onChange]);

  const [selectedLanguage, setSelectedLanguage] = useState<typeof language>(language);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const generateDynamicBoilerplate = (lang: string): string => {
    const funcMatch =
      boilerplate.match(/(?:function|def|fn|func)\s+(\w+)/) ||
      boilerplate.match(/class\s+(\w+)/);
    const funcName = funcMatch ? funcMatch[1] : "solution";

    switch (lang) {
      case "javascript": return `function ${funcName}(s) {\n  // Write your JavaScript here\n  return s.split('').reverse().join('');\n}`;
      case "typescript": return `function ${funcName}(s: string): string {\n  // Write your TypeScript here\n  return s.split('').reverse().join('');\n}`;
      case "python": return `def ${funcName}(s):\n    # Write your Python here\n    return s[::-1]`;
      case "cpp": return `#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    string ${funcName}(string s) {\n        // Write your C++ here\n        reverse(s.begin(), s.end());\n        return s;\n    }\n};`;
      case "java": return `import java.util.*;\n\npublic class Solution {\n    public static String ${funcName}(String s) {\n        // Write your Java here\n        return new StringBuilder(s).reverse().toString();\n    }\n}`;
      case "rust": return `fn ${funcName}(s: String) -> String {\n    // Write your Rust here\n    s.chars().rev().collect()\n}`;
      case "go": return `package main\n\nfunc ${funcName}(s string) string {\n    // Write your Go here\n    runes := []rune(s)\n    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n        runes[i], runes[j] = runes[j], runes[i]\n    }\n    return string(runes)\n}`;
      case "ruby": return `def ${funcName}(s)\n  # Write your Ruby here\n  s.reverse\nend`;
      case "swift": return `import Foundation\n\nfunc ${funcName}(_ s: String) -> String {\n    // Write your Swift here\n    return String(s.reversed())\n}`;
      case "php": return `<?php\nfunction ${funcName}($s) {\n    // Write your PHP here\n    return strrev($s);\n}`;
      default: return boilerplate;
    }
  };

  const resetBoilerplate = () => {
    if (window.confirm("Reset your code to the starter boilerplate? All current modifications will be lost.")) {
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
    setActiveTab("latest");

    if (localCode !== code) {
      onChange(localCode);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }

    const activeTC = allTestCases[activeTestCaseIndex];

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: localCode,
          input: activeTC?.input,
          language: selectedLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        let match = true;
        let logMsg = "";

        if (activeTC?.expectedOutput !== undefined && activeTC?.expectedOutput !== "") {
          const cleanExpected = activeTC.expectedOutput.replace(/\s+/g, "").replace(/['"]/g, "");
          const cleanActual = data.success && data.result ? String(data.result).replace(/\s+/g, "").replace(/['"]/g, "") : "";
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

        if (onCodeExecuted && !activeTC?.isCustom) {
          onCodeExecuted(match, activeTestCaseIndex);
        }
      }
    } catch (e: any) {
      const errorOutput = { success: false, error: e.message || "Connection interrupted" };
      setTerminalOutput(errorOutput);
      setExecutionLogs((prev) => [
        {
          timestamp: new Date(),
          testCaseName: activeTC?.name || `Case ${activeTestCaseIndex + 1}`,
          ...errorOutput,
        },
        ...prev,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const getMonacoLanguage = (lang: string) => {
    const map: Record<string, string> = { cpp: "cpp", java: "java", python: "python", javascript: "javascript", typescript: "typescript", rust: "rust", go: "go", ruby: "ruby", swift: "swift", php: "php" };
    return map[lang] || "javascript";
  };

  return (
    <div
      className={`flex flex-col rounded-xl border ${theme === 'vs-dark' ? 'border-slate-800' : 'border-slate-200'} overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-4 z-[9999] bg-slate-900 shadow-2xl"
          : `h-full min-h-[600px] ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-white'}`
      }`}
    >
      {/* Editor Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${theme === 'vs-dark' ? 'bg-[#252526] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
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
            className={`text-xs font-semibold px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 cursor-pointer ${
              theme === 'vs-dark' 
                ? 'bg-[#3c3c3c] border-[#3c3c3c] text-slate-200 hover:bg-[#4d4d4d]' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {LANGUAGES_LIST.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
          
          <span className={`text-[10px] font-mono flex items-center gap-1.5 ${theme === 'vs-dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {autoSaveStatus === "saving" && <span className="text-amber-500 animate-pulse flex items-center gap-1"><RefreshCcw className="h-3 w-3 animate-spin"/> Saving...</span>}
            {autoSaveStatus === "saved" && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Saved</span>}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
            className={`p-1.5 rounded transition-colors active:scale-95 ${theme === 'vs-dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}
            title="Toggle Theme"
          >
            {theme === "vs-dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <div className={`flex items-center border rounded p-0.5 ${theme === 'vs-dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className={`w-6 h-6 rounded text-xs font-bold active:scale-90 ${theme === 'vs-dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>A-</button>
            <span className={`px-1 text-[10px] font-mono ${theme === 'vs-dark' ? 'text-slate-400' : 'text-slate-500'}`}>{fontSize}px</span>
            <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className={`w-6 h-6 rounded text-xs font-bold active:scale-90 ${theme === 'vs-dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}>A+</button>
          </div>

          <button onClick={resetBoilerplate} disabled={readOnly} title="Reset to Template" className={`p-1.5 rounded transition-colors active:scale-95 disabled:opacity-50 ${theme === 'vs-dark' ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-200'}`}>
            <RotateCcw className="h-4 w-4" />
          </button>

          <button onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle fullscreen" className={`p-1.5 rounded transition-colors active:scale-95 ${theme === 'vs-dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'}`}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-hidden ${isFullscreen ? "h-[calc(100vh-40px)]" : "h-[600px]"}`}>
        <Group orientation="vertical">
          {/* Editor Panel */}
          <Panel defaultSize={60} minSize={20} className="flex flex-col relative group">
            <div className="flex-1 w-full h-full relative">
              <Editor
                height="100%"
                width="100%"
                language={getMonacoLanguage(selectedLanguage)}
                theme={theme}
                value={localCode}
                onChange={(val) => { if (!readOnly) setLocalCode(val || ""); }}
                options={{
                  readOnly,
                  fontSize,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  fontLigatures: true,
                  formatOnPaste: true,
                  padding: { top: 16 },
                  scrollbar: {
                    verticalScrollbarSize: 8,
                    horizontalScrollbarSize: 8
                  }
                }}
                loading={<div className="flex items-center justify-center h-full text-slate-500 text-sm animate-pulse">Initializing Editor...</div>}
              />
            </div>
          </Panel>

          <Separator className={`h-1.5 w-full flex items-center justify-center cursor-row-resize hover:bg-indigo-500/20 transition-colors ${theme === 'vs-dark' ? 'bg-[#333]' : 'bg-slate-200'}`}>
            <div className="w-8 h-1 rounded-full bg-slate-400/50" />
          </Separator>

          {/* Console / Test Case Panel */}
          <Panel defaultSize={40} minSize={15} className={`flex flex-col ${theme === 'vs-dark' ? 'bg-[#1e1e1e]' : 'bg-slate-50/50'}`}>
            {/* Test Case Tabs */}
            <div className={`flex items-center gap-1 p-2 overflow-x-auto border-b ${theme === 'vs-dark' ? 'border-[#333] bg-[#252526]' : 'border-slate-200 bg-white'}`}>
              {allTestCases.map((tc, index) => (
                <button
                  key={index}
                  onClick={() => { setActiveTestCaseIndex(index); setTerminalOutput(null); }}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                    activeTestCaseIndex === index
                      ? (theme === 'vs-dark' ? 'bg-[#37373d] text-white' : 'bg-slate-200 text-slate-800')
                      : (theme === 'vs-dark' ? 'text-slate-400 hover:bg-[#2d2d30]' : 'text-slate-500 hover:bg-slate-100')
                  }`}
                >
                  {tc.name || `Case ${index + 1}`} {tc.isHidden && "🔒"} {tc.isCustom && "⚡"}
                </button>
              ))}
              {!readOnly && (
                <button
                  onClick={() => {
                    setCustomTestCases([...customTestCases, { input: "", expectedOutput: "", isCustom: true, name: `Custom ${customTestCases.length + 1}` }]);
                    setActiveTestCaseIndex(allTestCases.length);
                    setTerminalOutput(null);
                  }}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap border border-dashed ${
                    theme === 'vs-dark' 
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-800' 
                      : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  + Custom Case
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
               {/* Test Case Input/Output Forms */}
               {(() => {
                 const tc = allTestCases[activeTestCaseIndex];
                 if (!tc) return null;
                 return (
                   <div className="flex flex-col gap-4 mb-4">
                     <div className="flex flex-col gap-1.5">
                       <span className={`text-[10px] font-semibold uppercase ${theme === 'vs-dark' ? 'text-slate-400' : 'text-slate-500'}`}>Input</span>
                       {tc.isCustom ? (
                          <textarea
                            value={tc.input}
                            disabled={readOnly}
                            onChange={(e) => {
                              const newCases = [...customTestCases];
                              newCases[activeTestCaseIndex - testCases.length].input = e.target.value;
                              setCustomTestCases(newCases);
                            }}
                            className={`w-full text-xs font-mono p-2 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              theme === 'vs-dark' ? 'bg-[#2d2d30] border-[#3e3e42] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                            }`}
                            rows={2}
                            placeholder="e.g. nums = [2,7,11,15], target = 9"
                          />
                       ) : (
                         <div className={`p-2.5 rounded font-mono text-xs ${theme === 'vs-dark' ? 'bg-[#2d2d30] text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                           {tc.isHidden ? "Hidden Test Case" : tc.input}
                         </div>
                       )}
                     </div>
                     
                     <div className="flex flex-col gap-1.5">
                       <span className={`text-[10px] font-semibold uppercase ${theme === 'vs-dark' ? 'text-slate-400' : 'text-slate-500'}`}>Expected Output</span>
                       {tc.isCustom ? (
                          <input
                            value={tc.expectedOutput || ""}
                            disabled={readOnly}
                            onChange={(e) => {
                              const newCases = [...customTestCases];
                              newCases[activeTestCaseIndex - testCases.length].expectedOutput = e.target.value;
                              setCustomTestCases(newCases);
                            }}
                            className={`w-full text-xs font-mono p-2 rounded border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              theme === 'vs-dark' ? 'bg-[#2d2d30] border-[#3e3e42] text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                            }`}
                            placeholder="(Optional) e.g. [0,1]"
                          />
                       ) : (
                         <div className={`p-2.5 rounded font-mono text-xs ${theme === 'vs-dark' ? 'bg-[#2d2d30] text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                           {tc.isHidden ? "Hidden" : tc.expectedOutput}
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })()}

               {/* Execution Results */}
               {terminalOutput && (
                 <div className="mt-2 flex flex-col gap-3 border-t border-slate-500/20 pt-4">
                    <div className={`flex items-center gap-2 text-sm font-bold ${terminalOutput.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {terminalOutput.success ? "Accepted" : "Wrong Answer / Error"}
                      <span className={`text-xs font-normal ${theme === 'vs-dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        — {terminalOutput.logMessage}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] font-semibold uppercase ${theme === 'vs-dark' ? 'text-slate-400' : 'text-slate-500'}`}>Actual Output</span>
                      <div className={`p-2.5 rounded font-mono text-xs ${theme === 'vs-dark' ? 'bg-[#2d2d30] text-slate-200' : 'bg-rose-50/50 text-slate-800 border border-slate-200'}`}>
                         {terminalOutput.result || (terminalOutput.error ? <span className="text-rose-500 whitespace-pre-wrap">{terminalOutput.error}</span> : "null")}
                      </div>
                    </div>

                    {terminalOutput.consoleOutput && (
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-semibold uppercase ${theme === 'vs-dark' ? 'text-slate-400' : 'text-slate-500'}`}>Stdout</span>
                        <div className={`p-2.5 rounded font-mono text-xs whitespace-pre-wrap ${theme === 'vs-dark' ? 'bg-[#1a1a1a] text-slate-300 border border-[#333]' : 'bg-slate-900 text-slate-200'}`}>
                          {terminalOutput.consoleOutput}
                        </div>
                      </div>
                    )}
                 </div>
               )}
            </div>

            {/* Action Bar */}
            <div className={`flex justify-end p-3 border-t ${theme === 'vs-dark' ? 'border-[#333] bg-[#252526]' : 'border-slate-200 bg-slate-50'}`}>
              <button
                onClick={handleRunCode}
                disabled={isRunning || readOnly}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-1.5 px-6 rounded-md text-[13px] font-semibold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none transition-all"
              >
                {isRunning ? (
                  <><RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Running...</>
                ) : (
                  <><Play className="h-3.5 w-3.5 fill-current" /> Run Code</>
                )}
              </button>
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
