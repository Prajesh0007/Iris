import React, { useEffect, useState, useRef } from "react";

export default function LiveProctorGrid() {
  const [activeFeeds, setActiveFeeds] = useState<
    { id: string; email: string; stream: MediaStream }[]
  >([]);

  useEffect(() => {
    let socket: any;

    Promise.all([import("socket.io-client"), import("simple-peer")]).then(
      ([{ io }, { default: Peer }]) => {
        socket = io();

        // Teachers join room "exam-global" implicitly or we can just ask for all.
        // For simplified WebRTC grid: we emit as teacher globally
        socket.emit("join-room", "live-exams", "teacher-admin", true);

        socket.on(
          "user-connected",
          (userId: string, isTeacher: boolean, socketId: string) => {
            if (!isTeacher) {
              // It's a student! We should wait for their signal... Wait, the student initiates.
              // In simple-peer, if initiator = true (student), they signal us, we answer.
            }
          },
        );

        socket.on("signal", (senderId: string, data: any) => {
          // Find existing peer
          const p = new Peer({ initiator: false, trickle: false });
          p.on("signal", (answer) => {
            socket.emit("signal", senderId, answer);
          });
          p.on("stream", (stream) => {
            setActiveFeeds((feeds) => {
              if (feeds.find((f) => f.id === senderId)) return feeds;
              return [
                ...feeds,
                { id: senderId, email: "Student Feed", stream },
              ];
            });
          });
          p.signal(data);
        });

        socket.on("user-disconnected", (userId: string, socketId: string) => {
          setActiveFeeds((feeds) => feeds.filter((f) => f.id !== socketId));
        });
      },
    );

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="glass p-5 rounded-3xl border border-white/60">
        <h3 className="text-xl font-bold font-sans">
          Live Proctor WebRTC Monitoring Grid
        </h3>
        <p className="text-xs text-slate-500">
          Real-time WebRTC connections to students actively taking assessments.
        </p>

        {activeFeeds.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No live students currently connected to the WebRTC mesh.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {activeFeeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative"
            >
              <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow z-10 animate-pulse">
                LIVE
              </span>
              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm z-10">
                Connection ID: {feed.id.slice(0, 6)}
              </span>
              <VideoPlayer stream={feed.stream} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
    />
  );
}
