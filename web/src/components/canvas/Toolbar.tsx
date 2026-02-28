"use client";
import { ToolMode } from "@/lib/types";
import { DRAW_COLORS } from "@/lib/config";

interface ToolbarProps {
  mode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
  claudeLoading: boolean;
  drawColor: string;
  onDrawColorChange: (color: string) => void;
}

const TOOLS: { label: string; mode: ToolMode; key?: string }[] = [
  { label: "Draw", mode: "draw", key: "D" },
  { label: "Erase", mode: "erase", key: "E" },
  { label: "Ask Claude", mode: "claude", key: "C" },
  { label: "Clear", mode: "clear" },
];

export function Toolbar({
  mode,
  onModeChange,
  claudeLoading,
  drawColor,
  onDrawColorChange,
}: ToolbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
      {TOOLS.map((tool) => (
        <button
          key={tool.mode}
          onClick={() => onModeChange(tool.mode)}
          className={`
            px-4 py-2 rounded-lg text-sm font-mono transition-all duration-150
            ${
              tool.mode === mode && tool.mode !== "clear"
                ? "bg-[#00c864] text-black"
                : "border border-[#444] text-white hover:border-[#888]"
            }
            ${tool.mode === "clear" ? "text-[#ff3c3c] border border-[#444] hover:border-[#ff3c3c]" : ""}
            ${tool.mode === "claude" && claudeLoading ? "animate-pulse" : ""}
          `}
        >
          {tool.label}
          {tool.key && (
            <span className="ml-1.5 text-xs opacity-40">{tool.key}</span>
          )}
        </button>
      ))}

      {/* Color picker - only show in draw mode */}
      {mode === "draw" && (
        <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-[#333]">
          {DRAW_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onDrawColorChange(color)}
              className={`
                w-6 h-6 rounded-full transition-transform
                ${drawColor === color ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-black" : "hover:scale-110"}
              `}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
