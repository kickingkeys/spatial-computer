"use client";

interface StepProjectorProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepProjector({ onNext, onBack }: StepProjectorProps) {
  return (
    <div className="flex flex-col items-center text-center gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-mono font-bold">Projector Setup</h2>
        <p className="text-[#888] text-sm max-w-md">
          If you have a projector, follow these steps. Otherwise, skip ahead.
        </p>
      </div>

      <div className="flex flex-col gap-5 text-left max-w-md w-full bg-[#111] rounded-xl p-6 border border-[#222]">
        <div className="flex items-start gap-3">
          <span className="text-[#00c864] font-mono text-sm shrink-0">1.</span>
          <p className="text-sm text-[#ccc]">
            Connect your projector via HDMI and set your display to{" "}
            <strong className="text-white">Extend</strong> (not Mirror)
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-[#00c864] font-mono text-sm shrink-0">2.</span>
          <p className="text-sm text-[#ccc]">
            Drag this browser window onto the projector display
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-[#00c864] font-mono text-sm shrink-0">3.</span>
          <p className="text-sm text-[#ccc]">
            Press <kbd className="px-1.5 py-0.5 bg-[#222] rounded text-xs text-white">F</kbd>{" "}
            on the canvas to go fullscreen
          </p>
        </div>
        <div className="mt-2 p-3 bg-[#0a0a0a] rounded-lg border border-[#333]">
          <p className="text-xs text-[#666] leading-relaxed">
            The canvas uses a black background because projectors add light
            to surfaces. Black = projects nothing = wall stays white. Only
            bright colors (your strokes, Claude&apos;s output) will be visible.
          </p>
        </div>
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
          Next
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 border border-[#444] text-[#888] font-mono text-sm
                     rounded-lg hover:border-[#666] hover:text-white transition-colors"
        >
          Skip (no projector)
        </button>
      </div>
    </div>
  );
}
