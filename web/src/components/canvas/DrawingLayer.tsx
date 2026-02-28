"use client";
import { useEffect, useRef, useCallback } from "react";
import { Stroke, Point } from "@/lib/types";
import { COLORS } from "@/lib/config";

interface DrawingLayerProps {
  strokes: Stroke[];
  width: number;
  height: number;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;

  if (stroke.points.length === 1) {
    ctx.beginPath();
    ctx.arc(
      stroke.points[0].x,
      stroke.points[0].y,
      stroke.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = stroke.color;
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
}

export function DrawingLayer({
  strokes,
  width,
  height,
  onCanvasRef,
}: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const setRef = useCallback(
    (el: HTMLCanvasElement | null) => {
      canvasRef.current = el;
      onCanvasRef?.(el);
    },
    [onCanvasRef]
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
  }, [strokes, width, height]);

  return (
    <canvas
      ref={setRef}
      width={width}
      height={height}
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
