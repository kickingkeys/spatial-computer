"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { DrawingLayer } from "./DrawingLayer";
import { Toolbar } from "./Toolbar";
import { PreviewPanel } from "./PreviewPanel";
import { CameraPreview } from "./CameraPreview";
import { useDrawing } from "@/hooks/useDrawing";
import { useClaude } from "@/hooks/useClaude";
import { useHandPose } from "@/hooks/useHandPose";
import { ToolMode, Point } from "@/lib/types";

// SVG cursor helpers
function penCursor(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z'/><path d='m15 5 4 4'/></svg>`;
  return `url("data:image/svg+xml,${svg}") 2 22, crosshair`;
}

function eraserCursor(): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/><path d='M22 21H7'/><path d='m5 11 9 9'/></svg>`;
  return `url("data:image/svg+xml,${svg}") 4 20, crosshair`;
}

function getCursor(mode: string, color: string): string {
  switch (mode) {
    case "draw": return penCursor(color);
    case "erase": return eraserCursor();
    case "claude": return "pointer";
    default: return "crosshair";
  }
}

interface SpatialCanvasProps {
  cameraDeviceId?: string | null;
}

export function SpatialCanvas({ cameraDeviceId }: SpatialCanvasProps) {
  const [mode, setMode] = useState<ToolMode>("draw");
  const [size, setSize] = useState({ width: 1920, height: 1080 });
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMouseDrawingRef = useRef(false);

  const { strokes, startStroke, continueStroke, endStroke, clearAll, undo, drawColor, setDrawColor } =
    useDrawing();
  const { loading, response, error, sendToClaude, clearResponse } = useClaude();
  const { hand, modelReady } = useHandPose(
    cameraDeviceId ? videoRef : { current: null },
    cameraDeviceId
  );

  // Track gesture edges
  const wasPinchingRef = useRef(false);

  // Resize handler
  useEffect(() => {
    function updateSize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Mode change handler
  const handleModeChange = useCallback(
    (newMode: ToolMode) => {
      if (newMode === "clear") {
        clearAll();
        clearResponse();
      } else {
        setMode(newMode);
      }
    },
    [clearAll, clearResponse]
  );

  // Snapshot the canvas, send to Claude
  const triggerClaude = useCallback(() => {
    if (loading) return;
    const canvas = canvasElRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    let cameraDataUrl: string | undefined;
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = videoRef.current.videoWidth;
      tmpCanvas.height = videoRef.current.videoHeight;
      tmpCanvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      cameraDataUrl = tmpCanvas.toDataURL("image/png");
    }
    sendToClaude(dataUrl, cameraDataUrl);
  }, [loading, sendToClaude]);

  // Handle hand gesture edges
  useEffect(() => {
    if (!hand) {
      wasPinchingRef.current = false;
      return;
    }

    // Pinch rising edge → trigger Claude
    if (hand.isPinching && !wasPinchingRef.current) {
      if (mode === "claude") {
        triggerClaude();
      }
    }

    wasPinchingRef.current = hand.isPinching;
  }, [hand, mode, triggerClaude]);

  // Mouse/touch handlers
  const getPoint = useCallback(
    (e: React.PointerEvent): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: e.clientX, y: e.clientY };
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (mode === "draw" || mode === "erase") {
        startStroke(getPoint(e), mode);
        isMouseDrawingRef.current = true;
      } else if (mode === "claude") {
        triggerClaude();
      }
    },
    [mode, startStroke, getPoint, triggerClaude]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isMouseDrawingRef.current) return;
      continueStroke(getPoint(e));
    },
    [continueStroke, getPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (isMouseDrawingRef.current) {
      endStroke();
      isMouseDrawingRef.current = false;
    }
  }, [endStroke]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undo();
      }
      if (e.key === "d") setMode("draw");
      if (e.key === "e") setMode("erase");
      if (e.key === "c" && !e.metaKey && !e.ctrlKey) setMode("claude");
      if (e.key === "x") {
        clearAll();
        clearResponse();
      }
      if (e.key === "f") {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, clearAll, clearResponse]);

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen bg-black overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ cursor: getCursor(mode, drawColor) }}
    >
      <DrawingLayer
        strokes={strokes}
        width={size.width}
        height={size.height}
        onCanvasRef={(el) => {
          canvasElRef.current = el;
        }}
      />

      <Toolbar
        mode={mode}
        onModeChange={handleModeChange}
        claudeLoading={loading}
        drawColor={drawColor}
        onDrawColorChange={setDrawColor}
      />

      <PreviewPanel
        html={response?.html ?? null}
        text={response?.text ?? null}
        error={error}
        loading={loading}
        onClose={clearResponse}
      />

      {/* Status bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
        <span className="text-[11px] font-mono text-[#555]">
          {strokes.length} stroke{strokes.length !== 1 ? "s" : ""}
        </span>
        <span className="text-[11px] font-mono text-[#555]">
          {mode === "claude" ? "click to ask claude" : mode}
        </span>
        {cameraDeviceId && (
          <span className="text-[11px] font-mono text-[#555]">
            {modelReady ? (hand ? (hand.isPinching ? "PINCH" : "hand") : "no hand") : "loading model..."}
          </span>
        )}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen();
            }
          }}
          className="text-[11px] font-mono text-[#555] hover:text-white transition-colors"
        >
          [F] fullscreen
        </button>
      </div>

      {/* Camera preview (bottom-left corner) */}
      {cameraDeviceId && (
        <div className="absolute bottom-3 left-3 w-48 h-36 border border-[#333] rounded-lg overflow-hidden opacity-70 hover:opacity-100 transition-opacity z-20">
          <CameraPreview
            videoRef={videoRef}
            hand={hand}
            modelReady={modelReady}
          />
        </div>
      )}
    </div>
  );
}
