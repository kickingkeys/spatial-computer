"use client";
import { useRef, useEffect, useState } from "react";
import { useHandPose } from "@/hooks/useHandPose";

interface StepHandTrackingProps {
  cameraId: string;
  onNext: () => void;
  onBack: () => void;
}

export function StepHandTracking({
  cameraId,
  onNext,
  onBack,
}: StepHandTrackingProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { hand, modelReady } = useHandPose(videoRef, cameraId);
  const [pinchCount, setPinchCount] = useState(0);
  const wasPinchingRef = useRef(false);

  // Count pinch rising edges
  useEffect(() => {
    if (hand?.isPinching && !wasPinchingRef.current) {
      setPinchCount((c) => c + 1);
    }
    wasPinchingRef.current = hand?.isPinching ?? false;
  }, [hand]);

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-mono font-bold">Test Hand Tracking</h2>
        <p className="text-[#888] text-sm max-w-md">
          Show your hand to the camera and pinch your thumb and index finger
          together. Try it a few times to verify it works.
        </p>
      </div>

      {/* Camera feed with hand skeleton overlay */}
      <div className="w-full max-w-md aspect-video bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden relative">
        <video
          ref={videoRef}
          width={640}
          height={480}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover -scale-x-100"
        />
        {/* Status */}
        <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${
            modelReady ? "bg-[#00c864]" : "bg-[#ffcc00] animate-pulse"
          }`} />
          <span className="text-[9px] font-mono text-white/60">
            {modelReady ? (hand ? (hand.isPinching ? "PINCH" : "tracking") : "no hand") : "loading model..."}
          </span>
        </div>
      </div>

      {/* Pinch indicator */}
      <div className="flex items-center gap-4">
        <div
          className={`px-4 py-2 rounded-lg border transition-colors ${
            hand?.isPinching
              ? "border-[#00c864] bg-[#00c864]/10 text-[#00c864]"
              : "border-[#333] text-[#888]"
          }`}
        >
          <span className="font-mono text-sm">
            {!modelReady
              ? "Loading hand model..."
              : hand?.isPinching
                ? "Pinch detected!"
                : hand
                  ? "Hand detected — try pinching"
                  : "Show your hand to the camera"}
          </span>
        </div>
        <span className="font-mono text-sm text-[#555]">
          {pinchCount} pinch{pinchCount !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2.5 border border-[#444] text-[#888] font-mono text-sm
                     rounded-lg hover:border-[#666] hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-[#00c864] text-black font-mono text-sm rounded-lg
                     hover:bg-[#00e070] transition-colors"
        >
          {pinchCount >= 3 ? "Looks good! Next" : "Next"}
        </button>
      </div>
    </div>
  );
}
