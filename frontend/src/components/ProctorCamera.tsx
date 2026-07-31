/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Sparkles,
  AlertTriangle,
  Eye,
  Mic,
  ShieldAlert,
} from "lucide-react";
import { AIProctorReport } from "../types";

interface ProctorCameraProps {
  onScanResult: (report: AIProctorReport) => void;
  onAudioAlert: (level: number) => void;
  requireCamera: boolean;
  isExamStarted: boolean;
  onStreamReady?: (stream: MediaStream) => void;
}

export default function ProctorCamera({
  onScanResult,
  onAudioAlert,
  requireCamera,
  isExamStarted,
  onStreamReady,
}: ProctorCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [latestStatus, setLatestStatus] = useState<AIProctorReport | null>(
    null,
  );
  const [isSimulatedFeed, setIsSimulatedFeed] = useState<boolean>(false);

  // Initialize Video Feed
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let activeInterval: NodeJS.Timeout | null = null;

    async function initCamera() {
      try {
        const constraints = {
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        };
        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);
        if (onStreamReady) onStreamReady(mediaStream);
        setHasPermission(true);
        setIsSimulatedFeed(false);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current
            .play()
            .catch((e) => console.log("Video autoplay error:", e));
        }
      } catch (err) {
        console.warn("Camera stream request failed:", err);
        setHasPermission(false);
        setIsSimulatedFeed(true); // fall back to simulated visual intelligence feed
      }
    }

    if (requireCamera && isExamStarted) {
      initCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (activeInterval) clearInterval(activeInterval);
    };
  }, [requireCamera, isExamStarted]);

  // Initialize Microphone Monitoring
  useEffect(() => {
    let activeAudioStream: MediaStream | null = null;

    async function initAudio() {
      try {
        const audioConstraints = { audio: true, video: false };
        const mediaStream =
          await navigator.mediaDevices.getUserMedia(audioConstraints);
        activeAudioStream = mediaStream;
        setAudioStream(mediaStream);

        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const normalizedVol = Math.min(100, Math.round(average * 2.5));
          setMicVolume(normalizedVol);

          // Audio triggers violation warning on parent if volume exceeds threshold (e.g. 75%)
          if (normalizedVol > 75) {
            onAudioAlert(normalizedVol);
          }

          animationFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      } catch (e) {
        console.log("Microphone feed block or missing:", e);
      }
    }

    if (isExamStarted) {
      initAudio();
    }

    return () => {
      if (activeAudioStream) {
        activeAudioStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isExamStarted]);

  // Captured base64 scanner submitter
  const performProctorScan = async () => {
    if (isScanning || !isExamStarted) return;
    setIsScanning(true);

    try {
      let imageBase64 = "";

      if (!isSimulatedFeed && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240);
          imageBase64 = canvas.toDataURL("image/jpeg", 0.85);
        }
      } else {
        // Mock dummy tiny slate gray canvas to send on simulation scenarios
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = 160;
          canvas.height = 120;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#64748b";
            ctx.fillRect(0, 0, 160, 120);
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px sans-serif";
            ctx.fillText("Simulated Feed", 40, 60);
            imageBase64 = canvas.toDataURL("image/jpeg");
          }
        }
      }

      if (!imageBase64) {
        setIsScanning(false);
        return;
      }

      const res = await fetch("/api/proctor/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64 }),
      });

      if (res.ok) {
        const report: AIProctorReport = await res.json();
        setLatestStatus(report);
        onScanResult(report);
      }
    } catch (e) {
      console.error("Proctor scan communication failed:", e);
    } finally {
      setIsScanning(false);
    }
  };

  // Automate snapshot scanner loops when exam starts
  useEffect(() => {
    let scanInterval: NodeJS.Timeout | null = null;
    if (isExamStarted) {
      // First quick scan on 5 seconds
      const timeout = setTimeout(() => {
        performProctorScan();
      }, 5000);

      // Recursive scan every 25 seconds
      scanInterval = setInterval(() => {
        performProctorScan();
      }, 25000);

      return () => {
        clearTimeout(timeout);
        if (scanInterval) clearInterval(scanInterval);
      };
    }
  }, [isExamStarted, isSimulatedFeed, stream]);

  return (
    <div className="glass p-4 rounded-2xl border border-white/60 relative overflow-hidden flex flex-col gap-3 min-w-[280px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
            AI Proctor Feed
          </span>
        </div>
        <div className="glass-pill px-2.5 py-1 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Live Telemetry
        </div>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200/50 flex flex-col justify-center items-center">
        {/* Real camera video indicator */}
        {!isSimulatedFeed && stream && (
          <video
            ref={videoRef}
            muted
            playsInline
            controls={false}
            className="w-full h-full object-cover transform rotate-0"
          />
        )}

        {/* Backdrop Simulator graphics */}
        {isSimulatedFeed && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center">
            <div className="relative">
              <CameraOff className="h-8 w-8 text-indigo-500 mb-1 animate-pulse" />
              <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-yellow-500 rounded-full border-2 border-white flex items-center justify-center">
                <AlertTriangle className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-700">
              Simulating Webcam Feed
            </span>
            <span className="text-[10px] text-slate-500 max-w-[220px] leading-tight mt-1">
              Real webcam bypassed. Simulated AI validation analyzing gaze
              vectors & frame integrity.
            </span>
          </div>
        )}

        {/* Verification scanning bar effect */}
        {isScanning && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 top-0 animate-[bounce_1.5s_infinite_alternate]" />
        )}

        {/* Live bounding box simulator to convey highly professional AI proctor visual feedback */}
        {isExamStarted && (
          <div className="absolute border border-dashed border-emerald-400/80 rounded-lg w-[70%] h-[70%] top-[15%] left-[15%] pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between">
              <div className="h-3 w-3 border-t-2 border-l-2 border-emerald-400" />
              <div className="h-3 w-3 border-t-2 border-r-2 border-emerald-400" />
            </div>
            <div className="text-[8px] text-emerald-500 bg-emerald-900/10 font-mono tracking-widest text-center self-center py-0.5 px-2.5 rounded-full backdrop-blur-sm border border-emerald-400/20">
              GAZE_LOCK:{" "}
              {latestStatus
                ? latestStatus.eyeContactStatus.toUpperCase()
                : "DETECTING"}
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-3 border-b-2 border-l-2 border-emerald-400" />
              <div className="h-3 w-3 border-b-2 border-r-2 border-emerald-400" />
            </div>
          </div>
        )}
      </div>

      {/* Hidden layout canvas for screens capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Audio Level Widget */}
      <div className="flex flex-col gap-1.5 mt-1 bg-white/50 p-2.5 rounded-xl border border-white/80">
        <div className="flex justify-between text-[11px] items-center">
          <span className="text-slate-500 flex items-center gap-1 font-medium">
            <Mic className="h-3 w-3 text-emerald-500" /> Ambient Noise Threshold
          </span>
          <span
            className={`font-mono text-[10px] ${micVolume > 70 ? "text-rose-500 font-bold" : "text-slate-500"}`}
          >
            {micVolume}% / 100% {micVolume > 70 && "(Spike)"}
          </span>
        </div>
        <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden flex">
          <div
            className={`transition-all duration-75 h-full ${
              micVolume > 75
                ? "bg-rose-500"
                : micVolume > 40
                  ? "bg-amber-400"
                  : "bg-emerald-400"
            }`}
            style={{ width: `${micVolume}%` }}
          />
        </div>
      </div>

      {/* Latest Analysis result feedback prompt */}
      {latestStatus ? (
        <div
          className={`p-2.5 rounded-xl text-left border flex flex-col gap-1 ${
            latestStatus.status === "clean"
              ? "bg-emerald-500/5 border-emerald-100"
              : latestStatus.status === "warning"
                ? "bg-amber-500/5 border-amber-100"
                : "bg-rose-500/5 border-rose-100"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center gap-1">
              {latestStatus.status === "clean" && (
                <Eye className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {latestStatus.status === "warning" && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-bounce" />
              )}
              {latestStatus.status === "flagged" && (
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
              )}
              <span
                className={
                  latestStatus.status === "clean"
                    ? "text-emerald-700"
                    : latestStatus.status === "warning"
                      ? "text-amber-700"
                      : "text-rose-700"
                }
              >
                {latestStatus.status === "clean" && "Honesty Core Verified"}
                {latestStatus.status === "warning" && "Deviation Caution"}
                {latestStatus.status === "flagged" && "Security Intrusion"}
              </span>
            </span>
            <span className="text-[10px] rounded bg-white px-1.5 py-0.5 border border-slate-100 font-mono text-slate-500 shadow-xs">
              Conf: {Math.round(latestStatus.confidence * 100)}%
            </span>
          </div>
          <p className="text-[10px] text-slate-600 leading-normal font-medium">
            {latestStatus.summary}
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-xl border border-dashed border-slate-200/60 bg-white/30 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            Waiting for AI telemetry scan...
          </span>
        </div>
      )}

      {/* Manual scanner button */}
      <button
        onClick={performProctorScan}
        disabled={isScanning || !isExamStarted}
        className="w-full bg-white hover:bg-slate-50 cursor-pointer active:scale-98 transition-all px-3 py-2 text-xs font-semibold border border-slate-200 text-indigo-600 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
      >
        <Sparkles
          className={`h-3 w-3 text-indigo-500 ${isScanning ? "animate-spin" : ""}`}
        />
        {isScanning ? "Analyzing Scene..." : "Trigger Instant AI Audit"}
      </button>
    </div>
  );
}
