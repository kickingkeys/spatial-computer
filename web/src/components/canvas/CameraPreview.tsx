"use client";
import { useRef, useEffect, useCallback } from "react";
import { HandData } from "@/lib/types";

interface CameraPreviewProps {
  videoRef:
    | React.RefObject<HTMLVideoElement | null>
    | ((el: HTMLVideoElement | null) => void);
  hand: HandData | null;
  modelReady: boolean;
}

export function CameraPreview({
  videoRef,
  hand,
  modelReady,
}: CameraPreviewProps) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      localVideoRef.current = el;
      if (typeof videoRef === "function") {
        videoRef(el);
      } else if (videoRef && "current" in videoRef) {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
      }
    },
    [videoRef]
  );

  useEffect(() => {
    const canvas = overlayRef.current;
    const video = localVideoRef.current;
    if (!canvas || !hand || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw hand skeleton
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];

    const sx = canvas.width / (video.videoWidth || 640);
    const sy = canvas.height / (video.videoHeight || 480);

    ctx.strokeStyle = hand.isPinching ? "#ff3c3c" : "#00c864";
    ctx.lineWidth = 1.5;
    for (const [a, b] of connections) {
      if (a >= hand.landmarks.length || b >= hand.landmarks.length) continue;
      ctx.beginPath();
      ctx.moveTo(hand.landmarks[a].x * sx, hand.landmarks[a].y * sy);
      ctx.lineTo(hand.landmarks[b].x * sx, hand.landmarks[b].y * sy);
      ctx.stroke();
    }

    ctx.fillStyle = hand.isPinching ? "#ff3c3c" : "#00c864";
    for (const lm of hand.landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * sx, lm.y * sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [hand]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={setVideoRef}
        width={640}
        height={480}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover -scale-x-100"
      />
      <canvas
        ref={overlayRef}
        width={240}
        height={180}
        className="absolute inset-0 w-full h-full -scale-x-100"
      />
      <div className="absolute bottom-1 left-1.5 flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            modelReady ? "bg-[#00c864]" : "bg-[#ffcc00] animate-pulse"
          }`}
        />
        <span className="text-[9px] font-mono text-white/60">
          {modelReady ? (hand ? "tracking" : "no hand") : "loading model..."}
        </span>
      </div>
    </div>
  );
}
