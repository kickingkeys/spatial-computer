"use client";
import { useState, useEffect } from "react";
import { getApiKey, setApiKey } from "@/hooks/useClaude";

interface StepReadyProps {
  hasCamera: boolean;
  onLaunch: () => void;
  onBack: () => void;
}

export function StepReady({ hasCamera, onLaunch, onBack }: StepReadyProps) {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = getApiKey();
    if (existing) {
      setKey(existing);
      setSaved(true);
    }
  }, []);

  function handleSaveKey() {
    if (key.trim()) {
      setApiKey(key.trim());
      setSaved(true);
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-mono font-bold">Ready to go</h2>
        <p className="text-[#888] text-sm max-w-md">
          Your spatial canvas is configured. Here&apos;s a quick reference.
        </p>
      </div>

      {/* API Key */}
      <div className="flex flex-col gap-3 text-left max-w-sm w-full bg-[#111] rounded-xl p-5 border border-[#222]">
        <h3 className="text-xs font-mono text-[#555] uppercase tracking-wider">
          Anthropic API Key
        </h3>
        <p className="text-xs text-[#666]">
          Required for Claude integration. Your key stays in your browser (localStorage) and is never sent to any server.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="sk-ant-..."
            className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg
                       text-sm text-white font-mono placeholder:text-[#444]
                       focus:outline-none focus:border-[#00c864]"
          />
          <button
            onClick={handleSaveKey}
            disabled={!key.trim() || saved}
            className={`px-4 py-2 text-sm font-mono rounded-lg transition-colors ${
              saved
                ? "bg-[#00c864]/20 text-[#00c864] border border-[#00c864]/30"
                : "bg-[#222] text-white hover:bg-[#333] border border-[#333]"
            }`}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="flex flex-col gap-3 text-left max-w-sm w-full bg-[#111] rounded-xl p-5 border border-[#222]">
        <h3 className="text-xs font-mono text-[#555] uppercase tracking-wider">
          Keyboard shortcuts
        </h3>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-xs text-white font-mono">
            D
          </kbd>
          <span className="text-[#ccc]">Draw mode</span>
          <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-xs text-white font-mono">
            E
          </kbd>
          <span className="text-[#ccc]">Eraser mode</span>
          <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-xs text-white font-mono">
            C
          </kbd>
          <span className="text-[#ccc]">Ask Claude mode (click to trigger)</span>
          <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-xs text-white font-mono">
            X
          </kbd>
          <span className="text-[#ccc]">Clear everything</span>
          <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-xs text-white font-mono">
            F
          </kbd>
          <span className="text-[#ccc]">Toggle fullscreen</span>
          <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-xs text-white font-mono">
            Cmd+Z
          </kbd>
          <span className="text-[#ccc]">Undo</span>
        </div>
        {hasCamera && (
          <>
            <h3 className="text-xs font-mono text-[#555] uppercase tracking-wider mt-3">
              Hand gestures
            </h3>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <span className="text-[#00c864] font-mono">Pinch</span>
              <span className="text-[#ccc]">
                Triggers Claude (in Ask Claude mode)
              </span>
            </div>
          </>
        )}
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
          onClick={onLaunch}
          className="px-8 py-3 bg-[#00c864] text-black font-mono text-sm rounded-lg
                     hover:bg-[#00e070] transition-colors font-bold"
        >
          Launch Canvas
        </button>
      </div>
    </div>
  );
}
