"use client";
import { useState, useRef, useCallback } from "react";
import { Stroke, Point } from "@/lib/types";
import { DRAWING, COLORS } from "@/lib/config";

export function useDrawing() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [drawColor, setDrawColor] = useState<string>(COLORS.draw);

  const startStroke = useCallback(
    (point: Point, mode: "draw" | "erase") => {
      const stroke: Stroke = {
        points: [point],
        color: mode === "draw" ? drawColor : COLORS.erase,
        width: mode === "draw" ? DRAWING.strokeWidth : DRAWING.eraserWidth,
      };
      activeStrokeRef.current = stroke;
      setStrokes((prev) => [...prev, stroke]);
    },
    [drawColor]
  );

  const continueStroke = useCallback((point: Point) => {
    if (!activeStrokeRef.current) return;
    activeStrokeRef.current.points.push(point);
    setStrokes((prev) => [...prev]);
  }, []);

  const endStroke = useCallback(() => {
    if (activeStrokeRef.current) {
      setUndoStack((prev) => [...prev, strokes]);
    }
    activeStrokeRef.current = null;
  }, [strokes]);

  const clearAll = useCallback(() => {
    if (strokes.length === 0) return;
    setUndoStack((prev) => [...prev, strokes]);
    setStrokes([]);
  }, [strokes]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setStrokes(previous);
    setUndoStack((prev) => prev.slice(0, -1));
  }, [undoStack]);

  return {
    strokes,
    startStroke,
    continueStroke,
    endStroke,
    clearAll,
    undo,
    drawColor,
    setDrawColor,
    isDrawing: activeStrokeRef.current !== null,
  };
}
