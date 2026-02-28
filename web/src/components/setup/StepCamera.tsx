"use client";
import { useEffect, useState } from "react";
import { useCamera } from "@/hooks/useCamera";

interface StepCameraProps {
  onNext: (cameraId: string | null) => void;
  onBack: () => void;
}

export function StepCamera({ onNext, onBack }: StepCameraProps) {
  const { cameras, selectedCamera, error, videoRef, enumerate, selectCamera, stopCamera } =
    useCamera();
  const [enumerated, setEnumerated] = useState(false);

  useEffect(() => {
    if (!enumerated) {
      enumerate().then((devices) => {
        setEnumerated(true);
        if (devices.length > 0) {
          selectCamera(devices[0].deviceId);
        }
      });
    }
  }, [enumerated, enumerate, selectCamera]);

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-mono font-bold">Select Camera</h2>
        <p className="text-[#888] text-sm max-w-md">
          A webcam enables hand gesture control. You can also skip this and
          just draw with your mouse.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#111] rounded-lg border border-[#ff3c3c]/30 max-w-md">
          <p className="text-sm text-[#ff3c3c]">{error}</p>
        </div>
      )}

      {cameras.length > 0 && (
        <div className="flex flex-col gap-4 w-full max-w-md">
          <select
            value={selectedCamera || ""}
            onChange={(e) => selectCamera(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#111] border border-[#333] rounded-lg
                       text-sm text-white font-mono appearance-none
                       focus:outline-none focus:border-[#00c864]"
          >
            {cameras.map((cam) => (
              <option key={cam.deviceId} value={cam.deviceId}>
                {cam.label || `Camera ${cam.deviceId.slice(0, 8)}...`}
              </option>
            ))}
          </select>

          {/* Camera preview */}
          <div className="w-full aspect-video bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {enumerated && cameras.length === 0 && !error && (
        <div className="p-4 bg-[#111] rounded-lg border border-[#222] max-w-md">
          <p className="text-sm text-[#888]">
            No cameras found. You can still use the canvas with mouse input.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-2.5 border border-[#444] text-[#888] font-mono text-sm
                     rounded-lg hover:border-[#666] hover:text-white transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => { stopCamera(); onNext(selectedCamera); }}
          className="px-6 py-2.5 bg-[#00c864] text-black font-mono text-sm rounded-lg
                     hover:bg-[#00e070] transition-colors"
        >
          {selectedCamera ? "Next" : "Skip (no camera)"}
        </button>
      </div>
    </div>
  );
}
